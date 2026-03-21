"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importContacts } from "@/lib/actions/crm";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";

type Props = {
  trigger?: React.ReactNode;
};

export function CsvImportDialog({ trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success?: string;
    error?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      setResult({ error: "CSV must have a header row and at least one data row." });
      setImporting(false);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const contacts: Array<{
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      lead_source?: string;
      tags?: string[];
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        const val = values[idx] ?? "";
        if (val) row[h] = val;
      });

      if (row.first_name) {
        contacts.push({
          first_name: row.first_name as string,
          last_name: (row.last_name as string) ?? "",
          email: (row.email as string) || undefined,
          phone: (row.phone as string) || undefined,
          lead_source: (row.lead_source as string) ?? "csv_import",
          tags: row.tags ? (row.tags as string).split(";") : [],
        });
      }
    }

    if (contacts.length === 0) {
      setResult({ error: "No valid contacts found. Ensure 'first_name' column exists." });
      setImporting(false);
      return;
    }

    const res = await importContacts(contacts);
    setResult(res);
    setImporting(false);

    if (res.success) {
      setTimeout(() => {
        setOpen(false);
        setFile(null);
        setResult(null);
        router.refresh();
      }, 1500);
    }
  }, [file, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="rounded-full" />}>
        <Upload className="size-3.5 mr-1.5" />
        Import CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[var(--bg-card)] border-[var(--border-default)]">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            Upload a CSV file with columns: first_name, last_name, email, phone,
            lead_source, tags (semicolon-separated).
          </p>

          {/* File selector */}
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-default)] p-6 cursor-pointer hover:border-[var(--accent-primary)]/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-[var(--accent-primary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {file.name}
                </span>
              </div>
            ) : (
              <>
                <Upload className="size-8 text-[var(--text-hint)] mb-2" />
                <p className="text-sm text-[var(--text-muted)]">
                  Click to select a CSV file
                </p>
              </>
            )}
          </div>

          {/* Result */}
          {result && (
            <div
              className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
                result.error
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-500/10 text-green-600"
              }`}
            >
              {result.error ? (
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
              ) : (
                <Check className="size-4 shrink-0 mt-0.5" />
              )}
              <span>{result.error ?? result.success}</span>
            </div>
          )}

          <Button
            className="rounded-full"
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? "Importing…" : "Import Contacts"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

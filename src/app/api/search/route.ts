import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use ilike for simple search (ts_query works when full-text index is ready)
  const pattern = `%${q}%`;

  const [tasksRes, projectsRes, contactsRes, dealsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title")
      .ilike("title", pattern)
      .eq("is_active", true)
      .limit(10),
    supabase
      .from("projects")
      .select("id, name")
      .ilike("name", pattern)
      .eq("is_active", true)
      .limit(5),
    supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`)
      .eq("is_active", true)
      .limit(5),
    supabase
      .from("deals")
      .select("id, name")
      .ilike("name", pattern)
      .eq("is_active", true)
      .limit(5),
  ]);

  const results = [
    ...(tasksRes.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      type: "task" as const,
    })),
    ...(projectsRes.data ?? []).map((p) => ({
      id: p.id,
      title: p.name,
      type: "project" as const,
    })),
    ...(contactsRes.data ?? []).map((c) => ({
      id: c.id,
      title: `${c.first_name} ${c.last_name}`.trim(),
      type: "contact" as const,
    })),
    ...(dealsRes.data ?? []).map((d) => ({
      id: d.id,
      title: d.name,
      type: "deal" as const,
    })),
  ];

  return NextResponse.json({ results });
}

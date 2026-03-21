import { cn } from "@/lib/utils";

export function AuthCard({
  children,
  className,
  title,
  description,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-8 space-y-6",
        className
      )}
    >
      {/* Brand mark — visible on mobile where left panel is hidden */}
      <div className="flex justify-center lg:hidden">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
          R
        </div>
      </div>

      {(title || description) && (
        <div className="space-y-1 text-center">
          {title && (
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

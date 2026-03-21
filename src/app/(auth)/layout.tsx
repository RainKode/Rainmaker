export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-card p-12">
        <div className="max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
              R
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Rainmaker
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Unified Task Management, CRM &amp; ERP for modern teams. Manage
            everything in one place.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}

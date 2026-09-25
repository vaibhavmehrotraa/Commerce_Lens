import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  accent,
  className,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {sublabel && <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>}
    </div>
  );
}

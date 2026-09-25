import type { ReactNode } from "react";

/** Monospace formula display -- no LaTeX dependency, keeps the bundle light. */
export function FormulaBlock({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/50 px-4 py-3">
      {label && <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>}
      <div className="overflow-x-auto whitespace-pre font-mono text-sm">{children}</div>
    </div>
  );
}

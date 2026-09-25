import { Badge } from "@/components/ui/badge";

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      {eyebrow && (
        <div className="mb-2 text-sm font-medium" style={{ color: "var(--series-1)" }}>
          {eyebrow}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}
    </div>
  );
}

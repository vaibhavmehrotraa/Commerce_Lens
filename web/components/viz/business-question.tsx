import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, HelpCircle, Eye, Lightbulb, Ruler } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The standard "every major chart" block required across the site:
 * Business Question -> Metric -> Observation -> Interpretation -> Caveat.
 * Observation/Interpretation are passed in as computed values -- never
 * hard-coded strings.
 */
export function BusinessQuestionBlock({
  question,
  metric,
  observation,
  interpretation,
  caveat,
}: {
  question: string;
  metric: string;
  observation: ReactNode;
  interpretation: ReactNode;
  caveat?: string;
}) {
  return (
    <Card className="border-border/80">
      <CardContent className="grid gap-4 pt-2 md:grid-cols-2">
        <Row icon={<HelpCircle className="h-4 w-4" />} label="Business Question">
          {question}
        </Row>
        <Row icon={<Ruler className="h-4 w-4" />} label="Metric">
          <span className="font-mono text-sm">{metric}</span>
        </Row>
        <Row icon={<Eye className="h-4 w-4" />} label="Observation">
          {observation}
        </Row>
        <Row icon={<Lightbulb className="h-4 w-4" />} label="Interpretation">
          {interpretation}
        </Row>
        {caveat && (
          <div className="md:col-span-2">
            <Row icon={<AlertTriangle className="h-4 w-4" />} label="Caveat" muted>
              {caveat}
            </Row>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  icon,
  label,
  children,
  muted,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={muted ? "text-sm text-muted-foreground" : "text-sm"}>{children}</div>
    </div>
  );
}

export function CaveatNote({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex gap-2 rounded-lg border px-3 py-2.5 text-sm text-muted-foreground"
      style={{ borderColor: "var(--status-warning)", backgroundColor: "color-mix(in srgb, var(--status-warning) 10%, transparent)" }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--status-warning)" }} />
      <div>{children}</div>
    </div>
  );
}

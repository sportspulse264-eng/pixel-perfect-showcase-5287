import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IncidentStatus, ResourceStatus, Severity } from "@/lib/types";

const TONE = {
  critical: "bg-critical-soft text-critical border-critical/20",
  warning: "bg-warning-soft text-warning border-warning/30",
  success: "bg-success-soft text-success border-success/20",
  info: "bg-info-soft text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
} as const;
export type Tone = keyof typeof TONE;

export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize", TONE[tone], className)}>{children}</span>;
}

const SEV_TONE: Record<Severity, Tone> = { critical: "critical", high: "warning", medium: "info", low: "muted" };
export const SeverityBadge = ({ s }: { s: Severity }) => <Pill tone={SEV_TONE[s]}>{s}</Pill>;

const RS_TONE: Record<ResourceStatus, Tone> = { available: "success", deployed: "info", unavailable: "muted" };
export const ResourceStatusBadge = ({ s }: { s: ResourceStatus }) => <Pill tone={RS_TONE[s]}>{s}</Pill>;

const IS_TONE: Record<IncidentStatus, Tone> = { open: "critical", in_progress: "warning", resolved: "success" };
export const IncidentStatusBadge = ({ s }: { s: IncidentStatus }) => <Pill tone={IS_TONE[s]}>{s.replace("_", " ")}</Pill>;

export function KpiCard({ label, value, sub, icon: Icon, tone }: { label: string; value: ReactNode; sub?: string; icon: LucideIcon; tone: Tone }) {
  return (
    <div className="card-surface flex items-center gap-4 p-4">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border", TONE[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold leading-tight">{value}</div>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card-surface flex flex-col", className)}>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

export const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
export const minsAgo = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} m ago`;
};

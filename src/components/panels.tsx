import { useMemo, useState } from "react";
import { CheckCircle2, Info, Play, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeShortages } from "@/lib/shortage";
import { RESOURCE_LABEL, type Strategy } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { EmptyState, Pill } from "./common";
import { cn } from "@/lib/utils";

export const STRATEGY_LABEL: Record<Strategy, string> = { fastest: "Fastest Response", urgency: "Highest Urgency First", balanced: "Balanced Coverage" };

export function ShortageRadar({ compact }: { compact?: boolean }) {
  const { incidents, resources, shelters } = useStore();
  const rows = useMemo(() => computeShortages(incidents, resources, shelters), [incidents, resources, shelters]);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{r.label}</span>
            <Pill tone={r.level === "critical" ? "critical" : r.level === "warning" ? "warning" : "success"}>
              {r.level === "ok" ? "OK" : `-${r.shortage} (${r.pct}%)`}
            </Pill>
          </div>
          <Progress value={r.required ? Math.min(100, (r.available / r.required) * 100) : 100}
            className={cn("mt-1 h-1.5", r.level === "critical" ? "[&>div]:bg-critical" : r.level === "warning" ? "[&>div]:bg-warning" : "[&>div]:bg-success")} />
          {!compact && <div className="mt-0.5 text-xs text-muted-foreground">Need {r.required} · Have {r.available} · {r.action}</div>}
        </div>
      ))}
    </div>
  );
}

export function StrategyPicker() {
  const { strategy, setStrategy } = useStore();
  return (
    <Select value={strategy} onValueChange={(v) => setStrategy(v as Strategy)}>
      <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
      <SelectContent className="z-[1200]">
        {(Object.keys(STRATEGY_LABEL) as Strategy[]).map((s) => <SelectItem key={s} value={s}>{STRATEGY_LABEL[s]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function RecommendationList({ limit }: { limit?: number }) {
  const { plan, incidents, resources, runAllocation, confirmRecommendation, confirmAll } = useStore();
  const [why, setWhy] = useState<number | null>(null);
  const inc = (id: string) => incidents.find((i) => i.id === id);
  const res = (id: string) => resources.find((r) => r.id === id);
  if (!plan) return (
    <div className="space-y-3">
      <EmptyState text="No allocation run yet. Choose a strategy and generate a Recommended Allocation." />
      <Button onClick={runAllocation} className="w-full"><Play className="h-4 w-4" />Run allocation</Button>
    </div>
  );
  const list = limit ? plan.recommendations.slice(0, limit) : plan.recommendations;
  return (
    <div className="space-y-3">
      {plan.warnings.map((w) => <div key={w} className="rounded-md border border-critical/20 bg-critical-soft px-3 py-2 text-xs text-critical">{w}</div>)}
      {list.length === 0 && <EmptyState text="No new recommendations — all serviceable demand is covered or no eligible resources remain." />}
      {list.map((r, idx) => (
        <div key={`${r.incidentId}-${r.resourceId}-${idx}`} className="rounded-md border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 text-sm">
              <div className="font-medium">{res(r.resourceId)?.name}{r.quantity > 1 ? ` × ${r.quantity}` : ""}</div>
              <div className="truncate text-xs text-muted-foreground">→ {inc(r.incidentId)?.title} · ETA {r.etaMin} min · score {r.score}</div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="ghost" onClick={() => setWhy(why === idx ? null : idx)} aria-label="Why this assignment?"><Info className="h-4 w-4" /></Button>
              <Button size="sm" onClick={() => confirmRecommendation(idx)}><CheckCircle2 className="h-4 w-4" />Confirm</Button>
            </div>
          </div>
          {why === idx && (
            <div className="mt-2 rounded-md bg-info-soft p-2 text-xs text-foreground">
              <div className="mb-1 flex items-center justify-between font-semibold text-info">Why this assignment?<button onClick={() => setWhy(null)}><X className="h-3 w-3" /></button></div>
              {r.explanation}
            </div>
          )}
        </div>
      ))}
      {limit && plan.recommendations.length > limit && <p className="text-xs text-muted-foreground">+{plan.recommendations.length - limit} more in Allocation Centre</p>}
      {plan.unmet.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning-soft p-3 text-xs">
          <div className="mb-1 font-semibold text-warning">Unmet demand</div>
          {plan.unmet.map((u) => <div key={`${u.incidentId}${u.type}`}>{inc(u.incidentId)?.title}: {u.missing} × {RESOURCE_LABEL[u.type]}{u.critical ? " (critical)" : ""}</div>)}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={runAllocation}><Play className="h-4 w-4" />Re-run</Button>
        {plan.recommendations.length > 0 && <Button className="flex-1" onClick={confirmAll}>Confirm all</Button>}
      </div>
    </div>
  );
}

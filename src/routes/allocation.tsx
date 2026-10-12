import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Undo2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { allocate } from "@/lib/allocation";
import { PageHeader, Panel, EmptyState, fmtTime } from "@/components/common";
import { RecommendationList, STRATEGY_LABEL, StrategyPicker } from "@/components/panels";
import { Button } from "@/components/ui/button";
import type { Strategy } from "@/lib/types";

export const Route = createFileRoute("/allocation")({
  head: () => ({ meta: [
    { title: "Allocation Centre — ResQFlow" }, { name: "description", content: "Explainable, strategy-based resource allocation recommendations." },
    { property: "og:title", content: "Allocation Centre — ResQFlow" }, { property: "og:description", content: "Compare allocation strategies and confirm assignments." },
  ] }),
  component: AllocationPage,
});

function AllocationPage() {
  const { incidents, resources, assignments, releaseAssignment } = useStore();
  const compare = useMemo(() => (["fastest", "urgency", "balanced"] as Strategy[]).map((s) => {
    const p = allocate(incidents, resources, assignments, { strategy: s });
    const served = new Set(p.recommendations.map((r) => r.incidentId)).size;
    const avg = p.recommendations.length ? Math.round(p.recommendations.reduce((a, r) => a + r.etaMin, 0) / p.recommendations.length) : 0;
    return { s, n: p.recommendations.length, served, avg, unmet: p.unmet.reduce((a, u) => a + (u.type === "water" || u.type === "food" ? 0 : u.missing), 0), critUnmet: p.unmet.filter((u) => u.critical).length };
  }), [incidents, resources, assignments]);

  return (
    <div>
      <PageHeader title="Allocation Centre" desc="Recommended Allocation uses a documented scoring system (no AI). Each card explains why." actions={<StrategyPicker />} />
      <Panel title="Strategy comparison" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Strategy</th><th>Recommendations</th><th>Incidents reached</th><th>Avg ETA</th><th>Unmet units</th><th>Critical gaps</th></tr></thead>
            <tbody>{compare.map((c) => <tr key={c.s} className="border-t"><td className="py-2 font-medium">{STRATEGY_LABEL[c.s]}</td><td>{c.n}</td><td>{c.served}</td><td>{c.avg} min</td><td>{c.unmet}</td><td className={c.critUnmet ? "text-critical" : ""}>{c.critUnmet}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Fastest: score = 1000 − ETA. Urgency: incidents sorted by severity first, score = severity×100 − ETA/2. Balanced: first pass gives every incident one unit per need, then fills remaining demand.</p>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recommended Allocation"><RecommendationList /></Panel>
        <Panel title={`Confirmed assignments (${assignments.length})`}>
          {assignments.length === 0 ? <EmptyState text="Nothing confirmed yet." /> : (
            <div className="space-y-2">
              {assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div><div className="font-medium">{resources.find((r) => r.id === a.resourceId)?.name}{a.quantity > 1 ? ` × ${a.quantity}` : ""}</div>
                    <div className="text-xs text-muted-foreground">→ {incidents.find((i) => i.id === a.incidentId)?.title} · ETA {a.etaMin} min · {fmtTime(a.createdAt)}</div></div>
                  <Button size="sm" variant="outline" onClick={() => releaseAssignment(a.id)}><Undo2 className="h-4 w-4" />Release</Button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

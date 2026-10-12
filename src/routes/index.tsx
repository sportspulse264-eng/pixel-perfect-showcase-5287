import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, Clock, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { KpiCard, Panel, SeverityBadge, IncidentStatusBadge, minsAgo, Pill } from "@/components/common";
import { LazyMap, MapLegend } from "@/components/LazyMap";
import { RecommendationList, ShortageRadar, StrategyPicker } from "@/components/panels";
import { Button } from "@/components/ui/button";
import { RESOURCE_LABEL } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ResQFlow" },
      { name: "description", content: "Live overview of incidents, resources, shortages and recommended allocations." },
      { property: "og:title", content: "Dashboard — ResQFlow" },
      { property: "og:description", content: "Emergency resource allocation dashboard for Ballari district (demo)." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { incidents, resources, assignments, shelters, community } = useStore();
  const active = incidents.filter((i) => i.status !== "resolved");
  const critical = active.filter((i) => i.severity === "critical").length;
  const available = resources.filter((r) => r.status === "available").length;
  const people = active.reduce((s, i) => s + i.peopleAffected, 0);
  const avgEta = assignments.length ? Math.round(assignments.reduce((s, a) => s + a.etaMin, 0) / assignments.length) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">Demonstration data · fictional incidents around Ballari, Karnataka</p>
        </div>
        <StrategyPicker />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Incidents" value={active.length} sub={`${critical} critical`} icon={AlertTriangle} tone="critical" />
        <KpiCard label="Total Resources" value={resources.length} sub={`${available} available`} icon={Boxes} tone="info" />
        <KpiCard label="People Affected" value={people.toLocaleString("en-IN")} sub="estimated, open incidents" icon={Users} tone="warning" />
        <KpiCard label="Avg. Response Time" value={avgEta ? `${avgEta} min` : "—"} sub={`${assignments.length} confirmed assignments`} icon={Clock} tone="success" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Live Map" className="xl:col-span-2" action={<Link to="/map" className="text-xs text-primary">Open full map</Link>}>
          <LazyMap incidents={incidents} resources={resources} shelters={shelters} community={community} assignments={assignments} height={400} />
          <MapLegend />
        </Panel>
        <Panel title="Resource Shortage Radar"><ShortageRadar /></Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Active Incidents" className="xl:col-span-2" action={<Link to="/incidents" className="text-xs text-primary">View all</Link>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Incident</th><th>Severity</th><th>Needs</th><th>Status</th><th>Reported</th></tr></thead>
              <tbody>
                {active.slice(0, 7).map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="py-2"><div className="font-medium">{i.title}</div><div className="text-xs text-muted-foreground">{i.id} · {i.area}{i.simulated && " · simulated"}</div></td>
                    <td><SeverityBadge s={i.severity} /></td>
                    <td className="text-xs text-muted-foreground">{i.needs.map((n) => `${n.quantity} ${RESOURCE_LABEL[n.type]}`).join(", ")}</td>
                    <td><IncidentStatusBadge s={i.status} /></td>
                    <td className="whitespace-nowrap text-xs text-muted-foreground">{minsAgo(i.reportedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Recommended Allocation"><RecommendationList limit={4} /></Panel>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Disaster What-If Simulator">
          <p className="mb-3 text-sm text-muted-foreground">Test floods, fires, earthquakes or cyclones on an isolated copy of the data and compare outcomes before and after.</p>
          <Button asChild><Link to="/simulator">Open simulator</Link></Button>
        </Panel>
        <Panel title="Community Resources" action={<Link to="/community" className="text-xs text-primary">Manage</Link>}>
          <div className="space-y-2">
            {community.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.provider} · {c.area}</div></div>
                <Pill tone={c.verified ? "success" : "warning"}>{c.verified ? "verified" : "unverified"}</Pill>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader, SeverityBadge, IncidentStatusBadge, minsAgo, EmptyState } from "@/components/common";
import { ReportDialog } from "@/components/ReportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RESOURCE_LABEL, type IncidentStatus } from "@/lib/types";
import { incidentPriority } from "@/lib/allocation";

export const Route = createFileRoute("/incidents")({
  head: () => ({ meta: [
    { title: "Incidents — ResQFlow" }, { name: "description", content: "Report, filter and manage emergency incidents." },
    { property: "og:title", content: "Incidents — ResQFlow" }, { property: "og:description", content: "Incident management for emergency coordinators." },
  ] }),
  component: IncidentsPage,
});

function IncidentsPage() {
  const { incidents, assignments, resources, updateIncident, deleteIncident } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("all");
  const [st, setSt] = useState("active");
  const now = Date.now();
  const list = incidents
    .filter((i) => (sev === "all" || i.severity === sev) && (st === "all" || (st === "active" ? i.status !== "resolved" : i.status === st)))
    .filter((i) => `${i.title} ${i.area}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => incidentPriority(b, now) - incidentPriority(a, now));

  return (
    <div>
      <PageHeader title="Incidents" desc="Sorted by computed priority (severity, waiting time, people affected)." actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Report incident</Button>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <Input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
        <Select value={sev} onValueChange={setSev}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent className="z-[1200]">{["all", "critical", "high", "medium", "low"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All severities" : s}</SelectItem>)}</SelectContent></Select>
        <Select value={st} onValueChange={setSt}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent className="z-[1200]">{["active", "all", "open", "in_progress", "resolved"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="card-surface overflow-x-auto">
        {list.length === 0 ? <div className="p-4"><EmptyState text="No incidents match these filters." /></div> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground"><tr><th className="p-3">Incident</th><th>Priority</th><th>Severity</th><th>Needs</th><th>Assigned</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((i) => {
                const asg = assignments.filter((a) => a.incidentId === i.id);
                return (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="p-3"><div className="font-medium">{i.title}</div><div className="text-xs text-muted-foreground">{i.id} · {i.area} · {i.peopleAffected} affected · {minsAgo(i.reportedAt)}{i.simulated && " · simulated"}</div></td>
                    <td className="font-mono text-xs">{Math.round(incidentPriority(i, now))}</td>
                    <td><SeverityBadge s={i.severity} /></td>
                    <td className="text-xs text-muted-foreground">{i.needs.map((n) => `${n.quantity} ${RESOURCE_LABEL[n.type]}`).join(", ")}</td>
                    <td className="text-xs">{asg.length ? asg.map((a) => resources.find((r) => r.id === a.resourceId)?.name ?? a.resourceId).join(", ") : <span className="text-muted-foreground">—</span>}</td>
                    <td>
                      <Select value={i.status} onValueChange={(v) => updateIncident(i.id, { status: v as IncidentStatus })}>
                        <SelectTrigger className="h-8 w-32 border-0 p-0 shadow-none"><IncidentStatusBadge s={i.status} /></SelectTrigger>
                        <SelectContent className="z-[1200]">{["open", "in_progress", "resolved"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="pr-3 text-right"><Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm(`Delete ${i.title}?`) && deleteIncident(i.id)}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <ReportDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

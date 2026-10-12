import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader, ResourceStatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RESOURCE_LABEL, type ResourceStatus, type ResourceType } from "@/lib/types";
import { AREA_NAMES, areaLocation } from "@/components/ReportDialog";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [
    { title: "Resources — ResQFlow" }, { name: "description", content: "Manage ambulances, rescue teams, boats and supplies." },
    { property: "og:title", content: "Resources — ResQFlow" }, { property: "og:description", content: "Emergency resource inventory and availability." },
  ] }),
  component: ResourcesPage,
});

const EXCLUSIVE: ResourceType[] = ["ambulance", "rescue_team", "boat", "fire_truck"];

function ResourcesPage() {
  const { resources, updateResource, deleteResource, addResource } = useStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("all");
  const [form, setForm] = useState({ name: "", type: "ambulance" as ResourceType, quantity: "1", reserve: "0", area: "Ballari" });
  const list = resources.filter((r) => type === "all" || r.type === type);

  const save = () => {
    const q = Number(form.quantity), rs = Number(form.reserve);
    if (!form.name.trim()) return toast.error("Name is required");
    if (!(q >= 0) || !(rs >= 0)) return toast.error("Quantity and reserve must be zero or more");
    const ex = EXCLUSIVE.includes(form.type);
    addResource({ name: form.name.trim(), type: form.type, status: "available", exclusive: ex, quantity: ex ? 1 : q, reserve: ex ? 0 : rs, base: form.area, location: areaLocation(form.area), speedKmh: 45 });
    setOpen(false); setForm({ ...form, name: "" });
  };

  return (
    <div>
      <PageHeader title="Resources" desc="Exclusive units serve one incident at a time; stock can be split, keeping a minimum reserve." actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Add resource</Button>} />
      <div className="mb-3"><Select value={type} onValueChange={setType}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent className="z-[1200]"><SelectItem value="all">All types</SelectItem>{Object.entries(RESOURCE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground"><tr><th className="p-3">Resource</th><th>Type</th><th>Base</th><th>Quantity</th><th>Reserve</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{r.name}<div className="text-xs font-normal text-muted-foreground">{r.id} · {r.exclusive ? "exclusive unit" : "divisible stock"}</div></td>
                <td>{RESOURCE_LABEL[r.type]}</td>
                <td className="text-xs text-muted-foreground">{r.base}</td>
                <td>{r.exclusive ? 1 : <Input type="number" min={0} className="h-8 w-24" value={r.quantity} onChange={(e) => updateResource(r.id, { quantity: Math.max(0, Number(e.target.value) || 0) })} />}</td>
                <td className="text-xs">{r.exclusive ? "—" : r.reserve}</td>
                <td>
                  <Select value={r.status} onValueChange={(v) => updateResource(r.id, { status: v as ResourceStatus })}>
                    <SelectTrigger className="h-8 w-32 border-0 p-0 shadow-none"><ResourceStatusBadge s={r.status} /></SelectTrigger>
                    <SelectContent className="z-[1200]">{["available", "deployed", "unavailable"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="pr-3 text-right"><Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm(`Remove ${r.name}?`) && deleteResource(r.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="z-[1300]">
          <DialogHeader><DialogTitle>Add resource</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ambulance A-12" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ResourceType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="z-[1400]">{Object.entries(RESOURCE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Base area</Label><Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="z-[1400]">{AREA_NAMES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
              {!EXCLUSIVE.includes(form.type) && <>
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div><Label>Min reserve</Label><Input type="number" value={form.reserve} onChange={(e) => setForm({ ...form, reserve: e.target.value })} /></div>
              </>}
            </div>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

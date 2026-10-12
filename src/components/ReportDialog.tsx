import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { RESOURCE_LABEL, type IncidentType, type Need, type ResourceType, type Severity } from "@/lib/types";

const AREAS: Record<string, { lat: number; lng: number }> = {
  Ballari: { lat: 15.1394, lng: 76.9214 }, Kampli: { lat: 15.4063, lng: 76.6006 }, Sandur: { lat: 15.0947, lng: 76.5459 },
  Toranagallu: { lat: 15.188, lng: 76.672 }, Siruguppa: { lat: 15.63, lng: 76.9 }, Hosapete: { lat: 15.2689, lng: 76.387 }, Kurugodu: { lat: 15.345, lng: 76.836 },
};
export const AREA_NAMES = Object.keys(AREAS);
export const areaLocation = (a: string) => AREAS[a] ?? AREAS.Ballari;

const DEFAULT_NEEDS: Record<IncidentType, Need[]> = {
  flood: [{ type: "boat", quantity: 1 }, { type: "water", quantity: 100 }],
  fire: [{ type: "fire_truck", quantity: 1 }, { type: "ambulance", quantity: 1 }],
  accident: [{ type: "ambulance", quantity: 1 }],
  medical: [{ type: "ambulance", quantity: 1 }, { type: "medical_kit", quantity: 1 }],
  landslide: [{ type: "rescue_team", quantity: 1 }],
  earthquake: [{ type: "rescue_team", quantity: 1 }, { type: "ambulance", quantity: 1 }, { type: "medical_kit", quantity: 3 }],
  cyclone: [{ type: "rescue_team", quantity: 1 }, { type: "food", quantity: 100 }],
};
export const defaultNeeds = (t: IncidentType, mult = 1) => DEFAULT_NEEDS[t].map((n) => ({ ...n, quantity: Math.max(1, Math.round(n.quantity * mult)) }));

export function ReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const addIncident = useStore((s) => s.addIncident);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<IncidentType>("accident");
  const [severity, setSeverity] = useState<Severity>("high");
  const [area, setArea] = useState("Ballari");
  const [people, setPeople] = useState("5");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const p = Number(people);
    if (title.trim().length < 3) return setError("Please enter a title (at least 3 characters).");
    if (!Number.isFinite(p) || p < 0) return setError("People affected must be zero or more.");
    const base = areaLocation(area);
    addIncident({ title: title.trim(), type, severity, area, peopleAffected: p, description: desc, needs: defaultNeeds(type, type === "flood" ? Math.max(1, p / 100) : 1), location: { lat: base.lat + 0.01, lng: base.lng + 0.01 } });
    toast.success("Incident reported (demo data)");
    setTitle(""); setDesc(""); setError(""); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[1300]">
        <DialogHeader>
          <DialogTitle>Report Emergency</DialogTitle>
          <DialogDescription>Adds an incident to the demo dataset. This does not contact real emergency services — call 112.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bus overturned near Kurugodu" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as IncidentType)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[1400]">{Object.keys(DEFAULT_NEEDS).map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[1400]">{["critical", "high", "medium", "low"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Area</Label>
              <Select value={area} onValueChange={setArea}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[1400]">{AREA_NAMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>People affected</Label><Input type="number" min={0} value={people} onChange={(e) => setPeople(e.target.value)} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Needs auto-filled: {defaultNeeds(type).map((n) => `${n.quantity} ${RESOURCE_LABEL[n.type as ResourceType]}`).join(", ")}</p>
          {error && <p className="text-sm text-critical">{error}</p>}
          <Button onClick={submit}>Submit report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { RESOURCE_LABEL, type Incident, type Resource, type ResourceType, type Shelter } from "./types";

export interface ShortageRow {
  key: string;
  label: string;
  required: number;
  available: number;
  shortage: number;
  pct: number;
  level: "critical" | "warning" | "ok";
  action: string;
}

export function shortageOf(required: number, available: number) {
  const shortage = Math.max(0, required - available);
  const pct = required > 0 ? (shortage / required) * 100 : 0;
  const level: ShortageRow["level"] = pct >= 50 ? "critical" : pct > 0 ? "warning" : "ok";
  return { shortage, pct: Math.round(pct), level };
}

const TRACKED: ResourceType[] = ["boat", "water", "medical_kit", "food", "ambulance"];

export function computeShortages(incidents: Incident[], resources: Resource[], shelters: Shelter[]): ShortageRow[] {
  const open = incidents.filter((i) => i.status !== "resolved");
  const rows: ShortageRow[] = TRACKED.map((t) => {
    const required = open.reduce((s, i) => s + i.needs.filter((n) => n.type === t).reduce((a, n) => a + n.quantity, 0), 0);
    const available = resources
      .filter((r) => r.type === t && r.status !== "unavailable")
      .reduce((s, r) => s + (r.exclusive ? 1 : r.quantity), 0);
    const s = shortageOf(required, available);
    return {
      key: t,
      label: RESOURCE_LABEL[t],
      required,
      available,
      ...s,
      action: s.level === "ok" ? "Adequate" : `Request ${s.shortage} more / check community supply`,
    };
  });
  // Shelter capacity: demand = displaced people (sum peopleAffected of flood/cyclone/earthquake), available = free beds
  const displaced = open
    .filter((i) => ["flood", "cyclone", "earthquake", "landslide"].includes(i.type))
    .reduce((s, i) => s + Math.round(i.peopleAffected * 0.3), 0);
  const free = shelters.reduce((s, sh) => s + Math.max(0, sh.capacity - sh.occupancy), 0);
  const s = shortageOf(displaced, free);
  rows.push({
    key: "shelter",
    label: "Shelter Capacity (free beds)",
    required: displaced,
    available: free,
    ...s,
    action: s.level === "ok" ? "Adequate" : "Open additional shelter",
  });
  return rows;
}

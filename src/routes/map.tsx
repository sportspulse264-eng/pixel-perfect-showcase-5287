import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/common";
import { LazyMap, MapLegend } from "@/components/LazyMap";
import type { MapLayers } from "@/components/MapView";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [
    { title: "Map View — ResQFlow" }, { name: "description", content: "Interactive map of incidents, resources, shelters and routes." },
    { property: "og:title", content: "Map View — ResQFlow" }, { property: "og:description", content: "OpenStreetMap view of the emergency situation." },
  ] }),
  component: MapPage,
});

function MapPage() {
  const s = useStore();
  const [layers, setLayers] = useState<MapLayers>({ incidents: true, resources: true, shelters: true, community: true, routes: true });
  return (
    <div>
      <PageHeader title="Map View" desc="Lines show confirmed assignments (resource → incident). Locations are approximate demo data." />
      <div className="mb-3 flex flex-wrap gap-4">
        {(Object.keys(layers) as (keyof MapLayers)[]).map((k) => (
          <div key={k} className="flex items-center gap-2"><Switch id={k} checked={layers[k]} onCheckedChange={(v) => setLayers({ ...layers, [k]: v })} /><Label htmlFor={k} className="capitalize">{k}</Label></div>
        ))}
      </div>
      <LazyMap incidents={s.incidents} resources={s.resources} shelters={s.shelters} community={s.community} assignments={s.assignments} layers={layers} height={640} />
      <MapLegend />
    </div>
  );
}

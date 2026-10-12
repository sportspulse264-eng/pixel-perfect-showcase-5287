import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { Assignment, CommunityResource, Incident, Resource, Shelter } from "@/lib/types";
import { RESOURCE_LABEL } from "@/lib/types";
import { BALLARI } from "@/lib/seed";

void L;

const css = (v: string) => (typeof window === "undefined" ? "#000" : getComputedStyle(document.documentElement).getPropertyValue(v).trim());

export interface MapLayers { incidents: boolean; resources: boolean; shelters: boolean; community: boolean; routes: boolean }

export default function MapView({
  incidents, resources, shelters = [], community = [], assignments = [], height = 420, layers,
  routes = [],
}: {
  incidents: Incident[]; resources: Resource[]; shelters?: Shelter[]; community?: CommunityResource[]; assignments?: Assignment[];
  height?: number; layers?: Partial<MapLayers>;
  routes?: { from: { lat: number; lng: number }; to: { lat: number; lng: number }; dashed?: boolean }[];
}) {
  const show = { incidents: true, resources: true, shelters: true, community: true, routes: true, ...layers };
  const sevColor = { critical: css("--critical"), high: css("--warning"), medium: css("--info"), low: css("--muted-foreground") };
  const resColor = { available: css("--success"), deployed: css("--primary"), unavailable: css("--muted-foreground") };
  const byRes = new Map(resources.map((r) => [r.id, r]));
  const byInc = new Map(incidents.map((i) => [i.id, i]));
  const lines = [
    ...assignments.flatMap((a) => {
      const r = byRes.get(a.resourceId), i = byInc.get(a.incidentId);
      return r && i ? [{ from: r.location, to: i.location, dashed: false }] : [];
    }),
    ...routes,
  ];

  return (
    <div style={{ height }} className="overflow-hidden rounded-md border">
      <MapContainer center={[BALLARI.lat + 0.1, BALLARI.lng - 0.15]} zoom={9} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {show.routes && lines.map((l, k) => (
          <Polyline key={k} positions={[[l.from.lat, l.from.lng], [l.to.lat, l.to.lng]]} pathOptions={{ color: css("--primary"), weight: 2, dashArray: l.dashed ? "6 6" : undefined }} />
        ))}
        {show.shelters && shelters.map((s) => (
          <CircleMarker key={s.id} center={[s.location.lat, s.location.lng]} radius={7} pathOptions={{ color: css("--info"), fillColor: css("--info-soft"), fillOpacity: 1, weight: 2 }}>
            <Popup><b>{s.name}</b><br />Shelter · {s.occupancy}/{s.capacity} occupied</Popup>
          </CircleMarker>
        ))}
        {show.community && community.map((c) => (
          <CircleMarker key={c.id} center={[c.location.lat, c.location.lng]} radius={5} pathOptions={{ color: css("--warning"), fillColor: css("--warning"), fillOpacity: 0.6, weight: 1 }}>
            <Popup><b>{c.name}</b><br />{c.provider} · {c.quantity} {RESOURCE_LABEL[c.type]}</Popup>
          </CircleMarker>
        ))}
        {show.resources && resources.map((r) => (
          <CircleMarker key={r.id} center={[r.location.lat, r.location.lng]} radius={6} pathOptions={{ color: resColor[r.status], fillColor: resColor[r.status], fillOpacity: 0.85, weight: 2 }}>
            <Tooltip>{r.name}</Tooltip>
            <Popup><b>{r.name}</b><br />{RESOURCE_LABEL[r.type]} · {r.status}<br />Qty {r.quantity} · {r.base}</Popup>
          </CircleMarker>
        ))}
        {show.incidents && incidents.filter((i) => i.status !== "resolved").map((i) => (
          <CircleMarker key={i.id} center={[i.location.lat, i.location.lng]} radius={i.severity === "critical" ? 12 : 9} pathOptions={{ color: sevColor[i.severity], fillColor: sevColor[i.severity], fillOpacity: 0.35, weight: 3, dashArray: i.simulated ? "4 3" : undefined }}>
            <Tooltip>{i.title}</Tooltip>
            <Popup><b>{i.title}</b>{i.simulated ? " (simulated)" : ""}<br />{i.severity} · {i.peopleAffected} affected<br />Needs: {i.needs.map((n) => `${n.quantity} ${RESOURCE_LABEL[n.type]}`).join(", ")}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

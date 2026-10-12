import type { LatLng } from "./types";

export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Road distance approximated as 1.3x straight-line; road-closure penalty multiplies time. */
export function etaMinutes(a: LatLng, b: LatLng, speedKmh: number, penalty = 1): number {
  const road = distanceKm(a, b) * 1.3;
  return Math.max(2, Math.round((road / Math.max(speedKmh, 1)) * 60 * penalty + 3));
}

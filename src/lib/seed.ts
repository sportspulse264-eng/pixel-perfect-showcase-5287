import type { CommunityResource, Incident, Resource, Shelter } from "./types";

export const BALLARI = { lat: 15.1394, lng: 76.9214 };

export function makeSeed(now = Date.now()) {
  const ago = (m: number) => new Date(now - m * 60000).toISOString();
  const incidents: Incident[] = [
    { id: "INC-101", title: "Flood near Kampli", type: "flood", severity: "critical", status: "open", area: "Kampli", location: { lat: 15.4063, lng: 76.6006 }, peopleAffected: 420, needs: [{ type: "boat", quantity: 2 }, { type: "rescue_team", quantity: 1 }, { type: "water", quantity: 300 }, { type: "food", quantity: 200 }], reportedAt: ago(95) },
    { id: "INC-102", title: "Road accident on NH-67, Ballari", type: "accident", severity: "high", status: "open", area: "Ballari", location: { lat: 15.155, lng: 76.94 }, peopleAffected: 6, needs: [{ type: "ambulance", quantity: 2 }], reportedAt: ago(20) },
    { id: "INC-103", title: "Medical emergency near VIMS Hospital", type: "medical", severity: "medium", status: "open", area: "Ballari", location: { lat: 15.1468, lng: 76.9095 }, peopleAffected: 1, needs: [{ type: "ambulance", quantity: 1 }, { type: "medical_kit", quantity: 2 }], reportedAt: ago(12) },
    { id: "INC-104", title: "Building fire near Toranagallu", type: "fire", severity: "critical", status: "open", area: "Toranagallu", location: { lat: 15.188, lng: 76.672 }, peopleAffected: 35, needs: [{ type: "fire_truck", quantity: 2 }, { type: "ambulance", quantity: 1 }, { type: "medical_kit", quantity: 10 }], reportedAt: ago(40) },
    { id: "INC-105", title: "Landslide risk near Sandur", type: "landslide", severity: "high", status: "open", area: "Sandur", location: { lat: 15.0947, lng: 76.5459 }, peopleAffected: 120, needs: [{ type: "rescue_team", quantity: 1 }, { type: "water", quantity: 100 }], reportedAt: ago(150) },
    { id: "INC-106", title: "Heat stroke cases, Siruguppa", type: "medical", severity: "low", status: "open", area: "Siruguppa", location: { lat: 15.63, lng: 76.9 }, peopleAffected: 8, needs: [{ type: "medical_kit", quantity: 4 }, { type: "water", quantity: 80 }], reportedAt: ago(60) },
  ];
  const r = (id: string, name: string, type: Resource["type"], base: string, lat: number, lng: number, exclusive = true, quantity = 1, reserve = 0, speedKmh = 45): Resource => ({ id, name, type, status: "available", exclusive, quantity, reserve, base, location: { lat, lng }, speedKmh });
  const resources: Resource[] = [
    r("A-03", "Ambulance A-03", "ambulance", "Ballari Central", 15.142, 76.925, true, 1, 0, 50),
    r("A-07", "Ambulance A-07", "ambulance", "Hospet Road", 15.2, 76.8, true, 1, 0, 50),
    r("A-11", "Ambulance A-11", "ambulance", "Kurugodu", 15.345, 76.836, true, 1, 0, 50),
    r("R-01", "Rescue Team R-01", "rescue_team", "Ballari Fire HQ", 15.135, 76.93, true, 1, 0, 40),
    r("R-02", "Rescue Team R-02", "rescue_team", "Sandur", 15.09, 76.55, true, 1, 0, 40),
    r("B-01", "Rescue Boat B-01", "boat", "Kampli Ghat", 15.4, 76.61, true, 1, 0, 30),
    r("F-01", "Fire Truck F-01", "fire_truck", "Ballari Fire HQ", 15.135, 76.93, true, 1, 0, 45),
    r("F-02", "Fire Truck F-02", "fire_truck", "JSW Toranagallu", 15.19, 76.66, true, 1, 0, 45),
    r("M-05", "Medical Kit M-05", "medical_kit", "District Store", 15.14, 76.92, false, 12, 2, 50),
    r("W-02", "Water Supply W-02", "water", "Ballari Depot (litres)", 15.15, 76.93, false, 350, 50, 40),
    r("FD-01", "Food Packets FD-01", "food", "Ballari Depot", 15.15, 76.93, false, 150, 20, 40),
  ];
  const shelters: Shelter[] = [
    { id: "SH-1", name: "Govt. High School Kampli", area: "Kampli", location: { lat: 15.41, lng: 76.61 }, capacity: 150, occupancy: 90, hasMedical: false },
    { id: "SH-2", name: "Community Hall Ballari", area: "Ballari", location: { lat: 15.13, lng: 76.92 }, capacity: 200, occupancy: 40, hasMedical: true },
    { id: "SH-3", name: "Sandur Panchayat Bhavan", area: "Sandur", location: { lat: 15.1, lng: 76.55 }, capacity: 80, occupancy: 75, hasMedical: false },
  ];
  const community: CommunityResource[] = [
    { id: "CR-1", name: "Tractor trolley", provider: "Kampli Farmers Group", type: "rescue_team", quantity: 1, area: "Kampli", location: { lat: 15.4, lng: 76.62 }, verified: true, contact: "Demo contact" },
    { id: "CR-2", name: "Bottled water", provider: "Ballari Rotary (demo)", type: "water", quantity: 200, area: "Ballari", location: { lat: 15.145, lng: 76.915 }, verified: false, contact: "Demo contact" },
    { id: "CR-3", name: "Cooked meals", provider: "Temple trust (demo)", type: "food", quantity: 120, area: "Hospet", location: { lat: 15.27, lng: 76.39 }, verified: true, contact: "Demo contact" },
  ];
  return { incidents, resources, shelters, community };
}

export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "in_progress" | "resolved";
export type IncidentType = "flood" | "fire" | "accident" | "medical" | "landslide" | "earthquake" | "cyclone";
export type ResourceType = "ambulance" | "rescue_team" | "boat" | "medical_kit" | "water" | "food" | "fire_truck";
export type ResourceStatus = "available" | "deployed" | "unavailable";

export interface LatLng { lat: number; lng: number }

export interface Need { type: ResourceType; quantity: number }

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  area: string;
  location: LatLng;
  peopleAffected: number;
  needs: Need[];
  reportedAt: string; // ISO
  description?: string;
  simulated?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  /** exclusive units (vehicles/teams) serve one incident; divisible stock can be split */
  exclusive: boolean;
  quantity: number; // available units/stock
  reserve: number; // minimum to keep (divisible)
  base: string;
  location: LatLng;
  speedKmh: number;
}

export interface Assignment {
  id: string;
  incidentId: string;
  resourceId: string;
  quantity: number;
  etaMin: number;
  status: "recommended" | "confirmed";
  explanation: string;
  createdAt: string;
}

export interface Shelter {
  id: string;
  name: string;
  area: string;
  location: LatLng;
  capacity: number;
  occupancy: number;
  hasMedical: boolean;
}

export interface CommunityResource {
  id: string;
  name: string;
  provider: string;
  type: ResourceType;
  quantity: number;
  area: string;
  location: LatLng;
  verified: boolean;
  contact: string;
}

export interface Notification {
  id: string;
  message: string;
  level: "critical" | "warning" | "info" | "success";
  createdAt: string;
  read: boolean;
}

export interface ActivityLog { id: string; message: string; createdAt: string }

export type Strategy = "fastest" | "urgency" | "balanced";

export const RESOURCE_LABEL: Record<ResourceType, string> = {
  ambulance: "Ambulance",
  rescue_team: "Rescue Team",
  boat: "Rescue Boat",
  medical_kit: "Medical Supplies",
  water: "Drinking Water",
  food: "Food Supplies",
  fire_truck: "Fire Truck",
};

export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

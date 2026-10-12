import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { allocate, type AllocationPlan } from "./allocation";
import { makeSeed } from "./seed";
import type {
  ActivityLog, Assignment, CommunityResource, Incident, Notification, Resource, Shelter, Strategy,
} from "./types";

let counter = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}${(counter++).toString(36)}`;

interface State {
  incidents: Incident[];
  resources: Resource[];
  assignments: Assignment[];
  shelters: Shelter[];
  community: CommunityResource[];
  notifications: Notification[];
  logs: ActivityLog[];
  strategy: Strategy;
  location: string;
  search: string;
  plan: AllocationPlan | null;
  seeded: boolean;
  init: () => void;
  resetDemo: () => void;
  setSearch: (s: string) => void;
  setLocation: (s: string) => void;
  setStrategy: (s: Strategy) => void;
  addIncident: (i: Omit<Incident, "id" | "reportedAt" | "status">) => void;
  updateIncident: (id: string, p: Partial<Incident>) => void;
  deleteIncident: (id: string) => void;
  addResource: (r: Omit<Resource, "id">) => void;
  updateResource: (id: string, p: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  runAllocation: () => void;
  confirmRecommendation: (index: number) => void;
  confirmAll: () => void;
  releaseAssignment: (id: string) => void;
  addShelter: (s: Omit<Shelter, "id">) => void;
  updateShelter: (id: string, p: Partial<Shelter>) => void;
  addCommunity: (c: Omit<CommunityResource, "id">) => void;
  updateCommunity: (id: string, p: Partial<CommunityResource>) => void;
  notify: (message: string, level: Notification["level"]) => void;
  markAllRead: () => void;
  log: (m: string) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      incidents: [], resources: [], assignments: [], shelters: [], community: [],
      notifications: [], logs: [], strategy: "balanced", location: "Ballari, Karnataka",
      search: "", plan: null, seeded: false,
      init: () => { if (!get().seeded) get().resetDemo(); },
      resetDemo: () => {
        const s = makeSeed();
        set({ ...s, assignments: [], plan: null, seeded: true, logs: [], notifications: [
          { id: uid("N"), message: "Demo dataset loaded (fictional data for Ballari district).", level: "info", createdAt: new Date().toISOString(), read: false },
          { id: uid("N"), message: "Critical: Flood near Kampli needs rescue boats.", level: "critical", createdAt: new Date().toISOString(), read: false },
        ] });
        get().log("Demo dataset reset");
      },
      setSearch: (search) => set({ search }),
      setLocation: (location) => set({ location }),
      setStrategy: (strategy) => set({ strategy, plan: null }),
      addIncident: (i) => {
        const inc: Incident = { ...i, id: uid("INC"), status: "open", reportedAt: new Date().toISOString() };
        set({ incidents: [inc, ...get().incidents], plan: null });
        get().log(`Incident reported: ${inc.title}`);
        get().notify(`New ${inc.severity} incident: ${inc.title}`, inc.severity === "critical" ? "critical" : "warning");
      },
      updateIncident: (id, p) => {
        set({ incidents: get().incidents.map((x) => (x.id === id ? { ...x, ...p } : x)), plan: null });
        if (p.status === "resolved") {
          // release resources held by resolved incident
          get().assignments.filter((a) => a.incidentId === id).forEach((a) => get().releaseAssignment(a.id));
          get().log(`Incident ${id} resolved`);
        }
      },
      deleteIncident: (id) => {
        get().assignments.filter((a) => a.incidentId === id).forEach((a) => get().releaseAssignment(a.id));
        set({ incidents: get().incidents.filter((x) => x.id !== id), plan: null });
        get().log(`Incident ${id} deleted`);
      },
      addResource: (r) => { set({ resources: [...get().resources, { ...r, id: uid("RES") }], plan: null }); get().log(`Resource added: ${r.name}`); },
      updateResource: (id, p) => { set({ resources: get().resources.map((x) => (x.id === id ? { ...x, ...p } : x)), plan: null }); },
      deleteResource: (id) => { set({ resources: get().resources.filter((x) => x.id !== id), plan: null }); get().log(`Resource ${id} removed`); },
      runAllocation: () => {
        const { incidents, resources, assignments, strategy } = get();
        const plan = allocate(incidents, resources, assignments, { strategy });
        set({ plan });
        get().log(`Allocation run (${strategy}): ${plan.recommendations.length} recommendations, ${plan.unmet.length} unmet needs`);
        plan.warnings.slice(0, 3).forEach((w) => get().notify(w, "critical"));
      },
      confirmRecommendation: (index) => {
        const plan = get().plan; if (!plan) return;
        const rec = plan.recommendations[index]; if (!rec) return;
        const res = get().resources.find((r) => r.id === rec.resourceId);
        if (!res || res.status === "unavailable" || (res.exclusive && res.status === "deployed") || (!res.exclusive && res.quantity < rec.quantity)) {
          get().notify(`Could not confirm: ${res?.name ?? rec.resourceId} is no longer available. Re-run allocation.`, "warning");
          return;
        }
        const a: Assignment = { id: uid("ASG"), incidentId: rec.incidentId, resourceId: rec.resourceId, quantity: rec.quantity, etaMin: rec.etaMin, status: "confirmed", explanation: rec.explanation, createdAt: new Date().toISOString() };
        set({
          assignments: [...get().assignments, a],
          resources: get().resources.map((r) => r.id !== res.id ? r : r.exclusive ? { ...r, status: "deployed" } : { ...r, quantity: r.quantity - rec.quantity }),
          incidents: get().incidents.map((i) => (i.id === rec.incidentId && i.status === "open" ? { ...i, status: "in_progress" } : i)),
          plan: { ...plan, recommendations: plan.recommendations.filter((_, j) => j !== index) },
        });
        get().log(`Confirmed ${res.name} → ${rec.incidentId}`);
      },
      confirmAll: () => { while (get().plan?.recommendations.length) { const before = get().plan!.recommendations.length; get().confirmRecommendation(0); if (get().plan!.recommendations.length === before) break; } },
      releaseAssignment: (id) => {
        const a = get().assignments.find((x) => x.id === id); if (!a) return;
        set({
          assignments: get().assignments.filter((x) => x.id !== id),
          resources: get().resources.map((r) => r.id !== a.resourceId ? r : r.exclusive ? { ...r, status: "available" } : { ...r, quantity: r.quantity + a.quantity }),
        });
        get().log(`Released assignment ${id}`);
      },
      addShelter: (s) => set({ shelters: [...get().shelters, { ...s, id: uid("SH") }] }),
      updateShelter: (id, p) => set({ shelters: get().shelters.map((x) => (x.id === id ? { ...x, ...p } : x)) }),
      addCommunity: (c) => { set({ community: [...get().community, { ...c, id: uid("CR") }] }); get().log(`Community offer added: ${c.name}`); },
      updateCommunity: (id, p) => set({ community: get().community.map((x) => (x.id === id ? { ...x, ...p } : x)) }),
      notify: (message, level) => set({ notifications: [{ id: uid("N"), message, level, createdAt: new Date().toISOString(), read: false }, ...get().notifications].slice(0, 50) }),
      markAllRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      log: (message) => set({ logs: [{ id: uid("L"), message, createdAt: new Date().toISOString() }, ...get().logs].slice(0, 200) }),
    }),
    {
      name: "resqflow-demo-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ ...s, plan: null, search: "" }),
    },
  ),
);

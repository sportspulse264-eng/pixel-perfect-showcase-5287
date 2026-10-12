import { etaMinutes } from "./geo";
import {
  RESOURCE_LABEL,
  SEVERITY_WEIGHT,
  type Assignment,
  type Incident,
  type Resource,
  type ResourceType,
  type Strategy,
} from "./types";

export interface Recommendation {
  incidentId: string;
  resourceId: string;
  quantity: number;
  etaMin: number;
  score: number;
  explanation: string;
  alternatives: { resourceId: string; etaMin: number }[];
}

export interface UnmetDemand {
  incidentId: string;
  type: ResourceType;
  missing: number;
  critical: boolean;
  reason: string;
}

export interface AllocationPlan {
  strategy: Strategy;
  recommendations: Recommendation[];
  unmet: UnmetDemand[];
  warnings: string[];
}

export interface AllocationOptions {
  strategy: Strategy;
  now?: number;
  /** ETA multiplier per incident area, e.g. road closures */
  roadPenalty?: Record<string, number>;
}

/**
 * Incident priority score (documented):
 *   severity weight (1-4) * 25
 * + min(waiting minutes, 240) / 240 * 20
 * + log10(people affected + 1) * 5
 */
export function incidentPriority(i: Incident, now: number): number {
  const waitMin = Math.max(0, (now - new Date(i.reportedAt).getTime()) / 60000);
  return SEVERITY_WEIGHT[i.severity] * 25 + (Math.min(waitMin, 240) / 240) * 20 + Math.log10(i.peopleAffected + 1) * 5;
}

/** Outstanding demand after existing valid assignments. */
export function outstandingNeeds(i: Incident, existing: Assignment[], resources: Resource[]) {
  const byId = new Map(resources.map((r) => [r.id, r]));
  return i.needs
    .map((n) => {
      const covered = existing
        .filter((a) => a.incidentId === i.id && byId.get(a.resourceId)?.type === n.type)
        .reduce((s, a) => s + a.quantity, 0);
      return { type: n.type, quantity: Math.max(0, n.quantity - covered) };
    })
    .filter((n) => n.quantity > 0);
}

export function allocate(
  incidents: Incident[],
  resources: Resource[],
  existing: Assignment[],
  opts: AllocationOptions,
): AllocationPlan {
  const now = opts.now ?? Date.now();
  const warnings: string[] = [];
  const recommendations: Recommendation[] = [];
  const unmet: UnmetDemand[] = [];

  // 1-2 validate + select
  const open = incidents.filter((i) => i.status !== "resolved" && i.needs.length > 0);
  // working copy of capacity (existing assignments already consumed resources)
  const remaining = new Map<string, number>();
  for (const r of resources) {
    if (r.quantity < 0 || !Number.isFinite(r.quantity)) {
      warnings.push(`${r.name} has invalid quantity and was skipped.`);
      continue;
    }
    if (r.status === "unavailable") continue;
    if (r.exclusive && r.status === "deployed") continue;
    remaining.set(r.id, r.exclusive ? 1 : Math.max(0, r.quantity));
  }

  // 4 ranking
  const priority = new Map(open.map((i) => [i.id, incidentPriority(i, now)]));
  const ordered = [...open].sort((a, b) => {
    if (opts.strategy === "urgency") {
      const d = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
      if (d) return d;
    }
    return priority.get(b.id)! - priority.get(a.id)! || a.id.localeCompare(b.id);
  });

  // balanced: first pass gives each incident at most 1 unit per need type, second pass fills rest
  const passes = opts.strategy === "balanced" ? [1, Infinity] : [Infinity];
  const outstanding = new Map(open.map((i) => [i.id, outstandingNeeds(i, existing, resources)]));

  for (const cap of passes) {
    for (const inc of ordered) {
      const penalty = opts.roadPenalty?.[inc.area] ?? 1;
      for (const need of outstanding.get(inc.id)!) {
        let toFill = Math.min(need.quantity, cap);
        while (toFill > 0) {
          const eligible = resources
            .filter((r) => r.type === need.type && (remaining.get(r.id) ?? 0) > 0)
            .map((r) => {
              const eta = etaMinutes(r.location, inc.location, r.speedKmh, penalty);
              const avail = remaining.get(r.id)!;
              const usable = r.exclusive ? 1 : Math.max(0, avail - (inc.severity === "critical" ? 0 : r.reserve));
              // strategy-specific score (higher is better)
              let score: number;
              if (opts.strategy === "fastest") score = 1000 - eta;
              else if (opts.strategy === "urgency") score = SEVERITY_WEIGHT[inc.severity] * 100 - eta * 0.5;
              else score = 1000 - eta + Math.min(usable, toFill) * 2; // prefer sources that can cover more
              return { r, eta, usable, score };
            })
            .filter((e) => e.usable > 0)
            .sort((a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id));

          if (!eligible.length) break;
          const best = eligible[0];
          const qty = best.r.exclusive ? 1 : Math.min(best.usable, toFill);
          remaining.set(best.r.id, remaining.get(best.r.id)! - qty);
          toFill -= qty;
          need.quantity -= qty;
          const alts = eligible.slice(1, 4).map((e) => ({ resourceId: e.r.id, etaMin: e.eta }));
          const altText = alts.length
            ? ` Alternatives considered: ${alts.map((a) => `${resources.find((r) => r.id === a.resourceId)!.name} (${a.etaMin} min)`).join(", ")}.`
            : " No other eligible resource was available.";
          const reason =
            opts.strategy === "fastest"
              ? "has the lowest estimated response time among eligible available units"
              : opts.strategy === "urgency"
                ? `was prioritised for this ${inc.severity} incident and is the quickest eligible unit`
                : "keeps minimum coverage across incidents while remaining quick to respond";
          const reserveText =
            !best.r.exclusive && best.r.reserve > 0
              ? inc.severity === "critical"
                ? ` Reserve of ${best.r.reserve} may be used because the incident is critical.`
                : ` A reserve of ${best.r.reserve} is kept back.`
              : "";
          recommendations.push({
            incidentId: inc.id,
            resourceId: best.r.id,
            quantity: qty,
            etaMin: best.eta,
            score: Math.round(best.score),
            alternatives: alts,
            explanation: `${best.r.name} was recommended for "${inc.title}" (${inc.severity}, priority ${Math.round(priority.get(inc.id)!)}) because it is available, matches the ${RESOURCE_LABEL[need.type].toLowerCase()} requirement and ${reason}. ETA ≈ ${best.eta} min.${reserveText}${altText}`,
          });
        }
      }
    }
  }

  for (const inc of ordered) {
    for (const need of outstanding.get(inc.id)!) {
      if (need.quantity > 0) {
        unmet.push({
          incidentId: inc.id,
          type: need.type,
          missing: need.quantity,
          critical: inc.severity === "critical",
          reason: `No available ${RESOURCE_LABEL[need.type].toLowerCase()} left with spare capacity.`,
        });
        if (inc.severity === "critical")
          warnings.push(`CRITICAL: "${inc.title}" still needs ${need.quantity} × ${RESOURCE_LABEL[need.type]}.`);
      }
    }
  }

  return { strategy: opts.strategy, recommendations, unmet, warnings };
}

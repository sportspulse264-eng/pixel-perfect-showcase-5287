import { describe, expect, it } from "vitest";
import { allocate } from "./allocation";
import { shortageOf } from "./shortage";
import { makeSeed } from "./seed";

const NOW = Date.parse("2026-10-12T08:00:00Z");

describe("allocation engine", () => {
  it("never assigns an exclusive unit to two incidents", () => {
    const { incidents, resources } = makeSeed(NOW);
    const plan = allocate(incidents, resources, [], { strategy: "fastest", now: NOW });
    const exclusiveIds = resources.filter((r) => r.exclusive).map((r) => r.id);
    for (const id of exclusiveIds) expect(plan.recommendations.filter((x) => x.resourceId === id).length).toBeLessThanOrEqual(1);
  });

  it("never allocates unavailable resources", () => {
    const { incidents, resources } = makeSeed(NOW);
    resources.forEach((r) => (r.status = "unavailable"));
    const plan = allocate(incidents, resources, [], { strategy: "balanced", now: NOW });
    expect(plan.recommendations).toHaveLength(0);
    expect(plan.unmet.length).toBeGreaterThan(0);
  });

  it("does not exceed divisible stock", () => {
    const { incidents, resources } = makeSeed(NOW);
    const plan = allocate(incidents, resources, [], { strategy: "urgency", now: NOW });
    const water = plan.recommendations.filter((x) => x.resourceId === "W-02").reduce((s, x) => s + x.quantity, 0);
    expect(water).toBeLessThanOrEqual(350);
  });

  it("is deterministic", () => {
    const { incidents, resources } = makeSeed(NOW);
    const a = allocate(incidents, resources, [], { strategy: "balanced", now: NOW });
    const b = allocate(incidents, resources, [], { strategy: "balanced", now: NOW });
    expect(a).toEqual(b);
  });

  it("warns when a critical incident is unserved", () => {
    const { incidents, resources } = makeSeed(NOW);
    const plan = allocate(incidents, resources.filter((r) => r.type !== "boat"), [], { strategy: "fastest", now: NOW });
    expect(plan.warnings.some((w) => w.includes("Kampli"))).toBe(true);
  });
});

describe("shortage", () => {
  it("is max(0, demand - supply) with percentage", () => {
    expect(shortageOf(10, 4)).toEqual({ shortage: 6, pct: 60, level: "critical" });
    expect(shortageOf(10, 12).shortage).toBe(0);
    expect(shortageOf(0, 0).pct).toBe(0);
  });
});

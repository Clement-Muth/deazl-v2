/// <reference types="bun-types" />
import { describe, it, expect } from "bun:test";
import { rebalanceAssignments } from "./rebalanceAssignments";
import type { SplitMember } from "./getSplitSettings";

const m = (budgetCap: number): SplitMember => ({ name: "", budgetCap, color: "", crMode: "CR" });
const members25 = [m(25), m(25)];

function prices(entries: [string, number][]): Map<string, number> {
  return new Map(entries);
}
function assignments(entries: [string, number][]): Map<string, number> {
  return new Map(entries);
}
function assigned(result: Map<string, number>, id: string) {
  return result.get(id);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function totalPerMember(result: Map<string, number>, prices: Map<string, number>, n: number): number[] {
  const totals = new Array(n).fill(0) as number[];
  for (const [id, mIdx] of result) {
    totals[mIdx] += prices.get(id) ?? 0;
  }
  return totals;
}

// ─── CR only ─────────────────────────────────────────────────────────────────

describe("CR only — 2 members, equal budgets", () => {
  it("1 item → member 0 (tie-break)", () => {
    const p = prices([["a", 5]]);
    const a = assignments([["a", 0]]);
    const r = rebalanceAssignments(p, a, new Set(), members25);
    expect(assigned(r, "a")).toBe(0);
  });

  it("2 items same price → one each", () => {
    const p = prices([["a", 5], ["b", 5]]);
    const a = assignments([["a", 0], ["b", 0]]);
    const r = rebalanceAssignments(p, a, new Set(), members25);
    const t = totalPerMember(r, p, 2);
    expect(t[0]).toBeCloseTo(5);
    expect(t[1]).toBeCloseTo(5);
  });

  it("3 items [10, 8, 7] → optimal split: 10 vs 15", () => {
    const p = prices([["a", 10], ["b", 8], ["c", 7]]);
    const a = assignments([["a", 0], ["b", 0], ["c", 0]]);
    const r = rebalanceAssignments(p, a, new Set(), members25);
    const t = totalPerMember(r, p, 2);
    expect(t[0]).toBeCloseTo(10);
    expect(t[1]).toBeCloseTo(15);
  });

  it("4 items [4, 3, 2, 1] → balanced 5/5", () => {
    const p = prices([["a", 4], ["b", 3], ["c", 2], ["d", 1]]);
    const a = assignments([["a", 0], ["b", 0], ["c", 0], ["d", 0]]);
    const r = rebalanceAssignments(p, a, new Set(), members25);
    const t = totalPerMember(r, p, 2);
    expect(t[0]).toBeCloseTo(5);
    expect(t[1]).toBeCloseTo(5);
  });

  it("items over budget → still assigns, cap doesn't hard-block", () => {
    const p = prices([["a", 30], ["b", 20]]);
    const a = assignments([["a", 0], ["b", 0]]);
    const r = rebalanceAssignments(p, a, new Set(), members25);
    // 30 → member 0 (tie), 20 → member 1 (25 > 25-30=-5)
    const t = totalPerMember(r, p, 2);
    expect(t[0]).toBeCloseTo(30);
    expect(t[1]).toBeCloseTo(20);
  });

  it("asymmetric budgets [20, 30] → big item goes to member 1", () => {
    const m2 = [m(20), m(30)];
    const p = prices([["a", 25], ["b", 5]]);
    const a = assignments([["a", 0], ["b", 0]]);
    const r = rebalanceAssignments(p, a, new Set(), m2);
    // member 0 cap 20, member 1 cap 30. rem[0]=20, rem[1]=30 → 25€ item to member 1
    expect(assigned(r, "a")).toBe(1);
    expect(assigned(r, "b")).toBe(0);
  });
});

// ─── HC only ─────────────────────────────────────────────────────────────────

describe("HC only — 2 members", () => {
  it("1 HC item → member 0 (tie-break)", () => {
    const p = prices([["a", 10]]);
    const a = assignments([["a", 0]]);
    const r = rebalanceAssignments(p, a, new Set(), members25, new Set(["a"]));
    expect(assigned(r, "a")).toBe(0);
  });

  it("2 HC items same price → one each", () => {
    const p = prices([["a", 6], ["b", 6]]);
    const a = assignments([["a", 0], ["b", 0]]);
    const hc = new Set(["a", "b"]);
    const r = rebalanceAssignments(p, a, new Set(), members25, hc);
    const t = totalPerMember(r, p, 2);
    expect(t[0]).toBeCloseTo(6);
    expect(t[1]).toBeCloseTo(6);
  });

  it("2 HC items [9.99, 5.99] → 9.99 to 0, 5.99 to 1", () => {
    const p = prices([["chaussettes", 9.99], ["mouchoirs", 5.99]]);
    const a = assignments([["chaussettes", 0], ["mouchoirs", 0]]);
    const hc = new Set(["chaussettes", "mouchoirs"]);
    const r = rebalanceAssignments(p, a, new Set(), members25, hc);
    const t = totalPerMember(r, p, 2);
    expect(t[0]).toBeCloseTo(9.99);
    expect(t[1]).toBeCloseTo(5.99);
  });

  it("3 HC items [10, 8, 5] → balanced 10 vs 13", () => {
    const p = prices([["a", 10], ["b", 8], ["c", 5]]);
    const a = assignments([["a", 0], ["b", 0], ["c", 0]]);
    const hc = new Set(["a", "b", "c"]);
    const r = rebalanceAssignments(p, a, new Set(), members25, hc);
    // sorted desc: 10→0, 8→1, 5→0 (0 has 10, 1 has 8, 10>8 so 5 goes to 1? no: 1 has 8 < 10, so 5 goes to 1)
    // 10→0 (tie), 8→1 (hcTotals[1]=0 < [0]=10), 5→1 (hcTotals[1]=8 < [0]=10)
    const t = totalPerMember(r, p, 2);
    expect(t[0]).toBeCloseTo(10);
    expect(t[1]).toBeCloseTo(13);
  });

  it("4 HC items [8, 7, 6, 5] → balanced 13 vs 13", () => {
    const p = prices([["a", 8], ["b", 7], ["c", 6], ["d", 5]]);
    const a = assignments([["a", 0], ["b", 0], ["c", 0], ["d", 0]]);
    const hc = new Set(["a", "b", "c", "d"]);
    const r = rebalanceAssignments(p, a, new Set(), members25, hc);
    // 8→0, 7→1, 6→1 (hcTotals: [8,7], 7<8 so 6 goes to 1?  no: 1 has 7 < 0's 8, so 6→1, hcTotals=[8,13]), 5→0 (8<13)
    // Actually: 8→0(tie), 7→1(0<8), 6→1? hcTotals=[8,7], 7<8 → 6→1. hcTotals=[8,13], 5→0(8<13)
    // Result: 0=8+5=13, 1=7+6=13
    const t = totalPerMember(r, p, 2);
    expect(t[0]).toBeCloseTo(13);
    expect(t[1]).toBeCloseTo(13);
  });
});

// ─── Mixed CR + HC ────────────────────────────────────────────────────────────

describe("Mixed CR + HC — user scenario", () => {
  it("olives(CR 2.50) + mouchoirs(HC 5.99) + chaussettes(HC 9.99) + pates(CR 4.99)", () => {
    const p = prices([
      ["olives", 2.50],
      ["mouchoirs", 5.99],
      ["chaussettes", 9.99],
      ["pates", 4.99],
    ]);
    const a = assignments([
      ["olives", 0], ["mouchoirs", 0], ["chaussettes", 0], ["pates", 0],
    ]);
    const hc = new Set(["mouchoirs", "chaussettes"]);
    const r = rebalanceAssignments(p, a, new Set(), members25, hc);

    // HC: chaussettes(9.99) → 0 (tie), mouchoirs(5.99) → 1
    expect(assigned(r, "chaussettes")).toBe(0);
    expect(assigned(r, "mouchoirs")).toBe(1);

    // CR: pates(4.99) → 0 (tie), olives(2.50) → 1 (rem[1]=25 > rem[0]=20.01)
    expect(assigned(r, "pates")).toBe(0);
    expect(assigned(r, "olives")).toBe(1);
  });

  it("HC tie-break uses total spending when HC totals are equal", () => {
    // cr1=22€ → member 0 (tie), cr2=3€ → member 1 (rem[1]=25 > rem[0]=3)
    // hc1=5€: HC totals equal (0/0), but member 1 has less total (3€ < 22€) → hc1 to member 1
    const p = prices([["cr1", 22], ["cr2", 3], ["hc1", 5]]);
    const a = assignments([["cr1", 0], ["cr2", 0], ["hc1", 0]]);
    const hc = new Set(["hc1"]);
    const r = rebalanceAssignments(p, a, new Set(), members25, hc);
    expect(assigned(r, "cr1")).toBe(0);
    expect(assigned(r, "cr2")).toBe(1);
    expect(assigned(r, "hc1")).toBe(1); // member 1 has less total spending
  });

  it("HC tie-break falls back to member 0 when all totals equal", () => {
    // CR equal (20 each), HC equal (0 each) → HC item to member 0
    const p = prices([["cr1", 20], ["cr2", 20], ["hc1", 5]]);
    const a = assignments([["cr1", 0], ["cr2", 0], ["hc1", 0]]);
    const hc = new Set(["hc1"]);
    const r = rebalanceAssignments(p, a, new Set(), members25, hc);
    expect(assigned(r, "hc1")).toBe(0);
  });
});

// ─── Locked assignments ───────────────────────────────────────────────────────

describe("Locked assignments", () => {
  it("locked CR item affects balance of unlocked items", () => {
    // member 0 has a locked 20€ CR item → only 5€ remaining
    // unlocked 10€ CR should go to member 1 (25€ remaining)
    const p = prices([["locked", 20], ["free", 10]]);
    const a = assignments([["locked", 0], ["free", 0]]);
    const locked = new Set(["locked"]);
    const r = rebalanceAssignments(p, a, locked, members25);
    expect(assigned(r, "locked")).toBe(0);
    expect(assigned(r, "free")).toBe(1);
  });

  it("locked HC item affects HC balance of unlocked HC items", () => {
    // member 0 has locked HC 10€ → member 1 gets next HC
    const p = prices([["locked_hc", 10], ["free_hc", 8]]);
    const a = assignments([["locked_hc", 0], ["free_hc", 0]]);
    const locked = new Set(["locked_hc"]);
    const hc = new Set(["locked_hc", "free_hc"]);
    const r = rebalanceAssignments(p, a, locked, members25, hc);
    expect(assigned(r, "locked_hc")).toBe(0);
    expect(assigned(r, "free_hc")).toBe(1);
  });

  it("locked item is not reassigned", () => {
    const p = prices([["a", 5], ["b", 5]]);
    const a = assignments([["a", 1], ["b", 0]]);
    const locked = new Set(["a"]);
    const r = rebalanceAssignments(p, a, locked, members25);
    // "a" is locked to member 1, stays there
    expect(assigned(r, "a")).toBe(1);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("empty assignments → empty result", () => {
    const r = rebalanceAssignments(new Map(), new Map(), new Set(), members25);
    expect(r.size).toBe(0);
  });

  it("item with no price (undefined) treated as 0", () => {
    const a = assignments([["a", 0], ["b", 0]]);
    const r = rebalanceAssignments(new Map(), a, new Set(), members25);
    const t = totalPerMember(r, new Map(), 2);
    expect(t[0]).toBe(0);
    expect(t[1]).toBe(0);
  });

  it("all items locked → no reassignment", () => {
    const p = prices([["a", 10], ["b", 10]]);
    const a = assignments([["a", 0], ["b", 0]]);
    const locked = new Set(["a", "b"]);
    const r = rebalanceAssignments(p, a, locked, members25);
    expect(assigned(r, "a")).toBe(0);
    expect(assigned(r, "b")).toBe(0);
  });
});

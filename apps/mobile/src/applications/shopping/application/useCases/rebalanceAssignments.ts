import type { SplitMember } from "./getSplitSettings";

export function rebalanceAssignments(
  confirmedPrices: Map<string, number>,
  currentAssignments: Map<string, number>,
  lockedAssignments: Set<string>,
  members: SplitMember[],
  horsCarteIds: Set<string> = new Set(),
): Map<string, number> {
  const newAssignments = new Map(currentAssignments);
  const carteTotals = new Array(members.length).fill(0) as number[];
  const horsCarteTotals = new Array(members.length).fill(0) as number[];
  for (const [id, mIdx] of currentAssignments) {
    if (lockedAssignments.has(id)) {
      const price = confirmedPrices.get(id) ?? 0;
      if (horsCarteIds.has(id)) horsCarteTotals[mIdx] += price;
      else carteTotals[mIdx] += price;
    }
  }
  const unlocked = [...currentAssignments.keys()]
    .filter((id) => !lockedAssignments.has(id))
    .sort((a, b) => (confirmedPrices.get(b) ?? 0) - (confirmedPrices.get(a) ?? 0));
  for (const id of unlocked) {
    const price = confirmedPrices.get(id) ?? 0;
    let best = 0;
    if (horsCarteIds.has(id)) {
      for (let i = 1; i < members.length; i++) {
        const hcDiff = horsCarteTotals[i] - horsCarteTotals[best];
        if (hcDiff < 0 || (hcDiff === 0 && carteTotals[i] + horsCarteTotals[i] < carteTotals[best] + horsCarteTotals[best])) best = i;
      }
      horsCarteTotals[best] += price;
    } else {
      let bestRem = members[0].budgetCap - carteTotals[0];
      for (let i = 1; i < members.length; i++) {
        const rem = members[i].budgetCap - carteTotals[i];
        if (rem > bestRem) { bestRem = rem; best = i; }
      }
      carteTotals[best] += price;
    }
    newAssignments.set(id, best);
  }
  return newAssignments;
}

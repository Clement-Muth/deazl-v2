import type { BadgeDefinition } from "../../domain/badges";

let pendingBadges: BadgeDefinition[] = [];

export function setPendingBadges(badges: BadgeDefinition[]) {
  pendingBadges = [...badges];
}

export function consumeNextPendingBadge(): BadgeDefinition | null {
  return pendingBadges.shift() ?? null;
}

export function hasPendingBadges(): boolean {
  return pendingBadges.length > 0;
}

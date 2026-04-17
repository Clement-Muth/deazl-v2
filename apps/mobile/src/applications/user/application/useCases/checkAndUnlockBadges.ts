import { supabase } from "../../../../lib/supabase";
import { BADGE_DEFINITIONS, type BadgeDefinition } from "../../domain/badges";
import { getBadgeStats } from "./getBadgeStats";

function meetsCriteria(key: string, stats: Awaited<ReturnType<typeof getBadgeStats>>): boolean {
  switch (key) {
    case "batch_cooker_1": return stats.totalSessions >= 1;
    case "batch_cooker_2": return stats.totalSessions >= 5;
    case "batch_cooker_3": return stats.totalSessions >= 10;
    case "monthly_goal_1": return stats.sessionsThisMonth >= stats.monthlyGoal;
    case "full_week_1": return stats.fullWeeksCount >= 1;
    case "full_week_2": return stats.fullWeeksCount >= 4;
    case "full_week_3": return stats.fullWeeksCount >= 10;
    case "streak_1": return stats.currentStreak >= 7;
    case "streak_2": return stats.currentStreak >= 30;
    case "streak_3": return stats.currentStreak >= 100;
    case "shopper_1": return stats.shoppingListsCompleted >= 1;
    case "shopper_2": return stats.shoppingListsCompleted >= 5;
    case "shopper_3": return stats.shoppingListsCompleted >= 20;
    default: return false;
  }
}

export async function checkAndUnlockBadges(): Promise<BadgeDefinition[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const stats = await getBadgeStats();
  const newlyUnlocked: BadgeDefinition[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (stats.unlockedKeys.includes(badge.key)) continue;
    if (!meetsCriteria(badge.key, stats)) continue;

    const { error } = await supabase.from("user_badges").insert({
      user_id: user.id,
      badge_key: badge.key,
    });

    if (!error) {
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
}

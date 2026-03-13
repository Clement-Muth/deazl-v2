import { supabase } from "../../../../lib/supabase";
import type { NotificationSettings } from "./updateNotificationSettings";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  householdSize: number;
  dietaryPreferences: string[];
  notificationSettings: NotificationSettings;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  shoppingList: true,
  household: true,
  planning: true,
};

export async function getProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: user.user_metadata?.full_name ?? "",
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    householdSize: user.user_metadata?.household_size ?? 2,
    dietaryPreferences: user.user_metadata?.dietary_preferences ?? [],
    notificationSettings: user.user_metadata?.notification_settings ?? DEFAULT_NOTIFICATION_SETTINGS,
  };
}

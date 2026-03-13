import { supabase } from "../../../../lib/supabase";

export interface NotificationSettings {
  shoppingList: boolean;
  household: boolean;
  planning: boolean;
}

export async function updateNotificationSettings(settings: NotificationSettings): Promise<{ error?: string }> {
  const { error } = await supabase.auth.updateUser({
    data: { notification_settings: settings },
  });
  if (error) return { error: error.message };
  return {};
}

import { supabase } from "../../../../lib/supabase";

export async function uploadAvatar(imageUri: string): Promise<{ url?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const response = await fetch(imageUri);
  const blob = await response.blob();
  const path = `${user.id}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
  return { url: publicUrl };
}

import { supabase } from "../../../../lib/supabase";

export async function uploadRecipeImage(localUri: string): Promise<string | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const response = await fetch(localUri);
  const blob = await response.blob();
  const ext = localUri.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("recipe-images")
    .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
  return publicUrl;
}

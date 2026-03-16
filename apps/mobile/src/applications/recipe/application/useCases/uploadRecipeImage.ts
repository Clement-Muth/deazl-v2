import { supabase } from "../../../../lib/supabase";

export async function uploadRecipeImage(base64: string, mimeType: string): Promise<string | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ext = mimeType.split("/")[1] ?? "jpeg";
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from("recipe-images")
    .upload(fileName, bytes, { contentType: mimeType, upsert: true });

  if (error) return { error: error.message };

  const { data: { publicUrl } } = supabase.storage.from("recipe-images").getPublicUrl(fileName);
  return publicUrl;
}

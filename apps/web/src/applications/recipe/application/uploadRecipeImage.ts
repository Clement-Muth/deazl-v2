import { createClient } from "@/lib/supabase/server";

export async function uploadRecipeImage(recipeId: string, file: File): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${recipeId}.${ext}`;

  const { error } = await supabase.storage
    .from("recipe-images")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return null;

  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return data.publicUrl;
}

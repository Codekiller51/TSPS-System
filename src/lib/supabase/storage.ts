import { createClient } from "./server";

export async function uploadImage(file: File, bucket: string, path: string) {
  try {
    const supabase = await createClient();

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error };
  }
}

export async function deleteImage(bucket: string, path: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error };
  }
}

export async function getPublicUrl(bucket: string, path: string) {
  const supabase = await createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

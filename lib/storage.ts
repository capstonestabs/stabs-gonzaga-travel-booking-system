import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { env, hasSupabaseServiceEnv } from "@/lib/env";

export async function uploadPublicAsset(options: {
  folder: "avatars" | "covers" | "destinations" | "tours" | "services";
  file: File;
  fileNamePrefix: string;
}) {
  if (!hasSupabaseServiceEnv()) {
    throw new Error("Supabase storage is not configured.");
  }

  const supabase = createAdminSupabaseClient();
  const extension = options.file.type.includes("webp") ? "webp" : "bin";
  const path = `${options.folder}/${options.fileNamePrefix}-${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await options.file.arrayBuffer());

  const { error } = await supabase.storage
    .from(env.storageBucket)
    .upload(path, buffer, { contentType: options.file.type, upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(env.storageBucket).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl
  };
}

export async function removePublicAsset(path: string) {
  if (!hasSupabaseServiceEnv()) {
    throw new Error("Supabase storage is not configured.");
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.storage.from(env.storageBucket).remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

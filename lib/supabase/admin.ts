import { createClient } from "@supabase/supabase-js";

import { env, hasSupabaseServiceEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  if (!hasSupabaseServiceEnv()) {
    throw new Error("Supabase service role credentials are missing.");
  }

  return createClient(env.nextPublicSupabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

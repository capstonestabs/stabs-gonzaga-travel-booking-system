const env = {
  nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  nextPublicSupabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  paymongoSecretKey: process.env.PAYMONGO_SECRET_KEY ?? "",
  paymongoWebhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET ?? "",
  nextPublicSiteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  storageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"
};

export function hasSupabaseBrowserEnv() {
  return Boolean(env.nextPublicSupabaseUrl && env.nextPublicSupabaseAnonKey);
}

export function hasSupabaseServiceEnv() {
  return Boolean(
    env.nextPublicSupabaseUrl &&
      env.nextPublicSupabaseAnonKey &&
      env.supabaseServiceRoleKey
  );
}

export function hasPayMongoEnv() {
  return Boolean(env.paymongoSecretKey);
}

export function getSiteUrl() {
  return env.nextPublicSiteUrl.replace(/\/$/, "");
}

export { env };

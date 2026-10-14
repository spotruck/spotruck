import { createClient } from "@supabase/supabase-js";

// Client Supabase "serveur" avec tous les droits. A n'utiliser que dans les routes /api.
export function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

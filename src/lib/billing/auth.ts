import { createClient } from "@supabase/supabase-js";

// Identifie l'utilisateur connecté à partir du jeton envoyé par le navigateur.
export async function authUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data } = await sb.auth.getUser(token);
  if (!data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

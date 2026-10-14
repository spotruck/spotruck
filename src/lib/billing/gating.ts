import { getAdmin } from "./admin";
import { FREE_PDF_PER_MONTH, GATING_ENABLED, isPaidPlan } from "./plans";

type Ft = { id: string; plan?: string | null; plan_expire_at?: string | null };

// Vérifie la limite mensuelle de dossiers PDF du plan gratuit.
// En cas de souci technique, on laisse passer : une panne de facturation ne doit jamais bloquer un utilisateur.
export async function checkPdfQuota(ft: Ft): Promise<{ ok: boolean; message?: string }> {
  if (!GATING_ENABLED) return { ok: true };
  try {
    if (isPaidPlan(ft)) return { ok: true };
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const { count, error } = await getAdmin()
      .from("pdf_generations")
      .select("id", { count: "exact", head: true })
      .eq("foodtrucker_id", ft.id)
      .gte("created_at", start.toISOString());
    if (error) return { ok: true };
    if ((count ?? 0) >= FREE_PDF_PER_MONTH) {
      return {
        ok: false,
        message: `Limite du plan gratuit atteinte : ${FREE_PDF_PER_MONTH} dossier PDF par mois. Passe au plan Pro (menu MON ABONNEMENT) pour en générer sans limite.`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function logPdf(foodtruckerId: string, evenementId: string | null) {
  try {
    await getAdmin().from("pdf_generations").insert({ foodtrucker_id: foodtruckerId, evenement_id: evenementId });
  } catch {
    // sans importance
  }
}

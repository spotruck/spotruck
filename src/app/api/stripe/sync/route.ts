import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { getAdmin } from "@/lib/billing/admin";
import { authUser } from "@/lib/billing/auth";
import { applySubscription } from "@/lib/billing/sync";

export const runtime = "nodejs";

// Met à jour le plan tout de suite après un paiement (ou au retour du portail),
// sans attendre le webhook.
export async function POST(req: NextRequest) {
  try {
    const user = await authUser(req);
    if (!user) return NextResponse.json({ error: "Session expirée, reconnecte-toi." }, { status: 401 });

    let sessionId: string | null = null;
    try {
      const body = await req.json();
      sessionId = body?.session_id || null;
    } catch {}

    const stripe = getStripe();
    let sub: Stripe.Subscription | null = null;

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
      if (session.client_reference_id !== user.id) {
        return NextResponse.json({ error: "Cette session n'est pas la tienne." }, { status: 403 });
      }
      if (session.subscription && typeof session.subscription !== "string") sub = session.subscription;
      else if (typeof session.subscription === "string") sub = await stripe.subscriptions.retrieve(session.subscription);
    } else {
      const { data: ft } = await getAdmin()
        .from("foodtruckers")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle();
      if (ft?.stripe_customer_id) {
        const list = await stripe.subscriptions.list({ customer: ft.stripe_customer_id, status: "all", limit: 1 });
        sub = list.data[0] || null;
      }
    }

    if (!sub) return NextResponse.json({ ok: true, plan: "free" });
    await applySubscription(sub, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("sync", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 500 });
  }
}

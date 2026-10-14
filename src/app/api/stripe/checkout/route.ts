import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { getAdmin } from "@/lib/billing/admin";
import { authUser } from "@/lib/billing/auth";
import { LAUNCH_OFFER_ACTIVE, PRICE_LOOKUP, isPaidPlan } from "@/lib/billing/plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await authUser(req);
    if (!user) return NextResponse.json({ error: "Session expirée, reconnecte-toi." }, { status: 401 });

    const admin = getAdmin();
    const stripe = getStripe();

    const { data: ft } = await admin
      .from("foodtruckers")
      .select("id, plan, plan_expire_at, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!ft) return NextResponse.json({ error: "Profil foodtrucker introuvable." }, { status: 404 });
    if (isPaidPlan(ft)) return NextResponse.json({ error: "Tu as déjà un abonnement actif." }, { status: 400 });

    // Client Stripe : on réutilise l'existant s'il est valide, sinon on en crée un.
    let customerId: string | null = ft.stripe_customer_id || null;
    if (customerId) {
      try {
        const c = await stripe.customers.retrieve(customerId);
        if ((c as { deleted?: boolean }).deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }
    if (!customerId) {
      const c = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = c.id;
      await admin.from("foodtruckers").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const key = LAUNCH_OFFER_ACTIVE ? PRICE_LOOKUP.launch : PRICE_LOOKUP.normal;
    const prices = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) {
      return NextResponse.json(
        { error: "Tarif introuvable côté Stripe. Lance d'abord le script create_stripe_products.py." },
        { status: 500 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      locale: "fr",
      success_url: `${origin}/dashboard/foodtrucker/abonnement?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/foodtrucker/abonnement?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur de paiement" }, { status: 500 });
  }
}

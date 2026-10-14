import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { getAdmin } from "@/lib/billing/admin";
import { applySubscription } from "@/lib/billing/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe nous prévient ici de chaque renouvellement, échec de paiement ou résiliation.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });

  const body = await req.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const admin = getAdmin();
  // Évite de traiter deux fois le même événement.
  const { error: dup } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dup && dup.code === "23505") return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription) {
          const id = typeof s.subscription === "string" ? s.subscription : s.subscription.id;
          const sub = await stripe.subscriptions.retrieve(id);
          await applySubscription(sub, s.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("webhook", event.type, e);
    // On oublie l'événement pour que Stripe le renvoie.
    await admin.from("stripe_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

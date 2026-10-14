import type Stripe from "stripe";
import { getAdmin } from "./admin";
import { GRACE_DAYS } from "./plans";

const ACTIVE = new Set(["active", "trialing", "past_due"]);

function periodEnd(sub: Stripe.Subscription): number | null {
  const s = sub as unknown as { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
  return s.items?.data?.[0]?.current_period_end ?? s.current_period_end ?? null;
}

// Recopie l'état d'un abonnement Stripe dans la fiche du foodtrucker.
export async function applySubscription(sub: Stripe.Subscription, userIdHint?: string | null): Promise<boolean> {
  const admin = getAdmin();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = userIdHint || sub.metadata?.user_id || null;

  const base = admin.from("foodtruckers").select("id, plan, stripe_subscription_id").limit(1);
  const { data: rows, error } = userId ? await base.eq("id", userId) : await base.eq("stripe_customer_id", customerId);
  if (error) throw new Error(error.message);
  const row = rows?.[0];
  if (!row) return false;

  const active = ACTIVE.has(sub.status);
  // Un ancien abonnement qui se termine ne doit pas annuler un abonnement plus récent.
  if (!active && row.stripe_subscription_id && row.stripe_subscription_id !== sub.id) return true;

  const end = periodEnd(sub);
  const keepPlan = ["premium", "saison"].includes(row.plan) ? row.plan : "pro";
  const { error: upErr } = await admin
    .from("foodtruckers")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan_status: sub.status,
      plan_cancel_at_period_end: !!sub.cancel_at_period_end || !!sub.cancel_at,
      plan: active ? keepPlan : "free",
      plan_expire_at: active && end ? new Date((end + GRACE_DAYS * 86400) * 1000).toISOString() : null,
    })
    .eq("id", row.id);
  if (upErr) throw new Error(upErr.message);
  return true;
}

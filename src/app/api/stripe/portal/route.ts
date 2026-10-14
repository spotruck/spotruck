import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { getAdmin } from "@/lib/billing/admin";
import { authUser } from "@/lib/billing/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await authUser(req);
    if (!user) return NextResponse.json({ error: "Session expirée, reconnecte-toi." }, { status: 401 });

    const { data: ft } = await getAdmin()
      .from("foodtruckers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!ft?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun abonnement à gérer pour l'instant." }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const configuration = process.env.STRIPE_PORTAL_CONFIG_ID;
    const session = await getStripe().billingPortal.sessions.create({
      customer: ft.stripe_customer_id,
      return_url: `${origin}/dashboard/foodtrucker/abonnement?refresh=1`,
      ...(configuration ? { configuration } : {}),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("portal", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 500 });
  }
}

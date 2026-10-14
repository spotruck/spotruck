// Réglages centraux des abonnements Spotruck.
// Pour changer un texte ou une limite, c'est ici. Le prix réel se règle dans Stripe.

// Mettre NEXT_PUBLIC_PLAN_GATING=on pour activer les limites du plan gratuit.
export const GATING_ENABLED = process.env.NEXT_PUBLIC_PLAN_GATING === "on";

// Mettre NEXT_PUBLIC_LAUNCH_OFFER=off pour arrêter l'offre de lancement (nouveaux abonnés au prix normal).
export const LAUNCH_OFFER_ACTIVE = process.env.NEXT_PUBLIC_LAUNCH_OFFER !== "off";

// Clés de recherche des tarifs dans Stripe (créées par le script create_stripe_products.py).
export const PRICE_LOOKUP = { launch: "spotruck_pro_launch", normal: "spotruck_pro_monthly" } as const;

// Prix affichés (TTC) : doivent correspondre à ceux créés dans Stripe.
export const PRICE_DISPLAY = { launch: 9.99, normal: 15 } as const;

// Nombre de dossiers PDF par mois pour le plan gratuit.
export const FREE_PDF_PER_MONTH = 1;

// Jours de marge après la fin de période payée (au cas où un renouvellement tarde).
export const GRACE_DAYS = 2;

export const PAID_PLANS = ["pro", "premium", "saison"];

export type Feature = { text: string; soon?: boolean };

export const FREE_FEATURES: Feature[] = [
  { text: "Toutes les annonces, le calendrier et ton profil public" },
  { text: "Résumé hebdomadaire des nouveautés", soon: true },
  { text: `${FREE_PDF_PER_MONTH} dossier PDF par mois` },
  { text: "Suivi des candidatures basique" },
  { text: "Aperçu des offres postées sur Spotruck", soon: true },
];

export const PRO_FEATURES: Feature[] = [
  { text: "Tout le plan Gratuit" },
  { text: "Dossiers PDF illimités" },
  { text: "Suivi complet des candidatures et rappels", soon: true },
  { text: "Alertes instantanées personnalisées", soon: true },
  { text: "Outil de prospection (e-mail pré-rédigé, suivi des relances)", soon: true },
  { text: "Répondre aux offres postées sur Spotruck", soon: true },
];

type PlanRow = { plan?: string | null; plan_expire_at?: string | null } | null | undefined;

export function isPaidPlan(f: PlanRow): boolean {
  if (!f || !f.plan || !PAID_PLANS.includes(f.plan)) return false;
  if (!f.plan_expire_at) return true;
  const t = Date.parse(f.plan_expire_at);
  return Number.isNaN(t) ? true : t > Date.now();
}

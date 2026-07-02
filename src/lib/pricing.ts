// ══════════════════════════════════════════════════════════════
// SYSTÈME DE PRIX DOUBLE SPOTRUCK
// ══════════════════════════════════════════════════════════════
// Inspiré d'Airbnb/Staffme :
// - L'organisateur saisit son budget total (ce qu'il paie)
// - Le foodtrucker voit ce qu'il va recevoir (budget - commission)
// - Spotruck garde la différence
// ══════════════════════════════════════════════════════════════

export type OrganizerPlan = "gratuit" | "pro-event" | "pro-semestriel" | "pro-annuel";

// Commission Spotruck selon le plan
export const COMMISSION_STANDARD = 0.13; // 13% pour plan Gratuit
export const COMMISSION_PRO = 0.10;      // 10% pour tous les plans Pro

/**
 * Retourne la commission applicable selon le plan organisateur
 */
export function getCommission(organizerPlan: OrganizerPlan): number {
  return organizerPlan === "gratuit" ? COMMISSION_STANDARD : COMMISSION_PRO;
}

/**
 * Calcule le prix NET que le foodtrucker va recevoir
 * @param organizerBudget - Le budget total saisi par l'organisateur
 * @param organizerPlan - Le plan de l'organisateur
 * @returns Le montant que le truck va recevoir (arrondi)
 */
export function getPriceForTruck(
  organizerBudget: number,
  organizerPlan: OrganizerPlan
): number {
  const commission = getCommission(organizerPlan);
  return Math.round(organizerBudget * (1 - commission));
}

/**
 * Calcule les frais Spotruck (la différence entre budget organisateur et prix truck)
 * @param organizerBudget - Le budget total saisi par l'organisateur
 * @param organizerPlan - Le plan de l'organisateur
 * @returns Les frais Spotruck
 */
export function getSpotruckFee(
  organizerBudget: number,
  organizerPlan: OrganizerPlan
): number {
  return organizerBudget - getPriceForTruck(organizerBudget, organizerPlan);
}

/**
 * Formatte un montant en euros avec séparateurs de milliers
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} €`;
}

/**
 * Exemple d'utilisation :
 *
 * const organizerBudget = 900;
 * const plan = "gratuit";
 *
 * const truckPrice = getPriceForTruck(organizerBudget, plan);
 * // => 783€ (900€ - 13%)
 *
 * const spotruckFee = getSpotruckFee(organizerBudget, plan);
 * // => 117€
 */

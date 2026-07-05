import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EvenementsListClient, { type EvenementRow, type CandidatureRow } from "./EvenementsListClient";

export default async function EvenementsListPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }

  const { data: evenements } = await supabase
    .from('evenements')
    .select(`
      id, titre, type, lieu, ville, region, description, date_debut, date_fin,
      heure_debut, heure_fin, visiteurs_attendus, nombre_trucks, statut,
      modele_financier, budget_truck, droit_de_place, pourcentage_ca,
      electricite_disponible, type_prise, amperage, surface_disponible,
      acces_vehicule, documents_requis, date_limite_candidature
    `)
    .eq('organisateur_id', user.id)
    .order('date_debut', { ascending: false });

  const evenementsList = evenements || [];
  const evenementIds = evenementsList.map(e => e.id);

  const candsByEvent: Record<string, CandidatureRow[]> = {};
  if (evenementIds.length > 0) {
    const { data: cands } = await supabase
      .from('candidatures')
      .select('id, evenement_id, foodtrucker_id, statut, created_at')
      .in('evenement_id', evenementIds)
      .order('created_at', { ascending: false });

    const rows = cands || [];
    const foodtruckerIds = [...new Set(rows.map(r => r.foodtrucker_id))];
    let foodtruckers: { id: string; nom_truck: string }[] = [];
    if (foodtruckerIds.length > 0) {
      const { data: ftData } = await supabase
        .from('foodtruckers')
        .select('id, nom_truck')
        .in('id', foodtruckerIds);
      foodtruckers = ftData || [];
    }

    rows.forEach(r => {
      const ft = foodtruckers.find(f => f.id === r.foodtrucker_id);
      const list = candsByEvent[r.evenement_id] ?? (candsByEvent[r.evenement_id] = []);
      list.push({
        id: r.id,
        truck: ft?.nom_truck || "Foodtrucker",
        statut: r.statut,
        dateISO: r.created_at,
      });
    });
  }

  const rows: EvenementRow[] = evenementsList.map(e => ({
    id: e.id,
    titre: e.titre,
    type: e.type,
    lieu: e.lieu || "",
    ville: e.ville || "",
    region: e.region || "",
    description: e.description || "",
    dateDebut: e.date_debut,
    dateFin: e.date_fin,
    heureDebut: e.heure_debut,
    heureFin: e.heure_fin,
    visiteurs: e.visiteurs_attendus || 0,
    trucks: e.nombre_trucks || 1,
    statut: e.statut,
    modeleFinancier: e.modele_financier,
    budgetTruck: e.budget_truck,
    droitDePlace: e.droit_de_place,
    pourcentageCa: e.pourcentage_ca,
    electriciteDisponible: e.electricite_disponible || false,
    typePrise: e.type_prise,
    amperage: e.amperage,
    surfaceDisponible: e.surface_disponible,
    accesVehicule: e.acces_vehicule ?? true,
    documentsRequis: e.documents_requis || [],
    dateLimiteCandidature: e.date_limite_candidature,
    candidatures: candsByEvent[e.id] || [],
  }));

  return <EvenementsListClient evenements={rows} />;
}

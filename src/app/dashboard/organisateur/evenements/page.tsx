import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EvenementsListClient, { type EvenementRow } from "./EvenementsListClient";

export default async function EvenementsListPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }

  const { data: evenements } = await supabase
    .from('evenements')
    .select('id, titre, type, lieu, ville, date_debut, date_fin, visiteurs_attendus, nombre_trucks, statut')
    .eq('organisateur_id', user.id)
    .order('date_debut', { ascending: false });

  const evenementsList = evenements || [];
  const evenementIds = evenementsList.map(e => e.id);

  const candCounts: Record<string, number> = {};
  if (evenementIds.length > 0) {
    const { data: cands } = await supabase
      .from('candidatures')
      .select('evenement_id')
      .in('evenement_id', evenementIds);
    (cands || []).forEach(c => { candCounts[c.evenement_id] = (candCounts[c.evenement_id] || 0) + 1; });
  }

  const rows: EvenementRow[] = evenementsList.map(e => ({
    id: e.id,
    titre: e.titre,
    type: e.type,
    lieu: e.lieu || "",
    ville: e.ville || "",
    dateDebut: e.date_debut,
    dateFin: e.date_fin,
    visiteurs: e.visiteurs_attendus || 0,
    trucks: e.nombre_trucks || 1,
    statut: e.statut,
    candidatures: candCounts[e.id] || 0,
  }));

  return <EvenementsListClient evenements={rows} />;
}

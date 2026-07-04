import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CandidaturesClient, { type Candidature } from "./CandidaturesClient";

const DOC_LABELS: Record<string, string> = {
  kbis: "KBIS",
  haccp: "HACCP",
  rc_pro: "RC Pro",
  conformite_gaz: "Conformité gaz",
  conformite_electrique: "Conformité électrique",
  controle_hygiene: "Contrôle hygiène",
};

const STATUT_MAP: Record<string, Candidature["statut"]> = {
  en_attente: "EN ATTENTE",
  acceptee: "RETENU",
  refusee: "REFUSÉ",
  annulee: "REFUSÉ",
};

export default async function CandidaturesPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }

  const { data: organisateur } = await supabase
    .from('organisateurs')
    .select('nom_organisation, prenom_responsable, nom_responsable')
    .eq('id', user.id)
    .single();

  const organisateurNom = organisateur?.prenom_responsable && organisateur?.nom_responsable
    ? `${organisateur.prenom_responsable} ${organisateur.nom_responsable}`
    : organisateur?.nom_organisation || "L'organisateur";

  const { data: evenements } = await supabase
    .from('evenements')
    .select('id, titre, ville')
    .eq('organisateur_id', user.id);

  const evenementsList = evenements || [];
  const evenementIds = evenementsList.map(e => e.id);

  let candidatures: Candidature[] = [];

  if (evenementIds.length > 0) {
    const { data: candRows } = await supabase
      .from('candidatures')
      .select('id, evenement_id, foodtrucker_id, message, statut, created_at')
      .in('evenement_id', evenementIds)
      .order('created_at', { ascending: false });

    const rows = candRows || [];
    const foodtruckerIds = [...new Set(rows.map(r => r.foodtrucker_id))];

    let foodtruckers: {
      id: string; nom_truck: string; cuisines: string[] | null; ville: string | null;
      note_moyenne: number | null; plan: string | null; longueur: number | null;
      largeur: number | null; amperage: number | null;
    }[] = [];
    let documents: { foodtrucker_id: string; type: string }[] = [];
    let avisRows: { cible_id: string; note_globale: number; commentaire: string | null }[] = [];

    if (foodtruckerIds.length > 0) {
      const [{ data: ftData }, { data: docData }, { data: avisData }] = await Promise.all([
        supabase.from('foodtruckers')
          .select('id, nom_truck, cuisines, ville, note_moyenne, plan, longueur, largeur, amperage')
          .in('id', foodtruckerIds),
        supabase.from('documents').select('foodtrucker_id, type').in('foodtrucker_id', foodtruckerIds),
        supabase.from('avis').select('cible_id, note_globale, commentaire').in('cible_id', foodtruckerIds).limit(30),
      ]);
      foodtruckers = ftData || [];
      documents = docData || [];
      avisRows = avisData || [];
    }

    candidatures = rows.map(r => {
      const ft = foodtruckers.find(f => f.id === r.foodtrucker_id);
      const evt = evenementsList.find(e => e.id === r.evenement_id);
      const docs = documents.filter(d => d.foodtrucker_id === r.foodtrucker_id).map(d => DOC_LABELS[d.type] || d.type);
      const avis = avisRows.filter(a => a.cible_id === r.foodtrucker_id).slice(0, 3).map(a => ({
        auteur: "Avis Spotruck",
        note: a.note_globale,
        texte: a.commentaire || "",
      }));
      const note = ft?.note_moyenne || 0;

      return {
        id: r.id,
        truck: ft?.nom_truck || "Foodtrucker",
        plan: ft?.plan || "free",
        cuisine: ft?.cuisines?.[0] || "Cuisine variée",
        ville: ft?.ville || "",
        note,
        score: note > 0 ? Math.round((note / 5) * 100) : 60,
        statut: STATUT_MAP[r.statut] || "EN ATTENTE",
        date: r.created_at,
        message: r.message || "",
        docs,
        taille: ft?.longueur && ft?.largeur ? `${ft.longueur}m × ${ft.largeur}m` : "Non précisé",
        amperage: ft?.amperage || 0,
        avis,
        foodtruckerId: r.foodtrucker_id,
        evenementId: r.evenement_id,
        evenementTitre: evt?.titre || "Événement",
        evenementVille: evt?.ville || "",
        evenementDate: "",
      };
    });
  }

  return <CandidaturesClient initialCandidatures={candidatures} organisateurNom={organisateurNom} />;
}

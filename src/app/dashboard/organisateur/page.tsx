import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrganisateurDashboardClient from "./OrganisateurDashboardClient";

const PLAN_LABELS: Record<string, string> = {
  gratuit: "Plan Gratuit",
  pro_event: "Plan Pro Event",
  pro_semestriel: "Plan Pro Semestriel",
  pro_annuel: "Plan Pro Annuel",
};

export default async function OrganisateurDashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }

  const { data: organisateur } = await supabase
    .from('organisateurs')
    .select('nom_organisation, prenom_responsable, nom_responsable, plan')
    .eq('id', user.id)
    .single();

  const userData = {
    displayName: organisateur?.prenom_responsable && organisateur?.nom_responsable
      ? `${organisateur.prenom_responsable} ${organisateur.nom_responsable}`
      : organisateur?.nom_organisation || "Organisateur",
    displaySubtitle: organisateur?.nom_organisation || "",
    initials: (organisateur?.prenom_responsable || organisateur?.nom_organisation || "O")[0].toUpperCase(),
    planLabel: PLAN_LABELS[organisateur?.plan || 'gratuit'] || "Plan Gratuit",
    prenom: organisateur?.prenom_responsable || "",
  };

  const { data: evenements } = await supabase
    .from('evenements')
    .select('id, titre, ville, date_debut, visiteurs_attendus, nombre_trucks, statut')
    .eq('organisateur_id', user.id)
    .order('date_debut', { ascending: false });

  const evenementsList = evenements || [];
  const evenementIds = evenementsList.map(e => e.id);

  let candidatures: { id: string; statut: string; evenement_id: string; foodtrucker_id: string }[] = [];
  if (evenementIds.length > 0) {
    const { data } = await supabase
      .from('candidatures')
      .select('id, statut, evenement_id, foodtrucker_id')
      .in('evenement_id', evenementIds);
    candidatures = data || [];
  }

  const evenementsPublies = evenementsList.filter(e => e.statut === 'publie' || e.statut === 'complet').length;
  const evenementsActifsList = evenementsList.filter(e => e.statut === 'publie' || e.statut === 'complet');
  const candidaturesNonTraitees = candidatures.filter(c => c.statut === 'en_attente').length;
  const trucksRetenus = candidatures.filter(c => c.statut === 'acceptee').length;

  const evtActifRaw = evenementsActifsList.sort((a, b) => a.date_debut.localeCompare(b.date_debut))[0];
  const evtTermineRaw = evenementsList.find(e => e.statut === 'termine');

  function toResume(e: typeof evtActifRaw | typeof evtTermineRaw, actif: boolean) {
    if (!e) return null;
    return {
      titre: e.titre,
      ville: e.ville || "",
      dateLabel: new Date(e.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      visiteurs: e.visiteurs_attendus || 0,
      trucks: e.nombre_trucks || 1,
      actif,
    };
  }

  const evenementActif = toResume(evtActifRaw, true);
  const dernierEvenement = toResume(evtTermineRaw, false);

  let candidaturesRecentes: {
    id: string; truck: string; cuisine: string; note: number; score: number;
    statut: "EN ATTENTE" | "RETENU" | "REFUSÉ"; ville: string;
  }[] = [];

  if (evtActifRaw && candidatures.length > 0) {
    const candForActif = candidatures.filter(c => c.evenement_id === evtActifRaw.id).slice(0, 3);
    const foodtruckerIds = candForActif.map(c => c.foodtrucker_id);
    if (foodtruckerIds.length > 0) {
      const { data: foodtruckers } = await supabase
        .from('foodtruckers')
        .select('id, nom_truck, cuisines, ville, note_moyenne')
        .in('id', foodtruckerIds);

      const STATUT_MAP: Record<string, "EN ATTENTE" | "RETENU" | "REFUSÉ"> = {
        en_attente: "EN ATTENTE", acceptee: "RETENU", refusee: "REFUSÉ", annulee: "REFUSÉ",
      };

      candidaturesRecentes = candForActif.map(c => {
        const ft = foodtruckers?.find(f => f.id === c.foodtrucker_id);
        return {
          id: c.id,
          truck: ft?.nom_truck || "Foodtrucker",
          cuisine: ft?.cuisines?.[0] || "Cuisine variée",
          note: ft?.note_moyenne || 0,
          score: Math.round(((ft?.note_moyenne || 0) / 5) * 100),
          statut: STATUT_MAP[c.statut] || "EN ATTENTE",
          ville: ft?.ville || "",
        };
      });
    }
  }

  return (
    <OrganisateurDashboardClient
      userData={userData}
      stats={{
        evenementsPublies,
        evenementsActifs: evenementsActifsList.length,
        candidaturesRecues: candidatures.length,
        candidaturesNonTraitees,
        trucksRetenus,
      }}
      evenementActif={evenementActif}
      dernierEvenement={dernierEvenement}
      candidaturesRecentes={candidaturesRecentes}
      nomEvenementActif={evtActifRaw ? `${evtActifRaw.titre} — ${evtActifRaw.ville || ""}, ${new Date(evtActifRaw.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ""}
    />
  );
}

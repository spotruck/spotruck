import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OpportunitesClient from "./OpportunitesClient";

export default async function OpportunitesPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  // Récupérer le plan de l'utilisateur
  const { data: foodtrucker } = await supabase
    .from('foodtruckers')
    .select('plan, nom_truck, prenom_gerant, nom_gerant')
    .eq('id', user.id)
    .single();

  const userPlan = foodtrucker?.plan || 'free';

  // Récupérer TOUS les événements d'abord pour debug
  const { data: allEvents, error: allEventsError } = await supabase
    .from('evenements')
    .select('id, titre, statut, created_at');

  console.log('🔍 Debug - TOUS les événements:', {
    count: allEvents?.length || 0,
    events: allEvents,
    error: allEventsError
  });

  // Récupérer les événements publiés
  const { data: evenements, error: eventsError } = await supabase
    .from('evenements')
    .select(`
      id,
      titre,
      date_debut,
      date_fin,
      heure_debut,
      heure_fin,
      lieu,
      ville,
      region,
      type,
      visiteurs_attendus,
      nombre_trucks,
      modele_financier,
      budget_truck,
      electricite_disponible,
      surface_disponible,
      created_at,
      date_limite_candidature,
      description,
      statut,
      source,
      url_source
    `)
    .eq('statut', 'publie')
    .gte('date_debut', new Date().toISOString().split('T')[0])
    .order('date_debut', { ascending: true });

  console.log('🔍 Debug - Événements PUBLIÉS:', {
    count: evenements?.length || 0,
    events: evenements?.map(e => ({ id: e.id, titre: e.titre, statut: e.statut })),
    error: eventsError,
    errorDetails: eventsError ? {
      message: eventsError.message,
      code: eventsError.code,
      details: eventsError.details,
      hint: eventsError.hint
    } : null
  });

  console.log('🔍 Opportunités Debug:', {
    userId: user.id,
    userEmail: user.email,
    userPlan,
    nombreEvenements: evenements?.length || 0,
    eventsError
  });

  // Préparer les données utilisateur pour la sidebar
  const userData = {
    displayName: foodtrucker?.nom_truck || "Foodtrucker",
    displaySubtitle: foodtrucker?.prenom_gerant && foodtrucker?.nom_gerant
      ? `${foodtrucker.prenom_gerant} ${foodtrucker.nom_gerant}`
      : foodtrucker?.prenom_gerant || "",
    initials: foodtrucker?.nom_truck ? foodtrucker.nom_truck[0].toUpperCase() : "F",
    planLabel: ({
      free: "Plan Free",
      pro: "Plan Pro",
      premium: "Plan Premium",
      saison: "Plan Saison"
    } as Record<string, string>)[userPlan as string],

  // Transformer les données Supabase pour le client
  const evenementsFormatted = (evenements || []).map((ev) => {
    // Formater les dates
    const dateDebut = new Date(ev.date_debut);
    const dateFin = ev.date_fin ? new Date(ev.date_fin) : null;

    let dateLabel = dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    if (dateFin && dateFin.getTime() !== dateDebut.getTime()) {
      dateLabel = `${dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}–${dateFin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }

    // Formater les heures
    const heuresLabel = ev.heure_fin
      ? `${ev.heure_debut} – ${ev.heure_fin}`
      : ev.heure_debut || "";

    // Budget pour les foodtruckers (ce qu'ils voient réellement)
    const budgetTruck = ev.budget_truck || 0;
    const budgetLabel = budgetTruck > 0
      ? (ev.modele_financier === 'privatisation'
          ? `${budgetTruck.toLocaleString('fr-FR')} € (prestation)`
          : `${budgetTruck.toLocaleString('fr-FR')} € / jour`)
      : "Tarif non communiqué";

    // Date limite de candidature
    const dateLimite = ev.date_limite_candidature
      ? new Date(ev.date_limite_candidature)
      : new Date(dateDebut.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 jours avant par défaut

    const dateLimiteLabel = dateLimite.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      id: ev.id,
      titre: ev.titre,
      date: dateLabel,
      dateISO: ev.date_debut,
      heures: heuresLabel,
      adresse: ev.lieu || "",
      ville: ev.ville || "",
      region: ev.region || "",
      type: ev.type || "Autre",
      visiteurs: ev.visiteurs_attendus || 0,
      trucks: ev.nombre_trucks || 1,
      budgetMin: budgetTruck,
      budgetMax: budgetTruck,
      budgetLabel: budgetLabel,
      offre: ev.modele_financier === 'privatisation' ? 'PRIVATISATION' : 'DROIT DE PLACE',
      cuisinesRecherchees: [],
      electricite: ev.electricite_disponible || false,
      surfaceParTruck: ev.surface_disponible ? `${ev.surface_disponible} m²` : "Non précisé",
      nouveau: (Date.now() - new Date(ev.created_at).getTime()) < 48 * 60 * 60 * 1000,
      publicationISO: ev.created_at,
      dateLimiteCandidatureISO: dateLimite.toISOString(),
      dateLimiteCandidatureLabel: dateLimiteLabel,
      source: ev.source || "Spotruck",
      urlSource: ev.url_source || "#",
      description: ev.description || "",
      descriptionComplete: ev.description || "",
      instructionsCandidature: "Candidatez directement via le formulaire Spotruck ci-dessous.",
      modeCandidature: "formulaire_spotruck" as const,
      contactCandidature: "spotruck_form",
      documentsRequis: ["KBIS", "HACCP", "RC Pro", "Photos du truck"],
    };
  });

  return (
    <OpportunitesClient
      initialEvenements={evenementsFormatted}
      userPlan={userPlan as "free" | "pro" | "premium" | "saison"}
      userData={userData}
    />
  );
}

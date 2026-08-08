import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilClient from "./ProfilClient";
import { type UploadedDoc } from "./DocumentUpload";
import type { Photo } from "./PhotoUpload";

// Cette page dépend de la session (cookies) : on force le rendu dynamique
// pour toujours relire les données à jour à chaque requête.
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const supabase = await createClient();

  // Récupérer l'utilisateur connecté
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  // Récupérer les données du foodtrucker
  const { data: foodtrucker } = await supabase
    .from('foodtruckers')
    .select('*')
    .eq('id', user.id)
    .single();

  // Documents : stockés directement sur la ligne foodtruckers (colonne JSONB
  // `documents`), exactement comme `photo_truck_url`. Lecture fiable depuis la
  // même ligne déjà chargée ci-dessus — plus de table séparée ni de RLS distincte.
  const rawDocuments = foodtrucker?.documents;
  const initialDocuments: Record<string, UploadedDoc> =
    rawDocuments && typeof rawDocuments === 'object' && !Array.isArray(rawDocuments)
      ? (rawDocuments as Record<string, UploadedDoc>)
      : {};

  // Photos : la photo principale du truck en premier, puis les photos de plats
  const initialPhotos: Photo[] = [
    ...(foodtrucker?.photo_truck_url
      ? [{ id: foodtrucker.photo_truck_url, url: foodtrucker.photo_truck_url, name: 'Photo du truck' }]
      : []),
    ...((foodtrucker?.photos_plats ?? []) as string[]).map((url: string) => ({ id: url, url, name: 'Photo' })),
  ];

  // Préparer les données initiales
  const initialData = {
    nom: foodtrucker?.nom_truck || '',
    prenom: foodtrucker?.prenom_gerant || '',
    nomGerant: foodtrucker?.nom_gerant || '',
    ville: foodtrucker?.ville || '',
    telephone: foodtrucker?.telephone || '',
    instagram: foodtrucker?.instagram || '',
    siteWeb: foodtrucker?.site_web || '',
    description: foodtrucker?.description || '',
    cuisines: foodtrucker?.cuisines || [],
    longueur: foodtrucker?.longueur?.toString() || '',
    largeur: foodtrucker?.largeur?.toString() || '',
    consommation: foodtrucker?.consommation_electrique?.toString() || '',
    typePrise: foodtrucker?.type_prise || '',
    amperage: foodtrucker?.amperage?.toString() || '',
    alimentation: '',
    plan: foodtrucker?.plan || 'free',
    photos: initialPhotos,
    documents: initialDocuments,
  };

  // Préparer les données pour la sidebar
  let sidebarDisplayName = "Foodtrucker";
  let sidebarDisplaySubtitle = "";
  let sidebarInitials = "F";
  let sidebarPlanLabel = "Plan Free";

  if (foodtrucker) {
    // Nom principal : prénom + nom du gérant OU nom du truck
    if (foodtrucker.prenom_gerant && foodtrucker.nom_gerant) {
      sidebarDisplayName = `${foodtrucker.prenom_gerant} ${foodtrucker.nom_gerant}`;
    } else if (foodtrucker.prenom_gerant) {
      sidebarDisplayName = foodtrucker.prenom_gerant;
    } else {
      sidebarDisplayName = foodtrucker.nom_truck || "Foodtrucker";
    }

    // Sous-titre : nom du truck
    sidebarDisplaySubtitle = foodtrucker.nom_truck || "";

    // Plan
    const planMap = {
      free: "Plan Free",
      pro: "Plan Pro",
      premium: "Plan Premium",
      saison: "Plan Saison"
    };
    sidebarPlanLabel = planMap[foodtrucker.plan as keyof typeof planMap] || "Plan Free";

    // Initiales
    if (foodtrucker.prenom_gerant) {
      sidebarInitials = foodtrucker.prenom_gerant[0].toUpperCase();
    } else if (foodtrucker.nom_truck) {
      sidebarInitials = foodtrucker.nom_truck[0].toUpperCase();
    }
  }

  const userData = {
    displayName: sidebarDisplayName,
    displaySubtitle: sidebarDisplaySubtitle,
    initials: sidebarInitials,
    planLabel: sidebarPlanLabel,
  };

  return <ProfilClient initialData={initialData} userId={user.id} userData={userData} />;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilClient from "./ProfilClient";
import { DOC_TYPE_MAP, type UploadedDoc } from "./DocumentUpload";
import type { Photo } from "./PhotoUpload";

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

  // Récupérer les documents réglementaires déjà déposés
  const { data: documentsRows } = await supabase
    .from('documents')
    .select('type, nom_fichier, url, created_at')
    .eq('foodtrucker_id', user.id);

  const typeToKey = Object.fromEntries(Object.entries(DOC_TYPE_MAP).map(([k, v]) => [v, k]));
  const initialDocuments: Record<string, UploadedDoc> = {};
  for (const row of documentsRows ?? []) {
    const key = typeToKey[row.type];
    if (!key || !row.url) continue;
    initialDocuments[key] = {
      name: row.nom_fichier || 'document.pdf',
      size: 0,
      uploadedAt: row.created_at,
      url: row.url,
    };
  }

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

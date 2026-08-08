import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ProfilClient from "./ProfilClient";
import { DOC_TYPE_MAP, type UploadedDoc } from "./DocumentUpload";
import type { Photo } from "./PhotoUpload";

// Cette page dépend de la session (cookies) et des documents en base :
// on force le rendu dynamique pour ne jamais servir une version mise en cache
// (sinon les documents peuvent « disparaître » après reconnexion).
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

  // Récupérer les documents réglementaires déjà déposés (table `documents`).
  let { data: documentsRows, error: documentsError } = await supabase
    .from('documents')
    .select('type, nom_fichier, url, created_at')
    .eq('foodtrucker_id', user.id);

  // Logs serveur (visibles dans les logs de fonction Netlify) pour diagnostiquer
  // une éventuelle disparition des documents après reconnexion.
  if (documentsError) {
    console.error('[profil] Erreur lecture documents (session):', documentsError.message);
  }
  console.log(`[profil] user=${user.id} — documents lus (session): ${documentsRows?.length ?? 0}`);

  // Filet de sécurité : en production, la lecture via la session utilisateur peut
  // renvoyer 0 ligne alors que les documents existent bel et bien en base (la photo,
  // elle, est lue de façon fiable car stockée sur la ligne foodtruckers). Si la clé
  // service_role est disponible côté serveur, on relit alors en bypassant la RLS,
  // strictement filtré sur l'utilisateur courant. Try/catch : ne casse jamais la page.
  if ((!documentsRows || documentsRows.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data: adminRows, error: adminError } = await admin
        .from('documents')
        .select('type, nom_fichier, url, created_at')
        .eq('foodtrucker_id', user.id);
      if (adminError) {
        console.error('[profil] Erreur lecture documents (admin):', adminError.message);
      } else if (adminRows && adminRows.length > 0) {
        console.log(`[profil] documents récupérés via admin (fallback): ${adminRows.length}`);
        documentsRows = adminRows;
      }
    } catch (e) {
      console.error('[profil] Fallback admin indisponible:', e);
    }
  }

  const typeToKey = Object.fromEntries(Object.entries(DOC_TYPE_MAP).map(([k, v]) => [v, k]));
  const initialDocuments: Record<string, UploadedDoc> = {};

  // On lit les URLs depuis la base ; la taille n'étant pas stockée en base,
  // on la récupère depuis le Storage (Content-Length) en parallèle.
  await Promise.all((documentsRows ?? []).map(async (row) => {
    const key = typeToKey[row.type];
    if (!key || !row.url) {
      console.warn(`[profil] document ignoré — type=${row.type} url=${row.url ? 'présente' : 'MANQUANTE'}`);
      return;
    }

    let size = 0;
    try {
      const head = await fetch(row.url, { method: 'HEAD', cache: 'no-store' });
      const len = head.headers.get('content-length');
      if (len) size = parseInt(len, 10);
    } catch (e) {
      console.warn(`[profil] taille indisponible pour ${key}:`, e);
    }

    initialDocuments[key] = {
      name: row.nom_fichier || 'document.pdf',
      size,
      uploadedAt: row.created_at,
      url: row.url,
    };
  }));

  console.log('[profil] documents affichés:', Object.keys(initialDocuments));

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

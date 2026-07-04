import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParametresClient from "./ParametresClient";

export default async function ParametresPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/auth/login');
  }

  const { data: organisateur } = await supabase
    .from('organisateurs')
    .select('nom_organisation, prenom_responsable, nom_responsable, type_organisation, siret, adresse, plan')
    .eq('id', user.id)
    .single();

  return (
    <ParametresClient
      organisateurId={user.id}
      email={user.email || ""}
      compte={{
        prenomResponsable: organisateur?.prenom_responsable || "",
        nomResponsable: organisateur?.nom_responsable || "",
        nomOrganisation: organisateur?.nom_organisation || "",
        typeOrganisation: organisateur?.type_organisation || "association",
        siret: organisateur?.siret || "",
        adresse: organisateur?.adresse || "",
      }}
      plan={(organisateur?.plan || 'gratuit') as "gratuit" | "pro_event" | "pro_semestriel" | "pro_annuel"}
    />
  );
}

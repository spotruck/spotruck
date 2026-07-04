import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EvenementClient from "./EvenementClient";

export default async function EvenementPage() {
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
    ? `${organisateur.prenom_responsable} ${organisateur.nom_responsable} — ${organisateur.nom_organisation}`
    : organisateur?.nom_organisation || "Organisateur";

  return <EvenementClient organisateurId={user.id} organisateurNom={organisateurNom} />;
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EvenementClient from "./EvenementClient";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export default async function EvenementPage({ searchParams }: Props) {
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

  const { id } = await searchParams;
  let initialData = null;
  if (id) {
    const { data: evt } = await supabase
      .from('evenements')
      .select('*')
      .eq('id', id)
      .eq('organisateur_id', user.id)
      .single();
    initialData = evt;
  }

  return (
    <EvenementClient
      organisateurId={user.id}
      organisateurNom={organisateurNom}
      evenementId={initialData?.id}
      initialData={initialData}
    />
  );
}

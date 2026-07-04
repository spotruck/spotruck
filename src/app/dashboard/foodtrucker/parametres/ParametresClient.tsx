import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ParametresClient from "./ParametresClient";

const NOTIF_DEFAULTS: Record<string, boolean> = {
  opportunites: true,
  candidature: true,
  message: true,
  rappel: true,
  document: true,
};

export default async function ParametresPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  const { data: foodtrucker } = await supabase
    .from('foodtruckers')
    .select('nom_truck, prenom_gerant, nom_gerant, plan, notif_prefs')
    .eq('id', user.id)
    .single();

  const userData = {
    displayName: foodtrucker?.nom_truck || "Foodtrucker",
    displaySubtitle: foodtrucker?.prenom_gerant && foodtrucker?.nom_gerant
      ? `${foodtrucker.prenom_gerant} ${foodtrucker.nom_gerant}`
      : foodtrucker?.prenom_gerant || "",
    initials: foodtrucker?.nom_truck ? foodtrucker.nom_truck[0].toUpperCase() : "F",
    planLabel: {
      free: "Plan Free",
      pro: "Plan Pro",
      premium: "Plan Premium",
      saison: "Plan Saison"
    }[(foodtrucker?.plan || 'free') as "free" | "pro" | "premium" | "saison"] || "Plan Free",
  };

  return (
    <ParametresClient
      userId={user.id}
      email={user.email || ""}
      plan={(foodtrucker?.plan || 'free') as "free" | "pro" | "premium" | "saison"}
      notifPrefs={{ ...NOTIF_DEFAULTS, ...(foodtrucker?.notif_prefs || {}) }}
      userData={userData}
    />
  );
}
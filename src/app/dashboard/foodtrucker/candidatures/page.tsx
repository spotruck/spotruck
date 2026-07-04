import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CandidaturesClient, { type Candidature } from "./CandidaturesClient";

const STATUT_MAP: Record<string, Candidature["statut"]> = {
  en_attente: "attente",
  acceptee: "acceptee",
  refusee: "refusee",
  annulee: "annulee",
};

const MODELE_LABEL: Record<string, string> = {
  droit_de_place: "Droit de place",
  privatisation: "Privatisation",
  mixte: "Droit de place + % du CA",
  pourcentage_ca: "% du chiffre d'affaires",
};

const DOC_LABELS: Record<string, string> = {
  kbis: "KBIS",
  haccp: "HACCP",
  rc_pro: "RC Pro",
  conformite_gaz: "Conformité gaz",
  conformite_electrique: "Conformité électrique",
  controle_hygiene: "Contrôle hygiène",
};

function fmtDateRange(debut: string, fin: string | null) {
  const d = new Date(debut);
  const dLabel = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  if (!fin || fin === debut) return dLabel;
  const f = new Date(fin);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}–${f.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
}

function budgetLabel(modele: string | null, montant: number | null) {
  if (!montant) return "Non communiqué";
  return modele === "privatisation"
    ? `${montant.toLocaleString("fr-FR")} € (prestation)`
    : `${montant.toLocaleString("fr-FR")} € / jour`;
}

export default async function CandidaturesPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: candRows } = await supabase
    .from("candidatures")
    .select("id, evenement_id, message, message_reponse, statut, created_at, updated_at")
    .eq("foodtrucker_id", user.id)
    .order("created_at", { ascending: false });

  const rows = candRows || [];
  const evenementIds = [...new Set(rows.map(r => r.evenement_id))];

  let evenements: {
    id: string; titre: string; date_debut: string; date_fin: string | null;
    ville: string | null; region: string | null; type: string;
    modele_financier: string | null; budget_truck: number | null;
    visiteurs_attendus: number | null; description: string | null;
  }[] = [];

  if (evenementIds.length > 0) {
    const { data } = await supabase
      .from("evenements")
      .select("id, titre, date_debut, date_fin, ville, region, type, modele_financier, budget_truck, visiteurs_attendus, description")
      .in("id", evenementIds);
    evenements = data || [];
  }

  const { data: docsData } = await supabase
    .from("documents")
    .select("type")
    .eq("foodtrucker_id", user.id);
  const documentsEnvoyes = (docsData || []).map(d => DOC_LABELS[d.type] || d.type);

  const candidatures: Candidature[] = rows.map(r => {
    const evt = evenements.find(e => e.id === r.evenement_id);
    return {
      id: r.id,
      titre: evt?.titre || "Événement",
      date: evt ? fmtDateRange(evt.date_debut, evt.date_fin) : "—",
      ville: evt?.ville || "",
      region: evt?.region || "",
      type: evt?.type || "Autre",
      offre: evt?.modele_financier ? (MODELE_LABEL[evt.modele_financier] ?? evt.modele_financier) : "—",
      budget: evt ? budgetLabel(evt.modele_financier, evt.budget_truck) : "—",
      visiteurs: evt?.visiteurs_attendus || 0,
      description: evt?.description || "",
      statut: STATUT_MAP[r.statut] || "attente",
      dateEnvoiISO: r.created_at,
      messageCandidature: r.message || "",
      documentsEnvoyes,
      messages: r.message_reponse
        ? [{ id: `resp-${r.id}`, auteur: "organisateur" as const, texte: r.message_reponse, dateISO: r.updated_at || r.created_at }]
        : [],
    };
  });

  return <CandidaturesClient initialCandidatures={candidatures} foodtruckerId={user.id} />;
}

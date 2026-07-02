import { Calendar, Euro, ChevronRight, Clock } from "lucide-react";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const S = {
  cream: "#F2EDE4",
  brown: "#2C1810",
  terra: "#C4622D",
  border: "#D4C9BC",
  muted: "#8C7B6E",
  card: "#EDE8DF",
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', Helvetica, sans-serif",
};

export default async function FoodtruckerDashboard() {
  const supabase = await createClient();

  // Récupérer l'utilisateur connecté
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  // Récupérer les données du foodtrucker
  const { data: foodtrucker, error: foodtruckerError } = await supabase
    .from('foodtruckers')
    .select('nom_truck, prenom_gerant, nom_gerant, plan')
    .eq('id', user.id)
    .single();

  // Debug logging
  console.log('🔍 Dashboard Debug:', {
    userId: user.id,
    userEmail: user.email,
    foodtruckerData: foodtrucker,
    foodtruckerError: foodtruckerError,
    nomTruck: foodtrucker?.nom_truck
  });

  // Récupérer les candidatures (demandes)
  const { data: candidatures } = await supabase
    .from('candidatures')
    .select(`
      id,
      statut,
      created_at,
      evenements (
        titre,
        date_debut,
        nombre_invites
      )
    `)
    .eq('foodtrucker_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculer les KPIs
  const demandesEnAttente = candidatures?.filter(c => c.statut === 'en_attente').length || 0;
  const evenementsConfirmes = candidatures?.filter(c => c.statut === 'acceptee').length || 0;

  // Nom d'affichage : toujours le nom du truck (en majuscules pour le style)
  const displayName = foodtrucker?.nom_truck?.toUpperCase() || 'TRUCK';

  // Plan actuel
  const planLabel = {
    free: 'FREE',
    pro: 'PRO',
    premium: 'PREMIUM',
    saison: 'SAISON'
  }[foodtrucker?.plan || 'free'];

  // Formater les demandes pour l'affichage
  const demandes = (candidatures || []).slice(0, 3).map(c => ({
    event: c.evenements?.titre || 'Événement',
    date: c.evenements?.date_debut
      ? new Date(c.evenements.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Date à définir',
    guests: c.evenements?.nombre_invites || 0,
    status: c.statut === 'en_attente' ? 'EN ATTENTE' : c.statut === 'acceptee' ? 'ACCEPTÉE' : 'REFUSÉE',
    statusColor: c.statut === 'en_attente' ? S.terra : c.statut === 'acceptee' ? '#2C7A4B' : '#C0392B',
  }));

  // Date du jour
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  // Préparer les données pour la sidebar
  let sidebarDisplayName = "Foodtrucker";
  let sidebarDisplaySubtitle = "";
  let sidebarInitials = "F";
  let sidebarPlanLabel = "Plan Free";

  if (foodtrucker) {
    // Nom principal : TOUJOURS le nom du truck
    sidebarDisplayName = foodtrucker.nom_truck || "Foodtrucker";

    // Sous-titre : prénom + nom du gérant (si renseigné)
    if (foodtrucker.prenom_gerant && foodtrucker.nom_gerant) {
      sidebarDisplaySubtitle = `${foodtrucker.prenom_gerant} ${foodtrucker.nom_gerant}`;
    } else if (foodtrucker.prenom_gerant) {
      sidebarDisplaySubtitle = foodtrucker.prenom_gerant;
    } else {
      sidebarDisplaySubtitle = "";
    }

    // Plan
    const planMap = {
      free: "Plan Free",
      pro: "Plan Pro",
      premium: "Plan Premium",
      saison: "Plan Saison"
    };
    sidebarPlanLabel = planMap[foodtrucker.plan as keyof typeof planMap] || "Plan Free";

    // Initiales : première lettre du nom du truck
    if (foodtrucker.nom_truck) {
      sidebarInitials = foodtrucker.nom_truck[0].toUpperCase();
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: S.cream,
        color: S.brown,
        display: "grid",
        gridTemplateColumns: "260px 1fr",
      }}
    >
      <FoodtruckerSidebar
        active="/dashboard/foodtrucker"
        userData={{
          displayName: sidebarDisplayName,
          displaySubtitle: sidebarDisplaySubtitle,
          initials: sidebarInitials,
          planLabel: sidebarPlanLabel,
        }}
      />

      {/* Contenu principal */}
      <div style={{ padding: "3rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "0.5rem" }}>
            <p style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted }}>
              {today}
            </p>
            <span style={{
              fontFamily: S.sans,
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              color: S.terra,
              fontWeight: 500,
              padding: "0.4rem 0.8rem",
              border: `1px solid ${S.terra}`,
            }}>
              PLAN {planLabel}
            </span>
          </div>
          <h1 style={{ fontFamily: S.serif, fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.1 }}>
            Bonjour, {displayName}.
          </h1>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", marginBottom: "3rem" }}>
          {[
            { label: "DEMANDES EN ATTENTE", value: String(demandesEnAttente), icon: <Clock size={18} strokeWidth={1.5} color={S.terra} /> },
            { label: "ÉVÉNEMENTS CONFIRMÉS", value: String(evenementsConfirmes), icon: <Calendar size={18} strokeWidth={1.5} color={S.terra} /> },
            { label: "REVENUS CE MOIS", value: "0 €", icon: <Euro size={18} strokeWidth={1.5} color={S.terra} /> },
          ].map((kpi) => (
            <div key={kpi.label} style={{ backgroundColor: S.card, padding: "2rem" }}>
              <div style={{ marginBottom: "1rem" }}>{kpi.icon}</div>
              <div style={{ fontFamily: S.serif, fontSize: "2.5rem", fontWeight: 800, color: S.brown, lineHeight: 1, marginBottom: "0.5rem" }}>
                {kpi.value}
              </div>
              <div style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        {/* Demandes récentes */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.5rem", fontWeight: 700 }}>Demandes récentes</h2>
            <button style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.terra, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              TOUT VOIR <ChevronRight size={12} />
            </button>
          </div>

          {demandes.length === 0 ? (
            <div style={{
              border: `1px solid ${S.border}`,
              padding: "3rem 2rem",
              textAlign: "center"
            }}>
              <p style={{ fontFamily: S.sans, fontSize: "0.875rem", color: S.brown, fontWeight: 500 }}>
                Vous n'avez pas encore de candidatures
              </p>
              <p style={{ fontFamily: S.sans, fontSize: "0.75rem", color: S.muted, marginTop: "0.5rem" }}>
                Les organisateurs pourront vous contacter une fois votre profil complété.
              </p>
            </div>
          ) : (
            <div style={{ border: `1px solid ${S.border}` }}>
              {/* En-tête tableau */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "1rem 1.5rem", borderBottom: `1px solid ${S.border}` }}>
                {["ÉVÉNEMENT", "DATE", "INVITÉS", "STATUT"].map((h) => (
                  <span key={h} style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted }}>
                    {h}
                  </span>
                ))}
              </div>
              {demandes.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr",
                    padding: "1.25rem 1.5rem",
                    borderBottom: i < demandes.length - 1 ? `1px solid ${S.border}` : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontFamily: S.sans, fontSize: "0.875rem", fontWeight: 400, color: S.brown }}>{d.event}</span>
                  <span style={{ fontFamily: S.sans, fontSize: "0.8rem", fontWeight: 300, color: S.muted }}>{d.date}</span>
                  <span style={{ fontFamily: S.sans, fontSize: "0.8rem", fontWeight: 300, color: S.muted }}>{d.guests} pers.</span>
                  <span style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.15em", color: d.statusColor, fontWeight: 500 }}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

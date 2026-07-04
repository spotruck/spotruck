import Link from "next/link";
import {
  LayoutDashboard, CalendarDays, Inbox, Heart,
  MessageSquare, Clock, Settings,
} from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";

const S = {
  cream:  "#F2EDE4",
  brown:  "#2C1810",
  terra:  "#C4622D",
  border: "#D4C9BC",
  muted:  "#8C7B6E",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

const NAV = [
  { icon: LayoutDashboard, label: "TABLEAU DE BORD",       href: "/dashboard/organisateur" },
  { icon: CalendarDays,    label: "MES ÉVÉNEMENTS",         href: "/dashboard/organisateur/evenements" },
  { icon: Inbox,           label: "CANDIDATURES REÇUES",    href: "/dashboard/organisateur/candidatures" },
  { icon: Heart,           label: "MES TRUCKS FAVORIS",     href: "/dashboard/organisateur/favoris" },
  { icon: MessageSquare,   label: "MESSAGERIE",              href: "/dashboard/organisateur/messagerie" },
  { icon: Clock,           label: "HISTORIQUE",              href: "/dashboard/organisateur/historique" },
  { icon: Settings,        label: "PARAMÈTRES",              href: "/dashboard/organisateur/parametres" },
];

interface UserData {
  displayName: string;
  displaySubtitle: string;
  initials: string;
  planLabel: string;
}

interface Props {
  active: string;
  userData?: UserData;
  badges?: Record<string, number>;
}

export default function OrganisateurSidebar({ active, userData, badges = {} }: Props) {
  const {
    displayName = "Organisateur",
    displaySubtitle = "",
    initials = "O",
    planLabel = "Plan Gratuit",
  } = userData || {};
  return (
    <aside style={{
      backgroundColor: S.brown,
      display: "flex",
      flexDirection: "column",
      padding: "2rem 0",
      position: "sticky",
      top: 0,
      height: "100vh",
    }}>
      {/* Logo */}
      <div style={{ padding: "0 1.5rem 2rem" }}>
        <Link href="/" style={{
          fontFamily: S.serif, fontSize: "1.2rem", fontWeight: 800,
          color: S.cream, textDecoration: "none", letterSpacing: "0.06em", display: "block",
        }}>
          SPOTRUCK
        </Link>
        <div style={{ marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#C4622D" }} />
          <span style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.15em", color: S.muted }}>
            ORGANISATEUR
          </span>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: "1.5rem" }} />

      <nav style={{ flex: 1, padding: "0 1rem", overflowY: "auto" }}>
        {NAV.map(({ icon: Icon, label, href }) => {
          const isActive = active === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.875rem 0.75rem", marginBottom: 2,
              textDecoration: "none",
              backgroundColor: isActive ? "rgba(196,98,45,0.15)" : "transparent",
              borderLeft: isActive ? `2px solid ${S.terra}` : "2px solid transparent",
            }}>
              <Icon size={15} strokeWidth={1.5} color={isActive ? S.terra : S.muted} />
              <span style={{
                fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em",
                fontWeight: 400, color: isActive ? S.cream : S.muted, flex: 1,
              }}>
                {label}
              </span>
              {badges[href] > 0 && (
                <span style={{
                  backgroundColor: S.terra, color: "#fff",
                  fontFamily: S.sans, fontSize: "0.55rem", fontWeight: 600,
                  lineHeight: 1, padding: "0.2rem 0.45rem", borderRadius: 2,
                  letterSpacing: "0.05em", flexShrink: 0,
                }}>
                  {badges[href]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem 1rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", backgroundColor: S.terra,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: S.serif, fontSize: "0.9rem", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 400, color: S.cream, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</p>
            {displaySubtitle && (
              <p style={{ fontFamily: S.sans, fontSize: "0.6rem", color: S.muted, letterSpacing: "0.1em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displaySubtitle}</p>
            )}
            <p style={{ fontFamily: S.sans, fontSize: "0.55rem", color: S.terra, letterSpacing: "0.15em", marginTop: "0.2rem", fontWeight: 500 }}>{planLabel}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}

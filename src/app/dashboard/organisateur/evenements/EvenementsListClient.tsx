"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import { Edit3, Plus, Users, Truck, Inbox } from "lucide-react";

const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B", red:    "#C0392B", amber:  "#B8850A",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

export interface EvenementRow {
  id: string;
  titre: string;
  type: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string | null;
  visiteurs: number;
  trucks: number;
  statut: string;
  candidatures: number;
}

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: "BROUILLON", color: S.muted, bg: "rgba(140,123,110,0.12)" },
  publie:    { label: "PUBLIÉ",    color: S.green, bg: "rgba(44,122,75,0.1)" },
  complet:   { label: "COMPLET",   color: S.amber, bg: "rgba(184,133,10,0.1)" },
  termine:   { label: "TERMINÉ",   color: S.muted, bg: "rgba(140,123,110,0.12)" },
  annule:    { label: "ANNULÉ",    color: S.red,   bg: "rgba(192,57,43,0.1)" },
};

const FILTRES = ["Tous", "brouillon", "publie", "complet", "termine", "annule"] as const;

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

interface Props {
  evenements: EvenementRow[];
}

export default function EvenementsListClient({ evenements }: Props) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<typeof FILTRES[number]>("Tous");

  const filtered = evenements.filter(e => filtre === "Tous" || e.statut === filtre);

  return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <OrganisateurSidebar active="/dashboard/organisateur/evenements" />

      <div style={{ padding:"3rem", maxWidth:1100, minWidth:0 }}>

        {/* Header */}
        <div style={{ marginBottom:"2rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>DASHBOARD — ORGANISATEUR</p>
            <h1 style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, lineHeight:1.1 }}>
              {evenements.length} événement{evenements.length !== 1 ? "s" : ""}
            </h1>
          </div>
          <button onClick={() => router.push("/dashboard/organisateur/evenement")}
            style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.875rem 1.75rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.5rem", whiteSpace:"nowrap" }}>
            <Plus size={14} strokeWidth={2} /> PUBLIER UN NOUVEL ÉVÉNEMENT
          </button>
        </div>

        {/* Filtres */}
        <div style={{ display:"flex", gap:"2px", marginBottom:"2rem", flexWrap:"wrap" }}>
          {FILTRES.map(f => {
            const count = f === "Tous" ? evenements.length : evenements.filter(e => e.statut === f).length;
            const label = f === "Tous" ? "Tous" : (STATUT_LABELS[f]?.label ?? f.toUpperCase());
            return (
              <button key={f} onClick={() => setFiltre(f)}
                style={{ padding:"0.5rem 1.25rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", backgroundColor: filtre === f ? S.brown : "transparent", color: filtre === f ? "#fff" : S.muted, border:`1px solid ${filtre === f ? S.brown : S.border}`, cursor:"pointer" }}>
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div style={{ backgroundColor:S.card, padding:"3rem", textAlign:"center" }}>
            <p style={{ fontFamily:S.sans, fontSize:"0.85rem", fontWeight:300, color:S.muted }}>
              Aucun événement dans cette catégorie.
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
            {filtered.map(e => {
              const st = STATUT_LABELS[e.statut] ?? STATUT_LABELS.brouillon;
              return (
                <div key={e.id} style={{ backgroundColor:S.card, padding:"1.25rem 1.5rem", display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:220 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.3rem", flexWrap:"wrap" }}>
                      <p style={{ fontFamily:S.serif, fontSize:"1.1rem", fontWeight:700, color:S.brown }}>{e.titre}</p>
                      <span style={{ backgroundColor:st.bg, color:st.color, fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.12em", fontWeight:700, padding:"0.2rem 0.55rem" }}>
                        {st.label}
                      </span>
                    </div>
                    <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted }}>
                      {e.type} · {fmtDate(e.dateDebut)}{e.dateFin && e.dateFin !== e.dateDebut ? ` → ${fmtDate(e.dateFin)}` : ""} · {e.lieu || e.ville || "Lieu non précisé"}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginTop:"0.5rem", flexWrap:"wrap" }}>
                      <span style={{ display:"flex", alignItems:"center", gap:"0.3rem", fontFamily:S.sans, fontSize:"0.68rem", color:S.muted }}>
                        <Truck size={12} strokeWidth={1.5} /> {e.trucks} truck{e.trucks > 1 ? "s" : ""}
                      </span>
                      {e.visiteurs > 0 && (
                        <span style={{ display:"flex", alignItems:"center", gap:"0.3rem", fontFamily:S.sans, fontSize:"0.68rem", color:S.muted }}>
                          <Users size={12} strokeWidth={1.5} /> {e.visiteurs.toLocaleString("fr-FR")} visiteurs
                        </span>
                      )}
                      <span style={{ display:"flex", alignItems:"center", gap:"0.3rem", fontFamily:S.sans, fontSize:"0.68rem", color:S.muted }}>
                        <Inbox size={12} strokeWidth={1.5} /> {e.candidatures} candidature{e.candidatures !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => router.push(`/dashboard/organisateur/evenement?id=${e.id}`)}
                    style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem", flexShrink:0 }}>
                    <Edit3 size={12} strokeWidth={1.5} /> MODIFIER
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

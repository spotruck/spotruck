"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import { Edit3, Plus, Users, Truck, Inbox, Eye, X, CheckCircle } from "lucide-react";

const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B", red:    "#C0392B", amber:  "#B8850A",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

export interface CandidatureRow {
  id: string;
  truck: string;
  statut: string;
  dateISO: string;
}

export interface EvenementRow {
  id: string;
  titre: string;
  type: string;
  lieu: string;
  ville: string;
  region: string;
  description: string;
  dateDebut: string;
  dateFin: string | null;
  heureDebut: string | null;
  heureFin: string | null;
  visiteurs: number;
  trucks: number;
  statut: string;
  modeleFinancier: string | null;
  budgetTruck: number | null;
  droitDePlace: number | null;
  pourcentageCa: number | null;
  electriciteDisponible: boolean;
  typePrise: string | null;
  amperage: number | null;
  surfaceDisponible: number | null;
  accesVehicule: boolean;
  documentsRequis: string[];
  dateLimiteCandidature: string | null;
  candidatures: CandidatureRow[];
}

const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: "BROUILLON", color: S.muted, bg: "rgba(140,123,110,0.12)" },
  publie:    { label: "PUBLIÉ",    color: S.green, bg: "rgba(44,122,75,0.1)" },
  complet:   { label: "COMPLET",   color: S.amber, bg: "rgba(184,133,10,0.1)" },
  termine:   { label: "TERMINÉ",   color: S.muted, bg: "rgba(140,123,110,0.12)" },
  annule:    { label: "ANNULÉ",    color: S.red,   bg: "rgba(192,57,43,0.1)" },
};

const CAND_STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: "EN ATTENTE", color: S.amber, bg: "rgba(184,133,10,0.1)" },
  acceptee:   { label: "ACCEPTÉE",   color: S.green, bg: "rgba(44,122,75,0.1)" },
  refusee:    { label: "REFUSÉE",    color: S.muted, bg: "rgba(140,123,110,0.12)" },
  annulee:    { label: "ANNULÉE",    color: S.red,   bg: "rgba(192,57,43,0.1)" },
};

const DOC_LABELS: Record<string, string> = {
  kbis: "KBIS", haccp: "HACCP", rc_pro: "RC Pro",
  conformite_gaz: "Conformité gaz", conformite_electrique: "Conformité électrique",
  controle_hygiene: "Contrôle hygiène",
};

const FILTRES = ["Tous", "brouillon", "publie", "complet", "termine", "annule"] as const;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function budgetLabel(e: EvenementRow) {
  if (e.modeleFinancier === "pourcentage_ca") {
    return e.pourcentageCa ? `${e.pourcentageCa}% du chiffre d'affaires` : "Pourcentage du CA non précisé";
  }
  if (e.modeleFinancier === "mixte") {
    return `${e.droitDePlace ?? 0} € + ${e.pourcentageCa ?? 0}% du CA`;
  }
  if (!e.budgetTruck) return "Non communiqué";
  return e.modeleFinancier === "privatisation"
    ? `${e.budgetTruck.toLocaleString("fr-FR")} € (prestation)`
    : `${e.budgetTruck.toLocaleString("fr-FR")} € / jour`;
}

// ─── Modale VOIR ÉVÉNEMENT ─────────────────────────────────────
function ModaleVoirEvenement({ e, onClose }: { e: EvenementRow; onClose: () => void }) {
  const st = STATUT_LABELS[e.statut] ?? STATUT_LABELS.brouillon;
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={onClose}>
      <div style={{ backgroundColor:S.cream, maxWidth:700, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"2.5rem" }} onClick={ev => ev.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.4rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700 }}>DÉTAIL DE L'ÉVÉNEMENT</p>
              <span style={{ backgroundColor:st.bg, color:st.color, fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.12em", fontWeight:700, padding:"0.2rem 0.55rem" }}>{st.label}</span>
            </div>
            <h2 style={{ fontFamily:S.serif, fontSize:"1.6rem", fontWeight:800, color:S.brown }}>{e.titre}</h2>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={20} color={S.muted} /></button>
        </div>

        {/* Infos générales */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"1.5rem" }}>
          {[
            { label: "DATE",             val: `${fmtDate(e.dateDebut)}${e.dateFin && e.dateFin !== e.dateDebut ? ` → ${fmtDate(e.dateFin)}` : ""}` },
            { label: "HORAIRES",         val: e.heureFin ? `${e.heureDebut} – ${e.heureFin}` : (e.heureDebut || "Non précisé") },
            { label: "LIEU",             val: e.lieu || e.ville || "Non précisé" },
            { label: "VILLE / RÉGION",   val: [e.ville, e.region].filter(Boolean).join(" — ") || "Non précisé" },
            { label: "TYPE",             val: e.type },
            { label: "TRUCKS RECHERCHÉS",val: `${e.trucks} truck${e.trucks > 1 ? "s" : ""}` },
            { label: "VISITEURS ATTENDUS", val: e.visiteurs > 0 ? e.visiteurs.toLocaleString("fr-FR") : "Non précisé" },
            { label: "BUDGET / TRUCK",   val: budgetLabel(e) },
            { label: "SURFACE PAR TRUCK",val: e.surfaceDisponible ? `${e.surfaceDisponible} m²` : "Non précisé" },
            { label: "ÉLECTRICITÉ",      val: e.electriciteDisponible ? `Disponible${e.typePrise ? ` (${e.typePrise}${e.amperage ? `, ${e.amperage}A` : ""})` : ""}` : "Non disponible" },
            { label: "ACCÈS VÉHICULE",   val: e.accesVehicule ? "Autorisé" : "Non autorisé" },
            { label: "DATE LIMITE CANDIDATURE", val: fmtDate(e.dateLimiteCandidature) },
          ].map(({ label, val }) => (
            <div key={label} style={{ backgroundColor:S.card, padding:"0.75rem 1rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.25rem" }}>{label}</p>
              <p style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.brown, fontWeight:300 }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        {e.description && (
          <div style={{ marginBottom:"1.5rem" }}>
            <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.6rem" }}>DESCRIPTION</p>
            <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color:S.brown, lineHeight:1.7, backgroundColor:S.card, padding:"1rem" }}>{e.description}</p>
          </div>
        )}

        {/* Documents requis */}
        {e.documentsRequis.length > 0 && (
          <div style={{ marginBottom:"1.5rem" }}>
            <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.6rem" }}>DOCUMENTS REQUIS</p>
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
              {e.documentsRequis.map(d => (
                <span key={d} style={{ backgroundColor:"rgba(44,122,75,0.1)", color:S.green, fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.05em", padding:"0.3rem 0.7rem", fontWeight:500 }}>{DOC_LABELS[d] || d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Candidatures reçues */}
        <div>
          <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>
            CANDIDATURES REÇUES ({e.candidatures.length})
          </p>
          {e.candidatures.length === 0 ? (
            <p style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight:300, color:S.muted, backgroundColor:S.card, padding:"1rem" }}>
              Aucune candidature reçue pour cet événement.
            </p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              {e.candidatures.map(c => {
                const cst = CAND_STATUT_LABELS[c.statut] ?? CAND_STATUT_LABELS.en_attente;
                return (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", backgroundColor:S.card, padding:"0.65rem 1rem" }}>
                    <span style={{ fontFamily:S.sans, fontSize:"0.8rem", color:S.brown, fontWeight:500 }}>{c.truck}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>{fmtDate(c.dateISO)}</span>
                      <span style={{ backgroundColor:cst.bg, color:cst.color, fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.12em", fontWeight:700, padding:"0.25rem 0.6rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                        {c.statut === "acceptee" && <CheckCircle size={10} strokeWidth={2} />} {cst.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:"1.5rem", marginTop:"1.5rem", borderTop:`1px solid ${S.border}` }}>
          <button onClick={onClose} style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.75rem 2rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer" }}>
            FERMER
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  evenements: EvenementRow[];
}

export default function EvenementsListClient({ evenements }: Props) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<typeof FILTRES[number]>("Tous");
  const [voirTarget, setVoirTarget] = useState<EvenementRow | null>(null);

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
                        <Inbox size={12} strokeWidth={1.5} /> {e.candidatures.length} candidature{e.candidatures.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
                    <button onClick={() => setVoirTarget(e)}
                      style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <Eye size={12} strokeWidth={1.5} /> VOIR
                    </button>
                    <button onClick={() => router.push(`/dashboard/organisateur/evenement?id=${e.id}`)}
                      style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <Edit3 size={12} strokeWidth={1.5} /> MODIFIER
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {voirTarget && <ModaleVoirEvenement e={voirTarget} onClose={() => setVoirTarget(null)} />}
    </main>
  );
}

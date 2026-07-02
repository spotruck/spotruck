"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import {
  Copy, Star, CheckCircle, X, Search, FileText,
  Heart, Send, Edit3, Download, ChevronDown,
  AlertTriangle, StickyNote,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B", red:    "#C0392B", amber:  "#B8850A",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

// ─── Types ────────────────────────────────────────────────────
interface TruckParticipant {
  nom:      string;
  cuisine:  string;
  noteOrga: number;   // note donnée par l'organisateur au truck
  avisOrga: string;   // commentaire de l'organisateur sur le truck
}

interface DocEvent {
  nom:   string;
  type:  "contrat" | "facture" | "plan" | "brief";
  taille: string;
}

interface BilanFinancier {
  droitsPlace?:     number;
  remunerations?:   number;
  couvertsEstimes?: number;
  couvertsReels?:   number;
}

interface Evenement {
  id:              string;
  titre:           string;
  type:            string;
  annee:           number;
  date:            string;
  lieu:            string;
  visiteurs:       number;
  visiteursReels?: number;
  trucks:          TruckParticipant[];
  modele:          string;
  statut:          "RÉALISÉ" | "ANNULÉ" | "REPORTÉ";
  avisDestrucks:   { truck:string; note:number; texte:string }[];
  documents:       DocEvent[];
  bilan:           BilanFinancier;
}

// ─── Données enrichies ────────────────────────────────────────
const HISTORIQUE: Evenement[] = [
  {
    id:"h1", titre:"Festival Solstice 2025", type:"Festival", annee:2025,
    date:"21 juin 2025", lieu:"Parc des Expositions, Bordeaux",
    visiteurs:2000, visiteursReels:1800,
    modele:"Droit de place — 800 € / truck",
    statut:"RÉALISÉ",
    trucks:[
      { nom:"Le Kalow Smash Burger", cuisine:"Burgers américains", noteOrga:5, avisOrga:"Excellent truck, ponctuel, professionnel. Files bien gérées. À réinviter en priorité." },
      { nom:"Tacos del Sol",         cuisine:"Mexicain",           noteOrga:4, avisOrga:"Bon niveau mais quelques retards logistiques. Menu à simplifier pour les grands flux." },
      { nom:"Sweet Nomad Crêpes",    cuisine:"Crêperie bretonne",  noteOrga:5, avisOrga:"Super ambiance, public familial conquis. Placement idéal côté entrée." },
    ],
    avisDestrucks:[
      { truck:"Le Kalow Smash Burger", note:5, texte:"Organisation parfaite, emplacement top, très bonne fréquentation." },
      { truck:"Tacos del Sol",         note:4, texte:"Bon événement, bravo à l'équipe. Quelques imprévus logistiques mineurs." },
      { truck:"Sweet Nomad Crêpes",    note:5, texte:"Super ambiance, on revient l'année prochaine !" },
    ],
    documents:[
      { nom:"Contrat_Kalow_Solstice2025.pdf",   type:"contrat",  taille:"1.1 MB" },
      { nom:"Contrat_Tacos_Solstice2025.pdf",   type:"contrat",  taille:"1.0 MB" },
      { nom:"Contrat_SweetNomad_Solstice2025.pdf", type:"contrat", taille:"0.9 MB" },
      { nom:"Facture_Solstice2025.pdf",          type:"facture",  taille:"340 KB" },
      { nom:"Plan_site_Solstice2025.pdf",        type:"plan",     taille:"2.4 MB" },
      { nom:"Brief_logistique_Solstice2025.docx",type:"brief",    taille:"125 KB" },
    ],
    bilan:{ droitsPlace:2400, couvertsEstimes:4000, couvertsReels:3600 },
  },
  {
    id:"h2", titre:"Gala Tech Corp 2025", type:"Séminaire", annee:2025,
    date:"14 novembre 2025", lieu:"Hôtel Intercontinental, Bordeaux",
    visiteurs:400, visiteursReels:350,
    modele:"Privatisation — 3 500 €",
    statut:"RÉALISÉ",
    trucks:[
      { nom:"Pizza Nomade", cuisine:"Pizza napolitaine", noteOrga:5, avisOrga:"Prestation haut de gamme irréprochable. Four à bois très apprécié par les invités corporate. Professionnel et discret." },
    ],
    avisDestrucks:[
      { truck:"Pizza Nomade", note:5, texte:"Prestation irréprochable. Les invités ont adoré. On les rebooking dès maintenant !" },
    ],
    documents:[
      { nom:"Contrat_PizzaNomade_TechCorp2025.pdf", type:"contrat", taille:"1.2 MB" },
      { nom:"Facture_TechCorp2025.pdf",              type:"facture", taille:"280 KB" },
      { nom:"Brief_logistique_TechCorp.docx",        type:"brief",   taille:"88 KB"  },
    ],
    bilan:{ remunerations:3500, couvertsEstimes:400, couvertsReels:350 },
  },
  {
    id:"h3", titre:"Marché de Noël Bordeaux 2025", type:"Marché", annee:2025,
    date:"20 décembre 2025", lieu:"Place de la Victoire, Bordeaux",
    visiteurs:3000, visiteursReels:2500,
    modele:"Droit de place — 600 € / truck",
    statut:"RÉALISÉ",
    trucks:[
      { nom:"Le Kalow Smash Burger", cuisine:"Burgers américains", noteOrga:5, avisOrga:"Record de ventes. Placement parfait face à la scène. Incontournable pour l'édition 2026." },
      { nom:"Sweet Nomad Crêpes",    cuisine:"Crêperie bretonne",  noteOrga:5, avisOrga:"Crêpes de Noël, un carton. Décoration du stand très réussie. Parfait pour l'ambiance de Noël." },
      { nom:"Les Frites du Coin",    cuisine:"Friterie belge",     noteOrga:4, avisOrga:"Bon niveau mais attente parfois trop longue. Prévoir 2 agents supplémentaires pour les créneaux 17h-19h." },
    ],
    avisDestrucks:[
      { truck:"Le Kalow Smash Burger", note:5, texte:"Record de ventes, super événement hivernal." },
      { truck:"Sweet Nomad Crêpes",    note:5, texte:"Les crêpes de Noël, un succès garanti." },
      { truck:"Les Frites du Coin",    note:4, texte:"Très bon. File d'attente bien gérée." },
    ],
    documents:[
      { nom:"Contrat_Kalow_Noel2025.pdf",      type:"contrat", taille:"1.0 MB" },
      { nom:"Contrat_SweetNomad_Noel2025.pdf", type:"contrat", taille:"0.9 MB" },
      { nom:"Contrat_FritesCoin_Noel2025.pdf", type:"contrat", taille:"0.9 MB" },
      { nom:"Facture_MarcheNoel2025.pdf",       type:"facture", taille:"320 KB" },
      { nom:"Plan_site_MarcheNoel.pdf",         type:"plan",    taille:"1.8 MB" },
    ],
    bilan:{ droitsPlace:1800, couvertsEstimes:6000, couvertsReels:5000 },
  },
];

// ─── LS helpers ───────────────────────────────────────────────
function lsGet<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function lsSet(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

// ─── Helpers d'affichage ──────────────────────────────────────
function StarsDisplay({ n, size = 12 }: { n:number; size?:number }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= Math.round(n) ? S.amber : "none"} stroke={S.amber} strokeWidth={1.5} />
      ))}
    </span>
  );
}
function StarsInput({ value, onChange }: { value:number; onChange:(n:number)=>void }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display:"inline-flex", gap:3, cursor:"pointer" }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={18}
          fill={i <= (hover || value) ? S.amber : "none"}
          stroke={S.amber} strokeWidth={1.5}
          style={{ cursor:"pointer" }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        />
      ))}
    </span>
  );
}
function DocIcon({ type }: { type:DocEvent["type"] }) {
  const color = type === "contrat" ? "#C0392B" : type === "facture" ? "#2E6DA4" : type === "plan" ? S.green : S.amber;
  return <FileText size={14} color={color} strokeWidth={1.5} />;
}
function StatutBadge({ statut }: { statut:Evenement["statut"] }) {
  const map = {
    "RÉALISÉ": { color:S.green, bg:"rgba(44,122,75,0.1)" },
    "ANNULÉ":  { color:S.red,   bg:"rgba(192,57,43,0.1)" },
    "REPORTÉ": { color:S.amber, bg:"rgba(184,133,10,0.1)" },
  };
  const st = map[statut];
  return (
    <span style={{ backgroundColor:st.bg, color:st.color, fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", fontWeight:700, padding:"0.25rem 0.65rem", display:"inline-flex", alignItems:"center", gap:"0.3rem" }}>
      {statut === "RÉALISÉ" && <CheckCircle size={10} strokeWidth={2.5} />}
      {statut}
    </span>
  );
}
function fmtNow() {
  return new Date().toLocaleDateString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric" })
    + " à " + new Date().toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
}

// ─── MODALE DÉTAIL ────────────────────────────────────────────
function EventDetailModal({ evt, onClose, onDuplicate }: {
  evt: Evenement;
  onClose: () => void;
  onDuplicate: (e: Evenement) => void;
}) {
  const router = useRouter();

  // Notes personnelles
  const LS_NOTE = `spotruck_notes_historique_${evt.id}`;
  const [note,      setNote]      = useState(() => lsGet<string>(LS_NOTE, ""));
  const [noteTs,    setNoteTs]    = useState(() => lsGet<string>(`${LS_NOTE}_ts`, ""));
  const [editNote,  setEditNote]  = useState(false);
  const [draftNote, setDraftNote] = useState(note);

  const saveNote = () => {
    const ts = fmtNow();
    lsSet(LS_NOTE, draftNote);
    lsSet(`${LS_NOTE}_ts`, ts);
    setNote(draftNote);
    setNoteTs(ts);
    setEditNote(false);
  };

  // Bilan (éditable)
  const LS_BILAN = `spotruck_historique_bilan_${evt.id}`;
  const [bilan,      setBilan]      = useState<BilanFinancier>(() => lsGet<BilanFinancier>(LS_BILAN, evt.bilan));
  const [editBilan,  setEditBilan]  = useState(false);
  const [draftBilan, setDraftBilan] = useState<BilanFinancier>(bilan);

  const saveBilan = () => { lsSet(LS_BILAN, draftBilan); setBilan(draftBilan); setEditBilan(false); };

  // Visiteurs réels
  const LS_VISIT = `spotruck_historique_visiteurs_${evt.id}`;
  const [visReels,   setVisReels]   = useState<number|undefined>(() => lsGet<number|undefined>(LS_VISIT, evt.visiteursReels));
  const [editVis,    setEditVis]    = useState(false);
  const [draftVis,   setDraftVis]   = useState(String(visReels ?? ""));

  const saveVis = () => { const n = parseInt(draftVis)||0; lsSet(LS_VISIT, n); setVisReels(n); setEditVis(false); };

  // Favoris
  const [favorisIds, setFavorisIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const list: { truckId:string; nom:string }[] = lsGet("spotruck_favoris_orga", []);
    setFavorisIds(new Set(list.map(f => f.nom)));
  }, []);
  const addFavori = (truck: TruckParticipant) => {
    const list: unknown[] = lsGet("spotruck_favoris_orga", []);
    list.push({ truckId:`fav-${Date.now()}`, nom:truck.nom, plan:"Pro", cuisine:truck.cuisine, ville:"Bordeaux", note:truck.noteOrga, dateAjout:new Date().toISOString().split("T")[0], nbEvenements:1, notePerso:"" });
    lsSet("spotruck_favoris_orga", list);
    setFavorisIds(prev => new Set([...prev, truck.nom]));
  };

  // Notes organisateur sur les trucks
  const LS_NOTORGA = `spotruck_notesOrga_${evt.id}`;
  const [notesOrga, setNotesOrga] = useState<Record<string, { note:number; avis:string }>>(() =>
    lsGet(LS_NOTORGA, Object.fromEntries(evt.trucks.map(t => [t.nom, { note:t.noteOrga, avis:t.avisOrga }])))
  );
  const [editingTruck, setEditingTruck] = useState<string|null>(null);
  const [draftNoteOrga, setDraftNoteOrga] = useState<{ note:number; avis:string }>({ note:5, avis:"" });

  const saveTruckNote = (nom: string) => {
    const updated = { ...notesOrga, [nom]: draftNoteOrga };
    setNotesOrga(updated); lsSet(LS_NOTORGA, updated); setEditingTruck(null);
  };

  const moyOrga = evt.trucks.length > 0
    ? (Object.values(notesOrga).reduce((a, v) => a + v.note, 0) / evt.trucks.length).toFixed(1)
    : "—";

  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.6)", zIndex:3000, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }} onClick={onClose}>
      <div style={{ backgroundColor:S.cream, maxWidth:860, width:"100%", marginTop:"1rem", marginBottom:"2rem" }} onClick={e => e.stopPropagation()}>

        {/* ── Header modale ── */}
        <div style={{ padding:"2rem 2.5rem 1.5rem", borderBottom:`1px solid ${S.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.3rem" }}>FICHE DÉTAIL — {evt.type.toUpperCase()}</p>
            <h2 style={{ fontFamily:S.serif, fontSize:"1.8rem", fontWeight:800, color:S.brown, lineHeight:1.1 }}>{evt.titre}</h2>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", flexShrink:0 }}><X size={22} color={S.muted} /></button>
        </div>

        <div style={{ padding:"0 2.5rem 2.5rem" }}>

          {/* ════════════════════ SECTION 1 — RÉSUMÉ ════════════════════ */}
          <section style={{ paddingTop:"2rem", marginBottom:"2rem", paddingBottom:"2rem", borderBottom:`1px solid ${S.border}` }}>
            <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"1rem" }}>1 — RÉSUMÉ DE L'ÉVÉNEMENT</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem 2rem" }}>
              {[
                ["Date",            evt.date],
                ["Lieu",            evt.lieu],
                ["Type",            evt.type],
                ["Modèle financier",evt.modele],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", gap:"0.5rem", padding:"0.4rem 0", borderBottom:`1px solid ${S.border}` }}>
                  <span style={{ fontFamily:S.sans, fontSize:"0.63rem", color:S.muted, minWidth:140 }}>{k}</span>
                  <span style={{ fontFamily:S.sans, fontSize:"0.75rem", fontWeight:500, color:S.brown }}>{v}</span>
                </div>
              ))}
              {/* Statut */}
              <div style={{ display:"flex", gap:"0.5rem", padding:"0.4rem 0", borderBottom:`1px solid ${S.border}`, alignItems:"center" }}>
                <span style={{ fontFamily:S.sans, fontSize:"0.63rem", color:S.muted, minWidth:140 }}>Statut final</span>
                <StatutBadge statut={evt.statut} />
              </div>
              {/* Visiteurs réels */}
              <div style={{ display:"flex", gap:"0.5rem", padding:"0.4rem 0", borderBottom:`1px solid ${S.border}`, alignItems:"center" }}>
                <span style={{ fontFamily:S.sans, fontSize:"0.63rem", color:S.muted, minWidth:140 }}>Visiteurs réels</span>
                {editVis ? (
                  <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                    <input type="number" value={draftVis} onChange={e => setDraftVis(e.target.value)}
                      style={{ width:80, border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.25rem 0.5rem", fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, outline:"none" }} />
                    <button onClick={saveVis} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.25rem 0.6rem", fontFamily:S.sans, fontSize:"0.6rem", cursor:"pointer" }}>OK</button>
                    <button onClick={() => setEditVis(false)} style={{ background:"none", border:"none", cursor:"pointer", color:S.muted }}><X size={12} /></button>
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <span style={{ fontFamily:S.sans, fontSize:"0.75rem", fontWeight:500, color:S.brown }}>{visReels ? visReels.toLocaleString("fr-FR") : "—"}</span>
                    <button onClick={() => { setEditVis(true); setDraftVis(String(visReels??"")); }}
                      style={{ background:"none", border:"none", cursor:"pointer", color:S.terra, display:"flex", alignItems:"center" }}>
                      <Edit3 size={11} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ════════════════════ SECTION 2 — TRUCKS ════════════════════ */}
          <section style={{ marginBottom:"2rem", paddingBottom:"2rem", borderBottom:`1px solid ${S.border}` }}>
            <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"1rem" }}>2 — TRUCKS PARTICIPANTS ({evt.trucks.length})</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {evt.trucks.map(t => {
                const orga = notesOrga[t.nom] ?? { note:t.noteOrga, avis:t.avisOrga };
                const isFav = favorisIds.has(t.nom);
                const isEditing = editingTruck === t.nom;
                return (
                  <div key={t.nom} style={{ backgroundColor:S.card, padding:"1.25rem" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:"1rem", flexWrap:"wrap" }}>
                      {/* Avatar */}
                      <div style={{ width:42, height:42, borderRadius:"50%", backgroundColor:S.brown, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontFamily:S.serif, fontSize:"0.95rem", fontWeight:700, color:"#fff" }}>{t.nom[0]}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontFamily:S.sans, fontSize:"0.85rem", fontWeight:600, color:S.brown, marginBottom:"0.15rem" }}>{t.nom}</p>
                        <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted, marginBottom:"0.5rem" }}>{t.cuisine}</p>
                        {/* Note + avis orga */}
                        {!isEditing ? (
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.3rem" }}>
                              <StarsDisplay n={orga.note} />
                              <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>{orga.note}/5 — ma note</span>
                              <button onClick={() => { setEditingTruck(t.nom); setDraftNoteOrga({ note:orga.note, avis:orga.avis }); }}
                                style={{ background:"none", border:"none", cursor:"pointer", color:S.terra, display:"flex", alignItems:"center" }}>
                                <Edit3 size={11} strokeWidth={1.5} />
                              </button>
                            </div>
                            {orga.avis && <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, lineHeight:1.6, borderLeft:`2px solid ${S.amber}`, paddingLeft:"0.6rem" }}>{orga.avis}</p>}
                          </div>
                        ) : (
                          <div>
                            <div style={{ marginBottom:"0.5rem" }}>
                              <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", color:S.muted, marginBottom:"0.3rem" }}>MA NOTE</p>
                              <StarsInput value={draftNoteOrga.note} onChange={n => setDraftNoteOrga(prev => ({ ...prev, note:n }))} />
                            </div>
                            <textarea value={draftNoteOrga.avis} onChange={e => setDraftNoteOrga(prev => ({ ...prev, avis:e.target.value }))}
                              placeholder="Mon avis sur ce truck pour cet événement..."
                              rows={2} style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.5rem 0.65rem", fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, outline:"none", resize:"none", boxSizing:"border-box", marginBottom:"0.4rem" }} />
                            <div style={{ display:"flex", gap:"0.4rem" }}>
                              <button onClick={() => saveTruckNote(t.nom)} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.35rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer" }}>SAUVEGARDER</button>
                              <button onClick={() => setEditingTruck(null)} style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.35rem 0.75rem", fontFamily:S.sans, fontSize:"0.6rem", cursor:"pointer" }}>ANNULER</button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Actions */}
                      <div style={{ display:"flex", gap:"0.4rem", flexShrink:0, flexWrap:"wrap" }}>
                        {isFav ? (
                          <div style={{ padding:"0.4rem 0.75rem", backgroundColor:"rgba(196,98,45,0.1)", color:S.terra, fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.1em", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                            <Heart size={10} fill={S.terra} stroke={S.terra} /> EN FAVORIS
                          </div>
                        ) : (
                          <button onClick={() => addFavori(t)} style={{ backgroundColor:S.green, color:"#fff", border:"none", padding:"0.4rem 0.75rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.1em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                            <Heart size={10} strokeWidth={2} /> FAVORIS
                          </button>
                        )}
                        <button onClick={() => {
                          // Préremplit un message d'invitation
                          try { localStorage.setItem("spotruck_org_brouillon_invite", JSON.stringify({ truck:t.nom, evt:evt.titre })); } catch {}
                          onClose();
                          router.push("/dashboard/organisateur/favoris");
                        }} style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.4rem 0.75rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.1em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          <Send size={10} strokeWidth={2} /> RÉINVITER
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Avis des trucks sur l'orga */}
            {(evt.avisDestrucks?.length ?? 0) > 0 && (
              <div style={{ marginTop:"1.25rem" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, fontWeight:700, marginBottom:"0.75rem" }}>AVIS DES TRUCKS SUR CET ÉVÉNEMENT</p>
                {(evt.avisDestrucks ?? []).map((a, i) => (
                  <div key={i} style={{ backgroundColor:S.cream, padding:"0.875rem 1rem", marginBottom:"2px", borderLeft:`3px solid ${S.amber}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem" }}>
                    <div>
                      <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:600, color:S.brown, marginBottom:"0.3rem" }}>{a.truck}</p>
                      <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, lineHeight:1.6 }}>{a.texte}</p>
                    </div>
                    <StarsDisplay n={a.note} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ════════════════════ SECTION 3 — DOCUMENTS ════════════════════ */}
          <section style={{ marginBottom:"2rem", paddingBottom:"2rem", borderBottom:`1px solid ${S.border}` }}>
            <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"1rem" }}>3 — DOCUMENTS DE L'ÉVÉNEMENT</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
              {evt.documents.map((d, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.65rem 0.875rem", backgroundColor:S.card }}>
                  <DocIcon type={d.type} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.7rem", fontWeight:500, color:S.brown, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.nom}</p>
                    <p style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted }}>{d.taille} · {d.type.charAt(0).toUpperCase() + d.type.slice(1)}</p>
                  </div>
                  <button style={{ background:"none", border:"none", cursor:"pointer", color:S.muted, display:"flex", alignItems:"center" }} title="Télécharger">
                    <Download size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ════════════════════ SECTION 4 — NOTES PERSONNELLES ════════════════════ */}
          <section style={{ marginBottom:"2rem", paddingBottom:"2rem", borderBottom:`1px solid ${S.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700 }}>4 — MES NOTES POUR LA PROCHAINE ÉDITION</p>
              {noteTs && !editNote && (
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted }}>Modifié le {noteTs}</p>
              )}
            </div>
            {editNote ? (
              <div>
                <textarea value={draftNote} onChange={e => setDraftNote(e.target.value)} rows={6}
                  placeholder="Ex: Placer les trucks au bord de la piscine plutôt qu'à l'entrée. Prévoir plus de place pour les files d'attente. Contacter Le Burger du Chef en priorité l'année prochaine..."
                  style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"rgba(196,98,45,0.02)", padding:"0.875rem 1rem", fontFamily:S.sans, fontSize:"0.8rem", color:S.brown, outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box", borderLeft:`3px solid ${S.terra}` }} />
                <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.75rem" }}>
                  <button onClick={saveNote} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.65rem 1.5rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                    <CheckCircle size={13} strokeWidth={2} /> SAUVEGARDER LA NOTE
                  </button>
                  <button onClick={() => { setDraftNote(note); setEditNote(false); }} style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.65rem 1rem", fontFamily:S.sans, fontSize:"0.62rem", cursor:"pointer" }}>ANNULER</button>
                </div>
              </div>
            ) : (
              <div style={{ border:`1px solid ${S.border}`, padding:"1rem", backgroundColor:"rgba(44,26,16,0.02)", cursor:"pointer", borderLeft:`3px solid ${note ? S.terra : S.border}` }}
                onClick={() => { setDraftNote(note); setEditNote(true); }}>
                {note
                  ? <p style={{ fontFamily:S.sans, fontSize:"0.8rem", fontWeight:300, color:S.brown, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{note}</p>
                  : <p style={{ fontFamily:S.sans, fontSize:"0.8rem", fontWeight:300, color:S.border, lineHeight:1.7, fontStyle:"italic" }}>
                      Cliquez pour ajouter vos notes pour la prochaine édition...
                    </p>
                }
              </div>
            )}
          </section>

          {/* ════════════════════ SECTION 5 — BILAN FINANCIER ════════════════════ */}
          <section style={{ marginBottom:"2rem", paddingBottom:"2rem", borderBottom:`1px solid ${S.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700 }}>5 — BILAN FINANCIER</p>
              <button onClick={() => { setDraftBilan(bilan); setEditBilan(v => !v); }}
                style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.3rem 0.75rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                <Edit3 size={11} strokeWidth={1.5} /> {editBilan ? "ANNULER" : "MODIFIER LE BILAN"}
              </button>
            </div>

            {editBilan ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"0.75rem" }}>
                {[
                  { k:"droitsPlace",     label:"Droits de place perçus (€)" },
                  { k:"remunerations",   label:"Rémunérations versées (€)" },
                  { k:"couvertsEstimes", label:"Couverts estimés" },
                  { k:"couvertsReels",   label:"Couverts réels" },
                ].map(({ k, label }) => (
                  <div key={k}>
                    <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", color:S.muted, display:"block", marginBottom:"0.3rem" }}>{label}</label>
                    <input type="number" value={(draftBilan as Record<string,number|undefined>)[k] ?? ""}
                      onChange={e => setDraftBilan(prev => ({ ...prev, [k]: parseInt(e.target.value)||0 }))}
                      style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.5rem 0.65rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none", boxSizing:"border-box" }} />
                  </div>
                ))}
                <div style={{ gridColumn:"1/-1" }}>
                  <button onClick={saveBilan} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.65rem 1.5rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", cursor:"pointer" }}>SAUVEGARDER</button>
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"2px" }}>
                {[
                  { l:"DROITS DE PLACE",        v: bilan.droitsPlace ? `${bilan.droitsPlace.toLocaleString("fr-FR")} €` : "—" },
                  { l:"RÉMUNÉRATIONS",          v: bilan.remunerations ? `${bilan.remunerations.toLocaleString("fr-FR")} €` : "—" },
                  { l:"COUVERTS ESTIMÉS",       v: bilan.couvertsEstimes ? bilan.couvertsEstimes.toLocaleString("fr-FR") : "—" },
                  { l:"COUVERTS RÉELS",         v: bilan.couvertsReels ? bilan.couvertsReels.toLocaleString("fr-FR") : "—" },
                ].map(i => (
                  <div key={i.l} style={{ backgroundColor:S.card, padding:"0.875rem 1rem" }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.3rem" }}>{i.l}</p>
                    <p style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:800, color:S.brown }}>{i.v}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Note moyenne organisateur */}
            <div style={{ marginTop:"1rem", display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 1rem", backgroundColor:S.card }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.18em", color:S.muted }}>NOTE MOY. DONNÉE AUX TRUCKS</p>
              <StarsDisplay n={parseFloat(moyOrga) || 0} size={14} />
              <p style={{ fontFamily:S.serif, fontSize:"1.2rem", fontWeight:800, color:S.amber }}>{moyOrga}★</p>
            </div>
          </section>

          {/* ════════════════════ SECTION 6 — ACTIONS ════════════════════ */}
          <section>
            <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"1rem" }}>6 — ACTIONS</p>
            <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
              <button onClick={() => { onDuplicate(evt); onClose(); }}
                style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.875rem 1.5rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <Copy size={14} strokeWidth={2} /> DUPLIQUER CET ÉVÉNEMENT
              </button>
              <button onClick={() => window.print()}
                style={{ backgroundColor:"transparent", color:S.brown, border:`1px solid ${S.border}`, padding:"0.875rem 1.5rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <Download size={14} strokeWidth={1.5} /> TÉLÉCHARGER LE RAPPORT PDF
              </button>
              <button onClick={onClose}
                style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem 1.5rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer" }}>
                FERMER
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────
export default function HistoriquePage() {
  const router = useRouter();
  const [toast,    setToast]    = useState("");
  const [detail,   setDetail]   = useState<Evenement|null>(null);

  // ── Filtres ────────────────────────────────────────────────
  const [query,       setQuery]       = useState("");
  const [filtreAnnee, setFiltreAnnee] = useState<number|null>(null);
  const [filtreStatut,setFiltreStatut]= useState<string>("Tous");
  const [filtreType,  setFiltreType]  = useState<string>("Tous");

  // ── Notes (pour icône dans la liste) ──────────────────────
  const [notesMap, setNotesMap] = useState<Record<string,string>>({});
  useEffect(() => {
    const map: Record<string,string> = {};
    HISTORIQUE.forEach(h => {
      const n = lsGet<string>(`spotruck_notes_historique_${h.id}`, "");
      if (n) map[h.id] = n;
    });
    setNotesMap(map);
  }, [detail]); // re-check after closing a modal

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }, []);

  const dupliquer = useCallback((h: Evenement) => {
    lsSet("spotruck_org_brouillon", { titre:`${h.titre} — Copie`, typeEvt:h.type, lieu:h.lieu, visiteurs:String(h.visiteurs), statut:"BROUILLON" });
    showToast(`Événement dupliqué : "${h.titre}" — modifiez et publiez !`);
    setTimeout(() => router.push("/dashboard/organisateur/evenement"), 1800);
  }, [router, showToast]);

  // ── Filtrage ────────────────────────────────────────────────
  const annees  = [...new Set(HISTORIQUE.map(h => h.annee))].sort((a,b) => b - a);
  const types   = ["Tous", ...new Set(HISTORIQUE.map(h => h.type))];
  const statuts = ["Tous", "RÉALISÉ", "ANNULÉ", "REPORTÉ"];

  const filtered = useMemo(() => HISTORIQUE.filter(h => {
    const q = query.toLowerCase();
    if (q && !h.titre.toLowerCase().includes(q) && !h.lieu.toLowerCase().includes(q)) return false;
    if (filtreAnnee && h.annee !== filtreAnnee) return false;
    if (filtreStatut !== "Tous" && h.statut !== filtreStatut) return false;
    if (filtreType   !== "Tous" && h.type   !== filtreType)   return false;
    return true;
  }), [query, filtreAnnee, filtreStatut, filtreType]);

  const hasFiltre = query || filtreAnnee || filtreStatut !== "Tous" || filtreType !== "Tous";

  // ── Stats globales ─────────────────────────────────────────
  const totalVisiteurs = HISTORIQUE.reduce((a, h) => a + (h.visiteursReels ?? h.visiteurs), 0);
  const totalTrucks    = [...new Set(HISTORIQUE.flatMap(h => h.trucks.map(t => t.nom)))].length;
  const allNotes       = HISTORIQUE.flatMap(h => h.trucks.map(t => t.noteOrga));
  const moyNotes       = allNotes.length > 0 ? (allNotes.reduce((a,b)=>a+b,0)/allNotes.length).toFixed(1) : "—";

  return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <OrganisateurSidebar active="/dashboard/organisateur/historique" />

      <div style={{ padding:"3rem", maxWidth:1060, minWidth:0 }}>

        {/* Header */}
        <div style={{ marginBottom:"2rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>DASHBOARD — ORGANISATEUR</p>
          <h1 style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, lineHeight:1.1 }}>Historique des événements</h1>
          <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color:S.muted, marginTop:"0.3rem" }}>
            {HISTORIQUE.length} événements passés — cliquez sur un événement pour voir sa fiche complète
          </p>
        </div>

        {/* Stats globales */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"2px", marginBottom:"2.5rem" }}>
          {[
            { label:"ÉVÉNEMENTS RÉALISÉS",  value:String(HISTORIQUE.filter(h=>h.statut==="RÉALISÉ").length) },
            { label:"TRUCKS ENGAGÉS",       value:String(totalTrucks) },
            { label:"VISITEURS TOTAL",      value:totalVisiteurs.toLocaleString("fr-FR") },
            { label:"NOTE MOY. ORGA",       value:`${moyNotes}★` },
          ].map(k => (
            <div key={k.label} style={{ backgroundColor:S.card, padding:"1.25rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>{k.label}</p>
              <p style={{ fontFamily:S.serif, fontSize:"1.8rem", fontWeight:800, color:S.brown, lineHeight:1 }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filtres ── */}
        <div style={{ marginBottom:"2rem", display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"flex-end" }}>
          {/* Recherche */}
          <div style={{ flex:"1 1 220px", position:"relative" }}>
            <Search size={13} color={S.muted} style={{ position:"absolute", left:"0.7rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par nom d'événement..."
              style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.55rem 2.1rem 0.55rem 2.1rem", fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, outline:"none", boxSizing:"border-box" }} />
            {query && <button onClick={() => setQuery("")} style={{ position:"absolute", right:"0.5rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer" }}><X size={12} color={S.muted} /></button>}
          </div>

          {/* Année */}
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.3rem" }}>ANNÉE</p>
            <div style={{ display:"flex", gap:"0.3rem" }}>
              <button onClick={() => setFiltreAnnee(null)} style={{ padding:"0.35rem 0.75rem", fontFamily:S.sans, fontSize:"0.65rem", backgroundColor: !filtreAnnee ? S.brown : "transparent", color: !filtreAnnee ? "#fff" : S.muted, border:`1px solid ${!filtreAnnee ? S.brown : S.border}`, cursor:"pointer" }}>Toutes</button>
              {annees.map(a => (
                <button key={a} onClick={() => setFiltreAnnee(a)} style={{ padding:"0.35rem 0.75rem", fontFamily:S.sans, fontSize:"0.65rem", backgroundColor: filtreAnnee === a ? S.brown : "transparent", color: filtreAnnee === a ? "#fff" : S.muted, border:`1px solid ${filtreAnnee === a ? S.brown : S.border}`, cursor:"pointer" }}>{a}</button>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.3rem" }}>STATUT</p>
            <div style={{ display:"flex", gap:"0.3rem" }}>
              {statuts.map(s => (
                <button key={s} onClick={() => setFiltreStatut(s)} style={{ padding:"0.35rem 0.75rem", fontFamily:S.sans, fontSize:"0.65rem", backgroundColor: filtreStatut === s ? S.terra : "transparent", color: filtreStatut === s ? "#fff" : S.muted, border:`1px solid ${filtreStatut === s ? S.terra : S.border}`, cursor:"pointer" }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.3rem" }}>TYPE</p>
            <div style={{ display:"flex", gap:"0.3rem" }}>
              {types.map(t => (
                <button key={t} onClick={() => setFiltreType(t)} style={{ padding:"0.35rem 0.75rem", fontFamily:S.sans, fontSize:"0.65rem", backgroundColor: filtreType === t ? S.brown : "transparent", color: filtreType === t ? "#fff" : S.muted, border:`1px solid ${filtreType === t ? S.brown : S.border}`, cursor:"pointer" }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {hasFiltre && (
            <button onClick={() => { setQuery(""); setFiltreAnnee(null); setFiltreStatut("Tous"); setFiltreType("Tous"); }}
              style={{ background:"none", border:`1px solid ${S.terra}`, color:S.terra, padding:"0.35rem 0.75rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem", alignSelf:"flex-end" }}>
              <X size={10} /> RÉINITIALISER
            </button>
          )}
        </div>

        {/* Résultat filtres */}
        {hasFiltre && (
          <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, marginBottom:"1rem" }}>
            {filtered.length} événement{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
          </p>
        )}

        {/* ── Liste événements ── */}
        {filtered.length === 0 ? (
          <div style={{ padding:"3rem", textAlign:"center", backgroundColor:S.card }}>
            <AlertTriangle size={28} strokeWidth={1.5} color={S.border} style={{ marginBottom:"0.75rem" }} />
            <p style={{ fontFamily:S.serif, fontSize:"1.2rem", fontWeight:700, color:S.brown, marginBottom:"0.4rem" }}>Aucun événement trouvé</p>
            <p style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.muted }}>Modifiez vos filtres pour voir plus de résultats</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
            {filtered.map(h => {
              const noteExiste = !!notesMap[h.id];
              const noteApercu = noteExiste ? notesMap[h.id].slice(0, 50) + (notesMap[h.id].length > 50 ? "…" : "") : "";
              const moy = h.trucks.length > 0
                ? (h.trucks.reduce((a,t) => a + t.noteOrga, 0) / h.trucks.length).toFixed(1)
                : "—";

              return (
                <div key={h.id} style={{ backgroundColor:S.card, padding:"1.5rem 1.75rem", cursor:"pointer", transition:"background-color 0.15s" }}
                  onClick={() => setDetail(h)}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem", marginBottom:"1rem" }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.4rem", flexWrap:"wrap" }}>
                        <h3 style={{ fontFamily:S.serif, fontSize:"1.15rem", fontWeight:700, color:S.brown }}>{h.titre}</h3>
                        <StatutBadge statut={h.statut} />
                        {/* Icône note */}
                        {noteExiste && (
                          <span title={noteApercu} style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem", cursor:"help" }}>
                            <StickyNote size={14} color={S.terra} strokeWidth={1.5} />
                            <span style={{ fontFamily:S.sans, fontSize:"0.58rem", color:S.terra }}>Note</span>
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted }}>{h.type} · {h.date} · {h.lieu}</p>
                    </div>
                    <div style={{ display:"flex", gap:"0.5rem" }}>
                      <button onClick={e => { e.stopPropagation(); dupliquer(h); }}
                        style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                        <Copy size={11} strokeWidth={2} /> DUPLIQUER
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDetail(h); }}
                        style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                        VOIR LA FICHE
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"2px", marginBottom:"0.875rem" }}>
                    {[
                      { l:"VISITEURS",    v:(h.visiteursReels ?? h.visiteurs).toLocaleString("fr-FR") },
                      { l:"TRUCKS",       v:String(h.trucks.length) },
                      { l:"MODÈLE",       v:h.modele.split("—")[0].trim() },
                      { l:"NOTE MOY.",    v:`${moy}★` },
                      { l:"DOCUMENTS",   v:`${h.documents.length}` },
                    ].map(i => (
                      <div key={i.l} style={{ backgroundColor:"rgba(44,26,16,0.04)", padding:"0.6rem 0.75rem" }}>
                        <p style={{ fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.2rem" }}>{i.l}</p>
                        <p style={{ fontFamily:S.serif, fontSize:"1rem", fontWeight:800, color:S.brown }}>{i.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Trucks + note aperçu */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"0.5rem" }}>
                    <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
                      {h.trucks.map(t => (
                        <span key={t.nom} style={{ backgroundColor:S.cream, border:`1px solid ${S.border}`, fontFamily:S.sans, fontSize:"0.63rem", color:S.brown, padding:"0.2rem 0.65rem" }}>{t.nom}</span>
                      ))}
                    </div>
                    {noteExiste && (
                      <p style={{ fontFamily:S.sans, fontSize:"0.65rem", fontStyle:"italic", color:S.muted, maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        📝 {noteApercu}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale détail */}
      {detail && (
        <EventDetailModal
          evt={detail}
          onClose={() => setDetail(null)}
          onDuplicate={dupliquer}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"2rem", left:"50%", transform:"translateX(-50%)", backgroundColor:S.green, color:"#fff", zIndex:5000, display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.875rem 1.75rem", boxShadow:"0 8px 24px rgba(0,0,0,0.2)", fontFamily:S.sans, fontSize:"0.78rem", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
          <CheckCircle size={16} strokeWidth={2} /> {toast}
        </div>
      )}
    </main>
  );
}

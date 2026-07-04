"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  Eye, MessageSquare, XCircle, CheckCircle, X, Send, AlertTriangle,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream: "#F2EDE4", brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Inter', Helvetica, sans-serif",
};

// ─── Types ────────────────────────────────────────────────────
type Statut = "attente" | "acceptee" | "refusee" | "annulee";

interface Message {
  id: string;
  auteur: "truck" | "organisateur";
  texte: string;
  dateISO: string;
}

export interface Candidature {
  id: string;
  titre: string;
  date: string;
  ville: string;
  region: string;
  type: string;
  offre: string;
  budget: string;
  visiteurs: number;
  description: string;
  statut: Statut;
  dateEnvoiISO: string;
  messageCandidature: string;
  documentsEnvoyes: string[];
  messages: Message[];
}

interface Props {
  initialCandidatures: Candidature[];
  foodtruckerId: string;
}

// ─── Statuts ──────────────────────────────────────────────────
const ST: Record<Statut, { color: string; bg: string; label: string }> = {
  attente:  { color: "#C4622D", bg: "rgba(196,98,45,0.1)",   label: "EN ATTENTE" },
  acceptee: { color: "#2C7A4B", bg: "rgba(44,122,75,0.1)",   label: "ACCEPTÉE" },
  refusee:  { color: "#8C7B6E", bg: "rgba(140,123,110,0.15)", label: "REFUSÉE" },
  annulee:  { color: "#C0392B", bg: "rgba(192,57,43,0.08)",  label: "ANNULÉE" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, color, onDone }: { message: string; color: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
      backgroundColor: color, color: "#fff", zIndex: 4000,
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.875rem 1.75rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      fontFamily: S.sans, fontSize: "0.78rem", letterSpacing: "0.08em",
      animation: "toastIn 0.25s ease",
    }}>
      <CheckCircle size={16} strokeWidth={2} /> {message}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ─── Modale base ──────────────────────────────────────────────
function Modale({ children, onClose, maxWidth = 560 }: { children: React.ReactNode; onClose: () => void; maxWidth?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,24,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: S.cream, width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto", border: `1px solid ${S.border}` }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ titre, label, onClose }: { titre: string; label: string; onClose: () => void }) {
  return (
    <div style={{ padding: "1.75rem 2rem", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.terra, marginBottom: "0.35rem" }}>{label}</p>
        <h2 style={{ fontFamily: S.serif, fontSize: "1.35rem", fontWeight: 800, color: S.brown, lineHeight: 1.2, maxWidth: 420 }}>{titre}</h2>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted, marginLeft: "1rem", flexShrink: 0 }}>
        <X size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ─── Modale VOIR ──────────────────────────────────────────────
function ModaleVoir({ c, onClose }: { c: Candidature; onClose: () => void }) {
  const st = ST[c.statut];
  const orgMsg = c.messages.find(m => m.auteur === "organisateur");

  return (
    <Modale onClose={onClose} maxWidth={600}>
      <ModalHeader titre={c.titre} label="DÉTAIL DE LA CANDIDATURE" onClose={onClose} />

      <div style={{ padding: "1.75rem 2rem" }}>
        {/* Statut + date envoi */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <span style={{ backgroundColor: st.bg, color: st.color, fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.15em", fontWeight: 600, padding: "0.3rem 0.75rem" }}>
            {st.label}
          </span>
          <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted }}>
            Candidature envoyée le {fmtDate(c.dateEnvoiISO)} à {fmtTime(c.dateEnvoiISO)}
          </span>
        </div>

        {/* Infos événement */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "DATE",        val: c.date },
            { label: "LIEU",        val: `${c.ville} — ${c.region}` },
            { label: "TYPE",        val: c.type },
            { label: "OFFRE",       val: c.offre },
            { label: "BUDGET",      val: c.budget },
            { label: "VISITEURS",   val: c.visiteurs.toLocaleString("fr-FR") },
          ].map(({ label, val }) => (
            <div key={label} style={{ backgroundColor: S.card, padding: "0.75rem 1rem" }}>
              <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.25rem" }}>{label}</p>
              <p style={{ fontFamily: S.sans, fontSize: "0.82rem", color: S.brown, fontWeight: 300 }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>DESCRIPTION DE L'ÉVÉNEMENT</p>
          <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.7, padding: "1rem", backgroundColor: S.card }}>
            {c.description || "Aucune description disponible."}
          </p>
        </div>

        {/* Message de candidature */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>VOTRE MESSAGE DE CANDIDATURE</p>
          <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.brown, lineHeight: 1.7, padding: "1rem", border: `1px solid ${S.border}` }}>
            {c.messageCandidature ? `"${c.messageCandidature}"` : "—"}
          </p>
        </div>

        {/* Documents envoyés */}
        {c.documentsEnvoyes.length > 0 && (
          <div style={{ marginBottom: "1.75rem" }}>
            <p style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.75rem" }}>DOCUMENTS DISPONIBLES</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {c.documentsEnvoyes.map(d => (
                <span key={d} style={{ display: "flex", alignItems: "center", gap: "0.3rem", backgroundColor: "rgba(44,122,75,0.08)", border: "1px solid rgba(44,122,75,0.2)", padding: "0.3rem 0.7rem", fontFamily: S.sans, fontSize: "0.65rem", color: "#2C7A4B" }}>
                  <CheckCircle size={11} strokeWidth={2} /> {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Message de l'organisateur (si envoyé) */}
        {orgMsg && (
          <div style={{ marginBottom:"1.5rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", backgroundColor: c.statut === "acceptee" ? "#2C7A4B" : "#8C7B6E" }} />
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color: c.statut === "acceptee" ? "#2C7A4B" : S.muted, fontWeight:700 }}>
                MESSAGE DE L'ORGANISATEUR
              </p>
            </div>
            <div style={{ border:`1px solid ${c.statut === "acceptee" ? "rgba(44,122,75,0.3)" : S.border}`, backgroundColor: c.statut === "acceptee" ? "rgba(44,122,75,0.04)" : "rgba(44,26,16,0.02)", padding:"1.25rem", borderLeft:`3px solid ${c.statut === "acceptee" ? "#2C7A4B" : "#D4C9BC"}` }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.8rem", fontWeight:300, color:S.brown, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{orgMsg.texte}</p>
            </div>
          </div>
        )}

        {/* Bouton fermer */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", borderTop: `1px solid ${S.border}` }}>
          <button onClick={onClose} style={{ backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "0.75rem 2rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer" }}>
            FERMER
          </button>
        </div>
      </div>
    </Modale>
  );
}

// ─── Modale MESSAGES ─────────────────────────────────────────
function ModaleMessages({ c, onSend, onClose }: { c: Candidature; onSend: (texte: string) => void; onClose: () => void }) {
  const [texte, setTexte] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [c.messages]);

  function handleSend() {
    if (!texte.trim()) return;
    onSend(texte.trim());
    setTexte("");
  }

  return (
    <Modale onClose={onClose} maxWidth={580}>
      <ModalHeader titre={c.titre} label="MESSAGERIE" onClose={onClose} />

      {/* Historique */}
      <div style={{ padding: "1.5rem 2rem", minHeight: 200, maxHeight: 320, overflowY: "auto", borderBottom: `1px solid ${S.border}` }}>
        {c.messages.length === 0 ? (
          <p style={{ fontFamily: S.sans, fontSize: "0.8rem", fontWeight: 300, color: S.muted, textAlign: "center", padding: "2rem 0" }}>Aucun message pour l'instant.</p>
        ) : (
          c.messages.map((m) => {
            const isTruck = m.auteur === "truck";
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isTruck ? "flex-end" : "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.1em", color: S.muted }}>
                    {isTruck ? "Vous" : "Organisateur"} · {fmtDate(m.dateISO)} {fmtTime(m.dateISO)}
                  </span>
                </div>
                <div style={{
                  backgroundColor: isTruck ? S.terra : S.card,
                  color: isTruck ? "#fff" : S.brown,
                  padding: "0.75rem 1rem", maxWidth: "80%",
                  fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, lineHeight: 1.6,
                }}>
                  {m.texte}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Champ de saisie */}
      <div style={{ padding: "1.25rem 2rem" }}>
        <textarea
          value={texte}
          onChange={e => setTexte(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Écrivez votre message… (Entrée pour envoyer)"
          rows={3}
          style={{ width: "100%", border: `1px solid ${S.border}`, backgroundColor: "transparent", padding: "0.75rem 1rem", fontFamily: S.sans, fontSize: "0.875rem", color: S.brown, outline: "none", resize: "none", lineHeight: 1.5, marginBottom: "0.75rem" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer" }}>
            FERMER
          </button>
          <button
            onClick={handleSend}
            disabled={!texte.trim()}
            style={{ backgroundColor: texte.trim() ? S.terra : S.muted, color: "#fff", border: "none", padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: texte.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "0.4rem", transition: "background-color 0.15s" }}
          >
            <Send size={13} strokeWidth={1.5} /> ENVOYER
          </button>
        </div>
      </div>
    </Modale>
  );
}

// ─── Modale ANNULER ───────────────────────────────────────────
function ModaleAnnuler({ titre, onConfirm, onClose }: { titre: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modale onClose={onClose} maxWidth={440}>
      <div style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <AlertTriangle size={22} color="#C0392B" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.25rem", fontWeight: 800, color: S.brown, marginBottom: "0.5rem", lineHeight: 1.2 }}>
              Annuler cette candidature ?
            </h2>
            <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.6 }}>
              Êtes-vous sûr de vouloir annuler votre candidature pour <strong style={{ color: S.brown, fontWeight: 500 }}>"{titre}"</strong> ? Cette action est irréversible.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onConfirm} style={{ flex: 1, backgroundColor: "#C0392B", color: "#fff", border: "none", padding: "0.875rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer" }}>
            OUI, ANNULER
          </button>
          <button onClick={onClose} style={{ backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "0.875rem 1.5rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer" }}>
            NON, GARDER
          </button>
        </div>
      </div>
    </Modale>
  );
}

// ─── Page principale ──────────────────────────────────────────
type FilterKey = "toutes" | "attente" | "acceptee" | "refusee" | "annulee";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "toutes",   label: "TOUTES" },
  { key: "attente",  label: "EN ATTENTE" },
  { key: "acceptee", label: "ACCEPTÉES" },
  { key: "refusee",  label: "REFUSÉES" },
  { key: "annulee",  label: "ANNULÉES" },
];

const COLS = ["ÉVÉNEMENT", "DATE", "TYPE", "OFFRE", "STATUT", "ACTIONS"];
const GRID = "2fr 1fr 1fr 1fr 1fr auto";

function CandidaturesClientInner({ initialCandidatures, foodtruckerId }: Props) {
  const [liste, setListe]             = useState<Candidature[]>(initialCandidatures);
  const [filtre, setFiltre]           = useState<FilterKey>("toutes");
  const [modaleVoir, setModaleVoir]   = useState<Candidature | null>(null);
  const [modaleMsg, setModaleMsg]     = useState<Candidature | null>(null);
  const [modaleAnn, setModaleAnn]     = useState<Candidature | null>(null);
  const [toast, setToast]             = useState<{ msg: string; color: string } | null>(null);

  // Deep-link : ouverture auto d'une modale via ?id=...&modal=detail|message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get("id");
    const modal  = params.get("modal");
    if (!id || !modal) return;

    const cand = initialCandidatures.find(c => c.id === id);
    if (!cand) return;

    if (modal === "detail")  setModaleVoir(cand);
    if (modal === "message") setModaleMsg(cand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = {
    toutes:   liste.length,
    attente:  liste.filter(c => c.statut === "attente").length,
    acceptee: liste.filter(c => c.statut === "acceptee").length,
    refusee:  liste.filter(c => c.statut === "refusee").length,
    annulee:  liste.filter(c => c.statut === "annulee").length,
  };

  const visible = filtre === "toutes" ? liste : liste.filter(c => c.statut === filtre);

  // ── Annuler candidature (réel, en base) ──
  const handleAnnuler = useCallback(async () => {
    if (!modaleAnn) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("candidatures")
      .update({ statut: "annulee" })
      .eq("id", modaleAnn.id)
      .eq("foodtrucker_id", foodtruckerId);

    if (error) {
      setToast({ msg: "Erreur lors de l'annulation — réessayez.", color: "#C0392B" });
      setModaleAnn(null);
      return;
    }
    setListe(prev => prev.map(c => c.id === modaleAnn.id ? { ...c, statut: "annulee" } : c));
    setModaleAnn(null);
    setToast({ msg: "Candidature annulée", color: "#C0392B" });
  }, [modaleAnn, foodtruckerId]);

  // ── Envoyer message (local à la session — pas de messagerie temps réel côté base) ──
  const handleSendMessage = useCallback((texte: string) => {
    if (!modaleMsg) return;
    const newMsg: Message = { id: `m-${Date.now()}`, auteur: "truck", texte, dateISO: new Date().toISOString() };
    setListe(prev => prev.map(c =>
      c.id === modaleMsg.id ? { ...c, messages: [...c.messages, newMsg] } : c
    ));
    setModaleMsg(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null);
    setToast({ msg: "Message envoyé", color: "#2C7A4B" });
  }, [modaleMsg]);

  return (
    <>
      <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown, display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <FoodtruckerSidebar active="/dashboard/foodtrucker/candidatures" />

        <div style={{ padding: "3rem" }}>
          {/* ── Header ── */}
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>DASHBOARD — FOODTRUCKER</p>
            <h1 style={{ fontFamily: S.serif, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.1 }}>Mes candidatures</h1>
          </div>

          {/* ── KPIs ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", marginBottom: "2.5rem" }}>
            {[
              { label: "EN ATTENTE",  value: counts.attente,  color: S.terra },
              { label: "ACCEPTÉES",   value: counts.acceptee, color: "#2C7A4B" },
              { label: "REFUSÉES",    value: counts.refusee,  color: S.muted },
              { label: "ANNULÉES",    value: counts.annulee,  color: "#C0392B" },
            ].map(k => (
              <div key={k.label} style={{ backgroundColor: S.card, padding: "1.5rem 2rem" }}>
                <div style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 800, color: k.color, lineHeight: 1, marginBottom: "0.4rem" }}>{k.value}</div>
                <div style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* ── Filtres ── */}
          <div style={{ display: "flex", gap: "2px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {FILTERS.map(f => {
              const isActive = filtre === f.key;
              const count = counts[f.key];
              if (f.key !== "toutes" && count === 0) return null; // masque les filtres vides
              return (
                <button key={f.key} onClick={() => setFiltre(f.key)} style={{
                  backgroundColor: isActive ? S.terra : "transparent",
                  color: isActive ? "#fff" : S.muted,
                  border: `1px solid ${isActive ? S.terra : S.border}`,
                  padding: "0.5rem 1.25rem",
                  fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", cursor: "pointer",
                  transition: "background-color 0.15s",
                }}>
                  {f.key === "toutes" ? `TOUTES (${count})` : `${f.label} (${count})`}
                </button>
              );
            })}
          </div>

          {/* ── Tableau ── */}
          {visible.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: S.muted, fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300 }}>
              Aucune candidature dans cette catégorie.
            </div>
          ) : (
            <div style={{ border: `1px solid ${S.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "1rem 1.5rem", borderBottom: `1px solid ${S.border}`, gap: "1rem" }}>
                {COLS.map(h => (
                  <span key={h} style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted }}>{h}</span>
                ))}
              </div>

              {visible.map((c, i) => {
                const st = ST[c.statut];
                const isLast = i === visible.length - 1;
                return (
                  <div key={c.id} style={{
                    display: "grid", gridTemplateColumns: GRID,
                    padding: "1.25rem 1.5rem", alignItems: "center", gap: "1rem",
                    borderBottom: isLast ? "none" : `1px solid ${S.border}`,
                    opacity: (c.statut === "refusee" || c.statut === "annulee") ? 0.6 : 1,
                    transition: "opacity 0.2s",
                  }}>
                    <span style={{ fontFamily: S.sans, fontSize: "0.875rem", color: S.brown }}>{c.titre}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted }}>{c.date}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.75rem", fontWeight: 300, color: S.muted }}>{c.type}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.7rem", fontWeight: 300, color: S.muted }}>{c.offre}</span>

                    <span style={{ display: "inline-block", padding: "0.3rem 0.6rem", backgroundColor: st.bg, color: st.color, fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", fontWeight: 600 }}>
                      {st.label}
                    </span>

                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      {/* VOIR */}
                      <button
                        title="Voir le détail"
                        onClick={() => setModaleVoir(c)}
                        style={{ background: "none", border: `1px solid ${S.border}`, cursor: "pointer", color: S.muted, padding: "0.35rem", display: "flex", alignItems: "center" }}
                      >
                        <Eye size={14} strokeWidth={1.5} />
                      </button>

                      {/* MESSAGE — acceptée seulement */}
                      {c.statut === "acceptee" && (
                        <button
                          title="Envoyer un message"
                          onClick={() => setModaleMsg(c)}
                          style={{ background: "none", border: `1px solid ${S.terra}`, cursor: "pointer", color: S.terra, padding: "0.35rem", display: "flex", alignItems: "center" }}
                        >
                          <MessageSquare size={14} strokeWidth={1.5} />
                        </button>
                      )}

                      {/* ANNULER — attente seulement */}
                      {c.statut === "attente" && (
                        <button
                          title="Annuler la candidature"
                          onClick={() => setModaleAnn(c)}
                          style={{ background: "none", border: `1px solid ${S.border}`, cursor: "pointer", color: S.muted, padding: "0.35rem", display: "flex", alignItems: "center" }}
                        >
                          <XCircle size={14} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Modales ── */}
      {modaleVoir && <ModaleVoir c={modaleVoir} onClose={() => setModaleVoir(null)} />}
      {modaleMsg  && <ModaleMessages c={modaleMsg} onSend={handleSendMessage} onClose={() => setModaleMsg(null)} />}
      {modaleAnn  && <ModaleAnnuler titre={modaleAnn.titre} onConfirm={handleAnnuler} onClose={() => setModaleAnn(null)} />}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} color={toast.color} onDone={() => setToast(null)} />}
    </>
  );
}

export default function CandidaturesClient(props: Props) {
  return <Suspense><CandidaturesClientInner {...props} /></Suspense>;
}

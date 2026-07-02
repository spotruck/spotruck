"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import {
  CheckCircle, X, Download, AlertTriangle, Zap, Star, Gift, Leaf,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream: "#F2EDE4", brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  danger: "#C0392B",
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Inter', Helvetica, sans-serif",
};

// ─── Styles réutilisables ─────────────────────────────────────
const input: React.CSSProperties = {
  width: "100%", border: `1px solid ${S.border}`, backgroundColor: "transparent",
  padding: "0.75rem 1rem", fontFamily: S.sans, fontSize: "0.875rem",
  color: S.brown, outline: "none",
};
const lbl: React.CSSProperties = {
  fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em",
  color: S.muted, display: "block", marginBottom: "0.5rem",
};
const btnTerra = (disabled = false): React.CSSProperties => ({
  backgroundColor: disabled ? S.muted : S.terra, color: "#fff", border: "none",
  padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.65rem",
  letterSpacing: "0.2em", cursor: disabled ? "not-allowed" : "pointer",
  transition: "background-color 0.15s",
});
const btnOutline: React.CSSProperties = {
  backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`,
  padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.65rem",
  letterSpacing: "0.2em", cursor: "pointer",
};

// ─── LocalStorage ─────────────────────────────────────────────
const LS_COMPTE    = "spotruck_compte";
const LS_ABO       = "spotruck_abonnement";
const LS_NOTIF     = "spotruck_notif_prefs";

type PlanKey = "free" | "pro" | "premium" | "saison";

interface CompteData { email: string }
interface AboData    { plan: PlanKey }
interface NotifData  { [key: string]: boolean }

const NOTIF_DEFAULTS: NotifData = {
  opportunites: true,
  candidature:  true,
  message:      true,
  rappel:       true,
  document:     true,
};

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Plans ────────────────────────────────────────────────────
const PLANS: {
  key: PlanKey; label: string; icon: React.ReactNode;
  priceLaunch: string; priceNormal: string; mention: string;
  features: { text: string; ok: boolean }[];
}[] = [
  {
    key: "free", label: "FREE", icon: <Gift size={16} strokeWidth={1.5} />,
    priceLaunch: "0 €", priceNormal: "", mention: "Pour démarrer",
    features: [
      { ok: true,  text: "Profil visible sur la marketplace" },
      { ok: true,  text: "Consultation des opportunités" },
      { ok: true,  text: "Calendrier en lecture seule" },
      { ok: false, text: "Candidatures" },
      { ok: false, text: "Statistiques financières" },
      { ok: false, text: "Calculateur de rentabilité" },
    ],
  },
  {
    key: "pro", label: "PRO", icon: <Star size={16} strokeWidth={1.5} />,
    priceLaunch: "15 €/mois", priceNormal: "29 €/mois",
    mention: "Offre valable pour les 50 premiers inscrits",
    features: [
      { ok: true,  text: "Candidatures illimitées" },
      { ok: true,  text: "Badge Vérifié ✓" },
      { ok: true,  text: "Calendrier complet + blocage de dates" },
      { ok: true,  text: "Suivi CA mensuel simple" },
      { ok: true,  text: "Liste des événements réalisés" },
      { ok: true,  text: "Factures PDF téléchargeables" },
      { ok: true,  text: "Export CSV des transactions" },
      { ok: false, text: "Calculateur de rentabilité" },
      { ok: false, text: "Ratios et projections" },
      { ok: false, text: "Accès anticipé 24h" },
    ],
  },
  {
    key: "premium", label: "PREMIUM", icon: <Zap size={16} strokeWidth={1.5} />,
    priceLaunch: "29 €/mois", priceNormal: "59 €/mois",
    mention: "Offre valable pour les 50 premiers inscrits",
    features: [
      { ok: true, text: "Tout Pro +" },
      { ok: true, text: "Tête de liste dans les résultats ⭐" },
      { ok: true, text: "Accès aux opportunités 24h avant" },
      { ok: true, text: "Alertes J-90 anticipées" },
      { ok: true, text: "Calculateur de rentabilité par événement → droit de place vs CA réalisé = marge nette %" },
      { ok: true, text: "Ratio candidatures : envoyées / acceptées / taux de succès %" },
      { ok: true, text: "CA moyen par type d'événement (festival, mariage, marché…)" },
      { ok: true, text: "Comparaison mensuelle : graphique mois par mois" },
      { ok: true, text: "Projection CA annuel estimée sur l'historique" },
      { ok: true, text: "Meilleure période : tes mois les plus rentables identifiés" },
      { ok: true, text: "Prospection base de données complète" },
    ],
  },
  {
    key: "saison", label: "SAISON", icon: <Leaf size={16} strokeWidth={1.5} />,
    priceLaunch: "99 €", priceNormal: "149 €",
    mention: "8 mois consécutifs",
    features: [
      { ok: true,  text: "Tout Plan Pro" },
      { ok: true,  text: "Valable 8 mois consécutifs à partir de votre date d'activation" },
      { ok: true,  text: "Adapté au rythme terrain" },
      { ok: true,  text: "Activation flexible selon votre saison" },
      { ok: false, text: "Fonctions Premium (calculateur, ratios, projections)" },
    ],
  },
];

const FACTURES = [
  { ref: "FAC-2025-003", date: "1 juin 2025",  montant: "16,50 €",  statut: "PAYÉE" },
  { ref: "FAC-2025-002", date: "1 mai 2025",   montant: "16,50 €",  statut: "PAYÉE" },
  { ref: "FAC-2025-001", date: "1 avr. 2025",  montant: "16,50 €",  statut: "PAYÉE" },
];

const NOTIF_LABELS: { key: string; label: string; sub: string }[] = [
  { key: "opportunites", label: "Nouvelles opportunités dans ma région",  sub: "Email dès qu'un événement correspond à votre profil" },
  { key: "candidature",  label: "Candidature acceptée ou refusée",        sub: "Email quand votre candidature est traitée" },
  { key: "message",      label: "Nouveau message d'un organisateur",      sub: "Email à chaque nouveau message reçu" },
  { key: "rappel",       label: "Rappel événement J-7",                   sub: "Email 7 jours avant chaque événement confirmé" },
  { key: "document",     label: "Alerte document expirant",               sub: "Email quand un document expire dans moins de 30 jours" },
];

// ─── Helpers ──────────────────────────────────────────────────
function passwordStrength(pwd: string): number {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}
const STRENGTH_COLORS = ["#D4C9BC", "#C0392B", "#E67E22", "#F1C40F", "#2C7A4B"];
const STRENGTH_LABELS = ["", "FAIBLE", "MOYEN", "BON", "FORT"];

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, color = "#2C7A4B", onDone }: { message: string; color?: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
      backgroundColor: color, color: "#fff", zIndex: 4000,
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.875rem 1.75rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      fontFamily: S.sans, fontSize: "0.78rem", letterSpacing: "0.08em",
      animation: "toastIn 0.25s ease", whiteSpace: "nowrap",
    }}>
      <CheckCircle size={16} strokeWidth={2} /> {message}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${S.border}` }}>
      <h2 style={{ fontFamily: S.serif, fontSize: "1.3rem", fontWeight: 700, color: S.brown }}>{title}</h2>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12,
        backgroundColor: on ? S.terra : S.border,
        position: "relative", cursor: "pointer", flexShrink: 0,
        transition: "background-color 0.2s",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff",
        position: "absolute", top: 3, left: on ? 23 : 3,
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

// ─── Modale générique ─────────────────────────────────────────
function Modal({ children, onClose, maxWidth = 520 }: { children: React.ReactNode; onClose: () => void; maxWidth?: number }) {
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

// ─── Page ─────────────────────────────────────────────────────
export default function ParametresPage() {
  const router = useRouter();

  // ── Compte ──
  const [email,        setEmail]        = useState("jean.martin@leburgerbreton.fr");
  const [editEmail,    setEditEmail]    = useState(false);
  const [emailDraft,   setEmailDraft]   = useState("");
  const [emailError,   setEmailError]   = useState("");
  const [editPwd,      setEditPwd]      = useState(false);
  const [pwdCurrent,   setPwdCurrent]   = useState("");
  const [pwdNew,       setPwdNew]       = useState("");
  const [pwdConfirm,   setPwdConfirm]   = useState("");
  const [pwdError,     setPwdError]     = useState("");

  // ── Abonnement ──
  const [plan,         setPlan]         = useState<PlanKey>("pro");
  const [modalPlans,   setModalPlans]   = useState(false);
  const [confirmPlan,  setConfirmPlan]  = useState<PlanKey | null>(null);
  const [modalFactures, setModalFactures] = useState(false);

  // ── Notifications ──
  const [notifPrefs, setNotifPrefs] = useState<NotifData>(NOTIF_DEFAULTS);

  // ── Zone danger ──
  const [modalDelete,  setModalDelete]  = useState(false);
  const [deleteInput,  setDeleteInput]  = useState("");

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; color?: string } | null>(null);
  const fire = useCallback((msg: string, color?: string) => setToast({ msg, color }), []);

  // ── Hydration localStorage ──
  useEffect(() => {
    const compte = loadLS<CompteData>(LS_COMPTE, { email: "jean.martin@leburgerbreton.fr" });
    const abo    = loadLS<AboData>(LS_ABO, { plan: "pro" });
    const notif  = loadLS<NotifData>(LS_NOTIF, NOTIF_DEFAULTS);
    setEmail(compte.email);
    setPlan(abo.plan);
    setNotifPrefs({ ...NOTIF_DEFAULTS, ...notif });
  }, []);

  // ─── Handlers Compte ──────────────────────────────────────
  function startEditEmail() { setEmailDraft(email); setEmailError(""); setEditEmail(true); }

  function saveEmail() {
    if (!emailDraft.includes("@") || !emailDraft.includes(".")) {
      setEmailError("Adresse email invalide."); return;
    }
    setEmail(emailDraft);
    saveLS(LS_COMPTE, { email: emailDraft });
    setEditEmail(false);
    fire("Email mis à jour");
  }

  function savePwd() {
    if (pwdNew.length < 8) { setPwdError("Minimum 8 caractères."); return; }
    if (pwdNew !== pwdConfirm) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    setPwdError("");
    setEditPwd(false);
    setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
    fire("Mot de passe mis à jour");
  }

  // ─── Handlers Abonnement ──────────────────────────────────
  function confirmChangePlan() {
    if (!confirmPlan) return;
    setPlan(confirmPlan);
    saveLS(LS_ABO, { plan: confirmPlan });
    setConfirmPlan(null);
    setModalPlans(false);
    const p = PLANS.find(p => p.key === confirmPlan);
    fire(`Plan ${p?.label} activé !`);
  }

  // ─── Handlers Notifications ───────────────────────────────
  function toggleNotif(key: string) {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveLS(LS_NOTIF, next);
      return next;
    });
  }

  // ─── Plan actuel ──────────────────────────────────────────
  const currentPlan = PLANS.find(p => p.key === plan)!;
  const strength = passwordStrength(pwdNew);

  return (
    <>
      <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown, display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <FoodtruckerSidebar active="/dashboard/foodtrucker/parametres" />

        <div style={{ padding: "3rem", maxWidth: "760px" }}>
          {/* ── Header ── */}
          <div style={{ marginBottom: "3rem" }}>
            <p style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>DASHBOARD — FOODTRUCKER</p>
            <h1 style={{ fontFamily: S.serif, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.1 }}>Paramètres</h1>
          </div>

          {/* ══════════════════════════════════════════════════
              SECTION 1 — COMPTE
          ══════════════════════════════════════════════════ */}
          <section style={{ marginBottom: "3rem" }}>
            <SectionHeader title="Mon compte" />

            {/* Email */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label style={lbl}>ADRESSE EMAIL</label>
              {!editEmail ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontFamily: S.sans, fontSize: "0.9rem", color: S.brown }}>{email}</span>
                  <button onClick={startEditEmail} style={{ ...btnOutline, padding: "0.4rem 0.875rem" }}>MODIFIER</button>
                </div>
              ) : (
                <div>
                  <input
                    type="email" value={emailDraft}
                    onChange={e => { setEmailDraft(e.target.value); setEmailError(""); }}
                    style={{ ...input, borderColor: emailError ? S.danger : S.border, marginBottom: "0.5rem" }}
                    autoFocus
                  />
                  {emailError && (
                    <p style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.danger, marginBottom: "0.5rem" }}>
                      {emailError}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={saveEmail} style={btnTerra()}>SAUVEGARDER</button>
                    <button onClick={() => { setEditEmail(false); setEmailError(""); }} style={btnOutline}>ANNULER</button>
                  </div>
                </div>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label style={lbl}>MOT DE PASSE</label>
              {!editPwd ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontFamily: S.sans, fontSize: "0.9rem", color: S.brown, letterSpacing: "0.15em" }}>••••••••</span>
                  <button onClick={() => { setEditPwd(true); setPwdError(""); }} style={{ ...btnOutline, padding: "0.4rem 0.875rem" }}>MODIFIER</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { lbl: "MOT DE PASSE ACTUEL",  val: pwdCurrent, set: setPwdCurrent, type: "password", ph: "••••••••" },
                    { lbl: "NOUVEAU MOT DE PASSE", val: pwdNew,     set: setPwdNew,     type: "password", ph: "Min. 8 caractères" },
                    { lbl: "CONFIRMER",            val: pwdConfirm, set: setPwdConfirm, type: "password", ph: "••••••••" },
                  ].map(f => (
                    <div key={f.lbl}>
                      <label style={lbl}>{f.lbl}</label>
                      <input type={f.type} value={f.val} onChange={e => { f.set(e.target.value); setPwdError(""); }}
                        placeholder={f.ph} style={input} />
                    </div>
                  ))}

                  {/* Barre de force */}
                  {pwdNew.length > 0 && (
                    <div>
                      <div style={{ display: "flex", gap: "3px", marginBottom: "0.3rem" }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: "3px", backgroundColor: i < strength ? STRENGTH_COLORS[strength] : S.border, transition: "background-color 0.2s, borderRadius 0" }} />
                        ))}
                      </div>
                      {strength > 0 && (
                        <span style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.15em", color: STRENGTH_COLORS[strength] }}>
                          {STRENGTH_LABELS[strength]}
                        </span>
                      )}
                    </div>
                  )}

                  {pwdError && <p style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.danger }}>{pwdError}</p>}

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={savePwd}
                      disabled={!pwdCurrent || !pwdNew || !pwdConfirm}
                      style={btnTerra(!pwdCurrent || !pwdNew || !pwdConfirm)}>SAUVEGARDER</button>
                    <button onClick={() => { setEditPwd(false); setPwdCurrent(""); setPwdNew(""); setPwdConfirm(""); setPwdError(""); }} style={btnOutline}>ANNULER</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              SECTION 2 — ABONNEMENT
          ══════════════════════════════════════════════════ */}
          <section style={{ marginBottom: "3rem" }}>
            <SectionHeader title="Mon abonnement" />

            {/* Plan actuel */}
            <div style={{ backgroundColor: S.card, padding: "1.75rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: S.terra }}>{currentPlan.icon}</span>
                  <span style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", color: S.terra, fontWeight: 600 }}>
                    PLAN ACTUEL — {currentPlan.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.3rem" }}>
                  <span style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 800, color: S.brown }}>{currentPlan.priceLaunch}</span>
                  {currentPlan.priceNormal && (
                    <span style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.muted, textDecoration: "line-through" }}>{currentPlan.priceNormal}</span>
                  )}
                </div>
                {currentPlan.key !== "free" && (
                  <span style={{ display: "inline-block", backgroundColor: "rgba(196,98,45,0.12)", color: S.terra, fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", padding: "0.2rem 0.5rem", fontWeight: 600 }}>
                    PRIX DE LANCEMENT
                  </span>
                )}
                <p style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted, marginTop: "0.4rem" }}>{currentPlan.mention}</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted, marginTop: "0.25rem", marginBottom: "1rem" }}>
                  Renouvellement le <strong style={{ color: S.brown, fontWeight: 500 }}>1er juillet 2025</strong>
                </p>
                {/* Features du plan actuel */}
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {currentPlan.features.map(f => (
                    <li key={f.text} style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: f.ok ? S.brown : S.muted, display: "flex", alignItems: "flex-start", gap: "0.4rem", lineHeight: 1.45, opacity: f.ok ? 1 : 0.5 }}>
                      <span style={{ flexShrink: 0, color: f.ok ? S.terra : S.border, fontWeight: 600, fontSize: "0.78rem", marginTop: "0.05rem" }}>
                        {f.ok ? "✓" : "✗"}
                      </span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button onClick={() => setModalPlans(true)} style={btnTerra()}>CHANGER DE PLAN</button>
                <button onClick={() => setModalFactures(true)} style={btnOutline}>GÉRER MA FACTURATION</button>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              SECTION 3 — NOTIFICATIONS
          ══════════════════════════════════════════════════ */}
          <section style={{ marginBottom: "3rem" }}>
            <SectionHeader title="Préférences de notifications" />
            <div>
              {NOTIF_LABELS.map((n, i) => (
                <div key={n.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: i < NOTIF_LABELS.length - 1 ? `1px solid ${S.border}` : "none" }}>
                  <div>
                    <p style={{ fontFamily: S.sans, fontSize: "0.875rem", color: S.brown, marginBottom: "0.2rem" }}>{n.label}</p>
                    <p style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted }}>{n.sub}</p>
                  </div>
                  <Toggle on={notifPrefs[n.key] ?? true} onToggle={() => toggleNotif(n.key)} />
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              SECTION 4 — ZONE DANGER
          ══════════════════════════════════════════════════ */}
          <section>
            <SectionHeader title="Zone de danger" />
            <div style={{ border: "1px solid rgba(192,57,43,0.3)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontFamily: S.sans, fontSize: "0.875rem", color: S.brown, fontWeight: 500, marginBottom: "0.2rem" }}>Supprimer mon compte</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.75rem", fontWeight: 300, color: S.muted }}>Action irréversible — toutes vos données seront effacées.</p>
              </div>
              <button onClick={() => setModalDelete(true)} style={{ backgroundColor: "transparent", color: S.danger, border: `1px solid ${S.danger}`, padding: "0.65rem 1.25rem", fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                <AlertTriangle size={13} strokeWidth={2} /> SUPPRIMER MON COMPTE
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════
          MODALES
      ══════════════════════════════════════════════════════ */}

      {/* ── Changer de plan ── */}
      {modalPlans && !confirmPlan && (
        <Modal onClose={() => setModalPlans(false)} maxWidth={780}>
          <div style={{ padding: "1.75rem 2rem", borderBottom: `1px solid ${S.border}` }}>
            <p style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.terra, marginBottom: "0.35rem" }}>ABONNEMENT</p>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.4rem", fontWeight: 800, color: S.brown }}>Choisissez votre plan</h2>
          </div>
          <div style={{ padding: "1.75rem 2rem", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2px" }}>
            {PLANS.map(p => {
              const isCurrent = p.key === plan;
              return (
                <div key={p.key} style={{ backgroundColor: isCurrent ? "rgba(196,98,45,0.08)" : S.card, border: isCurrent ? `2px solid ${S.terra}` : `2px solid transparent`, padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{ color: isCurrent ? S.terra : S.muted }}>{p.icon}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", color: isCurrent ? S.terra : S.muted, fontWeight: 600 }}>{p.label}</span>
                    {isCurrent && <span style={{ fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.1em", backgroundColor: S.terra, color: "#fff", padding: "0.15rem 0.4rem" }}>ACTUEL</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: S.serif, fontSize: "1.5rem", fontWeight: 800, color: S.brown }}>{p.priceLaunch}</span>
                    {p.priceNormal && <span style={{ fontFamily: S.sans, fontSize: "0.78rem", color: S.muted, textDecoration: "line-through" }}>{p.priceNormal}</span>}
                  </div>
                  {p.key !== "free" && (
                    <span style={{ display: "inline-block", backgroundColor: "rgba(196,98,45,0.12)", color: S.terra, fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.12em", padding: "0.15rem 0.4rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                      PRIX DE LANCEMENT
                    </span>
                  )}
                  <p style={{ fontFamily: S.sans, fontSize: "0.65rem", fontWeight: 300, color: S.muted, marginBottom: "1rem", lineHeight: 1.5 }}>{p.mention}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem" }}>
                    {p.features.map(f => (
                      <li key={f.text} style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: f.ok ? S.brown : S.muted, marginBottom: "0.3rem", display: "flex", alignItems: "flex-start", gap: "0.4rem", lineHeight: 1.45 }}>
                        <span style={{ flexShrink: 0, marginTop: "0.05rem", color: f.ok ? (isCurrent ? S.terra : "#2C7A4B") : S.border, fontWeight: 600, fontSize: "0.78rem" }}>
                          {f.ok ? "✓" : "✗"}
                        </span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrent}
                    onClick={() => setConfirmPlan(p.key)}
                    style={{ width: "100%", backgroundColor: isCurrent ? S.border : S.terra, color: "#fff", border: "none", padding: "0.7rem", fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", cursor: isCurrent ? "not-allowed" : "pointer" }}
                  >
                    {isCurrent ? "PLAN ACTUEL" : "CHOISIR"}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "1rem 2rem", borderTop: `1px solid ${S.border}`, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setModalPlans(false)} style={btnOutline}>FERMER</button>
          </div>
        </Modal>
      )}

      {/* ── Confirmation de changement de plan ── */}
      {confirmPlan && (
        <Modal onClose={() => setConfirmPlan(null)} maxWidth={440}>
          <div style={{ padding: "2rem" }}>
            {(() => {
              const p = PLANS.find(p => p.key === confirmPlan)!;
              return (
                <>
                  <h3 style={{ fontFamily: S.serif, fontSize: "1.3rem", fontWeight: 800, color: S.brown, marginBottom: "0.75rem" }}>
                    Passer au plan {p.label} ?
                  </h3>
                  <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.6, marginBottom: "1.5rem" }}>
                    Votre abonnement passera au plan <strong style={{ color: S.brown }}>{p.label}</strong> pour <strong style={{ color: S.brown }}>{p.priceLaunch}</strong>.{" "}
                    {p.mention}
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={confirmChangePlan} style={{ ...btnTerra(), flex: 1 }}>CONFIRMER</button>
                    <button onClick={() => setConfirmPlan(null)} style={btnOutline}>ANNULER</button>
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      {/* ── Facturation ── */}
      {modalFactures && (
        <Modal onClose={() => setModalFactures(false)} maxWidth={520}>
          <div style={{ padding: "1.75rem 2rem", borderBottom: `1px solid ${S.border}` }}>
            <p style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.terra, marginBottom: "0.35rem" }}>ABONNEMENT</p>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.35rem", fontWeight: 800, color: S.brown }}>Historique de facturation</h2>
          </div>
          <div style={{ border: `1px solid ${S.border}`, margin: "1.5rem 2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", padding: "0.75rem 1rem", borderBottom: `1px solid ${S.border}` }}>
              {["RÉFÉRENCE", "DATE", "MONTANT", ""].map((h, i) => (
                <span key={i} style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted }}>{h}</span>
              ))}
            </div>
            {FACTURES.map((f, i) => (
              <div key={f.ref} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", padding: "1rem", alignItems: "center", borderBottom: i < FACTURES.length - 1 ? `1px solid ${S.border}` : "none" }}>
                <span style={{ fontFamily: S.sans, fontSize: "0.78rem", color: S.brown, fontWeight: 500 }}>{f.ref}</span>
                <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted }}>{f.date}</span>
                <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.brown }}>{f.montant}</span>
                <button style={{ display: "flex", alignItems: "center", gap: "0.3rem", backgroundColor: "transparent", border: `1px solid ${S.border}`, padding: "0.35rem 0.75rem", cursor: "pointer", fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", color: S.muted }}>
                  <Download size={11} strokeWidth={1.5} /> PDF
                </button>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 2rem 1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setModalFactures(false)} style={btnOutline}>FERMER</button>
          </div>
        </Modal>
      )}

      {/* ── Suppression compte ── */}
      {modalDelete && (
        <Modal onClose={() => { setModalDelete(false); setDeleteInput(""); }} maxWidth={440}>
          <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <AlertTriangle size={22} color={S.danger} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ fontFamily: S.serif, fontSize: "1.2rem", fontWeight: 800, color: S.brown, marginBottom: "0.5rem" }}>
                  Supprimer définitivement mon compte ?
                </h3>
                <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  Cette action est <strong style={{ color: S.danger }}>irréversible</strong>. Toutes vos candidatures, messages et données seront effacés.
                </p>
                <label style={{ ...lbl, marginBottom: "0.5rem" }}>
                  TAPEZ <span style={{ color: S.danger, fontWeight: 600 }}>SUPPRIMER</span> POUR CONFIRMER
                </label>
                <input
                  type="text" value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="SUPPRIMER"
                  style={{ ...input, borderColor: deleteInput && deleteInput !== "SUPPRIMER" ? S.danger : S.border }}
                  autoFocus
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                disabled={deleteInput !== "SUPPRIMER"}
                onClick={() => {
                  setModalDelete(false);
                  fire("Compte supprimé", S.danger);
                  setTimeout(() => router.push("/"), 1800);
                }}
                style={{ flex: 1, backgroundColor: deleteInput === "SUPPRIMER" ? S.danger : S.border, color: "#fff", border: "none", padding: "0.875rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: deleteInput === "SUPPRIMER" ? "pointer" : "not-allowed", transition: "background-color 0.2s" }}
              >
                OUI, SUPPRIMER MON COMPTE
              </button>
              <button onClick={() => { setModalDelete(false); setDeleteInput(""); }} style={btnOutline}>ANNULER</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} color={toast.color} onDone={() => setToast(null)} />}
    </>
  );
}

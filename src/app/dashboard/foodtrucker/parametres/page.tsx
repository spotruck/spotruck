"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertTriangle, Zap, Star, Gift, Leaf } from "lucide-react";
import { FREE_FEATURES, PRO_FEATURES, GRACE_DAYS, isPaidPlan, type Feature } from "@/lib/billing/plans";

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

// ─── LocalStorage (préférences de notification, en secours) ───
const LS_NOTIF = "spotruck_notif_prefs";

type PlanKey = "free" | "pro" | "premium" | "saison";
interface NotifData { [key: string]: boolean }

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

// ─── Plans (affichage) ────────────────────────────────────────
const PLAN_META: Record<PlanKey, { label: string; icon: React.ReactNode }> = {
  free:    { label: "GRATUIT", icon: <Gift size={16} strokeWidth={1.5} /> },
  pro:     { label: "PRO",     icon: <Star size={16} strokeWidth={1.5} /> },
  premium: { label: "PREMIUM", icon: <Zap  size={16} strokeWidth={1.5} /> },
  saison:  { label: "SAISON",  icon: <Leaf size={16} strokeWidth={1.5} /> },
};

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
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
      backgroundColor: color, color: "#fff", zIndex: 4000,
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.875rem 1.75rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      fontFamily: S.sans, fontSize: "0.78rem", letterSpacing: "0.08em",
      animation: "toastIn 0.25s ease", maxWidth: "90vw",
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
  const supabase = useMemo(() => createClient(), []);

  // ── Compte ──
  const [email,        setEmail]        = useState("");
  const [editEmail,    setEditEmail]    = useState(false);
  const [emailDraft,   setEmailDraft]   = useState("");
  const [emailError,   setEmailError]   = useState("");
  const [emailBusy,    setEmailBusy]    = useState(false);
  const [editPwd,      setEditPwd]      = useState(false);
  const [pwdCurrent,   setPwdCurrent]   = useState("");
  const [pwdNew,       setPwdNew]       = useState("");
  const [pwdConfirm,   setPwdConfirm]   = useState("");
  const [pwdError,     setPwdError]     = useState("");
  const [pwdBusy,      setPwdBusy]      = useState(false);

  // ── Abonnement (données réelles) ──
  const [plan,         setPlan]         = useState<PlanKey>("free");
  const [planExpire,   setPlanExpire]   = useState<string | null>(null);
  const [planStatus,   setPlanStatus]   = useState<string | null>(null);
  const [cancelAtEnd,  setCancelAtEnd]  = useState(false);
  const [planLoading,  setPlanLoading]  = useState(true);
  const [portalBusy,   setPortalBusy]   = useState(false);

  // ── Notifications ──
  const [notifPrefs, setNotifPrefs] = useState<NotifData>(NOTIF_DEFAULTS);

  // ── Zone danger ──
  const [modalDelete,  setModalDelete]  = useState(false);
  const [deleteInput,  setDeleteInput]  = useState("");

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; color?: string } | null>(null);
  const fire = useCallback((msg: string, color?: string) => setToast({ msg, color }), []);

  // ── Chargement des vraies données ──
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) { router.push("/auth/login"); return; }
      if (!alive) return;
      setEmail(user.email || "");

      const { data: ft } = await supabase
        .from("foodtruckers")
        .select("plan, plan_expire_at, plan_status, plan_cancel_at_period_end")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive) return;
      const p = (ft?.plan || "free") as PlanKey;
      setPlan(isPaidPlan(ft) ? p : "free");
      setPlanExpire(ft?.plan_expire_at ?? null);
      setPlanStatus(ft?.plan_status ?? null);
      setCancelAtEnd(!!ft?.plan_cancel_at_period_end);
      setPlanLoading(false);

      // Préférences de notification : base de données si disponible, sinon navigateur
      let prefs: NotifData = loadLS<NotifData>(LS_NOTIF, NOTIF_DEFAULTS);
      try {
        const { data: np, error } = await supabase.from("foodtruckers").select("notif_prefs").eq("id", user.id).maybeSingle();
        if (!error && np?.notif_prefs && typeof np.notif_prefs === "object") prefs = np.notif_prefs as NotifData;
      } catch {}
      if (alive) setNotifPrefs({ ...NOTIF_DEFAULTS, ...prefs });
    })();
    return () => { alive = false; };
  }, [supabase, router]);

  // ─── Handlers Compte ──────────────────────────────────────
  function startEditEmail() { setEmailDraft(email); setEmailError(""); setEditEmail(true); }

  async function saveEmail() {
    if (!emailDraft.includes("@") || !emailDraft.includes(".")) {
      setEmailError("Adresse email invalide."); return;
    }
    if (emailDraft === email) { setEditEmail(false); return; }
    setEmailBusy(true);
    const { error } = await supabase.auth.updateUser({ email: emailDraft });
    setEmailBusy(false);
    if (error) { setEmailError(error.message); return; }
    setEditEmail(false);
    fire("Un e-mail de confirmation vient d'être envoyé à la nouvelle adresse");
  }

  async function savePwd() {
    if (pwdNew.length < 8) { setPwdError("Minimum 8 caractères."); return; }
    if (pwdNew !== pwdConfirm) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    setPwdBusy(true);
    const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: pwdCurrent });
    if (e1) { setPwdBusy(false); setPwdError("Mot de passe actuel incorrect."); return; }
    const { error: e2 } = await supabase.auth.updateUser({ password: pwdNew });
    setPwdBusy(false);
    if (e2) { setPwdError(e2.message); return; }
    setPwdError("");
    setEditPwd(false);
    setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
    fire("Mot de passe mis à jour");
  }

  // ─── Abonnement : portail Stripe (gestion + factures) ─────
  async function ouvrirPortail() {
    setPortalBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnecte-toi.");
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: "{}",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Erreur");
      if (j.url) window.location.href = j.url;
    } catch (e) {
      fire(e instanceof Error ? e.message : "Erreur", S.danger);
      setPortalBusy(false);
    }
  }

  // ─── Handlers Notifications ───────────────────────────────
  async function persistNotif(next: NotifData) {
    saveLS(LS_NOTIF, next);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) await supabase.from("foodtruckers").update({ notif_prefs: next }).eq("id", data.user.id);
    } catch {}
  }
  function toggleNotif(key: string) {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      void persistNotif(next);
      return next;
    });
  }

  // ─── Plan actuel ──────────────────────────────────────────
  const meta = PLAN_META[plan];
  const paid = plan !== "free";
  const features: Feature[] = paid ? PRO_FEATURES : FREE_FEATURES;
  const finPeriode =
    planExpire && !Number.isNaN(Date.parse(planExpire))
      ? new Date(Date.parse(planExpire) - GRACE_DAYS * 86400000).toLocaleDateString("fr-FR")
      : null;
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

          {/* ══════════════ SECTION 1 — COMPTE ══════════════ */}
          <section style={{ marginBottom: "3rem" }}>
            <SectionHeader title="Mon compte" />

            {/* Email */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label style={lbl}>ADRESSE EMAIL</label>
              {!editEmail ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontFamily: S.sans, fontSize: "0.9rem", color: S.brown }}>{email || "…"}</span>
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
                    <button onClick={saveEmail} disabled={emailBusy} style={btnTerra(emailBusy)}>{emailBusy ? "ENVOI…" : "SAUVEGARDER"}</button>
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
                          <div key={i} style={{ flex: 1, height: "3px", backgroundColor: i < strength ? STRENGTH_COLORS[strength] : S.border, transition: "background-color 0.2s" }} />
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
                      disabled={!pwdCurrent || !pwdNew || !pwdConfirm || pwdBusy}
                      style={btnTerra(!pwdCurrent || !pwdNew || !pwdConfirm || pwdBusy)}>{pwdBusy ? "ENVOI…" : "SAUVEGARDER"}</button>
                    <button onClick={() => { setEditPwd(false); setPwdCurrent(""); setPwdNew(""); setPwdConfirm(""); setPwdError(""); }} style={btnOutline}>ANNULER</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ══════════════ SECTION 2 — ABONNEMENT ══════════════ */}
          <section style={{ marginBottom: "3rem" }}>
            <SectionHeader title="Mon abonnement" />

            <div style={{ backgroundColor: S.card, padding: "1.75rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              {planLoading ? (
                <p style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.muted }}>Chargement…</p>
              ) : (
                <>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ color: S.terra }}>{meta.icon}</span>
                      <span style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", color: S.terra, fontWeight: 600 }}>
                        PLAN ACTUEL — {meta.label}
                      </span>
                    </div>

                    {paid ? (
                      <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted, marginBottom: "1rem", lineHeight: 1.6 }}>
                        {planStatus === "past_due" && (
                          <span style={{ color: S.danger, fontWeight: 500 }}>Dernier paiement refusé : mets à jour ta carte dans « Gérer mon abonnement ». <br /></span>
                        )}
                        {finPeriode && cancelAtEnd && (
                          <>Résiliation programmée : tu gardes l&apos;accès Pro jusqu&apos;au <strong style={{ color: S.brown, fontWeight: 500 }}>{finPeriode}</strong>.</>
                        )}
                        {finPeriode && !cancelAtEnd && (
                          <>Prochain renouvellement le <strong style={{ color: S.brown, fontWeight: 500 }}>{finPeriode}</strong>.</>
                        )}
                        {!finPeriode && <>Abonnement actif.</>}
                      </p>
                    ) : (
                      <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted, marginBottom: "1rem", lineHeight: 1.6 }}>
                        Tu utilises Spotruck gratuitement. Le plan Pro te fait gagner du temps sur tes candidatures.
                      </p>
                    )}

                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {features.map(f => (
                        <li key={f.text} style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.brown, display: "flex", alignItems: "flex-start", gap: "0.4rem", lineHeight: 1.45 }}>
                          <span style={{ flexShrink: 0, color: S.terra, fontWeight: 600, fontSize: "0.78rem", marginTop: "0.05rem" }}>✓</span>
                          <span>
                            {f.text}
                            {f.soon && <span style={{ marginLeft: 6, fontSize: "0.55rem", letterSpacing: "0.1em", opacity: 0.6 }}>BIENTÔT</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {paid ? (
                      <>
                        <button onClick={ouvrirPortail} disabled={portalBusy} style={btnTerra(portalBusy)}>
                          {portalBusy ? "OUVERTURE…" : "GÉRER MON ABONNEMENT"}
                        </button>
                        <button onClick={() => router.push("/dashboard/foodtrucker/abonnement")} style={btnOutline}>VOIR LES OFFRES</button>
                        <p style={{ fontFamily: S.sans, fontSize: "0.62rem", fontWeight: 300, color: S.muted, maxWidth: 190, lineHeight: 1.5 }}>
                          Carte, résiliation et factures PDF se gèrent dans « Gérer mon abonnement ».
                        </p>
                      </>
                    ) : (
                      <button onClick={() => router.push("/dashboard/foodtrucker/abonnement")} style={btnTerra()}>PASSER AU PRO</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ══════════════ SECTION 3 — NOTIFICATIONS ══════════════ */}
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

          {/* ══════════════ SECTION 4 — ZONE DANGER ══════════════ */}
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

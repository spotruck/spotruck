"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle, AlertTriangle, RotateCcw, Download,
  Edit3, Eye, EyeOff, X, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B", red:    "#C0392B", amber:  "#B8850A",
  gold:   "#D4A017",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

type PlanKey = "gratuit" | "pro_event" | "pro_semestriel" | "pro_annuel";

const DEFAUT_ACCEPT = `Bonjour,

Nous avons le plaisir de vous informer que votre candidature a été retenue.

Votre profil et votre concept correspondent parfaitement à nos attentes pour cet événement.

Prochaines étapes :
- Nous vous ferons parvenir le contrat dans les prochains jours
- Un acompte de 30% vous sera demandé à la signature
- Nous reviendrons vers vous avec les détails logistiques (emplacement, horaires d'accès, contact sur place)

N'hésitez pas à nous contacter si vous avez des questions.

Cordialement`;

const DEFAUT_REFUS = `Bonjour,

Nous vous remercions chaleureusement pour votre candidature ainsi que pour la qualité de votre présentation.

Nous avons reçu un grand nombre de candidatures de très bon niveau, ce qui a rendu notre sélection particulièrement difficile.

Après examen attentif de l'ensemble des dossiers, nous avons malheureusement dû faire des choix et nous ne sommes pas en mesure de vous retenir pour cette édition.

Nous gardons précieusement vos coordonnées et votre profil pour nos prochains événements.

Cordialement`;

// ─── Données transactions (aperçu — historique de facturation à venir) ──
const TRANSACTIONS = [
  { date:"21 juin 2025",   evt:"Festival Solstice 2025",       modele:"Privatisation",              prestation:3500, commission:455, statut:"PAYÉE"   },
  { date:"14 nov. 2025",   evt:"Gala Tech Corp 2025",           modele:"Privatisation",              prestation:2800, commission:364, statut:"PAYÉE"   },
  { date:"20 déc. 2025",   evt:"Marché de Noël Bordeaux 2025", modele:"Droit de place via Spotruck", prestation:1800, commission:90,  statut:"PAYÉE"   },
];

// ─── Helpers localStorage (préférences non critiques) ─────────
function lsGet<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function lsSet(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

const LS_MODELES = "spotruck_modeles_messages";
const LS_NOTIFS  = "spotruck_org_notifs";

// ─── Composants réutilisables ─────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom:"1.5rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}` }}>
      <h2 style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:700, color:S.brown }}>{title}</h2>
      {sub && <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.2rem" }}>{sub}</p>}
    </div>
  );
}

function Toggle({ on, onChange, label, sub }: { on:boolean; onChange:()=>void; label:string; sub?:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.875rem 0", borderBottom:`1px solid ${S.border}` }}>
      <div>
        <span style={{ fontFamily:S.sans, fontSize:"0.8rem", color:S.brown }}>{label}</span>
        {sub && <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, marginTop:"0.1rem" }}>{sub}</p>}
      </div>
      <div onClick={onChange} style={{ width:40, height:22, borderRadius:11, backgroundColor: on ? S.terra : S.border, position:"relative", cursor:"pointer", transition:"background-color 0.2s", flexShrink:0, marginLeft:"1rem" }}>
        <div style={{ position:"absolute", top:3, left: on ? 21 : 3, width:16, height:16, borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s" }} />
      </div>
    </div>
  );
}

function FieldInline({ label, value, onChange, type = "text", placeholder, error }: {
  label:string; value:string; onChange:(v:string)=>void;
  type?:string; placeholder?:string; error?:string;
}) {
  return (
    <div style={{ marginBottom:"1rem" }}>
      <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color: error ? S.red : S.muted, display:"block", marginBottom:"0.35rem" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", border:`1px solid ${error ? S.red : S.border}`, backgroundColor:"transparent", padding:"0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none", boxSizing:"border-box" }} />
      {error && <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.red, marginTop:"0.25rem" }}>⚠ {error}</p>}
    </div>
  );
}

interface Props {
  organisateurId: string;
  email: string;
  compte: {
    prenomResponsable: string;
    nomResponsable: string;
    nomOrganisation: string;
    typeOrganisation: string;
    siret: string;
    adresse: string;
  };
  plan: PlanKey;
}

const ORG_TYPES: { value: string; label: string }[] = [
  { value: "particulier", label: "Particulier" },
  { value: "association", label: "Association" },
  { value: "entreprise", label: "Entreprise" },
  { value: "mairie", label: "Mairie" },
  { value: "agence", label: "Agence événementielle" },
];

// ─── Page ─────────────────────────────────────────────────────
export default function ParametresClient({ organisateurId, email: initialEmail, compte, plan: initialPlan }: Props) {
  const router = useRouter();
  const [toast, setToast] = useState<{ msg:string; color?:string } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((msg: string, color = S.green) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── COMPTE ────────────────────────────────────────────────
  const [prenom,     setPrenom]     = useState(compte.prenomResponsable);
  const [nom,        setNom]        = useState(compte.nomResponsable);
  const [orgNom,     setOrgNom]     = useState(compte.nomOrganisation);
  const [orgType,    setOrgType]    = useState(compte.typeOrganisation || "association");
  const [siret,      setSiret]      = useState(compte.siret);
  const [adresse,    setAdresse]    = useState(compte.adresse);

  // Email éditable
  const [email,      setEmail]      = useState(initialEmail);
  const [editEmail,  setEditEmail]  = useState(false);
  const [draftEmail, setDraftEmail] = useState(email);
  const [emailErr,   setEmailErr]   = useState("");

  // Mot de passe
  const [editMdp,    setEditMdp]    = useState(false);
  const [mdpActuel,  setMdpActuel]  = useState("");
  const [mdpNouv,    setMdpNouv]    = useState("");
  const [mdpConfirm, setMdpConfirm] = useState("");
  const [showMdp,    setShowMdp]    = useState(false);
  const [mdpErr,     setMdpErr]     = useState("");

  // ── PLAN ──────────────────────────────────────────────────
  const [plan, setPlan] = useState<PlanKey>(initialPlan);
  const [accordionOpen, setAccordionOpen] = useState<number | null>(null);

  // ── NOTIFICATIONS (préférences locales) ───────────────────
  const [notifs, setNotifs] = useState(() => lsGet(LS_NOTIFS, {
    nouvelleCand: true, candidatureRetiree: false, messageRecu: true, rappelJ7: true, confirmPaiement: true,
  }));

  // ── MODÈLES MESSAGES (préférences locales) ────────────────
  const [msgAccept, setMsgAccept] = useState(() => lsGet<{acceptation?:string;refus?:string}>(LS_MODELES, {}).acceptation || DEFAUT_ACCEPT);
  const [msgRefus,  setMsgRefus]  = useState(() => lsGet<{acceptation?:string;refus?:string}>(LS_MODELES, {}).refus || DEFAUT_REFUS);

  // ── DANGER ────────────────────────────────────────────────
  const [showDanger,  setShowDanger]  = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  // ── Actions compte ────────────────────────────────────────
  const saveCompte = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("organisateurs")
      .update({
        prenom_responsable: prenom || null,
        nom_responsable: nom || null,
        nom_organisation: orgNom,
        type_organisation: orgType,
        siret: siret || null,
        adresse: adresse || null,
      })
      .eq("id", organisateurId);
    setSaving(false);
    if (error) { showToast("Erreur lors de la sauvegarde", S.red); return; }
    showToast("Informations mises à jour ✓");
  };

  const saveEmail = async () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(draftEmail)) { setEmailErr("Format d'email invalide"); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: draftEmail });
    if (error) { setEmailErr(error.message); return; }
    setEmail(draftEmail);
    setEmailErr("");
    setEditEmail(false);
    showToast("Un email de confirmation a été envoyé à la nouvelle adresse ✓");
  };

  const savePwd = async () => {
    if (!mdpActuel) { setMdpErr("Saisissez votre mot de passe actuel"); return; }
    if (mdpNouv.length < 8) { setMdpErr("Le nouveau mot de passe doit contenir au moins 8 caractères"); return; }
    if (mdpNouv !== mdpConfirm) { setMdpErr("Les mots de passe ne correspondent pas"); return; }
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: mdpActuel });
    if (verifyError) { setMdpErr("Mot de passe actuel incorrect"); return; }
    const { error } = await supabase.auth.updateUser({ password: mdpNouv });
    if (error) { setMdpErr(error.message); return; }
    setMdpErr(""); setEditMdp(false);
    setMdpActuel(""); setMdpNouv(""); setMdpConfirm("");
    showToast("Mot de passe mis à jour ✓");
  };

  const toggleNotif = (k: keyof typeof notifs) => {
    const next = { ...notifs, [k]: !notifs[k] };
    setNotifs(next); lsSet(LS_NOTIFS, next);
  };

  const saveModeles = () => {
    lsSet(LS_MODELES, { acceptation:msgAccept, refus:msgRefus });
    showToast("Modèles de messages sauvegardés ✓");
  };

  const exportCSV = () => {
    const rows = ["Date,Événement,Modèle,Prestation (€),Commission (€),Statut",
      ...TRANSACTIONS.map(t => `${t.date},"${t.evt}",${t.modele},${t.prestation},${t.commission},${t.statut}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(rows);
    a.download = "spotruck_transactions.csv"; a.click();
  };

  const changePlan = async (newPlan: PlanKey) => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("organisateurs").update({ plan: newPlan }).eq("id", organisateurId);
    setSaving(false);
    if (error) { showToast("Erreur lors du changement de plan", S.red); return; }
    setPlan(newPlan);
    showToast(`Plan ${newPlan.replace("_", " ")} activé !`, S.terra);
  };

  const supprimerCompte = () => {
    if (deleteInput !== "SUPPRIMER") { showToast("Tapez SUPPRIMER pour confirmer", S.red); return; }
    showToast("Compte supprimé — redirection...", S.red);
    setTimeout(() => router.push("/"), 2000);
  };

  return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <OrganisateurSidebar active="/dashboard/organisateur/parametres" />

      <div style={{ padding:"3rem", maxWidth:920, minWidth:0 }}>

        {/* Header */}
        <div style={{ marginBottom:"2.5rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>DASHBOARD — ORGANISATEUR</p>
          <h1 style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, lineHeight:1.1 }}>Paramètres du compte</h1>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — INFORMATIONS DU COMPTE
        ══════════════════════════════════════════════════════ */}
        <section style={{ marginBottom:"3rem" }}>
          <SectionHeader title="Informations du compte" />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 1.5rem", marginBottom:"1.25rem" }}>
            <FieldInline label="PRÉNOM DU RESPONSABLE" value={prenom} onChange={setPrenom} />
            <FieldInline label="NOM DU RESPONSABLE" value={nom} onChange={setNom} />
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, display:"block", marginBottom:"0.35rem" }}>TYPE D'ORGANISATION</label>
              <select value={orgType} onChange={e => setOrgType(e.target.value)}
                style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none", appearance:"none" }}>
                {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <FieldInline label="NOM DE L'ORGANISATION" value={orgNom} onChange={setOrgNom} />
            <FieldInline label="SIRET (optionnel)" value={siret} onChange={setSiret} placeholder="XXX XXX XXX XXXXX" />
            <FieldInline label="ADRESSE" value={adresse} onChange={setAdresse} placeholder="Rue, code postal, ville" />
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"2rem" }}>
            <button onClick={saveCompte} disabled={saving} style={{ backgroundColor: saving ? S.muted : S.terra, color:"#fff", border:"none", padding:"0.65rem 2rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "SAUVEGARDE…" : "SAUVEGARDER"}
            </button>
          </div>

          {/* Email */}
          <div style={{ backgroundColor:S.card, padding:"1.25rem", marginBottom:"2px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.2rem" }}>ADRESSE EMAIL</p>
                <p style={{ fontFamily:S.sans, fontSize:"0.88rem", color:S.brown }}>{email}</p>
              </div>
              {!editEmail && (
                <button onClick={() => { setDraftEmail(email); setEmailErr(""); setEditEmail(true); }}
                  style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.4rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                  <Edit3 size={11} strokeWidth={1.5} /> MODIFIER
                </button>
              )}
            </div>
            {editEmail && (
              <div style={{ marginTop:"1rem" }}>
                <FieldInline label="NOUVEL EMAIL" value={draftEmail} onChange={v => { setDraftEmail(v); setEmailErr(""); }} type="email" error={emailErr} />
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={saveEmail} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.5rem 1.25rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.18em", cursor:"pointer" }}>SAUVEGARDER</button>
                  <button onClick={() => { setEditEmail(false); setEmailErr(""); }} style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.5rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", cursor:"pointer" }}>ANNULER</button>
                </div>
              </div>
            )}
          </div>

          {/* Mot de passe */}
          <div style={{ backgroundColor:S.card, padding:"1.25rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.2rem" }}>MOT DE PASSE</p>
                <p style={{ fontFamily:S.sans, fontSize:"0.88rem", color:S.brown, letterSpacing:"0.25em" }}>••••••••••••</p>
              </div>
              {!editMdp && (
                <button onClick={() => { setMdpErr(""); setEditMdp(true); }}
                  style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.4rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                  <Edit3 size={11} strokeWidth={1.5} /> MODIFIER
                </button>
              )}
            </div>
            {editMdp && (
              <div style={{ marginTop:"1rem" }}>
                {[
                  { label:"MOT DE PASSE ACTUEL", val:mdpActuel, set:setMdpActuel },
                  { label:"NOUVEAU MOT DE PASSE (min. 8 caractères)", val:mdpNouv, set:setMdpNouv },
                  { label:"CONFIRMER LE NOUVEAU MOT DE PASSE", val:mdpConfirm, set:setMdpConfirm },
                ].map(f => (
                  <div key={f.label} style={{ position:"relative", marginBottom:"0.875rem" }}>
                    <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, display:"block", marginBottom:"0.35rem" }}>{f.label}</label>
                    <div style={{ position:"relative" }}>
                      <input type={showMdp ? "text" : "password"} value={f.val} onChange={e => f.set(e.target.value)}
                        style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.6rem 2.5rem 0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none", boxSizing:"border-box" }} />
                      <button onClick={() => setShowMdp(v => !v)} style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:S.muted, display:"flex" }}>
                        {showMdp ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>
                ))}
                {mdpErr && <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.red, marginBottom:"0.75rem" }}>⚠ {mdpErr}</p>}
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button onClick={savePwd} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.5rem 1.25rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.18em", cursor:"pointer" }}>SAUVEGARDER</button>
                  <button onClick={() => { setEditMdp(false); setMdpErr(""); setMdpActuel(""); setMdpNouv(""); setMdpConfirm(""); }}
                    style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.5rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", cursor:"pointer" }}>ANNULER</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — HISTORIQUE DES TRANSACTIONS
        ══════════════════════════════════════════════════════ */}
        <section style={{ marginBottom:"3rem" }}>
          <SectionHeader title="Historique des transactions" />

          <div style={{ marginBottom:"2px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.875rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700 }}>
                HISTORIQUE DES TRANSACTIONS VIA SPOTRUCK
              </p>
              <button onClick={exportCSV} style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.35rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                <Download size={11} strokeWidth={1.5} /> EXPORTER CSV
              </button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"0.9fr 1.8fr 1fr 0.8fr", gap:0, backgroundColor:S.brown, padding:"0.6rem 1rem" }}>
              {["DATE","ÉVÉNEMENT","MONTANT","STATUT"].map(h => (
                <p key={h} style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.15em", color:"rgba(255,255,255,0.65)", fontWeight:700 }}>{h}</p>
              ))}
            </div>
            {TRANSACTIONS.map((t, i) => (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"0.9fr 1.8fr 1fr 0.8fr", gap:0, backgroundColor: i%2===0 ? S.card : "rgba(44,26,16,0.03)", padding:"0.75rem 1rem", borderBottom:`1px solid ${S.border}`, alignItems:"center" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted }}>{t.date}</p>
                <p style={{ fontFamily:S.sans, fontSize:"0.7rem", color:S.brown, fontWeight:500, paddingRight:"0.5rem" }}>{t.evt}</p>
                <p style={{ fontFamily:S.sans, fontSize:"0.7rem", color:S.brown }}>{t.prestation > 0 ? `${t.prestation.toLocaleString("fr-FR")} €` : "—"}</p>
                <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", flexWrap:"wrap" }}>
                  <span style={{ fontFamily:S.sans, fontSize:"0.56rem", letterSpacing:"0.1em", fontWeight:700, color: t.statut === "PAYÉE" ? S.green : S.amber, backgroundColor: t.statut === "PAYÉE" ? "rgba(44,122,75,0.1)" : "rgba(184,133,10,0.1)", padding:"0.15rem 0.45rem" }}>
                    {t.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — MON ABONNEMENT
        ══════════════════════════════════════════════════════ */}
        <section style={{ marginBottom:"3rem" }}>
          <SectionHeader title="Mon abonnement" sub="Choisissez la formule adaptée à vos besoins" />

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"2px", marginBottom:"2rem" }}>
            {/* GRATUIT */}
            <div style={{ backgroundColor: plan === "gratuit" ? "rgba(196,98,45,0.08)" : S.card, border: plan === "gratuit" ? `2px solid ${S.terra}` : "none", padding:"1.5rem 1.25rem", position:"relative" }}>
              {plan === "gratuit" && (
                <div style={{ position:"absolute", top:"-1px", right:"-1px", backgroundColor:S.terra, color:"#fff", fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.15em", fontWeight:700, padding:"0.25rem 0.75rem" }}>
                  ACTUEL
                </div>
              )}
              <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>GRATUIT</p>
              <p style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, color:S.brown, lineHeight:1, marginBottom:"0.75rem" }}>0€</p>
              <p style={{ fontFamily:S.sans, fontSize:"0.68rem", fontWeight:300, color:S.muted, marginBottom:"1rem", minHeight:"2.5rem" }}>Pour démarrer</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem", marginBottom:"1rem" }}>
                {["Publication illimitée","Sélection basique","Contrat standard","1 utilisateur"].map(f => (
                  <div key={f} style={{ display:"flex", gap:"0.4rem", alignItems:"flex-start" }}>
                    <CheckCircle size={11} color={S.green} strokeWidth={2} style={{ flexShrink:0, marginTop:2 }} />
                    <span style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.brown }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRO EVENT */}
            <div style={{ backgroundColor: plan === "pro_event" ? "rgba(196,98,45,0.08)" : S.card, border: plan === "pro_event" ? `2px solid ${S.terra}` : "none", padding:"1.5rem 1.25rem", position:"relative" }}>
              {plan === "pro_event" && (
                <div style={{ position:"absolute", top:"-1px", right:"-1px", backgroundColor:S.terra, color:"#fff", fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.15em", fontWeight:700, padding:"0.25rem 0.75rem" }}>
                  ACTUEL
                </div>
              )}
              <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.terra, marginBottom:"0.5rem", fontWeight:700 }}>PRO EVENT</p>
              <div style={{ display:"flex", alignItems:"baseline", gap:"0.3rem", marginBottom:"0.4rem" }}>
                <p style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, color:S.brown, lineHeight:1 }}>19€</p>
                <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>/event</span>
              </div>
              <p style={{ fontFamily:S.sans, fontSize:"0.68rem", fontWeight:300, color:S.muted, marginBottom:"1rem", minHeight:"2.5rem" }}>Valable 1 événement</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem", marginBottom:"1rem" }}>
                {["Frais de service réduits","Contrat personnalisé","Support prioritaire","Badge confiance"].map(f => (
                  <div key={f} style={{ display:"flex", gap:"0.4rem", alignItems:"flex-start" }}>
                    <CheckCircle size={11} color={S.terra} strokeWidth={2} style={{ flexShrink:0, marginTop:2 }} />
                    <span style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.brown }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => changePlan("pro_event")} disabled={plan === "pro_event" || saving}
                style={{ width:"100%", backgroundColor: plan === "pro_event" ? "transparent" : S.terra, color: plan === "pro_event" ? S.terra : "#fff", border: plan === "pro_event" ? `1px solid ${S.terra}` : "none", padding:"0.6rem 0.875rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", cursor: plan === "pro_event" ? "default" : "pointer" }}>
                {plan === "pro_event" ? "PLAN ACTUEL" : "ACTIVER"}
              </button>
            </div>

            {/* PRO SEMESTRIEL */}
            <div style={{ backgroundColor: plan === "pro_semestriel" ? "rgba(196,98,45,0.08)" : S.card, border: plan === "pro_semestriel" ? `2px solid ${S.terra}` : "none", padding:"1.5rem 1.25rem", position:"relative" }}>
              {plan === "pro_semestriel" && (
                <div style={{ position:"absolute", top:"-1px", right:"-1px", backgroundColor:S.terra, color:"#fff", fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.15em", fontWeight:700, padding:"0.25rem 0.75rem" }}>
                  ACTUEL
                </div>
              )}
              <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.terra, marginBottom:"0.5rem", fontWeight:700 }}>PRO SEMESTRIEL</p>
              <div style={{ display:"flex", alignItems:"baseline", gap:"0.3rem", marginBottom:"0.4rem" }}>
                <p style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, color:S.brown, lineHeight:1 }}>79€</p>
                <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>/6 mois</span>
              </div>
              <p style={{ fontFamily:S.sans, fontSize:"0.68rem", fontWeight:300, color:S.muted, marginBottom:"1rem", minHeight:"2.5rem" }}>3-10 events/saison</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem", marginBottom:"1rem" }}>
                {["Frais de service réduits","Multi-utilisateurs","Analytics avancés","Badge permanent"].map(f => (
                  <div key={f} style={{ display:"flex", gap:"0.4rem", alignItems:"flex-start" }}>
                    <CheckCircle size={11} color={S.terra} strokeWidth={2} style={{ flexShrink:0, marginTop:2 }} />
                    <span style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.brown }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => changePlan("pro_semestriel")} disabled={plan === "pro_semestriel" || saving}
                style={{ width:"100%", backgroundColor: plan === "pro_semestriel" ? "transparent" : S.terra, color: plan === "pro_semestriel" ? S.terra : "#fff", border: plan === "pro_semestriel" ? `1px solid ${S.terra}` : "none", padding:"0.6rem 0.875rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", cursor: plan === "pro_semestriel" ? "default" : "pointer" }}>
                {plan === "pro_semestriel" ? "PLAN ACTUEL" : "PASSER EN PRO"}
              </button>
            </div>

            {/* PRO ANNUEL */}
            <div style={{ backgroundColor: plan === "pro_annuel" ? "rgba(196,98,45,0.08)" : S.card, border: plan === "pro_annuel" ? `2px solid ${S.gold}` : "none", padding:"1.5rem 1.25rem", position:"relative" }}>
              {plan === "pro_annuel" && (
                <div style={{ position:"absolute", top:"-1px", right:"-1px", backgroundColor:S.gold, color:"#fff", fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.15em", fontWeight:700, padding:"0.25rem 0.75rem" }}>
                  ★ ACTUEL
                </div>
              )}
              <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.gold, marginBottom:"0.5rem", fontWeight:700 }}>PRO ANNUEL</p>
              <div style={{ display:"flex", alignItems:"baseline", gap:"0.3rem", marginBottom:"0.4rem" }}>
                <p style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, color:S.brown, lineHeight:1 }}>129€</p>
                <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>/an</span>
              </div>
              <p style={{ fontFamily:S.sans, fontSize:"0.68rem", fontWeight:300, color:S.muted, marginBottom:"1rem", minHeight:"2.5rem" }}>Events illimités</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem", marginBottom:"1rem" }}>
                {["Frais de service réduits","Multi-utilisateurs","Analytics complets","Badge premium"].map(f => (
                  <div key={f} style={{ display:"flex", gap:"0.4rem", alignItems:"flex-start" }}>
                    <CheckCircle size={11} color={S.gold} strokeWidth={2} style={{ flexShrink:0, marginTop:2 }} />
                    <span style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.brown }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => changePlan("pro_annuel")} disabled={plan === "pro_annuel" || saving}
                style={{ width:"100%", backgroundColor: plan === "pro_annuel" ? "transparent" : S.gold, color: plan === "pro_annuel" ? S.gold : "#fff", border: plan === "pro_annuel" ? `1px solid ${S.gold}` : "none", padding:"0.6rem 0.875rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", cursor: plan === "pro_annuel" ? "default" : "pointer" }}>
                {plan === "pro_annuel" ? "★ PLAN ACTUEL" : "PASSER EN PRO"}
              </button>
            </div>
          </div>

          {/* CE QUE ÇA CHANGE CONCRÈTEMENT — Accordion */}
          <div style={{ marginTop:"2rem" }}>
            <div style={{ backgroundColor:S.brown, padding:"0.75rem 1.5rem", marginBottom:"2px" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:"rgba(255,255,255,0.6)", fontWeight:700 }}>CE QUE ÇA CHANGE CONCRÈTEMENT</p>
            </div>

            {[
              {
                titre:"Économie sur les frais de service",
                contenu:"Avec les plans Pro, vous passez de 13% à 10% de frais de service.\n\nExemple : Budget de 900€ pour une privatisation\n• Gratuit : 13% de frais = 117€ inclus dans les 900€\n• Pro Event : 10% de frais = 90€ inclus + 19€ d'abonnement = 109€ total\n• Pro Semestriel : 10% de frais = 90€ inclus + 79€/6 mois\n• Pro Annuel : 10% de frais = 90€ inclus + 129€/an\n\nÀ partir de 3 événements par semestre, Pro Semestriel devient rentable.\nÀ partir de 7 événements par an, Pro Annuel devient le plus avantageux.",
              },
              {
                titre:"Temps gagné",
                contenu:"Sans Pro :\n• Rédiger l'appel : 1h\n• Trier les candidatures email : 3h\n• Relances : 2h\n• Rédiger le contrat : 2h\nTotal : 8h/événement\n\nAvec Pro Event ou Pro Mensuel :\n• Publication : 5 min\n• Shortlist automatique : 0h\n• Messagerie centralisée : 30 min\n• Contrat en 1 clic : 5 min\nTotal : 40 min/événement\n\n→ 7h20 économisées par événement",
              },
              {
                titre:"Badge Organisateur de confiance",
                contenu:"Les trucks Premium voient en priorité les organisateurs Pro badgés.\n\n→ Vous recevez les candidatures des meilleurs trucks avant les autres organisateurs\n→ Vos événements sont pourvus plus rapidement\n→ Vous construisez votre réputation sur la plateforme",
              },
              {
                titre:"Multi-utilisateurs (Pro Event & Pro Mensuel)",
                contenu:"Votre assistante publie l'événement, votre responsable com sélectionne les trucks, vous signez le contrat.\n\n→ Tout le monde travaille sur le même compte\n→ Zéro confusion, zéro doublon\n→ Historique partagé de toutes les actions",
              },
            ].map((item, i) => {
              const isOpen = accordionOpen === i;
              return (
                <div key={i} style={{ marginBottom:"2px" }}>
                  <div onClick={() => setAccordionOpen(isOpen ? null : i)}
                    style={{ backgroundColor:S.card, padding:"1rem 1.5rem", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.7rem", fontWeight:600, color:S.brown }}>{item.titre}</p>
                    {isOpen ? <ChevronUp size={16} color={S.terra} strokeWidth={2} /> : <ChevronDown size={16} color={S.muted} strokeWidth={2} />}
                  </div>
                  {isOpen && (
                    <div style={{ backgroundColor:"rgba(44,26,16,0.02)", padding:"1.25rem 1.5rem", borderLeft:`3px solid ${S.terra}` }}>
                      <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, lineHeight:1.8, whiteSpace:"pre-line" }}>{item.contenu}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SECTION 4 — NOTIFICATIONS
        ══════════════════════════════════════════════════════ */}
        <section style={{ marginBottom:"3rem" }}>
          <SectionHeader title="Notifications" sub="Sauvegardé automatiquement" />
          <div style={{ backgroundColor:S.card, padding:"0 1.5rem" }}>
            <Toggle on={notifs.nouvelleCand}    onChange={() => toggleNotif("nouvelleCand")}    label="Nouvelle candidature reçue" />
            <Toggle on={notifs.candidatureRetiree} onChange={() => toggleNotif("candidatureRetiree")} label="Candidature retirée par un truck" />
            <Toggle on={notifs.messageRecu}     onChange={() => toggleNotif("messageRecu")}     label="Nouveau message d'un truck retenu" />
            <Toggle on={notifs.rappelJ7}        onChange={() => toggleNotif("rappelJ7")}        label="Rappel événement J-7" sub="Rappel automatique 7 jours avant chaque événement" />
            <Toggle on={notifs.confirmPaiement} onChange={() => toggleNotif("confirmPaiement")} label="Confirmation de paiement" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SECTION 5 — MODÈLES DE MESSAGES
        ══════════════════════════════════════════════════════ */}
        <section style={{ marginBottom:"3rem" }}>
          <SectionHeader title="Mes modèles de messages" sub="Pré-chargés automatiquement lors de chaque acceptation ou refus" />

          {[
            { label:"MESSAGE D'ACCEPTATION PAR DÉFAUT", value:msgAccept, onChange:setMsgAccept, defaut:DEFAUT_ACCEPT, color:S.green },
            { label:"MESSAGE DE REFUS PAR DÉFAUT",       value:msgRefus,  onChange:setMsgRefus,  defaut:DEFAUT_REFUS,  color:S.border },
          ].map(f => (
            <div key={f.label} style={{ marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.6rem" }}>
                <label style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.18em", color: f.color === S.green ? S.green : S.muted, fontWeight:700 }}>{f.label}</label>
                <button onClick={() => f.onChange(f.defaut)}
                  style={{ background:"none", border:`1px solid ${S.border}`, padding:"0.3rem 0.65rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.12em", color:S.muted, cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                  <RotateCcw size={10} strokeWidth={2} /> RÉINITIALISER
                </button>
              </div>
              <textarea value={f.value} onChange={e => f.onChange(e.target.value)} rows={13}
                style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.875rem 1rem", fontFamily:S.sans, fontSize:"0.78rem", color:S.brown, outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box", borderLeft:`3px solid ${f.color}` }} />
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={saveModeles} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.75rem 2rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer" }}>
              SAUVEGARDER LES MODÈLES
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SECTION 6 — ZONE DANGER
        ══════════════════════════════════════════════════════ */}
        <section>
          <div style={{ marginBottom:"1.5rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.red}` }}>
            <h2 style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:700, color:S.red }}>Zone de danger</h2>
          </div>
          <div style={{ border:`1px solid ${S.red}`, padding:"1.75rem", backgroundColor:"rgba(192,57,43,0.03)" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1rem", marginBottom:"1.5rem" }}>
              <AlertTriangle size={22} strokeWidth={1.5} color={S.red} style={{ flexShrink:0, marginTop:2 }} />
              <div>
                <p style={{ fontFamily:S.sans, fontSize:"0.85rem", fontWeight:600, color:S.red, marginBottom:"0.4rem" }}>Supprimer mon compte</p>
                <p style={{ fontFamily:S.sans, fontSize:"0.75rem", fontWeight:300, color:S.muted, lineHeight:1.6 }}>
                  Cette action est <strong>irréversible</strong>. Tous vos événements, candidatures, favoris, messages et historique seront définitivement supprimés.
                </p>
              </div>
            </div>

            {!showDanger ? (
              <button onClick={() => setShowDanger(true)} style={{ backgroundColor:"transparent", color:S.red, border:`1px solid ${S.red}`, padding:"0.65rem 1.5rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", cursor:"pointer" }}>
                SUPPRIMER MON COMPTE
              </button>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem", maxWidth:480 }}>
                <div>
                  <label style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.red, display:"block", marginBottom:"0.4rem" }}>
                    Tapez <strong>SUPPRIMER</strong> pour confirmer la suppression définitive
                  </label>
                  <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                    <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                      placeholder="SUPPRIMER"
                      style={{ flex:1, border:`1px solid ${S.red}`, backgroundColor:"transparent", padding:"0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none" }} />
                    <button onClick={() => { setShowDanger(false); setDeleteInput(""); }} style={{ background:"none", border:"none", cursor:"pointer", color:S.muted }}>
                      <X size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"0.75rem" }}>
                  <button onClick={supprimerCompte}
                    disabled={deleteInput !== "SUPPRIMER"}
                    style={{ backgroundColor: deleteInput === "SUPPRIMER" ? S.red : S.border, color:"#fff", border:"none", padding:"0.75rem 1.5rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", cursor: deleteInput === "SUPPRIMER" ? "pointer" : "not-allowed" }}>
                    OUI, SUPPRIMER DÉFINITIVEMENT
                  </button>
                  <button onClick={() => { setShowDanger(false); setDeleteInput(""); }} style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.75rem 1.25rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", cursor:"pointer" }}>
                    ANNULER
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"2rem", left:"50%", transform:"translateX(-50%)", backgroundColor: toast.color ?? S.green, color:"#fff", zIndex:5000, display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.875rem 1.75rem", boxShadow:"0 8px 24px rgba(0,0,0,0.2)", fontFamily:S.sans, fontSize:"0.78rem", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
          <CheckCircle size={16} strokeWidth={2} /> {toast.msg}
        </div>
      )}
    </main>
  );
}

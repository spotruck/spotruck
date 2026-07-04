"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronRight, ChevronLeft, CheckCircle, Zap, Plus, Minus,
  Upload, FileText, X, AlertTriangle, Eye,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B", red:    "#C0392B", amber:  "#B8850A",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Composants utilitaires ───────────────────────────────────
function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom:"1.5rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}` }}>
      <h2 style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:700 }}>{title}</h2>
      {sub && <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.2rem" }}>{sub}</p>}
    </div>
  );
}

function SubLabel({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color: error ? S.red : S.muted, display:"block", marginBottom:"0.45rem" }}>
      {children}
    </label>
  );
}

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.red, marginTop:"0.25rem" }}>⚠ {msg}</p>;
}

function Field({ label, value, onChange, type = "text", placeholder, full, error, rows }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; full?: boolean; error?: string; rows?: number;
}) {
  const border = `1px solid ${error ? S.red : S.border}`;
  const inputStyle: React.CSSProperties = { width:"100%", border, backgroundColor:"transparent", padding:"0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none", boxSizing:"border-box" };
  return (
    <div style={{ gridColumn: full ? "1/-1" : undefined }}>
      <SubLabel error={!!error}>{label}</SubLabel>
      {type === "textarea"
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? ""} rows={rows ?? 3} style={{ ...inputStyle, resize:"vertical" }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? ""} style={inputStyle} />
      }
      <ErrMsg msg={error} />
    </div>
  );
}

function Radio({ label, checked, onChange, sub }: { label: string; checked: boolean; onChange: () => void; sub?: string }) {
  return (
    <div onClick={onChange} style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", cursor:"pointer", padding:"0.75rem", backgroundColor: checked ? "rgba(196,98,45,0.06)" : "transparent", border:`1px solid ${checked ? S.terra : S.border}`, marginBottom:"0.5rem" }}>
      <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${checked ? S.terra : S.border}`, backgroundColor: checked ? S.terra : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
        {checked && <div style={{ width:7, height:7, borderRadius:"50%", backgroundColor:"#fff" }} />}
      </div>
      <div>
        <span style={{ fontFamily:S.sans, fontSize:"0.8rem", color:S.brown, fontWeight: checked ? 600 : 400 }}>{label}</span>
        {sub && <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted, marginTop:"0.15rem" }}>{sub}</p>}
      </div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
      <div onClick={onChange} style={{ width:40, height:22, borderRadius:11, backgroundColor: on ? S.terra : S.border, position:"relative", cursor:"pointer", transition:"background-color 0.2s", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, left: on ? 21 : 3, width:16, height:16, borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s" }} />
      </div>
      <span style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.brown }}>{label}</span>
    </div>
  );
}

function CheckItem({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: () => void; color?: string }) {
  return (
    <div onClick={onChange} style={{ display:"flex", alignItems:"center", gap:"0.6rem", cursor:"pointer", padding:"0.4rem 0" }}>
      <div style={{ width:18, height:18, border:`2px solid ${checked ? (color ?? S.terra) : S.border}`, backgroundColor: checked ? (color ?? S.terra) : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {checked && <CheckCircle size={12} color="#fff" strokeWidth={2.5} />}
      </div>
      <span style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.brown }}>{label}</span>
    </div>
  );
}

// ─── Constantes ───────────────────────────────────────────────
const TYPES_EVT = ["Festival", "Mariage", "Fête de quartier", "Salon", "Marché", "Séminaire", "Autre"];
const TRANCHES_AGE = [
  "Enfants (0-12 ans)", "Adolescents (13-17 ans)", "Jeunes adultes (18-25 ans)",
  "Adultes (26-39 ans)", "Adultes (40-59 ans)", "Seniors (60 ans et +)", "Tout public (toutes tranches)",
];
const DOCS = ["KBIS", "HACCP", "RC Pro", "Conformité gaz", "Conformité électrique", "Contrôle hygiène"];
const MODELE_FIN = [
  { key:"droit",        label:"Droit de place",               sub:"Le truck vous paie un montant fixe pour participer" },
  { key:"privatisation",label:"Privatisation",                sub:"Vous rémunérez le truck pour sa prestation" },
  { key:"mixte",        label:"Droit de place + % du CA",     sub:"Montant fixe + pourcentage sur les ventes" },
  { key:"pct_ca",       label:"Uniquement % du CA",           sub:"Le montant dépendra du chiffre d'affaires réalisé" },
];
const CAND_MODES = ["Via Spotruck (formulaire intégré)", "Par email", "Via lien externe"];

// ─── Mapping vers le schéma Supabase ──────────────────────────
const MODELE_FIN_DB: Record<string, "droit_de_place" | "privatisation" | "mixte" | "pourcentage_ca"> = {
  droit: "droit_de_place",
  privatisation: "privatisation",
  mixte: "mixte",
  pct_ca: "pourcentage_ca",
};
const MODE_CAND_DB: Record<string, "spotruck" | "email" | "lien_externe"> = {
  [CAND_MODES[0]]: "spotruck",
  "Par email": "email",
  "Via lien externe": "lien_externe",
};

// ─── Paliers annulation par défaut ────────────────────────────
const DEFAULT_PALIERS = [
  { delai:"> 15 jours", remboursement:100 },
  { delai:"7 à 15 jours", remboursement:50 },
  { delai:"< 7 jours", remboursement:0 },
];

// ─── Obligations par défaut ───────────────────────────────────
const OBL_FT_DEFAULT = [
  { label:"Arriver avant l'ouverture", checked:true, heures:"2" },
  { label:"Respecter les normes d'hygiène en vigueur", checked:true, heures:"" },
  { label:"Assurer la propreté de son emplacement", checked:true, heures:"" },
  { label:"Rester jusqu'à la fin de l'événement", checked:true, heures:"" },
  { label:"Porter une tenue aux couleurs de l'événement", checked:false, heures:"" },
];
const OBL_ORG_DEFAULT = [
  { label:"Fournir l'emplacement convenu", checked:true },
  { label:"Assurer l'accès électrique (si applicable)", checked:true },
  { label:"Informer le truck des règles du site", checked:true },
  { label:"Payer dans les délais convenus", checked:true },
];

interface Props {
  organisateurId: string;
  organisateurNom: string;
}

// ─── Page principale ──────────────────────────────────────────
export default function EvenementClient({ organisateurId, organisateurNom }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step,  setStep]  = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [proEventActive, setProEventActive] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // ── Étape 1 ──────────────────────────────────────────────
  const [titre,       setTitre]       = useState("");
  const [typeEvt,     setTypeEvt]     = useState("");
  const [description, setDescription] = useState("");
  const [dateDebut,   setDateDebut]   = useState("");
  const [dateFin,     setDateFin]     = useState("");
  const [heureDebut,  setHeureDebut]  = useState("");
  const [heureFin,    setHeureFin]    = useState("");
  const [lieu,        setLieu]        = useState("");
  const [visiteurs,   setVisiteurs]   = useState("");

  // ── Étape 2 ──────────────────────────────────────────────
  const [nbTrucksCount, setNbTrucksCount] = useState(2);
  const [truckDetails,  setTruckDetails]  = useState<string[]>(["", ""]);
  const [tranches,      setTranches]      = useState<string[]>([]);
  const [recherche,     setRecherche]     = useState("");

  // Modèle financier
  const [modele,          setModele]          = useState("droit");
  // Droit de place
  const [droitMontant,    setDroitMontant]    = useState("");
  const [droitViaSpotruck,setDroitViaSpotruck]= useState(false);
  // Privatisation
  const [privatType,   setPrivatType]   = useState<"fixe"|"fourchette">("fixe");
  const [privatFixe,   setPrivatFixe]   = useState("");
  const [privatMin,    setPrivatMin]    = useState("");
  const [privatMax,    setPrivatMax]    = useState("");
  // Mixte
  const [mixteDroit,   setMixteDroit]   = useState("");
  const [mixtePct,     setMixtePct]     = useState(10);
  // % CA uniquement
  const [pctCaSeul,    setPctCaSeul]    = useState(10);

  // Logistique
  const [elec,      setElec]      = useState(false);
  const [typeElec,  setTypeElec]  = useState("Monophasé");
  const [amperage,  setAmperage]  = useState("");
  const [surface,   setSurface]   = useState("");
  const [acces,     setAcces]     = useState(true);

  // ── Étape 3 ──────────────────────────────────────────────
  const [docs,         setDocs]         = useState<string[]>([]);
  const [noteMin,      setNoteMin]      = useState(3);
  const [exclu,        setExclu]        = useState(false);
  const [excluType,    setExcluType]    = useState("");
  const [dateLimite,   setDateLimite]   = useState("");
  const [instructions, setInstructions] = useState("");
  const [modesCand,    setModesCand]    = useState(CAND_MODES[0]);
  const [emailCand,    setEmailCand]    = useState("");
  const [urlCand,      setUrlCand]      = useState("");

  // Contrat
  const [contratMode,   setContratMode]   = useState<"upload"|"spotruck"|"aucun"|"">("");
  const [contratFile,   setContratFile]   = useState<{name:string;size:string}|null>(null);
  const [showContratBuilder, setShowContratBuilder] = useState(false);
  const [showContratPreview, setShowContratPreview] = useState(false);
  const [contratValidated,   setContratValidated]   = useState(false);
  // Champs contrat Spotruck
  const [siretOrga,     setSiretOrga]     = useState("");
  const [adresseOrga,   setAdresseOrga]   = useState("");
  const [precisions,    setPrecisions]    = useState("");
  const [acompte,       setAcompte]       = useState(30);
  const [soldeDate,     setSoldeDate]     = useState("");
  const [oblFt,         setOblFt]         = useState(OBL_FT_DEFAULT.map(o => ({ ...o })));
  const [oblOrg,        setOblOrg]        = useState(OBL_ORG_DEFAULT.map(o => ({ ...o })));
  const [autreOblFt,    setAutreOblFt]    = useState("");
  const [autreOblOrg,   setAutreOblOrg]   = useState("");
  const [paliers,       setPaliers]       = useState(DEFAULT_PALIERS.map(p => ({ ...p })));

  // ── Helpers ───────────────────────────────────────────────
  const toggleDoc = (d: string) => setDocs(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const updateTruckCount = (n: number) => {
    const clamped = Math.max(1, n);
    setNbTrucksCount(clamped);
    setTruckDetails(prev => {
      if (clamped > prev.length) return [...prev, ...Array(clamped - prev.length).fill("")];
      return prev.slice(0, clamped);
    });
  };

  const setTruckDetail = (i: number, val: string) =>
    setTruckDetails(prev => prev.map((d, j) => j === i ? val : d));

  const toggleTranche = (t: string) => {
    if (t === "Tout public (toutes tranches)") {
      setTranches(prev => prev.includes(t) ? [] : [t]);
    } else {
      setTranches(prev => {
        const without = prev.filter(x => x !== "Tout public (toutes tranches)");
        return without.includes(t) ? without.filter(x => x !== t) : [...without, t];
      });
    }
  };

  const goTo = (n: number) => { setStep(n); window.scrollTo({ top:0, behavior:"smooth" }); };

  // Calcul total droit de place
  const droitTotal = droitMontant ? nbTrucksCount * parseFloat(droitMontant) : 0;

  // Résumé modèle financier
  const modeleResume = () => {
    if (modele === "droit") {
      if (!droitMontant) return "Droit de place";
      const suffix = droitViaSpotruck ? " · 🛡️ via Spotruck" : " · ⚠️ Paiement direct";
      return `${droitMontant}€/truck · Total : ${droitTotal}€${suffix}`;
    }
    if (modele === "privatisation") {
      if (privatType === "fixe" && privatFixe) return `Privatisation ${privatFixe}€/truck`;
      if (privatType === "fourchette" && privatMin && privatMax) return `Privatisation ${privatMin}€ – ${privatMax}€/truck`;
      return "Privatisation";
    }
    if (modele === "mixte") return mixteDroit ? `${mixteDroit}€ droit + ${mixtePct}% CA HT` : "Mixte";
    if (modele === "pct_ca") return `${pctCaSeul}% du CA HT uniquement`;
    return "";
  };

  // Résumé contrat
  const contratResume = () => {
    if (contratMode === "upload" && contratFile) return contratFile.name;
    if (contratMode === "spotruck" && contratValidated) return "Contrat Spotruck généré";
    if (contratMode === "aucun") return "⚠️ Aucun contrat";
    return "Non défini";
  };

  // ── Construction du payload Supabase ─────────────────────
  const buildPayload = useCallback((statut: "publie" | "brouillon") => {
    const budgetTruck = modele === "droit" ? (parseFloat(droitMontant) || null)
      : modele === "privatisation" ? (privatType === "fixe" ? (parseFloat(privatFixe) || null) : (parseFloat(privatMin) || null))
      : modele === "mixte" ? (parseFloat(mixteDroit) || null)
      : null;
    const droitDePlace = modele === "droit" ? (parseFloat(droitMontant) || null)
      : modele === "mixte" ? (parseFloat(mixteDroit) || null)
      : null;
    const pourcentageCa = modele === "mixte" ? mixtePct : modele === "pct_ca" ? pctCaSeul : null;

    return {
      organisateur_id: organisateurId,
      titre: titre || "Événement sans titre",
      type: typeEvt || "Autre",
      description: description || null,
      date_debut: dateDebut,
      date_fin: dateFin || null,
      heure_debut: heureDebut || null,
      heure_fin: heureFin || null,
      lieu: lieu || "Lieu à préciser",
      visiteurs_attendus: visiteurs ? parseInt(visiteurs, 10) : null,
      nombre_trucks: nbTrucksCount,
      modele_financier: MODELE_FIN_DB[modele] ?? null,
      budget_truck: budgetTruck,
      droit_de_place: droitDePlace,
      pourcentage_ca: pourcentageCa,
      electricite_disponible: elec,
      type_prise: elec ? typeElec : null,
      amperage: elec && amperage ? parseInt(amperage, 10) : null,
      surface_disponible: surface ? parseFloat(surface) : null,
      acces_vehicule: acces,
      documents_requis: docs.length > 0 ? docs : null,
      note_minimum: noteMin,
      exclusivite_cuisine: exclu,
      instructions_candidature: instructions || null,
      mode_candidature: MODE_CAND_DB[modesCand] ?? "spotruck",
      contact_candidature: modesCand === "Par email" ? emailCand : modesCand === "Via lien externe" ? urlCand : null,
      date_limite_candidature: dateLimite || null,
      statut,
    };
  }, [organisateurId, titre, typeEvt, description, dateDebut, dateFin, heureDebut, heureFin, lieu,
      visiteurs, nbTrucksCount, modele, droitMontant, privatType, privatFixe, privatMin, mixteDroit,
      mixtePct, pctCaSeul, elec, typeElec, amperage, surface, acces, docs, noteMin, exclu,
      instructions, modesCand, emailCand, urlCand, dateLimite]);

  // ── Publier ───────────────────────────────────────────────
  const publier = useCallback(async () => {
    if (!titre.trim() || !typeEvt || !dateDebut || !lieu.trim()) {
      setPublishError("Merci de compléter le titre, le type, la date et le lieu de l'événement.");
      goTo(1);
      return;
    }
    setPublishing(true);
    setPublishError(null);
    const supabase = createClient();
    const { error } = await supabase.from("evenements").insert(buildPayload("publie"));
    setPublishing(false);
    if (error) {
      setPublishError(error.message || "Une erreur est survenue lors de la publication.");
      return;
    }
    setToast("Événement publié ! Les trucks peuvent maintenant postuler.");
    setTimeout(() => router.push("/dashboard/organisateur/candidatures"), 1800);
  }, [titre, typeEvt, dateDebut, lieu, buildPayload, router]);

  const sauvegarder = useCallback(async () => {
    if (!titre.trim() || !typeEvt || !dateDebut || !lieu.trim()) {
      saveLS("spotruck_org_brouillon", { titre, typeEvt, description, dateDebut, lieu, statut:"BROUILLON" });
      setToast("Brouillon sauvegardé localement — complétez titre, type, date et lieu pour l'enregistrer en ligne.");
      setTimeout(() => setToast(null), 3500);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("evenements").insert(buildPayload("brouillon"));
    if (error) {
      setToast("Impossible de sauvegarder le brouillon en ligne — sauvegardé localement.");
      saveLS("spotruck_org_brouillon", { titre, typeEvt, description, dateDebut, lieu, statut:"BROUILLON" });
    } else {
      setToast("Brouillon sauvegardé.");
    }
    setTimeout(() => setToast(null), 2500);
  }, [titre, typeEvt, description, dateDebut, lieu, buildPayload]);

  // ── Validation étape 1 ────────────────────────────────────
  const validerEtape1 = () => {
    const errs: Record<string, string> = {};
    if (!titre.trim())   errs.titre     = "Le titre est obligatoire";
    if (!typeEvt)        errs.typeEvt   = "Sélectionnez un type d'événement";
    if (!dateDebut)      errs.dateDebut = "La date de début est obligatoire";
    if (!heureDebut)     errs.heureDebut= "L'heure de début est obligatoire";
    if (!lieu.trim())    errs.lieu      = "L'adresse est obligatoire";
    setErrors(errs);
    if (Object.keys(errs).length === 0) goTo(2);
  };

  // ─── Barre de progression ─────────────────────────────────
  const stepLabels = ["L'événement", "Le besoin", "Critères & contrat"];

  const ProgressBar = () => (
    <div style={{ display:"flex", alignItems:"center", marginBottom:"3rem" }}>
      {stepLabels.map((l, i) => {
        const n = i + 1;
        const done   = step > n;
        const active = step === n;
        return (
          <div key={l} style={{ display:"flex", alignItems:"center", flex: i < stepLabels.length - 1 ? 1 : undefined }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", backgroundColor: done ? S.green : active ? S.terra : S.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {done
                  ? <CheckCircle size={14} color="#fff" strokeWidth={2.5} />
                  : <span style={{ fontFamily:S.sans, fontSize:"0.7rem", fontWeight:700, color: active ? "#fff" : S.muted }}>{n}</span>
                }
              </div>
              <span style={{ fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.15em", color: active ? S.brown : S.muted, fontWeight: active ? 600 : 400, whiteSpace:"nowrap" }}>
                {l.toUpperCase()}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div style={{ flex:1, height:1, backgroundColor: step > n ? S.green : S.border, margin:"0 1rem" }} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Boutons nav ─────────────────────────────────────────
  const BtnRetour = ({ to }: { to: number }) => (
    <button onClick={() => goTo(to)} style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem 1.5rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.5rem" }}>
      <ChevronLeft size={14} strokeWidth={2} /> RETOUR
    </button>
  );
  const BtnContinuer = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.875rem 2rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.5rem" }}>
      CONTINUER <ChevronRight size={14} strokeWidth={2} />
    </button>
  );

  return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <OrganisateurSidebar active="/dashboard/organisateur/evenement" />

      <div style={{ padding:"3rem", maxWidth:920, minWidth:0 }}>

        <div style={{ marginBottom:"2rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>DASHBOARD — ORGANISATEUR</p>
          <h1 style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, lineHeight:1.1 }}>Publier un événement</h1>
        </div>

        <ProgressBar />

        {/* ══════════════════════════════════════════════════════
            ÉTAPE 1 — L'ÉVÉNEMENT
        ══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <SectionTitle title="L'événement" sub="Décrivez votre événement pour attirer les bons trucks" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>

              <Field label="TITRE DE L'ÉVÉNEMENT *" value={titre}
                onChange={v => { setTitre(v); if (v.trim()) setErrors(e => ({ ...e, titre:"" })); }}
                placeholder="Ex: Festival Solstice 2026" full error={errors.titre} />

              <div style={{ gridColumn:"1/-1" }}>
                <SubLabel error={!!errors.typeEvt}>TYPE D'ÉVÉNEMENT *</SubLabel>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
                  {TYPES_EVT.map(t => (
                    <button key={t} onClick={() => { setTypeEvt(t); setErrors(e => ({ ...e, typeEvt:"" })); }}
                      style={{ padding:"0.4rem 0.85rem", fontFamily:S.sans, fontSize:"0.68rem", backgroundColor: typeEvt === t ? S.terra : "transparent", color: typeEvt === t ? "#fff" : S.muted, border:`1px solid ${typeEvt === t ? S.terra : errors.typeEvt ? S.red : S.border}`, cursor:"pointer" }}>
                      {t}
                    </button>
                  ))}
                </div>
                <ErrMsg msg={errors.typeEvt} />
              </div>

              <Field label="AMBIANCE ET PUBLIC" value={description} onChange={setDescription}
                type="textarea" placeholder="Décrivez l'ambiance, le public attendu, le cadre..." full />

              <Field label="DATE DE DÉBUT *" value={dateDebut} type="date" error={errors.dateDebut}
                onChange={v => { setDateDebut(v); if (v) setErrors(e => ({ ...e, dateDebut:"" })); }} />
              <Field label="DATE DE FIN" value={dateFin} type="date" onChange={setDateFin} />

              <Field label="HEURE DE DÉBUT *" value={heureDebut} type="time" error={errors.heureDebut}
                onChange={v => { setHeureDebut(v); if (v) setErrors(e => ({ ...e, heureDebut:"" })); }} />
              <Field label="HEURE DE FIN" value={heureFin} type="time" onChange={setHeureFin} />

              <Field label="ADRESSE COMPLÈTE *" value={lieu} error={errors.lieu}
                onChange={v => { setLieu(v); if (v.trim()) setErrors(e => ({ ...e, lieu:"" })); }}
                placeholder="Rue, code postal, ville" full />
              <Field label="VISITEURS ATTENDUS" value={visiteurs} type="number" placeholder="500" onChange={setVisiteurs} />
            </div>

            {Object.values(errors).some(Boolean) && (
              <div style={{ marginTop:"1.5rem", backgroundColor:"rgba(192,57,43,0.06)", border:`1px solid rgba(192,57,43,0.3)`, padding:"0.875rem 1.25rem" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.red, fontWeight:600 }}>
                  Veuillez remplir les champs obligatoires (*) avant de continuer.
                </p>
              </div>
            )}

            <div style={{ marginTop:"2rem", display:"flex", justifyContent:"flex-end" }}>
              <BtnContinuer onClick={validerEtape1} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            ÉTAPE 2 — LE BESOIN
        ══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <SectionTitle title="Le besoin" sub="Précisez ce dont vous avez besoin pour que les trucks puissent postuler" />

            <div style={{ display:"flex", flexDirection:"column", gap:"2rem" }}>

              {/* ── Compteur de trucks + détails par truck ── */}
              <div>
                <SubLabel>NOMBRE DE TRUCKS SOUHAITÉS</SubLabel>
                <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", marginBottom:"1.5rem" }}>
                  <button onClick={() => updateTruckCount(nbTrucksCount - 1)}
                    style={{ width:40, height:40, border:`1px solid ${S.border}`, backgroundColor:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:S.brown }}>
                    <Minus size={16} strokeWidth={2} />
                  </button>
                  <div style={{ textAlign:"center", minWidth:80 }}>
                    <p style={{ fontFamily:S.serif, fontSize:"2.4rem", fontWeight:800, color:S.terra, lineHeight:1 }}>{nbTrucksCount}</p>
                    <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, letterSpacing:"0.1em" }}>truck{nbTrucksCount > 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={() => updateTruckCount(nbTrucksCount + 1)}
                    style={{ width:40, height:40, border:`1px solid ${S.border}`, backgroundColor:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:S.brown }}>
                    <Plus size={16} strokeWidth={2} />
                  </button>
                </div>

                {/* Lignes dynamiques par truck */}
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  {truckDetails.map((detail, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, minWidth:18, textAlign:"right", flexShrink:0 }}>{i + 1}.</span>
                      <input
                        value={detail}
                        onChange={e => setTruckDetail(i, e.target.value)}
                        placeholder="Ex: Burgers, Tacos, Végétarien..."
                        style={{ flex:1, border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.5rem 0.75rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none" }}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted, marginTop:"0.5rem" }}>
                  Ces champs sont optionnels — précisez le type de cuisine souhaité pour chaque truck
                </p>
              </div>

              {/* ── Tranches d'âge ─────────────────────────── */}
              <div>
                <SubLabel>TRANCHE D'ÂGE DU PUBLIC <span style={{ color:S.muted, fontWeight:300 }}>(plusieurs choix possibles)</span></SubLabel>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.1rem" }}>
                  {TRANCHES_AGE.map(t => (
                    <CheckItem key={t} label={t} checked={tranches.includes(t)} onChange={() => toggleTranche(t)}
                      color={t === "Tout public (toutes tranches)" ? S.brown : S.terra} />
                  ))}
                </div>
                {tranches.length === 0 && (
                  <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, marginTop:"0.4rem" }}>
                    Aucune sélection = toutes tranches acceptées
                  </p>
                )}
              </div>

              {/* ── Ce que je recherche ────────────────────── */}
              <Field label="CE QUE JE RECHERCHE" value={recherche} onChange={setRecherche}
                type="textarea" rows={3} placeholder="Décrivez librement : type de cuisine, ambiance, contraintes particulières..." />

              {/* ── Modèle financier ───────────────────────── */}
              <div>
                <SubLabel>MODÈLE FINANCIER</SubLabel>
                {MODELE_FIN.map(m => (
                  <Radio key={m.key} label={m.label} sub={m.sub} checked={modele === m.key} onChange={() => setModele(m.key)} />
                ))}

                {/* Droit de place */}
                {modele === "droit" && (() => {
                  const montant    = parseFloat(droitMontant) || 0;
                  const frais5pct  = droitViaSpotruck ? Math.round(montant * 0.05 * 100) / 100 : 0;
                  const recu       = montant - frais5pct;
                  const totalBrut  = droitTotal;
                  const totalFreis = droitViaSpotruck ? Math.round(totalBrut * 0.05 * 100) / 100 : 0;
                  return (
                    <div style={{ marginTop:"1rem", padding:"1.25rem", backgroundColor:S.card, borderLeft:`3px solid ${S.terra}` }}>
                      <Field label="MONTANT DU DROIT DE PLACE PAR TRUCK (€)"
                        value={droitMontant} onChange={setDroitMontant} type="number" placeholder="800" />

                      {/* Total si plusieurs trucks */}
                      {droitMontant && nbTrucksCount > 1 && (
                        <div style={{ marginTop:"0.5rem", backgroundColor:"rgba(196,98,45,0.08)", padding:"0.6rem 1rem" }}>
                          <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.terra }}>
                            <strong>{nbTrucksCount} trucks × {droitMontant}€</strong> = <strong>{totalBrut.toLocaleString("fr-FR")}€ au total</strong>
                          </p>
                        </div>
                      )}

                      {/* Toggle paiement via Spotruck */}
                      <div style={{ marginTop:"1.25rem", paddingTop:"1.25rem", borderTop:`1px solid ${S.border}` }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: droitViaSpotruck ? "1rem" : 0 }}>
                          <div>
                            <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:600, color:S.brown }}>GÉRER LE PAIEMENT VIA SPOTRUCK</p>
                            <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, marginTop:"0.15rem" }}>
                              {droitViaSpotruck ? "Paiement sécurisé, acompte séquestré, garantie incluse" : "Paiement direct entre les parties, sans garantie Spotruck"}
                            </p>
                          </div>
                          <div onClick={() => setDroitViaSpotruck(v => !v)}
                            style={{ width:40, height:22, borderRadius:11, backgroundColor: droitViaSpotruck ? S.green : S.border, position:"relative", cursor:"pointer", transition:"background-color 0.2s", flexShrink:0, marginLeft:"1rem" }}>
                            <div style={{ position:"absolute", top:3, left: droitViaSpotruck ? 21 : 3, width:16, height:16, borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s" }} />
                          </div>
                        </div>

                        {/* Avantages si activé */}
                        {droitViaSpotruck && (
                          <div style={{ backgroundColor:"rgba(44,122,75,0.06)", border:`1px solid rgba(44,122,75,0.2)`, padding:"1rem 1.25rem" }}>
                            <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem", marginBottom:"1rem" }}>
                              {[
                                "Paiement sécurisé garanti",
                                "Acompte séquestré jusqu'à l'événement",
                                "Garantie annulation incluse",
                                `Frais Spotruck : 5% du droit de place`,
                              ].map(a => (
                                <div key={a} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                                  <span style={{ color:S.green, fontSize:"0.8rem" }}>✅</span>
                                  <span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.brown }}>{a}</span>
                                </div>
                              ))}
                            </div>

                            {/* Calcul auto */}
                            {droitMontant && montant > 0 && (
                              <div style={{ backgroundColor:"rgba(44,122,75,0.08)", padding:"0.75rem 1rem", borderLeft:`3px solid ${S.green}` }}>
                                <p style={{ fontFamily:S.sans, fontSize:"0.7rem", color:S.green, fontWeight:700, marginBottom:"0.4rem" }}>CALCUL PAR TRUCK</p>
                                <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
                                  <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.brown }}>
                                    Droit de place : <strong>{montant} €</strong>
                                  </p>
                                  <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.green }}>
                                    ↳ Vous recevez : <strong>{recu.toLocaleString("fr-FR")} €</strong>
                                  </p>
                                  <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted }}>
                                    Frais Spotruck : {frais5pct.toLocaleString("fr-FR")} €
                                  </p>
                                  {nbTrucksCount > 1 && (
                                    <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted, marginTop:"0.25rem", paddingTop:"0.25rem", borderTop:`1px solid ${S.border}` }}>
                                      {nbTrucksCount} trucks → Vous recevez au total : <strong style={{ color:S.green }}>{(recu * nbTrucksCount).toLocaleString("fr-FR")} €</strong> · Frais : {totalFreis.toLocaleString("fr-FR")} €
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Avertissement si désactivé */}
                        {!droitViaSpotruck && (
                          <div style={{ backgroundColor:"rgba(184,133,10,0.07)", border:`1px solid rgba(184,133,10,0.25)`, padding:"0.65rem 0.875rem", display:"flex", alignItems:"flex-start", gap:"0.5rem" }}>
                            <span style={{ color:S.amber, fontSize:"0.8rem", flexShrink:0 }}>⚠️</span>
                            <p style={{ fontFamily:S.sans, fontSize:"0.7rem", color:S.amber, lineHeight:1.5 }}>
                              Paiement hors Spotruck — aucune garantie en cas d'annulation. Activez le paiement Spotruck pour sécuriser la transaction.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Privatisation */}
                {modele === "privatisation" && (
                  <div style={{ marginTop:"1rem", padding:"1.25rem", backgroundColor:S.card, borderLeft:`3px solid ${S.terra}` }}>
                    <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem" }}>
                      {(["fixe","fourchette"] as const).map(t => (
                        <button key={t} onClick={() => setPrivatType(t)} style={{ padding:"0.4rem 1rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.12em", backgroundColor: privatType === t ? S.brown : "transparent", color: privatType === t ? "#fff" : S.muted, border:`1px solid ${privatType === t ? S.brown : S.border}`, cursor:"pointer" }}>
                          {t === "fixe" ? "MONTANT FIXE" : "FOURCHETTE (négociable)"}
                        </button>
                      ))}
                    </div>
                    {privatType === "fixe" ? (
                      <Field label="BUDGET RÉMUNÉRATION PAR TRUCK (€)" value={privatFixe} onChange={setPrivatFixe} type="number" placeholder="500" />
                    ) : (
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                        <Field label="DE (€)" value={privatMin} onChange={setPrivatMin} type="number" placeholder="300" />
                        <Field label="À (€)" value={privatMax} onChange={setPrivatMax} type="number" placeholder="700" />
                      </div>
                    )}
                  </div>
                )}

                {/* Mixte */}
                {modele === "mixte" && (
                  <div style={{ marginTop:"1rem", padding:"1.25rem", backgroundColor:S.card, borderLeft:`3px solid ${S.terra}` }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
                      <Field label="DROIT DE PLACE FIXE PAR TRUCK (€)" value={mixteDroit} onChange={setMixteDroit} type="number" placeholder="500" />
                    </div>
                    <div>
                      <SubLabel>% PRÉLEVÉ SUR CA HT</SubLabel>
                      <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                        <input type="range" min={0} max={30} step={1} value={mixtePct} onChange={e => setMixtePct(Number(e.target.value))} style={{ flex:1, accentColor:S.terra }} />
                        <span style={{ fontFamily:S.serif, fontSize:"1.4rem", fontWeight:800, color:S.terra, minWidth:46 }}>{mixtePct}%</span>
                      </div>
                      {(mixteDroit || mixtePct > 0) && (
                        <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.terra, marginTop:"0.5rem", fontWeight:500 }}>
                          {mixteDroit ? `${mixteDroit}€` : "—"} de droit de place + {mixtePct}% du CA HT
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* % CA uniquement */}
                {modele === "pct_ca" && (
                  <div style={{ marginTop:"1rem", padding:"1.25rem", backgroundColor:S.card, borderLeft:`3px solid ${S.terra}` }}>
                    <SubLabel>% PRÉLEVÉ SUR CA HT</SubLabel>
                    <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"0.75rem" }}>
                      <input type="range" min={0} max={30} step={1} value={pctCaSeul} onChange={e => setPctCaSeul(Number(e.target.value))} style={{ flex:1, accentColor:S.terra }} />
                      <span style={{ fontFamily:S.serif, fontSize:"1.6rem", fontWeight:800, color:S.terra, minWidth:52 }}>{pctCaSeul}%</span>
                    </div>
                    <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.terra, fontWeight:600 }}>
                      {pctCaSeul}% du CA HT uniquement — pas de droit de place fixe
                    </p>
                    <div style={{ marginTop:"0.75rem", display:"flex", alignItems:"flex-start", gap:"0.5rem", padding:"0.6rem 0.75rem", backgroundColor:"rgba(44,26,16,0.05)", borderLeft:`2px solid ${S.amber}` }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.amber }}>ℹ</span>
                      <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.amber, lineHeight:1.5 }}>
                        Le montant final dépendra du chiffre d'affaires réalisé par le truck le jour de l'événement.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Logistique ─────────────────────────────── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <Toggle on={elec} onChange={() => setElec(v => !v)} label="Alimentation électrique disponible" />
                  {elec && (
                    <div style={{ marginTop:"1rem", paddingLeft:"1rem", borderLeft:`2px solid ${S.border}`, display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                      <div>
                        <SubLabel>TYPE</SubLabel>
                        <div style={{ display:"flex", gap:"0.5rem" }}>
                          {["Monophasé","Triphasé"].map(t => (
                            <button key={t} onClick={() => setTypeElec(t)} style={{ flex:1, padding:"0.5rem", fontFamily:S.sans, fontSize:"0.72rem", backgroundColor: typeElec === t ? S.brown : "transparent", color: typeElec === t ? "#fff" : S.muted, border:`1px solid ${typeElec === t ? S.brown : S.border}`, cursor:"pointer" }}>{t}</button>
                          ))}
                        </div>
                      </div>
                      <Field label="AMPÉRAGE (A)" value={amperage} onChange={setAmperage} type="number" placeholder="32" />
                    </div>
                  )}
                </div>
                <Field label="SURFACE PAR TRUCK (m²)" value={surface} onChange={setSurface} type="number" placeholder="20" />
                <div style={{ display:"flex", alignItems:"center" }}>
                  <Toggle on={acces} onChange={() => setAcces(v => !v)} label="Accès véhicule utilitaire possible" />
                </div>
              </div>
            </div>

            <div style={{ marginTop:"2rem", display:"flex", justifyContent:"space-between" }}>
              <BtnRetour to={1} />
              <BtnContinuer onClick={() => goTo(3)} />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            ÉTAPE 3 — CRITÈRES & CONTRAT
        ══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <SectionTitle title="Critères et contrat" sub="Définissez vos exigences, le mode de candidature et le contrat" />

            <div style={{ display:"flex", flexDirection:"column", gap:"2rem" }}>

              {/* Documents exigés */}
              <div>
                <SubLabel>DOCUMENTS EXIGÉS</SubLabel>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.25rem" }}>
                  {DOCS.map(d => <CheckItem key={d} label={d} checked={docs.includes(d)} onChange={() => toggleDoc(d)} />)}
                </div>
              </div>

              {/* Note minimum */}
              <div>
                <SubLabel>NOTE MINIMUM DU TRUCK</SubLabel>
                <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                  <input type="range" min={1} max={5} step={0.5} value={noteMin} onChange={e => setNoteMin(Number(e.target.value))} style={{ flex:1, accentColor:S.terra }} />
                  <span style={{ fontFamily:S.serif, fontSize:"1.4rem", fontWeight:800, color:S.terra, minWidth:44 }}>{noteMin}★</span>
                </div>
              </div>

              {/* Exclusivité */}
              <div>
                <Toggle on={exclu} onChange={() => setExclu(v => !v)} label="Exclusivité cuisine" />
                {exclu && (
                  <div style={{ marginTop:"0.75rem" }}>
                    <Field label="TYPE EN EXCLUSIVITÉ" value={excluType} onChange={setExcluType} placeholder="Ex: Burgers, Mexicain..." />
                  </div>
                )}
              </div>

              {/* Date limite + instructions */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                <Field label="DATE LIMITE DE CANDIDATURE" value={dateLimite} onChange={setDateLimite} type="date" />
                <div />
                <Field label="INSTRUCTIONS DE CANDIDATURE" value={instructions} onChange={setInstructions}
                  type="textarea" rows={3} placeholder="Comment les trucks doivent-ils postuler ?" full />
              </div>

              {/* Mode candidature */}
              <div>
                <SubLabel>MODE DE CANDIDATURE</SubLabel>
                {CAND_MODES.map(m => (
                  <Radio key={m} label={m} checked={modesCand === m} onChange={() => setModesCand(m)} />
                ))}
                {modesCand === "Par email" && (
                  <div style={{ marginTop:"0.5rem" }}>
                    <Field label="ADRESSE EMAIL" value={emailCand} onChange={setEmailCand} type="email" placeholder="contact@monevenement.fr" />
                  </div>
                )}
                {modesCand === "Via lien externe" && (
                  <div style={{ marginTop:"0.5rem" }}>
                    <Field label="URL DU FORMULAIRE" value={urlCand} onChange={setUrlCand} placeholder="https://" />
                  </div>
                )}
              </div>

              {/* ════════════════════════════════════════════
                  CONTRAT
              ════════════════════════════════════════════ */}
              <div>
                <div style={{ marginBottom:"1rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}` }}>
                  <h3 style={{ fontFamily:S.serif, fontSize:"1.1rem", fontWeight:700, color:S.brown }}>Contrat</h3>
                  <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.15rem" }}>
                    Le contrat sera envoyé au truck retenu pour signature électronique
                  </p>
                </div>

                {/* Option A — Upload */}
                <div onClick={() => setContratMode("upload")} style={{ padding:"1.25rem", border:`1px solid ${contratMode === "upload" ? S.terra : S.border}`, backgroundColor: contratMode === "upload" ? "rgba(196,98,45,0.05)" : "transparent", cursor:"pointer", marginBottom:"0.5rem" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom: contratMode === "upload" ? "1rem" : 0 }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${contratMode === "upload" ? S.terra : S.border}`, backgroundColor: contratMode === "upload" ? S.terra : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {contratMode === "upload" && <div style={{ width:7, height:7, borderRadius:"50%", backgroundColor:"#fff" }} />}
                    </div>
                    <span style={{ fontFamily:S.sans, fontSize:"0.8rem", fontWeight: contratMode === "upload" ? 600 : 400, color:S.brown }}>Uploader mon propre contrat</span>
                  </div>
                  {contratMode === "upload" && (
                    <div onClick={e => e.stopPropagation()}>
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display:"none" }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const sizeKb = f.size / 1024;
                            const size = sizeKb > 1024 ? `${(sizeKb/1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`;
                            setContratFile({ name:f.name, size });
                          }
                        }} />
                      {contratFile ? (
                        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem", backgroundColor:S.card }}>
                          <FileText size={16} color={S.green} strokeWidth={1.5} />
                          <div style={{ flex:1 }}>
                            <p style={{ fontFamily:S.sans, fontSize:"0.75rem", fontWeight:600, color:S.brown }}>{contratFile.name}</p>
                            <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted }}>{contratFile.size}</p>
                          </div>
                          <button onClick={() => setContratFile(null)} style={{ background:"none", border:"none", cursor:"pointer" }}>
                            <X size={14} color={S.muted} />
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => fileRef.current?.click()}
                          style={{ border:`2px dashed ${S.border}`, padding:"2rem", textAlign:"center", cursor:"pointer", backgroundColor:"rgba(44,26,16,0.02)" }}>
                          <Upload size={24} color={S.muted} style={{ marginBottom:"0.5rem" }} />
                          <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.muted }}>
                            Glissez votre contrat ici ou <span style={{ color:S.terra, fontWeight:600 }}>cliquez pour sélectionner</span>
                          </p>
                          <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted, marginTop:"0.3rem" }}>PDF, DOC, DOCX · Max 10 MB</p>
                        </div>
                      )}
                      <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted, marginTop:"0.5rem" }}>
                        Votre contrat sera envoyé au truck retenu pour signature électronique.
                      </p>
                    </div>
                  )}
                </div>

                {/* Option B — Spotruck */}
                <div onClick={() => { setContratMode("spotruck"); }} style={{ padding:"1.25rem", border:`1px solid ${contratMode === "spotruck" ? S.terra : S.border}`, backgroundColor: contratMode === "spotruck" ? "rgba(196,98,45,0.05)" : "transparent", cursor:"pointer", marginBottom:"0.5rem" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${contratMode === "spotruck" ? S.terra : S.border}`, backgroundColor: contratMode === "spotruck" ? S.terra : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {contratMode === "spotruck" && <div style={{ width:7, height:7, borderRadius:"50%", backgroundColor:"#fff" }} />}
                      </div>
                      <div>
                        <span style={{ fontFamily:S.sans, fontSize:"0.8rem", fontWeight: contratMode === "spotruck" ? 600 : 400, color:S.brown }}>Générer un contrat Spotruck</span>
                        <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted }}>Contrat pré-rempli avec les infos de votre événement</p>
                      </div>
                    </div>
                    {contratMode === "spotruck" && contratValidated && (
                      <span style={{ backgroundColor:"rgba(44,122,75,0.1)", color:S.green, fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.12em", fontWeight:700, padding:"0.25rem 0.6rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                        <CheckCircle size={10} strokeWidth={2.5} /> VALIDÉ
                      </span>
                    )}
                  </div>
                  {contratMode === "spotruck" && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop:"1rem" }}>
                      <button onClick={() => setShowContratBuilder(v => !v)}
                        style={{ backgroundColor:contratValidated ? S.green : S.brown, color:"#fff", border:"none", padding:"0.65rem 1.25rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                        <FileText size={13} strokeWidth={2} />
                        {contratValidated ? "MODIFIER LE CONTRAT" : "GÉNÉRER UN CONTRAT SPOTRUCK"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Option C — Aucun */}
                <div onClick={() => setContratMode("aucun")} style={{ padding:"1.25rem", border:`1px solid ${contratMode === "aucun" ? S.red : S.border}`, backgroundColor: contratMode === "aucun" ? "rgba(192,57,43,0.04)" : "transparent", cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${contratMode === "aucun" ? S.red : S.border}`, backgroundColor: contratMode === "aucun" ? S.red : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {contratMode === "aucun" && <div style={{ width:7, height:7, borderRadius:"50%", backgroundColor:"#fff" }} />}
                    </div>
                    <span style={{ fontFamily:S.sans, fontSize:"0.8rem", color:S.brown }}>Je ne souhaite pas de contrat</span>
                  </div>
                  {contratMode === "aucun" && (
                    <div style={{ marginTop:"0.75rem", display:"flex", alignItems:"flex-start", gap:"0.6rem", padding:"0.75rem", backgroundColor:"rgba(192,57,43,0.08)", borderLeft:`3px solid ${S.red}` }}>
                      <AlertTriangle size={15} color={S.red} style={{ flexShrink:0, marginTop:2 }} />
                      <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.red, lineHeight:1.5 }}>
                        <strong>Attention :</strong> sans contrat, vous n'êtes pas protégé en cas d'annulation ou de litige avec le truck.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ════════════════════════════════════════════
                  RÉCAPITULATIF
              ════════════════════════════════════════════ */}
              <div style={{ backgroundColor:S.card, padding:"1.75rem" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"1.25rem" }}>RÉCAPITULATIF COMPLET</p>

                {/* Infos événement */}
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>L'ÉVÉNEMENT</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem 2rem", marginBottom:"1.25rem" }}>
                  {[
                    ["Titre", titre],
                    ["Type", typeEvt],
                    ["Date", dateDebut + (dateFin && dateFin !== dateDebut ? ` → ${dateFin}` : "")],
                    ["Horaires", heureDebut + (heureFin ? ` → ${heureFin}` : "")],
                    ["Lieu", lieu],
                    ["Visiteurs", visiteurs || "—"],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", gap:"0.5rem", padding:"0.35rem 0", borderBottom:`1px solid ${S.border}` }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.63rem", color:S.muted, minWidth:80 }}>{k}</span>
                      <span style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:500, color:S.brown }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>

                {/* Besoin */}
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>LE BESOIN</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem 2rem", marginBottom:"1.25rem" }}>
                  {[
                    ["Trucks", `${nbTrucksCount} truck${nbTrucksCount > 1 ? "s" : ""}${truckDetails.some(d => d.trim()) ? ` (${truckDetails.map((d,i) => d.trim() ? `${i+1}. ${d.trim()}` : `${i+1}. —`).join(" · ")})` : ""}`],
                    ["Public", tranches.length > 0 ? tranches.map(t => t.split(" (")[0]).join(", ") : "Tout public"],
                    ["Modèle fin.", modeleResume().replace(" · 🛡️ via Spotruck","").replace(" · ⚠️ Paiement direct","") || "—"],
                    ["Paiement", modele === "droit" ? (droitViaSpotruck ? "🛡️ Sécurisé via Spotruck" : "⚠️ Direct entre les parties") : "Via Spotruck"],
                    ["Électricité", elec ? `${typeElec} ${amperage}A` : "Non"],
                    ["Surface/truck", surface ? `${surface} m²` : "—"],
                    ["Accès utilitaire", acces ? "Oui" : "Non"],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", gap:"0.5rem", padding:"0.35rem 0", borderBottom:`1px solid ${S.border}` }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.63rem", color:S.muted, minWidth:110 }}>{k}</span>
                      <span style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:500, color:S.brown }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>

                {/* Critères */}
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>CRITÈRES & CONTRAT</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem 2rem", marginBottom:"1.5rem" }}>
                  {[
                    ["Note min.", `${noteMin}★`],
                    ["Exclusivité", exclu ? excluType || "Oui" : "Non"],
                    ["Docs exigés", docs.length > 0 ? docs.join(", ") : "Aucun"],
                    ["Date limite cand.", dateLimite || "—"],
                    ["Mode cand.", modesCand.split(" (")[0]],
                    ["Contrat", contratResume()],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", gap:"0.5rem", padding:"0.35rem 0", borderBottom:`1px solid ${S.border}` }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.63rem", color:S.muted, minWidth:110 }}>{k}</span>
                      <span style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:500, color: v?.includes("⚠") ? S.red : S.brown }}>{v || "—"}</span>
                    </div>
                  ))}
                </div>

                {/* Checklist */}
                <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                  {[
                    { ok: !!(titre && typeEvt && dateDebut && lieu),  label:"Informations complètes" },
                    { ok: !!(modeleResume()),                          label:"Modèle financier défini" },
                    ...(modele === "droit" ? [{
                      ok: true,
                      warn: !droitViaSpotruck,
                      label: droitViaSpotruck ? "🛡️ PAIEMENT SÉCURISÉ via Spotruck" : "⚠️ Paiement hors Spotruck — aucune garantie",
                    }] : []),
                    { ok: !!(contratMode && contratMode !== "aucun"), label: contratMode === "aucun" ? "⚠️ Aucun contrat sélectionné" : "Contrat disponible", warn: contratMode === "aucun" },
                  ].map(c => (
                    <div key={c.label} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      {c.ok
                        ? <CheckCircle size={14} color={c.warn ? S.amber : S.green} strokeWidth={2} />
                        : <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${S.border}` }} />
                      }
                      <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color: c.ok ? (c.warn ? S.amber : S.green) : S.muted }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* end flex col */}

            {publishError && (
              <div style={{ marginTop:"1.5rem", backgroundColor:"rgba(192,57,43,0.06)", border:`1px solid rgba(192,57,43,0.3)`, padding:"0.875rem 1.25rem" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.red, fontWeight:600 }}>⚠ {publishError}</p>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                BOOSTER AVEC PRO EVENT
            ══════════════════════════════════════════════════════ */}
            <div style={{ marginTop:"2rem", padding:"1.75rem", backgroundColor:"rgba(196,98,45,0.08)", border:`2px solid ${proEventActive ? S.terra : "rgba(196,98,45,0.25)"}` }}>
              <div style={{ display:"flex", gap:"1.5rem", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
                    <span style={{ backgroundColor:S.terra, color:"#fff", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", fontWeight:700, padding:"0.25rem 0.75rem" }}>PRO EVENT — 19€</span>
                    <p style={{ fontFamily:S.sans, fontSize:"0.75rem", fontWeight:600, color:S.brown }}>BOOSTEZ CET ÉVÉNEMENT</p>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem", marginBottom:"1rem" }}>
                    {[
                      "Frais de service réduits",
                      "Contrat personnalisable qui vous protège",
                      "Support prioritaire 7j/7 — disponible le jour J",
                    ].map(f => (
                      <div key={f} style={{ display:"flex", gap:"0.5rem", alignItems:"flex-start" }}>
                        <CheckCircle size={12} color={S.terra} strokeWidth={2} style={{ flexShrink:0, marginTop:3 }} />
                        <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.brown }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ backgroundColor:"rgba(44,26,16,0.05)", padding:"1rem", borderLeft:`3px solid ${S.terra}` }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, lineHeight:1.7 }}>
                      <strong style={{ fontWeight:600 }}>Pour 19€ sur cet événement :</strong><br />
                      → Vous êtes sûr d'avoir le bon truck<br />
                      → Contrat qui vous protège<br />
                      → Si le truck annule → remboursé<br />
                      → Support disponible le jour J
                    </p>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.75rem", minWidth:140 }}>
                  <Toggle on={proEventActive} onChange={() => setProEventActive(v => !v)} label="" />
                  <span style={{ fontFamily:S.sans, fontSize:"0.7rem", color:S.muted, textAlign:"center" }}>
                    {proEventActive ? "✅ Pro Event activé" : "Activer Pro Event"}
                  </span>
                  {proEventActive && (
                    <div style={{ textAlign:"center", marginTop:"0.5rem" }}>
                      <p style={{ fontFamily:S.serif, fontSize:"1.5rem", fontWeight:800, color:S.terra }}>19€</p>
                      <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted }}>Facturé après publication</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop:"2rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
              <BtnRetour to={2} />
              <div style={{ display:"flex", gap:"0.75rem" }}>
                <button onClick={sauvegarder} style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem 1.5rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer" }}>
                  SAUVEGARDER EN BROUILLON
                </button>
                <button onClick={publier} disabled={publishing} style={{ backgroundColor: publishing ? S.muted : S.terra, color:"#fff", border:"none", padding:"0.875rem 2rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor: publishing ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <Zap size={14} strokeWidth={2} /> {publishing ? "PUBLICATION…" : `PUBLIER L'ÉVÉNEMENT${proEventActive ? " + PRO EVENT" : ""}`}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════════
          MODALE CONTRAT SPOTRUCK
      ══════════════════════════════════════════════════════ */}
      {showContratBuilder && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:3000, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
          <div style={{ backgroundColor:S.cream, width:"100%", maxWidth:780, padding:"2.5rem", position:"relative", marginTop:"2rem", marginBottom:"2rem" }}
            onClick={e => e.stopPropagation()}>

            {/* Header modale */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2rem", paddingBottom:"1rem", borderBottom:`1px solid ${S.border}` }}>
              <div>
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.3rem" }}>CONTRAT SPOTRUCK</p>
                <h2 style={{ fontFamily:S.serif, fontSize:"1.6rem", fontWeight:800, color:S.brown }}>Générateur de contrat</h2>
              </div>
              <button onClick={() => setShowContratBuilder(false)} style={{ background:"none", border:"none", cursor:"pointer" }}>
                <X size={22} color={S.muted} />
              </button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"2rem" }}>

              {/* 1. Parties */}
              <section>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>1. PARTIES</p>
                <div style={{ backgroundColor:S.card, padding:"1.25rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                  <Field label="NOM / RAISON SOCIALE" value={organisateurNom} onChange={() => {}} />
                  <Field label="SIRET" value={siretOrga} onChange={setSiretOrga} placeholder="XXX XXX XXX XXXXX" />
                  <Field label="ADRESSE" value={adresseOrga} onChange={setAdresseOrga} placeholder="Rue, code postal, ville" full />
                  <Field label="ÉVÉNEMENT CONCERNÉ" value={titre || "—"} onChange={() => {}} />
                  <Field label="DATE(S)" value={dateDebut + (dateFin && dateFin !== dateDebut ? ` → ${dateFin}` : "") || "—"} onChange={() => {}} />
                </div>
              </section>

              {/* 2. Objet */}
              <section>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>2. OBJET DE LA PRESTATION</p>
                <div style={{ backgroundColor:S.card, padding:"1.25rem" }}>
                  <div style={{ padding:"0.75rem", backgroundColor:"rgba(44,26,16,0.05)", marginBottom:"0.75rem", fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, lineHeight:1.7 }}>
                    Le foodtrucker s'engage à fournir une prestation de restauration mobile lors de l'événement{" "}
                    <strong>"{titre || "[titre]"}"</strong> se déroulant le{" "}
                    <strong>{dateDebut || "[date]"}</strong>{dateFin && dateFin !== dateDebut ? ` au ${dateFin}` : ""}{" "}
                    à <strong>{lieu || "[lieu]"}</strong>, en présence d'environ <strong>{visiteurs || "[n]"}</strong> visiteurs.
                  </div>
                  <Field label="PRÉCISIONS SUPPLÉMENTAIRES" value={precisions} onChange={setPrecisions}
                    type="textarea" rows={2} placeholder="Cuisine spécifique, contraintes particulières..." />
                </div>
              </section>

              {/* 3. Conditions financières */}
              <section>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>3. CONDITIONS FINANCIÈRES</p>
                <div style={{ backgroundColor:S.card, padding:"1.25rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                  <Field label="TYPE" value={MODELE_FIN.find(m => m.key === modele)?.label ?? "—"} onChange={() => {}} />
                  <Field label="MONTANT" value={modeleResume() || "—"} onChange={() => {}} />
                  <div style={{ gridColumn:"1/-1" }}>
                    <SubLabel>ACOMPTE À LA SIGNATURE</SubLabel>
                    <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                      <input type="range" min={0} max={50} step={5} value={acompte} onChange={e => setAcompte(Number(e.target.value))} style={{ flex:1, accentColor:S.terra }} />
                      <span style={{ fontFamily:S.serif, fontSize:"1.2rem", fontWeight:800, color:S.terra, minWidth:44 }}>{acompte}%</span>
                    </div>
                    <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, marginTop:"0.3rem" }}>
                      Solde ({100-acompte}%) à verser à la date ci-dessous
                    </p>
                  </div>
                  <Field label="DATE DE VERSEMENT DU SOLDE" value={soldeDate} onChange={setSoldeDate} type="date" />
                </div>
              </section>

              {/* 4. Obligations du foodtrucker */}
              <section>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>4. OBLIGATIONS DU FOODTRUCKER</p>
                <div style={{ backgroundColor:S.card, padding:"1.25rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  {oblFt.map((o, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <div onClick={() => setOblFt(prev => prev.map((x, j) => j === i ? { ...x, checked:!x.checked } : x))}
                        style={{ width:18, height:18, border:`2px solid ${o.checked ? S.terra : S.border}`, backgroundColor: o.checked ? S.terra : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer" }}>
                        {o.checked && <CheckCircle size={12} color="#fff" strokeWidth={2.5} />}
                      </div>
                      <span style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.brown, flex:1 }}>{o.label}</span>
                      {i === 0 && o.checked && (
                        <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                          <input type="number" value={o.heures}
                            onChange={e => setOblFt(prev => prev.map((x, j) => j === i ? { ...x, heures:e.target.value } : x))}
                            style={{ width:50, border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.25rem 0.4rem", fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, outline:"none", textAlign:"center" }} />
                          <span style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted }}>h avant</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ marginTop:"0.5rem" }}>
                    <Field label="AUTRE OBLIGATION (optionnel)" value={autreOblFt} onChange={setAutreOblFt} placeholder="..." />
                  </div>
                </div>
              </section>

              {/* 5. Obligations de l'organisateur */}
              <section>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>5. OBLIGATIONS DE L'ORGANISATEUR</p>
                <div style={{ backgroundColor:S.card, padding:"1.25rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  {oblOrg.map((o, i) => (
                    <div key={i} onClick={() => setOblOrg(prev => prev.map((x, j) => j === i ? { ...x, checked:!x.checked } : x))}
                      style={{ display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer" }}>
                      <div style={{ width:18, height:18, border:`2px solid ${o.checked ? S.terra : S.border}`, backgroundColor: o.checked ? S.terra : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {o.checked && <CheckCircle size={12} color="#fff" strokeWidth={2.5} />}
                      </div>
                      <span style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.brown }}>{o.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:"0.5rem" }}>
                    <Field label="AUTRE OBLIGATION (optionnel)" value={autreOblOrg} onChange={setAutreOblOrg} placeholder="..." />
                  </div>
                </div>
              </section>

              {/* 6. Annulation */}
              <section>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>6. CONDITIONS D'ANNULATION</p>
                <div style={{ backgroundColor:S.card, padding:"1.25rem" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"2px", marginBottom:"0.5rem" }}>
                    <div style={{ padding:"0.5rem", backgroundColor:"rgba(44,26,16,0.05)" }}>
                      <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", color:S.muted, marginBottom:"0.25rem" }}>DÉLAI</p>
                    </div>
                    <div style={{ padding:"0.5rem", backgroundColor:"rgba(44,26,16,0.05)", gridColumn:"2/-1" }}>
                      <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", color:S.muted, marginBottom:"0.25rem" }}>REMBOURSEMENT</p>
                    </div>
                  </div>
                  {paliers.map((p, i) => (
                    <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"2px", marginBottom:"2px" }}>
                      <div style={{ padding:"0.5rem 0.75rem", backgroundColor:S.cream, display:"flex", alignItems:"center" }}>
                        <input value={p.delai} onChange={e => setPaliers(prev => prev.map((x, j) => j === i ? { ...x, delai:e.target.value } : x))}
                          style={{ width:"100%", border:"none", backgroundColor:"transparent", fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, outline:"none" }} />
                      </div>
                      <div style={{ padding:"0.5rem 0.75rem", backgroundColor:S.cream, gridColumn:"2/-1", display:"flex", alignItems:"center", gap:"0.5rem" }}>
                        <input type="number" min={0} max={100} value={p.remboursement}
                          onChange={e => setPaliers(prev => prev.map((x, j) => j === i ? { ...x, remboursement:Number(e.target.value) } : x))}
                          style={{ width:60, border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.25rem 0.4rem", fontFamily:S.sans, fontSize:"0.75rem", color:S.brown, outline:"none", textAlign:"center" }} />
                        <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted }}>%</span>
                        <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted, marginLeft:"0.25rem" }}>
                          {p.remboursement === 100 ? "Remboursement intégral" : p.remboursement === 0 ? "Aucun remboursement" : `Remboursement partiel`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 7. Résiliation */}
              <section>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>7. RÉSILIATION</p>
                <div style={{ backgroundColor:S.card, padding:"1.25rem" }}>
                  <p style={{ fontFamily:S.sans, fontSize:"0.75rem", fontWeight:300, color:S.muted, lineHeight:1.7 }}>
                    En cas de manquement grave aux obligations contractuelles, chacune des parties peut résilier le présent contrat avec un préavis de 48 heures, par notification écrite. Les sommes versées restent acquises selon les conditions d'annulation définies à l'article 6.
                  </p>
                </div>
              </section>

            </div>

            {/* Actions modale */}
            <div style={{ marginTop:"2rem", display:"flex", gap:"0.75rem", justifyContent:"flex-end", borderTop:`1px solid ${S.border}`, paddingTop:"1.5rem" }}>
              <button onClick={() => setShowContratPreview(true)}
                style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.75rem 1.5rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                <Eye size={13} strokeWidth={2} /> PRÉVISUALISER
              </button>
              <button onClick={() => { setContratValidated(true); setShowContratBuilder(false); setToast("Contrat Spotruck validé."); setTimeout(() => setToast(null), 2000); }}
                style={{ backgroundColor:S.green, color:"#fff", border:"none", padding:"0.75rem 1.75rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                <CheckCircle size={13} strokeWidth={2} /> VALIDER CE CONTRAT
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODALE PRÉVISUALISATION CONTRAT
      ══════════════════════════════════════════════════════ */}
      {showContratPreview && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.65)", zIndex:4000, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"2rem", overflowY:"auto" }}>
          <div style={{ backgroundColor:"#fff", width:"100%", maxWidth:680, padding:"3.5rem 4rem", position:"relative", marginTop:"2rem", marginBottom:"2rem", fontFamily:"Georgia, serif", lineHeight:1.8 }}>
            <button onClick={() => setShowContratPreview(false)} style={{ position:"absolute", top:"1.5rem", right:"1.5rem", background:"none", border:"none", cursor:"pointer" }}>
              <X size={20} color="#666" />
            </button>

            <div style={{ textAlign:"center", marginBottom:"2.5rem", borderBottom:"2px solid #333", paddingBottom:"1.5rem" }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.7rem", letterSpacing:"0.25em", color:"#C4622D", marginBottom:"0.5rem" }}>SPOTRUCK</p>
              <h1 style={{ fontFamily:"Georgia", fontSize:"1.6rem", fontWeight:700, color:"#2C1810", marginBottom:"0.25rem" }}>CONTRAT DE PRESTATION</h1>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.7rem", color:"#666" }}>Restauration mobile lors d'événement</p>
            </div>

            <p style={{ marginBottom:"1.5rem", color:"#333", fontSize:"0.9rem" }}>
              Entre <strong>{organisateurNom}</strong>{siretOrga && `, SIRET ${siretOrga}`}{adresseOrga && `, ${adresseOrga}`}, ci-après dénommée <em>"l'Organisateur"</em>,<br /><br />
              Et le foodtrucker retenu, ci-après dénommé <em>"le Prestataire"</em>.
            </p>

            <h2 style={{ fontSize:"1rem", fontWeight:700, color:"#2C1810", marginBottom:"0.5rem", marginTop:"1.5rem" }}>Article 1 — Objet</h2>
            <p style={{ color:"#333", fontSize:"0.88rem" }}>
              Le Prestataire s'engage à fournir une prestation de restauration mobile lors de <strong>"{titre || "[titre]"}"</strong>, le <strong>{dateDebut || "[date]"}</strong> à <strong>{lieu || "[lieu]"}</strong> pour environ {visiteurs || "—"} visiteurs.
              {precisions && ` ${precisions}`}
            </p>

            <h2 style={{ fontSize:"1rem", fontWeight:700, color:"#2C1810", marginBottom:"0.5rem", marginTop:"1.5rem" }}>Article 2 — Conditions financières</h2>
            <p style={{ color:"#333", fontSize:"0.88rem" }}>
              Modèle : <strong>{MODELE_FIN.find(m => m.key === modele)?.label}</strong>. Montant : <strong>{modeleResume() || "—"}</strong>.<br />
              Acompte de <strong>{acompte}%</strong> à la signature. Solde ({100-acompte}%) au {soldeDate || "[date solde]"}.
            </p>

            <h2 style={{ fontSize:"1rem", fontWeight:700, color:"#2C1810", marginBottom:"0.5rem", marginTop:"1.5rem" }}>Article 3 — Obligations du Prestataire</h2>
            <ul style={{ color:"#333", fontSize:"0.88rem", paddingLeft:"1.5rem" }}>
              {oblFt.filter(o => o.checked).map((o, i) => (
                <li key={i}>{o.label}{o.heures && i === 0 ? ` (${o.heures}h avant ouverture)` : ""}.</li>
              ))}
              {autreOblFt && <li>{autreOblFt}.</li>}
            </ul>

            <h2 style={{ fontSize:"1rem", fontWeight:700, color:"#2C1810", marginBottom:"0.5rem", marginTop:"1.5rem" }}>Article 4 — Obligations de l'Organisateur</h2>
            <ul style={{ color:"#333", fontSize:"0.88rem", paddingLeft:"1.5rem" }}>
              {oblOrg.filter(o => o.checked).map((o, i) => <li key={i}>{o.label}.</li>)}
              {autreOblOrg && <li>{autreOblOrg}.</li>}
            </ul>

            <h2 style={{ fontSize:"1rem", fontWeight:700, color:"#2C1810", marginBottom:"0.5rem", marginTop:"1.5rem" }}>Article 5 — Annulation</h2>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.85rem", color:"#333" }}>
              <thead>
                <tr style={{ backgroundColor:"#f5f0ea" }}>
                  <th style={{ padding:"0.4rem 0.75rem", textAlign:"left", border:"1px solid #ddd" }}>Délai</th>
                  <th style={{ padding:"0.4rem 0.75rem", textAlign:"left", border:"1px solid #ddd" }}>Remboursement</th>
                </tr>
              </thead>
              <tbody>
                {paliers.map((p, i) => (
                  <tr key={i}>
                    <td style={{ padding:"0.4rem 0.75rem", border:"1px solid #ddd" }}>{p.delai}</td>
                    <td style={{ padding:"0.4rem 0.75rem", border:"1px solid #ddd" }}>{p.remboursement}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 style={{ fontSize:"1rem", fontWeight:700, color:"#2C1810", marginBottom:"0.5rem", marginTop:"1.5rem" }}>Article 6 — Résiliation</h2>
            <p style={{ color:"#333", fontSize:"0.88rem" }}>
              En cas de manquement grave, chaque partie peut résilier avec un préavis de 48 heures par notification écrite.
            </p>

            <div style={{ marginTop:"3rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem" }}>
              <div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.72rem", color:"#666", marginBottom:"0.5rem" }}>L'ORGANISATEUR</p>
                <div style={{ height:48, borderBottom:"1px solid #333" }} />
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.65rem", color:"#999", marginTop:"0.25rem" }}>{organisateurNom} — Date : ___________</p>
              </div>
              <div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.72rem", color:"#666", marginBottom:"0.5rem" }}>LE FOODTRUCKER</p>
                <div style={{ height:48, borderBottom:"1px solid #333" }} />
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:"0.65rem", color:"#999", marginTop:"0.25rem" }}>Nom : ___________ — Date : ___________</p>
              </div>
            </div>

            <div style={{ marginTop:"2rem", textAlign:"center", display:"flex", gap:"0.75rem", justifyContent:"center" }}>
              <button onClick={() => { setContratValidated(true); setShowContratPreview(false); setShowContratBuilder(false); setToast("Contrat validé !"); setTimeout(() => setToast(null), 2000); }}
                style={{ backgroundColor:"#2C7A4B", color:"#fff", border:"none", padding:"0.75rem 2rem", fontFamily:"'Inter',sans-serif", fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer" }}>
                VALIDER CE CONTRAT
              </button>
              <button onClick={() => setShowContratPreview(false)}
                style={{ backgroundColor:"transparent", color:"#8C7B6E", border:"1px solid #D4C9BC", padding:"0.75rem 1.5rem", fontFamily:"'Inter',sans-serif", fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer" }}>
                FERMER
              </button>
            </div>
          </div>
        </div>
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

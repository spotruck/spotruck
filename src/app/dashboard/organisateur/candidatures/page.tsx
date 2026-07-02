"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import {
  Star, CheckCircle, XCircle, MessageSquare, User,
  Lightbulb, ChevronDown, X, Filter, Send, AlertTriangle,
  Paperclip, FileText, Image as ImageIcon,
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

// ─── LocalStorage keys ────────────────────────────────────────
const LS_CAND      = "spotruck_org_candidatures";
const LS_MODELES   = "spotruck_modeles_messages";
const LS_FT_NOTIFS = "spotruck_ft_notifications";
const LS_FT_MSGS   = "spotruck_ft_messages";

// ─── Infos événement (mock) ───────────────────────────────────
const EVT_NOM  = "Festival Solstice";
const EVT_DATE = "21 juin 2026";
const EVT_LIEU = "Bordeaux";
const ORG_NOM  = "Sophie Mercier";

// ─── Messages par défaut ──────────────────────────────────────
const DEFAULT_MSG_ACCEPT = `Bonjour,

Nous avons le plaisir de vous informer que votre candidature pour ${EVT_NOM} du ${EVT_DATE} à ${EVT_LIEU} a été retenue.

Votre profil et votre concept correspondent parfaitement à nos attentes pour cet événement.

Prochaines étapes :
- Nous vous ferons parvenir le contrat dans les prochains jours
- Un acompte de 30% vous sera demandé à la signature
- Nous reviendrons vers vous avec les détails logistiques (emplacement, horaires d'accès, contact sur place)

N'hésitez pas à nous contacter si vous avez des questions.

Cordialement,
${ORG_NOM}`;

const DEFAULT_MSG_REFUS = `Bonjour,

Nous vous remercions chaleureusement pour votre candidature à ${EVT_NOM} ainsi que pour la qualité de votre présentation.

Nous avons reçu un grand nombre de candidatures de très bon niveau, ce qui a rendu notre sélection particulièrement difficile.

Après examen attentif de l'ensemble des dossiers, nous avons malheureusement dû faire des choix et nous ne sommes pas en mesure de vous retenir pour cette édition.

Nous gardons précieusement vos coordonnées et votre profil pour nos prochains événements. Nous espérons avoir l'occasion de collaborer ensemble dans le futur.

Nous vous souhaitons une belle saison et vous remercions encore de l'intérêt que vous portez à nos événements.

Cordialement,
${ORG_NOM}`;

const MOTIFS_REFUS = [
  "Profil ne correspond pas au type d'événement",
  "Cuisine déjà représentée par un autre truck retenu",
  "Documents manquants ou incomplets",
  "Budget incompatible",
  "Nombre de trucks atteint",
  "Autre",
];

// ─── Types ────────────────────────────────────────────────────
interface Candidature {
  id: string; truck: string; plan: "Pro"|"Premium"; cuisine: string;
  ville: string; distance: number; note: number; score: number;
  statut: "EN ATTENTE"|"RETENU"|"REFUSÉ"; date: string; message: string;
  docs: string[]; taille: string; amperage: number;
  avis: { auteur:string; note:number; texte:string }[];
  references: string[];
}

// ─── Données initiales ────────────────────────────────────────
const CANDIDATURES_INIT: Candidature[] = [
  { id:"c01", truck:"Le Kalow Smash Burger",  plan:"Premium", cuisine:"Burgers américains",   ville:"Bordeaux",  distance:2,  note:4.8, score:97, statut:"EN ATTENTE", date:"2026-06-01", message:"Bonjour, nous sommes spécialisés dans les burgers artisanaux. Notre truck est autonome et nous avons déjà officié à 3 festivals similaires.", docs:["KBIS","HACCP","RC Pro","Conformité gaz"], taille:"8m × 3m", amperage:16, avis:[{auteur:"Festival de Pau",note:5,texte:"Service parfait, queue bien gérée, cuisine délicieuse."},{auteur:"Fête du quartier",note:5,texte:"Super ambiance, très professionnel."}], references:["Festival Garorock 2025","Estivales de Montpellier 2025"] },
  { id:"c02", truck:"Sweet Nomad Crêpes",      plan:"Pro",     cuisine:"Crêperie bretonne",    ville:"Mérignac",  distance:8,  note:4.6, score:85, statut:"EN ATTENTE", date:"2026-06-02", message:"Notre crêperie mobile est idéale pour compléter une offre salée. Nous proposons crêpes sucrées et salées pour tous les publics.", docs:["KBIS","HACCP","RC Pro"], taille:"5m × 2.5m", amperage:16, avis:[{auteur:"Salon du mariage",note:5,texte:"Les crêpes étaient excellentes, succès total."},{auteur:"Foire de Bordeaux",note:4,texte:"Bon service malgré l'affluence."}], references:["Marché de Noël Bordeaux 2025","Foire de Bordeaux 2025"] },
  { id:"c03", truck:"Tacos del Sol",           plan:"Pro",     cuisine:"Mexicain",             ville:"Pessac",    distance:12, note:4.3, score:72, statut:"RETENU",    date:"2026-06-01", message:"Spécialistes de la street food mexicaine authentique. Tacos, burritos, nachos faits maison. Public jeune et festif, parfait pour votre événement.", docs:["KBIS","HACCP"], taille:"6m × 2.5m", amperage:32, avis:[{auteur:"Soirée étudiante",note:4,texte:"Très bon, service rapide."},{auteur:"Festival urbain",note:5,texte:"Ambiance super, produits de qualité."}], references:["Festival Urbain Bordeaux 2025"] },
  { id:"c04", truck:"Pizza Nomade",            plan:"Premium", cuisine:"Pizza napolitaine",    ville:"Talence",   distance:5,  note:4.9, score:91, statut:"EN ATTENTE", date:"2026-06-03", message:"Four à bois traditionnel, pâtes fermentées 48h, ingrédients DOP. Nous sommes autonomes en eau et électricité.", docs:["KBIS","HACCP","RC Pro","Conformité gaz","Contrôle hygiène"], taille:"9m × 3m", amperage:0, avis:[{auteur:"Gala Tech Corp",note:5,texte:"Les meilleures pizzas de France sur roues !"},{auteur:"Festival des Saveurs",note:5,texte:"Incroyable qualité, public ravi."}], references:["Gala Tech Corp 2026","Festival Garorock 2025"] },
  { id:"c05", truck:"Wok Express",             plan:"Pro",     cuisine:"Cuisine asiatique",    ville:"Bègles",    distance:7,  note:4.2, score:68, statut:"EN ATTENTE", date:"2026-06-02", message:"Cuisine wok thaï et japonaise. Bols, nouilles sautées, dim sum. Service rapide pour les grands événements.", docs:["KBIS","HACCP"], taille:"5m × 2m", amperage:16, avis:[{auteur:"Marché nocturne",note:4,texte:"Bonne nourriture, service correct."}], references:["Marché nocturne Arcachon 2025"] },
  { id:"c06", truck:"Les Frites du Coin",      plan:"Pro",     cuisine:"Friterie belge",       ville:"Lormont",   distance:15, note:4.4, score:74, statut:"EN ATTENTE", date:"2026-06-04", message:"Frites artisanales à la graisse de bœuf, sauces maison. Un classique de la street food festive.", docs:["KBIS","HACCP","RC Pro"], taille:"5m × 2.5m", amperage:16, avis:[{auteur:"Fête de quartier",note:5,texte:"Un succès à chaque fois !"},{auteur:"Festival Rock",note:4,texte:"Super frites, file d'attente bien gérée."}], references:["Fête de quartier Mérignac 2025","Festival Rock 2025"] },
  { id:"c07", truck:"Glacier Mobile Joia",     plan:"Premium", cuisine:"Glaces artisanales",   ville:"Bordeaux",  distance:3,  note:4.7, score:88, statut:"EN ATTENTE", date:"2026-06-03", message:"35 parfums de glaces artisanales, sorbets, coupes. Idéal pour un événement estival en complément des trucks salés.", docs:["KBIS","HACCP","RC Pro","Contrôle hygiène"], taille:"4m × 2m", amperage:16, avis:[{auteur:"Marché des créateurs",note:5,texte:"Succès phénoménal, files toute la journée."},{auteur:"Festival de jazz",note:5,texte:"Parfait pour la chaleur !"}], references:["Festival Jazz de Bordeaux 2025","Marché des Créateurs 2026"] },
  { id:"c08", truck:"Burger Végétal",          plan:"Pro",     cuisine:"Végétarien/Vegan",     ville:"Villenave", distance:10, note:4.1, score:63, statut:"EN ATTENTE", date:"2026-06-04", message:"100% végétal, burgers, wraps et bowls. Pour les publics soucieux de leur alimentation et de l'environnement.", docs:["KBIS","HACCP"], taille:"5m × 2.5m", amperage:16, avis:[{auteur:"Festival Green",note:4,texte:"Excellent, enfin une offre végé de qualité."}], references:["Festival Green Bordeaux 2025"] },
  { id:"c09", truck:"Ramen Izakaya",           plan:"Pro",     cuisine:"Japonais",             ville:"Mérignac",  distance:9,  note:4.5, score:79, statut:"EN ATTENTE", date:"2026-06-02", message:"Ramen, yakitori, gyoza. Une expérience japonaise authentique en plein air.", docs:["KBIS","HACCP","RC Pro"], taille:"6m × 2.5m", amperage:16, avis:[{auteur:"Festival Gastronomique",note:5,texte:"Sublime, file d'attente tout le week-end."},{auteur:"Salon du Goût",note:4,texte:"Très bon, légèrement cher."}], references:["Festival Gastronomique 2025"] },
  { id:"c10", truck:"Churros & Co",            plan:"Pro",     cuisine:"Snacking sucré",       ville:"Bordeaux",  distance:4,  note:4.3, score:71, statut:"EN ATTENTE", date:"2026-06-05", message:"Churros frais, chocolat chaud, limonades maison. Le snack sucré incontournable de vos événements.", docs:["KBIS","HACCP"], taille:"4m × 2m", amperage:16, avis:[{auteur:"Foire",note:4,texte:"Les enfants adorent !"},{auteur:"Festival",note:5,texte:"Rapide et délicieux."}], references:["Foire de Bordeaux 2025"] },
  { id:"c11", truck:"Cevicheria Pacifica",     plan:"Premium", cuisine:"Péruvien",             ville:"Bordeaux",  distance:6,  note:4.6, score:82, statut:"EN ATTENTE", date:"2026-06-03", message:"Ceviche, tiradito, anticuchos. Une cuisine péruvienne raffinée et originale qui se démarque.", docs:["KBIS","HACCP","RC Pro","Contrôle hygiène"], taille:"6m × 2.5m", amperage:16, avis:[{auteur:"Festival Street Food",note:5,texte:"Dépaysement total, goûts incroyables."},{auteur:"Marché Nocturne",note:5,texte:"Le meilleur ceviche du coin."}], references:["Festival Street Food Paris 2025","Estivales 2025"] },
  { id:"c12", truck:"BBQ du Périgord",         plan:"Pro",     cuisine:"Grillades régionales", ville:"Libourne",  distance:30, note:4.4, score:65, statut:"EN ATTENTE", date:"2026-06-05", message:"Spécialités périgordines : magret, saucisses de canard, pommes sarladaises. Un dépaysement à 30km.", docs:["KBIS","HACCP","RC Pro"], taille:"7m × 3m", amperage:32, avis:[{auteur:"Fête de village",note:5,texte:"Authentique et généreux."},{auteur:"Festival gastronomique",note:4,texte:"Bon mais un peu long à servir."}], references:["Fêtes de Périgueux 2025"] },
  { id:"c13", truck:"Crêpe & Galette Bio",     plan:"Pro",     cuisine:"Crêperie bio",         ville:"Bordeaux",  distance:5,  note:4.3, score:70, statut:"EN ATTENTE", date:"2026-06-04", message:"Crêpes et galettes à base de farine bio et locale. Garnitures de saison. Idéal pour un public sensible à l'origine des produits.", docs:["KBIS","HACCP"], taille:"4m × 2m", amperage:16, avis:[{auteur:"Marché bio",note:5,texte:"Délicieux et responsable."}], references:["Marché Bio Bordeaux 2025"] },
  { id:"c14", truck:"Le Truck Brésilien",      plan:"Pro",     cuisine:"Brésilien",            ville:"Pessac",    distance:11, note:4.0, score:58, statut:"REFUSÉ",    date:"2026-06-01", message:"Churrasco, feijoada, coxinha. La cuisine brésilienne festive et conviviale.", docs:["KBIS","HACCP"], taille:"6m × 2.5m", amperage:16, avis:[{auteur:"Soirée Latino",note:4,texte:"Savoureux !"}], references:["Soirée Latino Bordeaux 2025"] },
];

const STATUT_STYLE: Record<string, { color:string; bg:string }> = {
  "EN ATTENTE": { color:S.amber, bg:"rgba(184,133,10,0.1)" },
  "RETENU":     { color:S.green, bg:"rgba(44,122,75,0.1)" },
  "REFUSÉ":     { color:S.red,   bg:"rgba(192,57,43,0.1)" },
};

function Stars({ n, size = 13 }: { n:number; size?:number }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= Math.round(n) ? S.amber : "none"} stroke={S.amber} strokeWidth={1.5} />
      ))}
    </span>
  );
}
function DocBadge({ label }: { label:string }) {
  return <span style={{ backgroundColor:"rgba(44,122,75,0.12)", color:S.green, fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.1em", padding:"0.2rem 0.45rem", fontWeight:600 }}>{label}</span>;
}
function RadioRow({ label, checked, onChange }: { label:string; checked:boolean; onChange:()=>void }) {
  return (
    <div onClick={onChange} style={{ display:"flex", alignItems:"center", gap:"0.65rem", padding:"0.5rem 0", cursor:"pointer" }}>
      <div style={{ width:17, height:17, borderRadius:"50%", border:`2px solid ${checked ? S.terra : S.border}`, backgroundColor: checked ? S.terra : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {checked && <div style={{ width:7, height:7, borderRadius:"50%", backgroundColor:"#fff" }} />}
      </div>
      <span style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.brown }}>{label}</span>
    </div>
  );
}

// ─── Pièces jointes ───────────────────────────────────────────
interface Attachment { id:string; name:string; size:string; mime:"pdf"|"doc"|"image" }

const ACCEPT_TYPES = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
const MAX_FILES    = 3;
const MAX_MB       = 10;

function mimeOf(name: string): Attachment["mime"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["jpg","jpeg","png"].includes(ext)) return "image";
  return "doc";
}
function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function AttachIcon({ mime }: { mime: Attachment["mime"] }) {
  if (mime === "pdf")   return <FileText  size={14} color="#C0392B" strokeWidth={1.5} />;
  if (mime === "image") return <ImageIcon size={14} color="#2E6DA4" strokeWidth={1.5} />;
  return                       <FileText  size={14} color="#2C7A4B" strokeWidth={1.5} />;
}

function AttachmentZone({ files, onChange }: { files:Attachment[]; onChange:(f:Attachment[])=>void }) {
  const ref = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const remaining = MAX_FILES - files.length;
    const toAdd: Attachment[] = picked.slice(0, remaining)
      .filter(f => f.size <= MAX_MB * 1024 * 1024)
      .map(f => ({ id:`att-${Date.now()}-${Math.random()}`, name:f.name, size:fmtSize(f.size), mime:mimeOf(f.name) }));
    onChange([...files, ...toAdd]);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div style={{ marginTop:"0.75rem" }}>
      {/* Fichiers déjà joints */}
      {files.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem", marginBottom:"0.5rem" }}>
          {files.map(f => (
            <div key={f.id} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.5rem 0.75rem", backgroundColor:S.card, border:`1px solid ${S.border}` }}>
              <AttachIcon mime={f.mime} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:500, color:S.brown, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</p>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted }}>{f.size}</p>
              </div>
              <button onClick={() => onChange(files.filter(x => x.id !== f.id))}
                style={{ background:"none", border:"none", cursor:"pointer", padding:"0.2rem", flexShrink:0, color:S.muted, display:"flex", alignItems:"center" }}>
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton ajouter */}
      {files.length < MAX_FILES && (
        <>
          <input ref={ref} type="file" multiple accept={ACCEPT_TYPES} onChange={pick} style={{ display:"none" }} />
          <button onClick={() => ref.current?.click()} style={{ display:"flex", alignItems:"center", gap:"0.45rem", background:"none", border:`1px dashed ${S.border}`, padding:"0.45rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", color:S.muted, cursor:"pointer", width:"100%" }}>
            <Paperclip size={12} strokeWidth={1.5} />
            AJOUTER UNE PIÈCE JOINTE
            <span style={{ marginLeft:"auto", color:S.border }}>{files.length}/{MAX_FILES} · PDF, DOC, JPG, PNG · max {MAX_MB}MB</span>
          </button>
        </>
      )}

      {/* Cas d'usage */}
      {files.length === 0 && (
        <p style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted, marginTop:"0.3rem" }}>
          Ex : contrat à signer, plan du site, règlement intérieur, brief logistique
        </p>
      )}
    </div>
  );
}

// ─── LS helpers ───────────────────────────────────────────────
function loadModeles() {
  try {
    const r = localStorage.getItem(LS_MODELES);
    if (r) {
      const p = JSON.parse(r);
      return { accept: p.acceptation || DEFAULT_MSG_ACCEPT, refus: p.refus || DEFAULT_MSG_REFUS };
    }
  } catch {}
  return { accept: DEFAULT_MSG_ACCEPT, refus: DEFAULT_MSG_REFUS };
}
function pushFtNotif(type: "acceptation"|"refus", truck: string, candId: string) {
  try {
    const list: unknown[] = JSON.parse(localStorage.getItem(LS_FT_NOTIFS) || "[]");
    list.unshift({
      id: `ftnotif-${Date.now()}`,
      type, truck, candId,
      eventNom: EVT_NOM,
      dateISO: new Date().toISOString(),
      lue: false,
    });
    localStorage.setItem(LS_FT_NOTIFS, JSON.stringify(list));
  } catch {}
}
function pushFtMsg(candId: string, payload: { message:string; statut:string; motif?:string; attachments?:Attachment[] }) {
  try {
    const map: Record<string, unknown> = JSON.parse(localStorage.getItem(LS_FT_MSGS) || "{}");
    map[candId] = { ...payload, dateISO: new Date().toISOString() };
    localStorage.setItem(LS_FT_MSGS, JSON.stringify(map));
  } catch {}
}

// ─── Page ─────────────────────────────────────────────────────
export default function CandidaturesPage() {
  const router = useRouter();
  const [candidatures, setCandidatures] = useState<Candidature[]>(CANDIDATURES_INIT);
  const [filtre, setFiltre] = useState<"Toutes"|"EN ATTENTE"|"RETENU"|"REFUSÉ">("Toutes");
  const [tri, setTri]       = useState<"score"|"note"|"date"|"plan">("score");
  const [modale, setModale] = useState<Candidature|null>(null);
  const [showTri, setShowTri] = useState(false);
  const [toast, setToast]   = useState("");

  // ── Modale Retenir ────────────────────────────────────────
  const [retenirTarget,    setRetenirTarget]    = useState<Candidature|null>(null);
  const [acceptMsg,        setAcceptMsg]        = useState("");
  const [acceptAttachments,setAcceptAttachments]= useState<Attachment[]>([]);

  // ── Modale Refuser ────────────────────────────────────────
  const [refuserTarget,   setRefuserTarget]   = useState<Candidature|null>(null);
  const [refusMotif,      setRefusMotif]       = useState("");
  const [refusMotifAutre, setRefusMotifAutre] = useState("");
  const [refusIncludeMotif, setRefusIncludeMotif] = useState(false);
  const [refusMsg,        setRefusMsg]         = useState("");
  const [refusAttachments,setRefusAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_CAND);
      if (stored) setCandidatures(JSON.parse(stored));
    } catch {}
  }, []);

  const save = useCallback((list: Candidature[]) => {
    setCandidatures(list);
    try { localStorage.setItem(LS_CAND, JSON.stringify(list)); } catch {}
  }, []);

  // ── Ouvrir modale Retenir ─────────────────────────────────
  const openRetenir = useCallback((c: Candidature) => {
    const { accept } = loadModeles();
    setAcceptMsg(accept);
    setAcceptAttachments([]);
    setRetenirTarget(c);
  }, []);

  // ── Ouvrir modale Refuser ─────────────────────────────────
  const openRefuser = useCallback((c: Candidature) => {
    const { refus } = loadModeles();
    setRefusMsg(refus);
    setRefusMotif("");
    setRefusMotifAutre("");
    setRefusIncludeMotif(false);
    setRefusAttachments([]);
    setRefuserTarget(c);
  }, []);

  // ── Exécuter Retenir ──────────────────────────────────────
  const executeRetenir = useCallback((withMessage: boolean) => {
    if (!retenirTarget) return;
    const newList = candidatures.map(c => c.id === retenirTarget.id ? { ...c, statut:"RETENU" as const } : c);
    save(newList);
    if (withMessage) {
      pushFtMsg(retenirTarget.id, { message: acceptMsg, statut:"RETENU", attachments: acceptAttachments });
    }
    pushFtNotif("acceptation", retenirTarget.truck, retenirTarget.id);
    setRetenirTarget(null);
    setModale(null);
    setToast(`${retenirTarget.truck} retenu${withMessage ? " — message envoyé" : ""} ✓`);
    setTimeout(() => setToast(""), 3000);
  }, [retenirTarget, candidatures, save, acceptMsg]);

  // ── Exécuter Refuser ──────────────────────────────────────
  const executeRefuser = useCallback((withMessage: boolean) => {
    if (!refuserTarget) return;
    const motifFinal = refusMotif === "Autre" ? refusMotifAutre : refusMotif;
    let msgFinal = refusMsg;
    if (withMessage && refusIncludeMotif && motifFinal) {
      msgFinal = refusMsg + `\n\nLa principale raison de notre choix : ${motifFinal}`;
    }
    const newList = candidatures.map(c => c.id === refuserTarget.id ? { ...c, statut:"REFUSÉ" as const } : c);
    save(newList);
    if (withMessage) {
      pushFtMsg(refuserTarget.id, { message: msgFinal, statut:"REFUSÉ", motif: motifFinal, attachments: refusAttachments });
    }
    pushFtNotif("refus", refuserTarget.truck, refuserTarget.id);
    setRefuserTarget(null);
    setModale(null);
    setToast(`Candidature de ${refuserTarget.truck} refusée${withMessage ? " — message envoyé" : ""}`);
    setTimeout(() => setToast(""), 3000);
  }, [refuserTarget, candidatures, save, refusMsg, refusMotif, refusMotifAutre, refusIncludeMotif]);

  const triLabels: Record<string, string> = {
    score:"Score compatibilité", note:"Note moyenne", date:"Date de candidature", plan:"Plan (Premium en premier)"
  };

  const filtered = candidatures
    .filter(c => filtre === "Toutes" || c.statut === filtre)
    .sort((a, b) => {
      if (tri === "score") return b.score - a.score;
      if (tri === "note")  return b.note - a.note;
      if (tri === "date")  return b.date.localeCompare(a.date);
      if (tri === "plan")  return (b.plan === "Premium" ? 1 : 0) - (a.plan === "Premium" ? 1 : 0);
      return 0;
    });

  const totalAttendu = candidatures.filter(c => c.statut === "EN ATTENTE").length;

  // Quand le motif change, injecte-le dans le message si le toggle est actif
  const handleMotifChange = (motif: string) => {
    setRefusMotif(motif);
  };

  return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <OrganisateurSidebar active="/dashboard/organisateur/candidatures" badges={{ "/dashboard/organisateur/candidatures": totalAttendu }} />

      <div style={{ padding:"3rem", maxWidth:1100, minWidth:0 }}>

        {/* Header */}
        <div style={{ marginBottom:"2rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>FESTIVAL SOLSTICE — BORDEAUX, 21 JUIN 2026</p>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
            <h1 style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, lineHeight:1.1 }}>
              {candidatures.length} candidatures reçues
            </h1>
            <div style={{ display:"flex", gap:"0.5rem", position:"relative" }}>
              <button onClick={() => setShowTri(v => !v)} style={{ border:`1px solid ${S.border}`, backgroundColor:"transparent", color:S.brown, padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                <Filter size={12} strokeWidth={1.5} /> TRIER : {triLabels[tri].split(" ")[0].toUpperCase()} <ChevronDown size={11} />
              </button>
              {showTri && (
                <div style={{ position:"absolute", top:"110%", right:0, backgroundColor:"#fff", border:`1px solid ${S.border}`, zIndex:100, minWidth:220, boxShadow:"0 8px 24px rgba(0,0,0,0.1)" }}>
                  {Object.entries(triLabels).map(([k, v]) => (
                    <button key={k} onClick={() => { setTri(k as typeof tri); setShowTri(false); }} style={{ display:"block", width:"100%", textAlign:"left", padding:"0.75rem 1rem", fontFamily:S.sans, fontSize:"0.72rem", color: tri === k ? S.terra : S.brown, backgroundColor: tri === k ? "rgba(196,98,45,0.05)" : "transparent", border:"none", cursor:"pointer" }}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conseil Spotruck */}
        <div style={{ marginBottom:"2rem", backgroundColor:S.terra, padding:"1.25rem 1.5rem", display:"flex", gap:"1rem", alignItems:"flex-start" }}>
          <Lightbulb size={20} strokeWidth={1.5} color="#fff" style={{ flexShrink:0, marginTop:2 }} />
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:"rgba(255,255,255,0.7)", fontWeight:700, marginBottom:"0.35rem" }}>CONSEIL SPOTRUCK</p>
            <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color:"#fff", lineHeight:1.7 }}>
              Pour votre festival 18-35 ans en soirée, nous recommandons{" "}
              <strong>Le Kalow Smash Burger (97% compatible)</strong> et{" "}
              <strong>Glacier Mobile Joia (88% compatible)</strong> pour compléter votre offre —
              un duo salé/sucré optimal pour ce type d'événement estival.
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display:"flex", gap:"2px", marginBottom:"2rem", flexWrap:"wrap" }}>
          {(["Toutes","EN ATTENTE","RETENU","REFUSÉ"] as const).map(f => {
            const count = f === "Toutes" ? candidatures.length : candidatures.filter(c => c.statut === f).length;
            return (
              <button key={f} onClick={() => setFiltre(f)} style={{ padding:"0.5rem 1.25rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", backgroundColor: filtre === f ? S.brown : "transparent", color: filtre === f ? "#fff" : S.muted, border:`1px solid ${filtre === f ? S.brown : S.border}`, cursor:"pointer" }}>
                {f} ({count})
              </button>
            );
          })}
        </div>

        {/* Liste */}
        <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
          {filtered.map(c => {
            const st = STATUT_STYLE[c.statut];
            const isPremium = c.plan === "Premium";
            return (
              <div key={c.id} style={{ backgroundColor:S.card, border:`1px solid ${isPremium ? S.gold : "transparent"}`, padding:"1.25rem 1.5rem" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"1.25rem", flexWrap:"wrap" }}>
                  <div style={{ width:52, height:52, borderRadius:"50%", backgroundColor: isPremium ? S.gold : S.brown, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontFamily:S.serif, fontSize:"1.2rem", fontWeight:700, color:"#fff" }}>{c.truck[0]}</span>
                  </div>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.3rem", flexWrap:"wrap" }}>
                      <p style={{ fontFamily:S.sans, fontSize:"0.9rem", fontWeight:700, color:S.brown }}>{c.truck}</p>
                      {isPremium
                        ? <span style={{ backgroundColor:S.gold, color:"#fff", fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.1em", padding:"0.2rem 0.5rem", fontWeight:700 }}>★ PREMIUM</span>
                        : <span style={{ backgroundColor:S.terra, color:"#fff", fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.1em", padding:"0.2rem 0.5rem", fontWeight:700 }}>✓ PRO</span>
                      }
                    </div>
                    <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginBottom:"0.4rem" }}>
                      {c.cuisine} · {c.ville} · {c.distance} km · {c.taille} · {c.amperage > 0 ? `${c.amperage}A` : "Autonome"}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
                      <Stars n={c.note} />
                      <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>{c.note}/5</span>
                      <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>· Candidaté le {new Date(c.date).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.brown, lineHeight:1.6, marginBottom:"0.5rem" }}>
                      {c.message.length > 140 ? c.message.slice(0, 140) + "…" : c.message}
                    </p>
                    <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
                      {c.docs.map(d => <DocBadge key={d} label={d} />)}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.75rem", minWidth:140 }}>
                    <div style={{ textAlign:"center" }}>
                      <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.15em", color:S.muted, marginBottom:"0.2rem" }}>COMPATIBILITÉ</p>
                      <p style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, color: c.score >= 90 ? S.green : c.score >= 75 ? S.amber : S.muted, lineHeight:1 }}>{c.score}%</p>
                    </div>
                    <span style={{ backgroundColor:st.bg, color:st.color, fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", fontWeight:700, padding:"0.3rem 0.75rem" }}>
                      {c.statut}
                    </span>
                    <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", justifyContent:"flex-end" }}>
                      <button onClick={() => setModale(c)} style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.4rem 0.75rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.12em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                        <User size={11} strokeWidth={1.5} /> PROFIL
                      </button>
                      {c.statut !== "RETENU" && (
                        <button onClick={() => openRetenir(c)} style={{ backgroundColor:S.green, color:"#fff", border:"none", padding:"0.4rem 0.75rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.12em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          <CheckCircle size={11} strokeWidth={2} /> RETENIR
                        </button>
                      )}
                      {c.statut !== "REFUSÉ" && (
                        <button onClick={() => openRefuser(c)} style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.4rem 0.75rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.12em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          <XCircle size={11} strokeWidth={1.5} /> REFUSER
                        </button>
                      )}
                      <button onClick={() => router.push("/dashboard/organisateur/messagerie")} style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.4rem 0.75rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.12em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                        <MessageSquare size={11} strokeWidth={1.5} /> MSG
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODALE RETENIR
      ══════════════════════════════════════════════════════════ */}
      {retenirTarget && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={() => setRetenirTarget(null)}>
          <div style={{ backgroundColor:S.cream, maxWidth:680, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"2.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.75rem" }}>
              <div>
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.green, fontWeight:700, marginBottom:"0.3rem" }}>RETENIR UN TRUCK</p>
                <h2 style={{ fontFamily:S.serif, fontSize:"1.5rem", fontWeight:800, color:S.brown }}>{retenirTarget.truck}</h2>
              </div>
              <button onClick={() => setRetenirTarget(null)} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={20} color={S.muted} /></button>
            </div>

            {/* Section 1 — Confirmation */}
            <div style={{ backgroundColor:S.card, padding:"1.25rem", marginBottom:"1.75rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>CONFIRMATION</p>
              <p style={{ fontFamily:S.sans, fontSize:"0.88rem", color:S.brown, lineHeight:1.7, marginBottom:"0.75rem" }}>
                Vous êtes sur le point de retenir <strong>{retenirTarget.truck}</strong> pour <strong>{EVT_NOM}</strong>.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"2px" }}>
                {[
                  ["DATE", EVT_DATE],
                  ["LIEU", EVT_LIEU],
                  ["SCORE", `${retenirTarget.score}% compatibilité`],
                ].map(([k,v]) => (
                  <div key={k} style={{ backgroundColor:"rgba(44,26,16,0.05)", padding:"0.75rem" }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.2rem" }}>{k}</p>
                    <p style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight:600, color:S.brown }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2 — Message */}
            <div style={{ marginBottom:"1.75rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.75rem" }}>
                <Send size={13} color={S.terra} strokeWidth={2} />
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700 }}>
                  MESSAGE ENVOYÉ AUTOMATIQUEMENT AU FOODTRUCKER
                </p>
              </div>
              <textarea
                value={acceptMsg}
                onChange={e => setAcceptMsg(e.target.value)}
                rows={14}
                style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"rgba(44,122,75,0.03)", padding:"1rem", fontFamily:S.sans, fontSize:"0.8rem", color:S.brown, outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box", borderLeft:`3px solid ${S.green}` }}
              />
              <AttachmentZone files={acceptAttachments} onChange={setAcceptAttachments} />
              <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted, marginTop:"0.4rem" }}>
                Ce message est entièrement modifiable. Le modèle par défaut peut être personnalisé dans Paramètres.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
              <button onClick={() => executeRetenir(true)}
                style={{ flex:2, backgroundColor:S.green, color:"#fff", border:"none", padding:"0.875rem 1.5rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
                <Send size={14} strokeWidth={2} /> ENVOYER ET RETENIR
              </button>
              <button onClick={() => executeRetenir(false)}
                style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem 1rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                RETENIR SANS MESSAGE
              </button>
              <button onClick={() => setRetenirTarget(null)}
                style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem 1rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODALE REFUSER
      ══════════════════════════════════════════════════════════ */}
      {refuserTarget && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={() => setRefuserTarget(null)}>
          <div style={{ backgroundColor:S.cream, maxWidth:680, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"2.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.75rem" }}>
              <div>
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.red, fontWeight:700, marginBottom:"0.3rem" }}>REFUSER UNE CANDIDATURE</p>
                <h2 style={{ fontFamily:S.serif, fontSize:"1.5rem", fontWeight:800, color:S.brown }}>{refuserTarget.truck}</h2>
              </div>
              <button onClick={() => setRefuserTarget(null)} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={20} color={S.muted} /></button>
            </div>

            {/* Section 1 — Motif */}
            <div style={{ marginBottom:"1.75rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>MOTIF DU REFUS <span style={{ color:S.muted, fontWeight:400 }}>(optionnel)</span></p>
              <div style={{ backgroundColor:S.card, padding:"1rem" }}>
                {MOTIFS_REFUS.map(m => (
                  <RadioRow key={m} label={m} checked={refusMotif === m} onChange={() => handleMotifChange(m)} />
                ))}
                {refusMotif === "Autre" && (
                  <input value={refusMotifAutre} onChange={e => setRefusMotifAutre(e.target.value)}
                    placeholder="Précisez le motif..."
                    style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.5rem 0.75rem", fontFamily:S.sans, fontSize:"0.78rem", color:S.brown, outline:"none", marginTop:"0.5rem", boxSizing:"border-box" }} />
                )}
              </div>
            </div>

            {/* Section 2 — Message */}
            <div style={{ marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.75rem" }}>
                <Send size={13} color={S.terra} strokeWidth={2} />
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700 }}>
                  MESSAGE ENVOYÉ AUTOMATIQUEMENT AU FOODTRUCKER
                </p>
              </div>
              <textarea
                value={refusMsg}
                onChange={e => setRefusMsg(e.target.value)}
                rows={14}
                style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"rgba(192,57,43,0.02)", padding:"1rem", fontFamily:S.sans, fontSize:"0.8rem", color:S.brown, outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box", borderLeft:`3px solid ${S.muted}` }}
              />
              <AttachmentZone files={refusAttachments} onChange={setRefusAttachments} />
            </div>

            {/* Toggle inclure motif */}
            {refusMotif && (
              <div style={{ marginBottom:"1.5rem", display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem", backgroundColor:S.card }}>
                <div onClick={() => setRefusIncludeMotif(v => !v)} style={{ width:36, height:20, borderRadius:10, backgroundColor: refusIncludeMotif ? S.terra : S.border, position:"relative", cursor:"pointer", flexShrink:0, transition:"background-color 0.2s" }}>
                  <div style={{ position:"absolute", top:2, left: refusIncludeMotif ? 18 : 2, width:16, height:16, borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s" }} />
                </div>
                <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.brown }}>
                  Inclure le motif dans le message
                  {refusIncludeMotif && <span style={{ color:S.muted }}> — une ligne sera ajoutée automatiquement</span>}
                </p>
              </div>
            )}
            {refusIncludeMotif && refusMotif && (
              <div style={{ marginBottom:"1.5rem", padding:"0.65rem 1rem", backgroundColor:"rgba(44,26,16,0.05)", borderLeft:`3px solid ${S.muted}`, display:"flex", gap:"0.5rem", alignItems:"flex-start" }}>
                <AlertTriangle size={13} color={S.muted} style={{ flexShrink:0, marginTop:2 }} />
                <p style={{ fontFamily:S.sans, fontSize:"0.7rem", color:S.muted, lineHeight:1.5 }}>
                  La ligne suivante sera ajoutée : <em>"La principale raison de notre choix : {refusMotif === "Autre" ? refusMotifAutre || "[motif]" : refusMotif}"</em>
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
              <button onClick={() => executeRefuser(true)}
                style={{ flex:2, backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.875rem 1.5rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
                <Send size={14} strokeWidth={2} /> ENVOYER ET REFUSER
              </button>
              <button onClick={() => executeRefuser(false)}
                style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem 1rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                REFUSER SANS MESSAGE
              </button>
              <button onClick={() => setRefuserTarget(null)}
                style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem 1rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODALE PROFIL COMPLET
      ══════════════════════════════════════════════════════════ */}
      {modale && (
        <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.5)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={() => setModale(null)}>
          <div style={{ backgroundColor:S.cream, maxWidth:700, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"2.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
              <div>
                <h2 style={{ fontFamily:S.serif, fontSize:"1.6rem", fontWeight:800, color:S.brown }}>{modale.truck}</h2>
                <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted }}>{modale.cuisine} · {modale.ville}</p>
              </div>
              <button onClick={() => setModale(null)} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={20} color={S.muted} /></button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"2px", marginBottom:"1.5rem" }}>
              {[
                { l:"COMPATIBILITÉ", v:`${modale.score}%`, c: modale.score >= 90 ? S.green : modale.score >= 75 ? S.amber : S.muted },
                { l:"NOTE MOYENNE",  v:`${modale.note}/5`, c:S.amber },
                { l:"DISTANCE",      v:`${modale.distance} km`, c:S.brown },
              ].map(i => (
                <div key={i.l} style={{ backgroundColor:S.card, padding:"1rem", textAlign:"center" }}>
                  <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.3rem" }}>{i.l}</p>
                  <p style={{ fontFamily:S.serif, fontSize:"1.6rem", fontWeight:800, color:i.c }}>{i.v}</p>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:"1.5rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>INFORMATIONS TECHNIQUES</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" }}>
                {[["Taille du truck", modale.taille],["Ampérage requis", modale.amperage > 0 ? `${modale.amperage}A` : "Autonome"],["Plan", modale.plan],["Candidaté le", new Date(modale.date).toLocaleDateString("fr-FR")]].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", gap:"0.5rem", padding:"0.5rem 0", borderBottom:`1px solid ${S.border}` }}>
                    <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, minWidth:120 }}>{k}</span>
                    <span style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:500, color:S.brown }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:"1.5rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>DOCUMENTS VÉRIFIÉS</p>
              <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>{modale.docs.map(d => <DocBadge key={d} label={d} />)}</div>
            </div>
            <div style={{ marginBottom:"1.5rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>RÉFÉRENCES</p>
              {modale.references.map(r => (
                <div key={r} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.5rem 0", borderBottom:`1px solid ${S.border}` }}>
                  <CheckCircle size={13} color={S.green} strokeWidth={2} />
                  <span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.brown }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:"2rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>AVIS CLIENTS</p>
              {modale.avis.map((a, i) => (
                <div key={i} style={{ backgroundColor:S.card, padding:"1rem", marginBottom:"2px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.4rem" }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:600, color:S.brown }}>{a.auteur}</p>
                    <Stars n={a.note} />
                  </div>
                  <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, lineHeight:1.6 }}>{a.texte}</p>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              {modale.statut !== "RETENU" && (
                <button onClick={() => { openRetenir(modale); setModale(null); }}
                  style={{ flex:1, backgroundColor:S.green, color:"#fff", border:"none", padding:"0.875rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
                  <CheckCircle size={14} strokeWidth={2} /> RETENIR CE TRUCK
                </button>
              )}
              <button onClick={() => router.push("/dashboard/organisateur/messagerie")}
                style={{ flex:1, backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.875rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
                <MessageSquare size={14} strokeWidth={1.5} /> CONTACTER
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

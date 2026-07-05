"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import {
  Send, CheckCircle, Paperclip, FileText, Image as ImageIcon, X,
  Search, Plus, Users, MoreHorizontal, Trash2, AlertTriangle,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B", red:    "#C0392B",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

// ─── Pièces jointes ───────────────────────────────────────────
interface Attachment { id:string; name:string; size:string; mime:"pdf"|"doc"|"image"; url?:string }
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
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function AttachIcon({ mime, size = 13 }: { mime:Attachment["mime"]; size?:number }) {
  if (mime === "pdf")   return <FileText  size={size} color="#C0392B" strokeWidth={1.5} />;
  if (mime === "image") return <ImageIcon size={size} color="#2E6DA4" strokeWidth={1.5} />;
  return                       <FileText  size={size} color="#2C7A4B" strokeWidth={1.5} />;
}

// ─── Types ────────────────────────────────────────────────────
interface Message {
  id:    string;
  from:  "orga" | "truck";
  texte: string;
  heure: string;
  lu:    boolean;
  sender?: string;       // pour les groupes : qui parle côté truck
  attachments?: Attachment[];
}

interface Conv {
  id:        string;
  truck:     string;     // nom affiché (ou nom du groupe)
  cuisine:   string;
  statut:    "RETENU" | "EN ATTENTE";
  messages:  Message[];
  lastMsg:   string;
  lastDate:  string;
  nonLus:    number;
  groupe?:   boolean;
  groupeNom?: string;
  membres?:  string[];   // noms des trucks dans le groupe
}

// ─── Catalogue trucks ─────────────────────────────────────────
const TRUCKS_CATALOG = [
  { id:"t01", nom:"Le Kalow Smash Burger", cuisine:"Burgers américains",   plan:"Premium" as const, favori:true  },
  { id:"t02", nom:"Sweet Nomad Crêpes",    cuisine:"Crêperie bretonne",    plan:"Pro"     as const, favori:true  },
  { id:"t03", nom:"Pizza Nomade",          cuisine:"Pizza napolitaine",    plan:"Premium" as const, favori:true  },
  { id:"t04", nom:"Glacier Mobile Joia",   cuisine:"Glaces artisanales",   plan:"Premium" as const, favori:true  },
  { id:"t05", nom:"Tacos del Sol",         cuisine:"Mexicain",             plan:"Pro"     as const, favori:false },
  { id:"t06", nom:"Wok Express",           cuisine:"Cuisine asiatique",    plan:"Pro"     as const, favori:false },
  { id:"t07", nom:"BBQ du Périgord",       cuisine:"Grillades régionales", plan:"Pro"     as const, favori:false },
  { id:"t08", nom:"Burger Végétal",        cuisine:"Végétarien/Vegan",    plan:"Pro"     as const, favori:false },
  { id:"t09", nom:"Ramen Izakaya",         cuisine:"Japonais",             plan:"Pro"     as const, favori:false },
  { id:"t10", nom:"Cevicheria Pacifica",   cuisine:"Péruvien",             plan:"Premium" as const, favori:false },
];

// ─── Données initiales ────────────────────────────────────────
const CONVS_INIT: Conv[] = [
  {
    id:"conv1", truck:"Le Kalow Smash Burger", cuisine:"Burgers américains", statut:"RETENU",
    lastMsg:"Super ! On confirme pour le 21 juin.", lastDate:"Aujourd'hui 10:24", nonLus:1,
    messages:[
      { id:"m1", from:"orga",  texte:"Bonjour, nous sommes intéressés par votre candidature pour le Festival Solstice. Êtes-vous disponibles pour une arrivée à 10h le 21 juin ?", heure:"Hier 14:32", lu:true },
      { id:"m2", from:"truck", texte:"Bonjour Sophie ! Oui tout à fait, 10h c'est parfait. Nous avons besoin de 2h de mise en place. Pouvez-vous confirmer l'emplacement exact ?", heure:"Hier 15:18", lu:true },
      { id:"m3", from:"orga",  texte:"Parfait. Emplacement B3, côté scène principale. Le plan et le règlement sont joints.", heure:"Hier 16:45", lu:true, attachments:[{ id:"a1", name:"Plan_Festival_Solstice_2026.pdf", size:"1.2 MB", mime:"pdf" },{ id:"a2", name:"Reglement_interieur.pdf", size:"340 KB", mime:"pdf" }] },
      { id:"m4", from:"truck", texte:"Oui, 16A en monophasé. Super ! On confirme pour le 21 juin.", heure:"Aujourd'hui 10:24", lu:false },
    ]
  },
  {
    id:"conv2", truck:"Tacos del Sol", cuisine:"Mexicain", statut:"RETENU",
    lastMsg:"Reçu, merci pour les informations !", lastDate:"Hier 18:05", nonLus:0,
    messages:[
      { id:"m1", from:"orga",  texte:"Bonjour ! Votre candidature pour le Festival Solstice a bien été retenue. Bienvenue dans l'équipe !", heure:"2026-06-03 09:00", lu:true, attachments:[{ id:"a1", name:"Brief_logistique_Solstice.docx", size:"89 KB", mime:"doc" }] },
      { id:"m2", from:"truck", texte:"Merci beaucoup ! Quels sont les horaires exacts d'ouverture au public ?", heure:"2026-06-03 11:22", lu:true },
      { id:"m3", from:"orga",  texte:"Le festival ouvre à 12h, ferme à 23h. Opérationnels dès 11h30.", heure:"2026-06-03 14:00", lu:true },
      { id:"m4", from:"truck", texte:"Reçu, merci pour les informations !", heure:"Hier 18:05", lu:true },
    ]
  },
  {
    id:"conv3", truck:"Festival Solstice — Trucks retenus", cuisine:"", statut:"RETENU",
    lastMsg:"Rappel : réunion technique vendredi 14h en visio.", lastDate:"Aujourd'hui 09:00", nonLus:0,
    groupe:true, groupeNom:"Festival Solstice — Trucks retenus",
    membres:["Le Kalow Smash Burger","Tacos del Sol","Pizza Nomade"],
    messages:[
      { id:"m1", from:"orga", texte:"Bonjour à tous ! Ce groupe est créé pour coordonner la logistique du Festival Solstice 2026. Merci de vous présenter brièvement.", heure:"2026-06-03 10:00", lu:true },
      { id:"m2", from:"truck", texte:"Bonjour ! Le Kalow Smash Burger, présent et motivé !", heure:"2026-06-03 10:15", lu:true, sender:"Le Kalow Smash Burger" },
      { id:"m3", from:"truck", texte:"Tacos del Sol ici, hâte de participer !", heure:"2026-06-03 10:22", lu:true, sender:"Tacos del Sol" },
      { id:"m4", from:"truck", texte:"Pizza Nomade, bonjour à tous. Nous serons là dès 9h !", heure:"2026-06-03 10:45", lu:true, sender:"Pizza Nomade" },
      { id:"m5", from:"orga", texte:"Parfait ! Rappel : réunion technique vendredi 14h en visio.", heure:"Aujourd'hui 09:00", lu:true },
    ]
  },
];

// ─── MessageBubble ────────────────────────────────────────────
function MessageBubble({ m, isGroupe }: { m:Message; isGroupe?:boolean }) {
  const isOrga = m.from === "orga";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems: isOrga ? "flex-end" : "flex-start" }}>
      {/* Nom expéditeur (groupes uniquement, côté truck) */}
      {isGroupe && !isOrga && m.sender && (
        <p style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.terra, fontWeight:600, marginBottom:"0.25rem", letterSpacing:"0.05em" }}>
          {m.sender}
        </p>
      )}
      <div style={{ maxWidth:"72%", backgroundColor: isOrga ? S.terra : S.card, padding:"0.875rem 1.25rem", borderRadius: isOrga ? "12px 12px 2px 12px" : "12px 12px 12px 2px" }}>
        <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color: isOrga ? "#fff" : S.brown, lineHeight:1.6 }}>{m.texte}</p>
        {m.attachments && m.attachments.length > 0 && (
          <div style={{ marginTop:"0.6rem", display:"flex", flexDirection:"column", gap:"0.3rem" }}>
            {m.attachments.map(f => (
              <div key={f.id} onClick={() => { if (f.url) window.open(f.url, "_blank", "noopener,noreferrer"); }}
                style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.4rem 0.65rem", backgroundColor: isOrga ? "rgba(255,255,255,0.15)" : "rgba(44,26,16,0.06)", borderRadius:4, cursor: f.url ? "pointer" : "default" }}>
                <AttachIcon mime={f.mime} size={12} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontFamily:S.sans, fontSize:"0.68rem", fontWeight:500, color: isOrga ? "#fff" : S.brown, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</p>
                  <p style={{ fontFamily:S.sans, fontSize:"0.58rem", color: isOrga ? "rgba(255,255,255,0.65)" : S.muted }}>{f.size}</p>
                </div>
                <span style={{ fontFamily:S.sans, fontSize:"0.58rem", color: isOrga ? "rgba(255,255,255,0.7)" : S.muted }}>↓</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:"0.3rem", marginTop:"0.3rem" }}>
        <span style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted }}>{m.heure}</span>
        {isOrga && m.lu && <CheckCircle size={10} color={S.green} strokeWidth={2} />}
      </div>
    </div>
  );
}

// ─── MessageInput ─────────────────────────────────────────────
function MessageInput({ draft, onDraftChange, pending, onPendingChange, onSend, canSend }: {
  draft:string; onDraftChange:(v:string)=>void;
  pending:Attachment[]; onPendingChange:(a:Attachment[])=>void;
  onSend:()=>void; canSend:boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.slice(0, MAX_FILES - pending.length).filter(f => f.size <= MAX_MB * 1024 * 1024)
      .map(f => ({ id:`a-${Date.now()}-${Math.random()}`, name:f.name, size:fmtSize(f.size), mime:mimeOf(f.name), url:URL.createObjectURL(f) }));
    onPendingChange([...pending, ...toAdd]);
    if (fileRef.current) fileRef.current.value = "";
  };
  return (
    <div style={{ borderTop:`1px solid ${S.border}`, backgroundColor:S.cream, flexShrink:0 }}>
      {pending.length > 0 && (
        <div style={{ padding:"0.75rem 2rem 0", display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
          {pending.map(f => (
            <div key={f.id} style={{ display:"flex", alignItems:"center", gap:"0.45rem", padding:"0.35rem 0.65rem", backgroundColor:S.card, border:`1px solid ${S.border}` }}>
              <AttachIcon mime={f.mime} />
              <span style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.brown }}>{f.name}</span>
              <span style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted }}>({f.size})</span>
              <button onClick={() => onPendingChange(pending.filter(x => x.id !== f.id))} style={{ background:"none", border:"none", cursor:"pointer", color:S.muted, display:"flex", alignItems:"center" }}>
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding:"1rem 2rem 1.25rem", display:"flex", gap:"0.75rem", alignItems:"flex-end" }}>
        <div style={{ flex:1 }}>
          <textarea value={draft} onChange={e => onDraftChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Écrivez votre message… (Entrée pour envoyer)" rows={2}
            style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.75rem 1rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none", resize:"none", boxSizing:"border-box" }}
          />
          {pending.length < MAX_FILES && (
            <>
              <input ref={fileRef} type="file" multiple accept={ACCEPT_TYPES} onChange={pick} style={{ display:"none" }} />
              <button onClick={() => fileRef.current?.click()} style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:"none", border:"none", cursor:"pointer", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.12em", color:S.muted, padding:"0.3rem 0", marginTop:"0.3rem" }}>
                <Paperclip size={11} strokeWidth={1.5} />
                JOINDRE UN FICHIER
                <span style={{ color:S.border, marginLeft:"0.25rem" }}>{pending.length}/{MAX_FILES} · PDF, DOC, JPG, PNG · max {MAX_MB}MB</span>
              </button>
            </>
          )}
        </div>
        <button onClick={onSend} disabled={!canSend}
          style={{ backgroundColor: canSend ? S.terra : S.border, color:"#fff", border:"none", padding:"0.875rem 1.5rem", cursor: canSend ? "pointer" : "not-allowed", display:"flex", alignItems:"center", gap:"0.4rem", flexShrink:0, alignSelf:"flex-start", marginTop:"0.1rem" }}>
          <Send size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ─── Modale Nouvelle Conversation ────────────────────────────
function NouvelleConvModal({ onClose, onCreer }: {
  onClose: () => void;
  onCreer: (conv: Omit<Conv,"nonLus"|"lastDate">) => void;
}) {
  const [searchTruck,   setSearchTruck]   = useState("");
  const [estGroupe,     setEstGroupe]     = useState(false);
  const [selTrucks,     setSelTrucks]     = useState<string[]>([]);
  const [groupeNom,     setGroupeNom]     = useState("");
  const [premierMsg,    setPremierMsg]    = useState("");
  const [attachments,   setAttachments]   = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files
      .slice(0, MAX_FILES - attachments.length)
      .filter(f => f.size <= MAX_MB * 1024 * 1024)
      .map(f => ({ id:`nc-${Date.now()}-${Math.random()}`, name:f.name, size:fmtSize(f.size), mime:mimeOf(f.name), url:URL.createObjectURL(f) }));
    setAttachments(prev => [...prev, ...toAdd]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const catalogFiltre = useMemo(() => {
    const q = searchTruck.toLowerCase();
    const list = [...TRUCKS_CATALOG].sort((a,b) => (b.favori ? 1 : 0) - (a.favori ? 1 : 0));
    return q ? list.filter(t => t.nom.toLowerCase().includes(q) || t.cuisine.toLowerCase().includes(q)) : list;
  }, [searchTruck]);

  const toggleTruck = (nom: string) => {
    if (!estGroupe) {
      setSelTrucks([nom]);
    } else {
      setSelTrucks(prev => prev.includes(nom) ? prev.filter(x => x !== nom) : [...prev, nom]);
    }
  };

  const canCreate = selTrucks.length > 0 && (premierMsg.trim().length > 0 || attachments.length > 0);

  const creer = () => {
    if (!canCreate) return;
    const isGrp = estGroupe && selTrucks.length > 1;
    const nomConv = isGrp ? (groupeNom.trim() || selTrucks.join(", ")) : selTrucks[0];
    const cuisine = isGrp ? "" : (TRUCKS_CATALOG.find(t => t.nom === selTrucks[0])?.cuisine ?? "");
    const conv: Omit<Conv,"nonLus"|"lastDate"> = {
      id: `conv-${Date.now()}`,
      truck: nomConv, cuisine, statut: "EN ATTENTE",
      messages: [{ id:`m${Date.now()}`, from:"orga", texte:premierMsg.trim(), heure:"Maintenant", lu:true, attachments: attachments.length > 0 ? [...attachments] : undefined }],
      lastMsg: attachments.length > 0 && !premierMsg.trim() ? `📎 ${attachments.length} fichier(s) joint(s)` : premierMsg.trim(),
      groupe: isGrp || undefined,
      groupeNom: isGrp ? nomConv : undefined,
      membres: isGrp ? selTrucks : undefined,
    };
    onCreer(conv);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={onClose}>
      <div style={{ backgroundColor:S.cream, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto", padding:"2.5rem" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.75rem" }}>
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.25rem" }}>MESSAGERIE</p>
            <h2 style={{ fontFamily:S.serif, fontSize:"1.5rem", fontWeight:800, color:S.brown }}>Nouvelle conversation</h2>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={20} color={S.muted} /></button>
        </div>

        {/* Toggle groupe */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.875rem 1rem", backgroundColor:S.card, marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
            <Users size={15} color={estGroupe ? S.terra : S.muted} strokeWidth={1.5} />
            <span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:estGroupe ? S.brown : S.muted, fontWeight: estGroupe ? 600 : 400 }}>
              CONVERSATION GROUPÉE
            </span>
          </div>
          <div onClick={() => { setEstGroupe(v => !v); setSelTrucks([]); }}
            style={{ width:38, height:21, borderRadius:10.5, backgroundColor: estGroupe ? S.terra : S.border, position:"relative", cursor:"pointer", flexShrink:0, transition:"background-color 0.2s" }}>
            <div style={{ position:"absolute", top:2.5, left: estGroupe ? 19 : 2.5, width:16, height:16, borderRadius:"50%", backgroundColor:"#fff", transition:"left 0.2s" }} />
          </div>
        </div>

        {/* Tags trucks sélectionnés */}
        {selTrucks.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem", marginBottom:"1rem" }}>
            {selTrucks.map(nom => (
              <div key={nom} style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.3rem 0.65rem", backgroundColor:S.terra, borderRadius:2 }}>
                <span style={{ fontFamily:S.sans, fontSize:"0.68rem", color:"#fff" }}>{nom}</span>
                <button onClick={() => setSelTrucks(prev => prev.filter(x => x !== nom))} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.7)", display:"flex", padding:0 }}>
                  <X size={11} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Nom de groupe */}
        {estGroupe && selTrucks.length > 1 && (
          <div style={{ marginBottom:"1rem" }}>
            <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, display:"block", marginBottom:"0.35rem" }}>
              NOM DU GROUPE <span style={{ color:S.border }}>(optionnel)</span>
            </label>
            <input value={groupeNom} onChange={e => setGroupeNom(e.target.value)}
              placeholder="Ex: Festival Garorock 2026 — Trucks retenus"
              style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none", boxSizing:"border-box" }} />
          </div>
        )}

        {/* Recherche truck */}
        <div style={{ marginBottom:"0.75rem" }}>
          <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, display:"block", marginBottom:"0.35rem" }}>
            {estGroupe ? "SÉLECTIONNER LES TRUCKS (plusieurs)" : "SÉLECTIONNER UN TRUCK"}
          </label>
          <div style={{ position:"relative" }}>
            <Search size={13} color={S.muted} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
            <input value={searchTruck} onChange={e => setSearchTruck(e.target.value)}
              placeholder="Rechercher par nom ou cuisine..."
              style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.55rem 0.75rem 0.55rem 2.25rem", fontFamily:S.sans, fontSize:"0.78rem", color:S.brown, outline:"none", boxSizing:"border-box" }} />
            {searchTruck && <button onClick={() => setSearchTruck("")} style={{ position:"absolute", right:"0.5rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer" }}><X size={12} color={S.muted} /></button>}
          </div>
        </div>

        {/* Liste trucks */}
        <div style={{ maxHeight:220, overflowY:"auto", border:`1px solid ${S.border}`, marginBottom:"1.25rem" }}>
          {catalogFiltre.length === 0 ? (
            <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.muted, padding:"1.25rem", textAlign:"center" }}>Aucun truck trouvé</p>
          ) : (
            catalogFiltre.map(t => {
              const sel = selTrucks.includes(t.nom);
              return (
                <div key={t.id} onClick={() => toggleTruck(t.nom)}
                  style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 1rem", borderBottom:`1px solid ${S.border}`, cursor:"pointer", backgroundColor: sel ? "rgba(196,98,45,0.07)" : "transparent" }}>
                  {/* Checkbox (groupe) ou radio (solo) */}
                  <div style={{ width:16, height:16, border:`2px solid ${sel ? S.terra : S.border}`, backgroundColor: sel ? S.terra : "transparent", borderRadius: estGroupe ? 2 : "50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {sel && <CheckCircle size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  {/* Avatar */}
                  <div style={{ width:32, height:32, borderRadius:"50%", backgroundColor:S.brown, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontFamily:S.serif, fontSize:"0.75rem", fontWeight:700, color:"#fff" }}>{t.nom[0]}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight: sel ? 600 : 400, color:S.brown }}>{t.nom}</span>
                      {t.favori && <span style={{ fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.12em", color:S.terra, backgroundColor:"rgba(196,98,45,0.1)", padding:"0.1rem 0.35rem" }}>FAV</span>}
                      {t.plan === "Premium" && <span style={{ fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.1em", color:"#D4A017", backgroundColor:"rgba(212,160,23,0.1)", padding:"0.1rem 0.35rem" }}>★ PREMIUM</span>}
                    </div>
                    <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>{t.cuisine}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Premier message + pièces jointes */}
        <div style={{ marginBottom:"1.5rem" }}>
          <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, display:"block", marginBottom:"0.35rem" }}>
            PREMIER MESSAGE {attachments.length === 0 && <span style={{ color:S.border }}>*</span>}
          </label>
          <textarea value={premierMsg} onChange={e => setPremierMsg(e.target.value)} rows={3}
            placeholder="Rédigez votre message d'ouverture..."
            style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.82rem", color:S.brown, outline:"none", resize:"none", boxSizing:"border-box" }} />

          {/* Fichiers déjà joints */}
          {attachments.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem", marginTop:"0.6rem" }}>
              {attachments.map(f => (
                <div key={f.id} style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.5rem 0.75rem", backgroundColor:S.card, border:`1px solid ${S.border}` }}>
                  <AttachIcon mime={f.mime} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:500, color:S.brown, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</p>
                    <p style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted }}>{f.size}</p>
                  </div>
                  <button onClick={() => setAttachments(prev => prev.filter(x => x.id !== f.id))}
                    style={{ background:"none", border:"none", cursor:"pointer", color:S.muted, display:"flex", alignItems:"center", flexShrink:0 }}>
                    <X size={13} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bouton ajouter */}
          {attachments.length < MAX_FILES && (
            <>
              <input ref={fileRef} type="file" multiple accept={ACCEPT_TYPES} onChange={pickFiles} style={{ display:"none" }} />
              <button onClick={() => fileRef.current?.click()}
                style={{ display:"flex", alignItems:"center", gap:"0.45rem", width:"100%", marginTop:"0.5rem", border:`1px dashed ${S.border}`, backgroundColor:"transparent", padding:"0.5rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", color:S.muted, cursor:"pointer" }}>
                <Paperclip size={12} strokeWidth={1.5} />
                AJOUTER UNE PIÈCE JOINTE
                <span style={{ marginLeft:"auto", color:S.border }}>{attachments.length}/{MAX_FILES} · PDF, DOC, JPG, PNG · max {MAX_MB}MB</span>
              </button>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <button onClick={creer} disabled={!canCreate}
            style={{ flex:2, backgroundColor: canCreate ? S.terra : S.border, color:"#fff", border:"none", padding:"0.875rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor: canCreate ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
            <Send size={14} strokeWidth={2} /> ENVOYER
          </button>
          <button onClick={onClose}
            style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.15em", cursor:"pointer" }}>
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modale confirmation suppression ─────────────────────────
function ConfirmDeleteModal({ nom, onConfirm, onClose }: { nom:string; onConfirm:()=>void; onClose:()=>void }) {
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={onClose}>
      <div style={{ backgroundColor:S.cream, maxWidth:420, width:"100%", padding:"2rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:"0.875rem", marginBottom:"1.5rem" }}>
          <AlertTriangle size={22} color={S.red} strokeWidth={1.5} style={{ flexShrink:0, marginTop:2 }} />
          <div>
            <h3 style={{ fontFamily:S.serif, fontSize:"1.15rem", fontWeight:700, color:S.brown, marginBottom:"0.4rem" }}>Supprimer cette conversation ?</h3>
            <p style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight:300, color:S.muted, lineHeight:1.6 }}>
              La conversation avec <strong style={{ color:S.brown }}>{nom}</strong> sera définitivement supprimée. Cette action est irréversible.
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <button onClick={onConfirm} style={{ flex:1, backgroundColor:S.red, color:"#fff", border:"none", padding:"0.75rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer" }}>
            SUPPRIMER
          </button>
          <button onClick={onClose} style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.75rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer" }}>
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
function MessageriePageInner() {
  const searchParams = useSearchParams();
  const [convs,    setConvs]    = useState<Conv[]>(CONVS_INIT);
  const [activeId, setActiveId] = useState<string>("conv1");
  const [draft,    setDraft]    = useState("");
  const [pending,  setPending]  = useState<Attachment[]>([]);
  const bottomRef              = useRef<HTMLDivElement>(null);

  // ── Deep-link : ouvrir ou créer la conversation d'un truck ──
  // (ex: venant du bouton "MSG" des candidatures : ?truck=Nom&cuisine=Cuisine)
  useEffect(() => {
    const truckParam = searchParams.get("truck");
    if (!truckParam) return;
    const cuisineParam = searchParams.get("cuisine") || "";
    setConvs(prev => {
      const existing = prev.find(c => !c.groupe && c.truck.toLowerCase() === truckParam.toLowerCase());
      if (existing) {
        setActiveId(existing.id);
        return prev;
      }
      const newConv: Conv = {
        id: `conv-${Date.now()}`,
        truck: truckParam,
        cuisine: cuisineParam,
        statut: "EN ATTENTE",
        messages: [],
        lastMsg: "",
        lastDate: "Maintenant",
        nonLus: 0,
      };
      setActiveId(newConv.id);
      return [newConv, ...prev];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Features ──────────────────────────────────────────────
  const [query,        setQuery]       = useState("");
  const [showNewConv,  setShowNewConv] = useState(false);
  const [menuOpen,     setMenuOpen]    = useState<string|null>(null);
  const [deleteTarget, setDeleteTarget]= useState<string|null>(null);
  const [toast,        setToast]       = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }, []);

  // ── Conversation active ───────────────────────────────────
  const activeConv = convs.find(c => c.id === activeId) ?? convs[0];

  // ── Scroll bas ────────────────────────────────────────────
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [activeConv?.messages.length]);

  // ── Reset saisie au changement de conv ───────────────────
  useEffect(() => { setDraft(""); setPending([]); }, [activeId]);

  // ── Fermer menu "..." si clic en dehors ──────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  // ── Filtre recherche ──────────────────────────────────────
  const filteredConvs = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return convs;
    return convs.filter(c =>
      c.truck.toLowerCase().includes(q) ||
      c.lastMsg.toLowerCase().includes(q) ||
      (c.groupeNom?.toLowerCase().includes(q)) ||
      c.cuisine.toLowerCase().includes(q)
    );
  }, [convs, query]);

  // ── Ouvrir conv ───────────────────────────────────────────
  const openConv = (id: string) => {
    setConvs(prev => prev.map(c => c.id === id ? { ...c, nonLus:0, messages:c.messages.map(m => ({ ...m, lu:true })) } : c));
    setActiveId(id);
    setMenuOpen(null);
  };

  // ── Envoyer message ───────────────────────────────────────
  const envoyer = () => {
    const texte = draft.trim();
    if (!texte && pending.length === 0) return;
    const msg: Message = {
      id:`m${Date.now()}`, from:"orga",
      texte: texte || "(Fichier joint)", heure:"Maintenant", lu:true,
      attachments: pending.length > 0 ? [...pending] : undefined,
    };
    setConvs(prev => prev.map(c => c.id === activeId
      ? { ...c, messages:[...c.messages, msg], lastMsg: texte || `📎 ${pending.length} fichier(s)`, lastDate:"Maintenant" }
      : c
    ));
    setDraft(""); setPending([]);
  };

  // ── Créer nouvelle conversation ───────────────────────────
  const creerConv = (conv: Omit<Conv,"nonLus"|"lastDate">) => {
    const full: Conv = { ...conv, nonLus:0, lastDate:"Maintenant" };
    setConvs(prev => [full, ...prev]);
    setActiveId(full.id);
  };

  // ── Supprimer conversation ────────────────────────────────
  const supprimerConv = (id: string) => {
    const nom = convs.find(c => c.id === id)?.truck ?? "";
    setConvs(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeId === id && next.length > 0) setActiveId(next[0].id);
      return next;
    });
    setDeleteTarget(null);
    showToast(`Conversation supprimée`);
    void nom; // suppress unused warning
  };

  const totalNonLus = convs.reduce((a, c) => a + c.nonLus, 0);
  const canSend = draft.trim().length > 0 || pending.length > 0;

  return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <OrganisateurSidebar active="/dashboard/organisateur/messagerie" badges={{ "/dashboard/organisateur/messagerie": totalNonLus }} />

      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", height:"100vh", overflow:"hidden" }}>

        {/* ══════════════════════════════════════════════════════
            PANNEAU GAUCHE — Liste conversations
        ══════════════════════════════════════════════════════ */}
        <div style={{ borderRight:`1px solid ${S.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Header + bouton + */}
          <div style={{ padding:"1.5rem 1.25rem 1rem", borderBottom:`1px solid ${S.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
              <div>
                <h1 style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:800, color:S.brown }}>Messagerie</h1>
                <p style={{ fontFamily:S.sans, fontSize:"0.62rem", fontWeight:300, color:S.muted, marginTop:"0.15rem" }}>
                  {convs.length} conversation{convs.length > 1 ? "s" : ""}
                </p>
              </div>
              {/* Bouton + nouvelle conversation */}
              <button onClick={() => setShowNewConv(true)}
                style={{ width:36, height:36, borderRadius:"50%", backgroundColor:S.terra, color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
                title="Nouvelle conversation">
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Barre de recherche */}
            <div style={{ position:"relative" }}>
              <Search size={13} color={S.muted} strokeWidth={1.5} style={{ position:"absolute", left:"0.7rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher une conversation..."
                style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.55rem 2.25rem 0.55rem 2.1rem", fontFamily:S.sans, fontSize:"0.72rem", color:S.brown, outline:"none", boxSizing:"border-box" }}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ position:"absolute", right:"0.5rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer" }}>
                  <X size={12} color={S.muted} />
                </button>
              )}
            </div>
          </div>

          {/* Liste */}
          <div style={{ overflowY:"auto", flex:1 }}>
            {filteredConvs.length === 0 ? (
              <div style={{ padding:"2rem 1.25rem", textAlign:"center" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.muted }}>Aucune conversation trouvée</p>
                {query && <button onClick={() => setQuery("")} style={{ marginTop:"0.5rem", background:"none", border:"none", cursor:"pointer", fontFamily:S.sans, fontSize:"0.65rem", color:S.terra, letterSpacing:"0.1em" }}>EFFACER LA RECHERCHE</button>}
              </div>
            ) : (
              filteredConvs.map(c => {
                const isActive = c.id === activeId;
                return (
                  <div key={c.id} style={{ borderBottom:`1px solid ${S.border}`, position:"relative" }}>
                    <div onClick={() => openConv(c.id)}
                      style={{ padding:"1rem 1.25rem", cursor:"pointer", backgroundColor: isActive ? "rgba(196,98,45,0.08)" : "transparent", borderLeft: isActive ? `3px solid ${S.terra}` : "3px solid transparent", paddingRight:"2.75rem" }}>

                      {/* Ligne 1 : avatar + nom + date + badge non-lus */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.3rem" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", minWidth:0 }}>
                          {/* Avatar groupe ou simple */}
                          {c.groupe ? (
                            <div style={{ width:34, height:34, borderRadius:4, backgroundColor:S.brown, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <Users size={14} color="#fff" strokeWidth={1.5} />
                            </div>
                          ) : (
                            <div style={{ width:34, height:34, borderRadius:"50%", backgroundColor:S.brown, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                              <span style={{ fontFamily:S.serif, fontSize:"0.82rem", fontWeight:700, color:"#fff" }}>{c.truck[0]}</span>
                            </div>
                          )}
                          <div style={{ minWidth:0 }}>
                            <p style={{ fontFamily:S.sans, fontSize:"0.76rem", fontWeight:c.nonLus > 0 ? 700 : 600, color:S.brown, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {c.groupe && c.groupeNom ? c.groupeNom : c.truck}
                            </p>
                            {c.cuisine && <p style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted }}>{c.cuisine}</p>}
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0, marginLeft:"0.5rem" }}>
                          <p style={{ fontFamily:S.sans, fontSize:"0.58rem", color:S.muted }}>{c.lastDate.split(" ")[0]}</p>
                          {c.nonLus > 0 && (
                            <div style={{ width:18, height:18, borderRadius:"50%", backgroundColor:S.terra, display:"flex", alignItems:"center", justifyContent:"center", marginTop:"0.25rem", marginLeft:"auto" }}>
                              <span style={{ fontFamily:S.sans, fontSize:"0.58rem", fontWeight:700, color:"#fff" }}>{c.nonLus}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dernier message */}
                      <p style={{ fontFamily:S.sans, fontSize:"0.67rem", fontWeight: c.nonLus > 0 ? 600 : 300, color: c.nonLus > 0 ? S.brown : S.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:"0.35rem" }}>
                        {c.lastMsg}
                      </p>

                      {/* Badges */}
                      <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" }}>
                        <span style={{ backgroundColor: c.statut === "RETENU" ? "rgba(44,122,75,0.1)" : "rgba(184,133,10,0.1)", color: c.statut === "RETENU" ? S.green : S.muted, fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.12em", fontWeight:700, padding:"0.12rem 0.4rem" }}>
                          {c.statut}
                        </span>
                        {c.groupe && (
                          <span style={{ backgroundColor:"rgba(44,26,16,0.08)", color:S.muted, fontFamily:S.sans, fontSize:"0.52rem", letterSpacing:"0.1em", fontWeight:700, padding:"0.12rem 0.4rem", display:"flex", alignItems:"center", gap:"0.2rem" }}>
                            <Users size={8} strokeWidth={2} /> GROUPE ({c.membres?.length ?? 2})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bouton "..." */}
                    <button onClick={e => { e.stopPropagation(); setMenuOpen(prev => prev === c.id ? null : c.id); }}
                      style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:"0.3rem", color:S.muted }}>
                      <MoreHorizontal size={15} strokeWidth={1.5} />
                    </button>

                    {/* Menu "..." déroulant */}
                    {menuOpen === c.id && (
                      <div onClick={e => e.stopPropagation()}
                        style={{ position:"absolute", right:"0.5rem", top:"2.5rem", zIndex:200, backgroundColor:"#fff", border:`1px solid ${S.border}`, boxShadow:"0 6px 20px rgba(0,0,0,0.1)", minWidth:160 }}>
                        <button onClick={() => { setDeleteTarget(c.id); setMenuOpen(null); }}
                          style={{ display:"flex", alignItems:"center", gap:"0.5rem", width:"100%", textAlign:"left", padding:"0.75rem 1rem", fontFamily:S.sans, fontSize:"0.7rem", color:S.red, backgroundColor:"transparent", border:"none", cursor:"pointer" }}>
                          <Trash2 size={13} strokeWidth={1.5} /> SUPPRIMER
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            PANNEAU DROIT — Conversation active
        ══════════════════════════════════════════════════════ */}
        {activeConv ? (
          <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
            {/* Header conversation */}
            <div style={{ padding:"1.25rem 2rem", borderBottom:`1px solid ${S.border}`, backgroundColor:S.cream, display:"flex", alignItems:"center", gap:"1rem", flexShrink:0 }}>
              {activeConv.groupe ? (
                <div style={{ width:40, height:40, borderRadius:6, backgroundColor:S.brown, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Users size={18} color="#fff" strokeWidth={1.5} />
                </div>
              ) : (
                <div style={{ width:40, height:40, borderRadius:"50%", backgroundColor:S.brown, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontFamily:S.serif, fontSize:"1rem", fontWeight:700, color:"#fff" }}>{activeConv.truck[0]}</span>
                </div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.88rem", fontWeight:600, color:S.brown, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {activeConv.groupe && activeConv.groupeNom ? activeConv.groupeNom : activeConv.truck}
                </p>
                {activeConv.groupe && activeConv.membres ? (
                  <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {activeConv.membres.join(" · ")}
                  </p>
                ) : (
                  activeConv.cuisine && <p style={{ fontFamily:S.sans, fontSize:"0.65rem", fontWeight:300, color:S.muted }}>{activeConv.cuisine}</p>
                )}
              </div>
              <button onClick={() => { setDeleteTarget(activeConv.id); }}
                style={{ background:"none", border:`1px solid ${S.border}`, cursor:"pointer", padding:"0.4rem 0.65rem", display:"flex", alignItems:"center", gap:"0.35rem", color:S.muted, fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.12em", flexShrink:0 }}>
                <Trash2 size={12} strokeWidth={1.5} /> SUPPRIMER
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:"auto", padding:"2rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              {activeConv.messages.map(m => (
                <MessageBubble key={m.id} m={m} isGroupe={activeConv.groupe} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Zone de saisie */}
            <MessageInput draft={draft} onDraftChange={setDraft} pending={pending} onPendingChange={setPending} onSend={envoyer} canSend={canSend} />
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1 }}>
            <p style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.muted }}>Sélectionnez une conversation</p>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {showNewConv && <NouvelleConvModal onClose={() => setShowNewConv(false)} onCreer={creerConv} />}
      {deleteTarget && (
        <ConfirmDeleteModal
          nom={convs.find(c => c.id === deleteTarget)?.truck ?? ""}
          onConfirm={() => supprimerConv(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
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

export default function MessageriePage() {
  return (
    <Suspense>
      <MessageriePageInner />
    </Suspense>
  );
}

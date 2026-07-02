"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import {
  Star, Send, Heart, Search, X, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, User, Trash2,
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

// ─── localStorage ────────────────────────────────────────────
const LS_FAV  = "spotruck_favoris_orga";
const LS_CORB = "spotruck_favoris_corbeille";
const LS_NOTE = "spotruck_favoris_notes";

function ls<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Types ────────────────────────────────────────────────────
interface TruckDB {
  id: string; nom: string; plan: "Pro"|"Premium";
  cuisine: string; ville: string; region: string;
  note: number; description: string; specialites: string[];
  taille: string; amperage: number; references: string[];
  avis: { auteur:string; note:number; texte:string }[];
}
interface FavoriEntry {
  truckId: string; nom: string; plan: "Pro"|"Premium";
  cuisine: string; ville: string; note: number;
  dateAjout: string; nbEvenements: number; notePerso: string;
}
interface CorbeilleEntry extends FavoriEntry { dateRetrait: string; }

// ─── Base de trucks ───────────────────────────────────────────
const TRUCKS_DB: TruckDB[] = [
  { id:"t01", nom:"Le Kalow Smash Burger",  plan:"Premium", cuisine:"Burgers",     ville:"Bordeaux",   region:"Nouvelle-Aquitaine", note:4.8, description:"Burgers artisanaux à base de viande locale. Concept américain revisité, double smash, sauces maison.", specialites:["Double Smash","Burger vegan","Frites maison"], taille:"8m × 3m", amperage:16, references:["Festival Garorock 2025","Estivales de Montpellier 2025","Foire de Bordeaux 2025"], avis:[{auteur:"Festival de Pau",note:5,texte:"Service parfait, queue bien gérée."},{auteur:"Mairie de Bordeaux",note:5,texte:"Partenaire incontournable."}] },
  { id:"t02", nom:"Sweet Nomad Crêpes",      plan:"Pro",     cuisine:"Desserts",    ville:"Mérignac",   region:"Nouvelle-Aquitaine", note:4.6, description:"Crêperie mobile bretonne. Crêpes sucrées et galettes salées, farines bio, garnitures de saison.", specialites:["Crêpes sucrées","Galettes bretonnes","Caramel beurre salé"], taille:"5m × 2.5m", amperage:16, references:["Marché de Noël Bordeaux 2025","Foire de Bordeaux 2025"], avis:[{auteur:"Salon du mariage",note:5,texte:"Les crêpes étaient excellentes."},{auteur:"Foire de Bordeaux",note:4,texte:"Bon service malgré l'affluence."}] },
  { id:"t03", nom:"Pizza Nomade",            plan:"Premium", cuisine:"Pizza",       ville:"Talence",    region:"Nouvelle-Aquitaine", note:4.9, description:"Four à bois traditionnel, pâtes fermentées 48h, ingrédients DOP certifiés. Autonome en eau et électricité.", specialites:["Margherita DOP","Pizza truffe","Four à bois"], taille:"9m × 3m", amperage:0, references:["Gala Tech Corp 2026","Festival Garorock 2025","Salon du Luxe Paris 2025"], avis:[{auteur:"Gala Tech Corp",note:5,texte:"Les meilleures pizzas de France sur roues."},{auteur:"Festival des Saveurs",note:5,texte:"Incroyable qualité."}] },
  { id:"t04", nom:"Glacier Mobile Joia",     plan:"Premium", cuisine:"Desserts",    ville:"Bordeaux",   region:"Nouvelle-Aquitaine", note:4.7, description:"35 parfums de glaces artisanales, sorbets fruités, coupes maison. Idéal pour événements estivaux.", specialites:["Glaces artisanales","Sorbets bio","Coupes signature"], taille:"4m × 2m", amperage:16, references:["Festival Jazz de Bordeaux 2025","Marché des Créateurs 2026"], avis:[{auteur:"Marché des créateurs",note:5,texte:"Succès phénoménal."},{auteur:"Festival de jazz",note:5,texte:"Parfait pour la chaleur !"}] },
  { id:"t05", nom:"Tacos del Sol",           plan:"Pro",     cuisine:"Tacos",       ville:"Pessac",     region:"Nouvelle-Aquitaine", note:4.3, description:"Street food mexicaine authentique. Tacos, burritos, nachos maison. Public festif et jeune.", specialites:["Tacos al pastor","Burrito XXL","Nachos partagés"], taille:"6m × 2.5m", amperage:32, references:["Festival Urbain Bordeaux 2025"], avis:[{auteur:"Soirée étudiante",note:4,texte:"Très bon, service rapide."},{auteur:"Festival urbain",note:5,texte:"Ambiance top."}] },
  { id:"t06", nom:"Wok Express",             plan:"Pro",     cuisine:"Asiatique",   ville:"Bègles",     region:"Nouvelle-Aquitaine", note:4.2, description:"Cuisine wok thaï et japonaise. Bols savoureux, nouilles sautées, dim sum vapeur.", specialites:["Bowl thaï","Pad thaï","Dumplings vapeur"], taille:"5m × 2m", amperage:16, references:["Marché nocturne Arcachon 2025"], avis:[{auteur:"Marché nocturne",note:4,texte:"Bonne nourriture, service correct."}] },
  { id:"t07", nom:"BBQ du Périgord",         plan:"Pro",     cuisine:"BBQ",         ville:"Périgueux",  region:"Nouvelle-Aquitaine", note:4.4, description:"Spécialités périgordines au feu de bois : magret, saucisses de canard, pommes sarladaises.", specialites:["Magret de canard","Saucisses artisan","Pommes sarladaises"], taille:"7m × 3m", amperage:32, references:["Fêtes de Périgueux 2025","Festival gastronomique 2025"], avis:[{auteur:"Fête de village",note:5,texte:"Authentique et généreux."},{auteur:"Festival gastronomique",note:4,texte:"Bon mais un peu long à servir."}] },
  { id:"t08", nom:"Burger Végétal",          plan:"Pro",     cuisine:"Végétarien",  ville:"Bordeaux",   region:"Nouvelle-Aquitaine", note:4.1, description:"100% végétal. Burgers, wraps et bowls. Engagement environnemental fort, emballages compostables.", specialites:["Burger jackfruit","Bowl veggie","Wrap falafel"], taille:"5m × 2.5m", amperage:16, references:["Festival Green Bordeaux 2025"], avis:[{auteur:"Festival Green",note:4,texte:"Excellent, enfin une offre végé de qualité."}] },
  { id:"t09", nom:"Ramen Izakaya",           plan:"Pro",     cuisine:"Asiatique",   ville:"Mérignac",   region:"Nouvelle-Aquitaine", note:4.5, description:"Ramen, yakitori, gyoza. Une expérience japonaise authentique en plein air, bouillon mijoté 12h.", specialites:["Ramen tonkotsu","Yakitori",  "Gyoza maison"], taille:"6m × 2.5m", amperage:16, references:["Festival Gastronomique 2025","Salon du Goût 2025"], avis:[{auteur:"Festival Gastronomique",note:5,texte:"Sublime."},{auteur:"Salon du Goût",note:4,texte:"Très bon."}] },
  { id:"t10", nom:"Cevicheria Pacifica",     plan:"Premium", cuisine:"Autre",       ville:"Bordeaux",   region:"Nouvelle-Aquitaine", note:4.6, description:"Cuisine péruvienne raffinée. Ceviche, tiradito, anticuchos. Produits frais, marinades maison.", specialites:["Ceviche clasico","Tiradito nikkei","Anticuchos"], taille:"6m × 2.5m", amperage:16, references:["Festival Street Food Paris 2025","Estivales 2025"], avis:[{auteur:"Festival Street Food",note:5,texte:"Dépaysement total."},{auteur:"Marché Nocturne",note:5,texte:"Le meilleur ceviche du coin."}] },
];

// ─── Favoris initiaux ─────────────────────────────────────────
const FAVORIS_INIT: FavoriEntry[] = [
  { truckId:"t01", nom:"Le Kalow Smash Burger", plan:"Premium", cuisine:"Burgers",  ville:"Bordeaux", note:4.8, dateAjout:"2025-12-20", nbEvenements:2, notePerso:"Excellent truck, très professionnel. Toujours ponctuel. À rappeler pour Solstice." },
  { truckId:"t03", nom:"Pizza Nomade",          plan:"Premium", cuisine:"Pizza",    ville:"Talence",  note:4.9, dateAjout:"2026-01-15", nbEvenements:1, notePerso:"Four à bois magnifique, produits DOP. Attention : réserver 3 mois à l'avance." },
  { truckId:"t02", nom:"Sweet Nomad Crêpes",   plan:"Pro",     cuisine:"Desserts", ville:"Mérignac", note:4.6, dateAjout:"2025-09-10", nbEvenements:2, notePerso:"Idéale pour les événements familiaux. Bien pour compléter une offre salée." },
  { truckId:"t04", nom:"Glacier Mobile Joia",  plan:"Premium", cuisine:"Desserts", ville:"Bordeaux", note:4.7, dateAjout:"2026-03-01", nbEvenements:1, notePerso:"" },
];

const CORBEILLE_INIT: CorbeilleEntry[] = [
  { truckId:"t05", nom:"Tacos del Sol",    plan:"Pro", cuisine:"Tacos",    ville:"Pessac",   note:4.3, dateAjout:"2025-06-01", nbEvenements:1, notePerso:"",   dateRetrait:"2026-04-10" },
  { truckId:"t06", nom:"Wok Express",     plan:"Pro", cuisine:"Asiatique",ville:"Bègles",   note:4.2, dateAjout:"2025-08-01", nbEvenements:0, notePerso:"",   dateRetrait:"2026-02-28" },
];

// ─── Événement actif mock ─────────────────────────────────────
const EVENEMENT_ACTIF = {
  nom: "Festival Solstice", date:"21 juin 2026", lieu:"Bordeaux",
  visiteurs: 2000, cuisine:"burgers et desserts", nbTrucks: 3,
  modele: "Droit de place : 800€ / truck",
};

// ─── Constantes filtres ───────────────────────────────────────
const CUISINES = ["Burgers","Tacos","Pizza","Asiatique","BBQ","Végétarien","Desserts","Autre"];
const REGIONS  = ["Toutes les régions","Nouvelle-Aquitaine","Île-de-France","Bretagne","Pays de la Loire","Occitanie","Provence-Alpes-Côte d'Azur","Auvergne-Rhône-Alpes","Normandie","Grand Est","Hauts-de-France","Centre-Val de Loire","Bourgogne-Franche-Comté","Corse"];

// ─── Helpers ──────────────────────────────────────────────────
function StarsDisplay({ n, size = 12, interactive = false, onSet }: { n:number; size?:number; interactive?:boolean; onSet?:(v:number)=>void }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          fill={i <= Math.round(n) ? S.amber : "none"}
          stroke={S.amber} strokeWidth={1.5}
          style={{ cursor: interactive ? "pointer" : "default" }}
          onClick={() => interactive && onSet?.(i)}
        />
      ))}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
}

function PlanBadge({ plan }: { plan:"Pro"|"Premium" }) {
  return plan === "Premium"
    ? <span style={{ backgroundColor:S.gold, color:"#fff", fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.1em", padding:"0.18rem 0.45rem", fontWeight:700 }}>★ PREMIUM</span>
    : <span style={{ backgroundColor:S.terra, color:"#fff", fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.1em", padding:"0.18rem 0.45rem", fontWeight:700 }}>✓ PRO</span>;
}

// ─── Composant : Tag filtre cuisine ──────────────────────────
function CuisineTag({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:"0.3rem 0.75rem", fontFamily:S.sans, fontSize:"0.65rem", backgroundColor: active ? S.brown : "transparent", color: active ? "#fff" : S.muted, border:`1px solid ${active ? S.brown : S.border}`, cursor:"pointer", letterSpacing:"0.05em" }}>
      {label}
    </button>
  );
}

// ─── Composant : Profil truck modale ─────────────────────────
function ProfileModal({ truck, isFavori, onAddFav, onClose }: {
  truck:TruckDB; isFavori:boolean; onAddFav:(t:TruckDB)=>void; onClose:()=>void;
}) {
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={onClose}>
      <div style={{ backgroundColor:S.cream, maxWidth:700, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"2.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5rem" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.3rem" }}>
              <h2 style={{ fontFamily:S.serif, fontSize:"1.6rem", fontWeight:800, color:S.brown }}>{truck.nom}</h2>
              <PlanBadge plan={truck.plan} />
            </div>
            <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted }}>{truck.cuisine} · {truck.ville} · {truck.region}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={20} color={S.muted} /></button>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"2px", marginBottom:"1.5rem" }}>
          {[
            { l:"NOTE",    v:`${truck.note}/5`,   c:S.amber },
            { l:"TAILLE",  v:truck.taille,        c:S.brown },
            { l:"AMPÉRAGE",v:truck.amperage > 0 ? `${truck.amperage}A` : "Autonome", c:S.brown },
          ].map(i => (
            <div key={i.l} style={{ backgroundColor:S.card, padding:"1rem", textAlign:"center" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.3rem" }}>{i.l}</p>
              <p style={{ fontFamily:i.l === "NOTE" ? S.serif : S.sans, fontSize:i.l === "NOTE" ? "1.6rem" : "0.88rem", fontWeight:i.l === "NOTE" ? 800 : 600, color:i.c }}>{i.v}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom:"1.25rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>DESCRIPTION</p>
          <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color:S.brown, lineHeight:1.7, padding:"0.875rem 1rem", backgroundColor:S.card }}>{truck.description}</p>
        </div>

        {/* Spécialités */}
        <div style={{ marginBottom:"1.25rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>SPÉCIALITÉS</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
            {truck.specialites.map(s => (
              <span key={s} style={{ padding:"0.3rem 0.75rem", backgroundColor:S.card, border:`1px solid ${S.border}`, fontFamily:S.sans, fontSize:"0.72rem", color:S.brown }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Références */}
        <div style={{ marginBottom:"1.25rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>RÉFÉRENCES</p>
          {truck.references.map(r => (
            <div key={r} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.4rem 0", borderBottom:`1px solid ${S.border}` }}>
              <CheckCircle size={12} color={S.green} strokeWidth={2} />
              <span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.brown }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Avis */}
        <div style={{ marginBottom:"1.75rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>AVIS CLIENTS</p>
          {truck.avis.map((a, i) => (
            <div key={i} style={{ backgroundColor:S.card, padding:"0.875rem 1rem", marginBottom:"2px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.3rem" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:600, color:S.brown }}>{a.auteur}</p>
                <StarsDisplay n={a.note} />
              </div>
              <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, lineHeight:1.6 }}>{a.texte}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:"0.75rem" }}>
          {!isFavori ? (
            <button onClick={() => { onAddFav(truck); onClose(); }}
              style={{ flex:1, backgroundColor:S.green, color:"#fff", border:"none", padding:"0.875rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
              <Heart size={14} fill="#fff" /> AJOUTER AUX FAVORIS
            </button>
          ) : (
            <div style={{ flex:1, backgroundColor:"rgba(44,122,75,0.1)", color:S.green, padding:"0.875rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
              <Heart size={14} fill={S.green} stroke={S.green} /> DÉJÀ EN FAVORIS
            </div>
          )}
          <button onClick={onClose} style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer" }}>
            FERMER
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant : Modale invitation ───────────────────────────
function InvitationModal({ favori, onClose, onSent }: {
  favori:FavoriEntry; onClose:()=>void; onSent:(nom:string)=>void;
}) {
  const [msg, setMsg] = useState(`Bonjour,

Suite à notre collaboration précédente sur Spotruck, nous souhaiterions vous inviter à participer à ${EVENEMENT_ACTIF.nom} qui se déroulera le ${EVENEMENT_ACTIF.date} à ${EVENEMENT_ACTIF.lieu}.

Cet événement accueillera environ ${EVENEMENT_ACTIF.visiteurs.toLocaleString("fr-FR")} visiteurs et nous recherchons ${EVENEMENT_ACTIF.nbTrucks} truck(s) de type ${EVENEMENT_ACTIF.cuisine}.

Les conditions sont les suivantes :
${EVENEMENT_ACTIF.modele}

N'hésitez pas à nous contacter pour plus d'informations.

Nous espérons pouvoir compter sur votre présence !

Cordialement,
Sophie Mercier`);

  const envoyer = () => {
    // Pousse une notif fictive pour le foodtrucker
    try {
      const list: unknown[] = JSON.parse(localStorage.getItem("spotruck_ft_notifications") || "[]");
      list.unshift({ id:`invite-${Date.now()}`, type:"invitation", truck:favori.nom, eventNom:EVENEMENT_ACTIF.nom, dateISO:new Date().toISOString(), lue:false });
      lsSet("spotruck_ft_notifications", list);
    } catch {}
    onSent(favori.nom);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={onClose}>
      <div style={{ backgroundColor:S.cream, maxWidth:680, width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"2.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.75rem" }}>
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.3rem" }}>INVITATION DIRECTE</p>
            <h2 style={{ fontFamily:S.serif, fontSize:"1.5rem", fontWeight:800, color:S.brown }}>{favori.nom}</h2>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={20} color={S.muted} /></button>
        </div>

        {/* Événement sélectionné */}
        <div style={{ backgroundColor:S.card, padding:"1rem 1.25rem", marginBottom:"1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.2rem" }}>ÉVÉNEMENT</p>
            <p style={{ fontFamily:S.sans, fontSize:"0.85rem", fontWeight:600, color:S.brown }}>{EVENEMENT_ACTIF.nom}</p>
            <p style={{ fontFamily:S.sans, fontSize:"0.7rem", color:S.muted }}>{EVENEMENT_ACTIF.date} · {EVENEMENT_ACTIF.lieu}</p>
          </div>
          <div style={{ width:8, height:8, borderRadius:"50%", backgroundColor:S.green }} />
        </div>

        {/* Message */}
        <div style={{ marginBottom:"1.5rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.6rem" }}>MESSAGE D'INVITATION (modifiable)</p>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={16}
            style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"1rem", fontFamily:S.sans, fontSize:"0.8rem", color:S.brown, outline:"none", resize:"vertical", lineHeight:1.7, boxSizing:"border-box", borderLeft:`3px solid ${S.terra}` }} />
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <button onClick={envoyer}
            style={{ flex:2, backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.875rem 1.5rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
            <Send size={14} strokeWidth={2} /> ENVOYER L'INVITATION
          </button>
          <button onClick={onClose}
            style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.875rem 1rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer" }}>
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant : Confirmation suppression définitive ──────────
function ConfirmDeleteModal({ nom, onConfirm, onClose }: { nom:string; onConfirm:()=>void; onClose:()=>void }) {
  return (
    <div style={{ position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.55)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center", padding:"2rem" }} onClick={onClose}>
      <div style={{ backgroundColor:S.cream, maxWidth:440, width:"100%", padding:"2rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:"0.875rem", marginBottom:"1.5rem" }}>
          <AlertTriangle size={22} color={S.red} strokeWidth={1.5} style={{ flexShrink:0, marginTop:2 }} />
          <div>
            <h3 style={{ fontFamily:S.serif, fontSize:"1.2rem", fontWeight:700, color:S.brown, marginBottom:"0.4rem" }}>Supprimer définitivement ?</h3>
            <p style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight:300, color:S.muted, lineHeight:1.6 }}>
              <strong style={{ color:S.brown }}>{nom}</strong> sera définitivement retiré de vos favoris. Cette action est irréversible.
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.75rem" }}>
          <button onClick={onConfirm}
            style={{ flex:1, backgroundColor:S.red, color:"#fff", border:"none", padding:"0.75rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer" }}>
            OUI, SUPPRIMER
          </button>
          <button onClick={onClose}
            style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.75rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.18em", cursor:"pointer" }}>
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────
export default function FavorisPage() {
  // ── Search state ──────────────────────────────────────────
  const [query,         setQuery]         = useState("");
  const [cuisineTags,   setCuisineTags]   = useState<string[]>([]);
  const [regionFilter,  setRegionFilter]  = useState("Toutes les régions");
  const [noteMinFilter, setNoteMinFilter] = useState(0);
  const [planFilter,    setPlanFilter]    = useState<"tous"|"Pro"|"Premium">("tous");
  const [profileModal,  setProfileModal]  = useState<TruckDB|null>(null);
  const [showRegion,    setShowRegion]    = useState(false);

  // ── Favoris state ─────────────────────────────────────────
  const [favoris,   setFavoris]   = useState<FavoriEntry[]>(FAVORIS_INIT);
  const [corbeille, setCorbeille] = useState<CorbeilleEntry[]>(CORBEILLE_INIT);
  const [corbeilleOpen, setCorbeilleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string|null>(null);

  // ── Invitation / notes state ──────────────────────────────
  const [inviteTarget, setInviteTarget] = useState<FavoriEntry|null>(null);
  const [editNoteId,   setEditNoteId]   = useState<string|null>(null);
  const [draftNote,    setDraftNote]    = useState("");

  // ── Toast ─────────────────────────────────────────────────
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  // ── Persistance localStorage ──────────────────────────────
  useEffect(() => { try { const f = ls<FavoriEntry[]>(LS_FAV, []); if (f.length) setFavoris(f); } catch {} }, []);
  useEffect(() => { try { const c = ls<CorbeilleEntry[]>(LS_CORB, []); if (c.length) setCorbeille(c); } catch {} }, []);

  useEffect(() => { lsSet(LS_FAV,  favoris);   }, [favoris]);
  useEffect(() => { lsSet(LS_CORB, corbeille); }, [corbeille]);
  useEffect(() => {
    const notes: Record<string, string> = {};
    favoris.forEach(f => { notes[f.truckId] = f.notePerso; });
    lsSet(LS_NOTE, notes);
  }, [favoris]);

  // ── Favoris ids (set) ─────────────────────────────────────
  const favoriIds = useMemo(() => new Set(favoris.map(f => f.truckId)), [favoris]);

  // ── Recherche filtrée ─────────────────────────────────────
  const resultats = useMemo(() => {
    return TRUCKS_DB.filter(t => {
      const q = query.toLowerCase();
      if (q && !t.nom.toLowerCase().includes(q) && !t.cuisine.toLowerCase().includes(q) && !t.ville.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      if (cuisineTags.length > 0 && !cuisineTags.includes(t.cuisine)) return false;
      if (regionFilter !== "Toutes les régions" && t.region !== regionFilter) return false;
      if (noteMinFilter > 0 && t.note < noteMinFilter) return false;
      if (planFilter !== "tous" && t.plan !== planFilter) return false;
      return true;
    });
  }, [query, cuisineTags, regionFilter, noteMinFilter, planFilter]);

  const hasFiltre = query || cuisineTags.length > 0 || regionFilter !== "Toutes les régions" || noteMinFilter > 0 || planFilter !== "tous";

  // ── Actions favoris ───────────────────────────────────────
  const addFavori = useCallback((t: TruckDB) => {
    if (favoriIds.has(t.id)) return;
    // Retire de la corbeille si présent
    setCorbeille(prev => prev.filter(c => c.truckId !== t.id));
    setFavoris(prev => [...prev, { truckId:t.id, nom:t.nom, plan:t.plan, cuisine:t.cuisine, ville:t.ville, note:t.note, dateAjout:new Date().toISOString().split("T")[0], nbEvenements:0, notePerso:"" }]);
    showToast(`${t.nom} ajouté aux favoris ♥`);
  }, [favoriIds, showToast]);

  const retirerFavori = useCallback((truckId: string) => {
    const f = favoris.find(x => x.truckId === truckId);
    if (!f) return;
    setFavoris(prev => prev.filter(x => x.truckId !== truckId));
    setCorbeille(prev => [...prev, { ...f, dateRetrait: new Date().toISOString().split("T")[0] }]);
    showToast(`${f.nom} retiré des favoris`);
  }, [favoris, showToast]);

  const recupererCorbeille = useCallback((truckId: string) => {
    const c = corbeille.find(x => x.truckId === truckId);
    if (!c) return;
    setCorbeille(prev => prev.filter(x => x.truckId !== truckId));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dateRetrait: _dr, ...fav } = c;
    setFavoris(prev => [...prev, { ...fav, dateAjout: new Date().toISOString().split("T")[0] }]);
    showToast(`${c.nom} récupéré dans les favoris !`);
  }, [corbeille, showToast]);

  const supprimerDefinitif = useCallback((truckId: string) => {
    const c = corbeille.find(x => x.truckId === truckId);
    setCorbeille(prev => prev.filter(x => x.truckId !== truckId));
    setConfirmDelete(null);
    if (c) showToast(`${c.nom} supprimé définitivement`);
  }, [corbeille, showToast]);

  const saveNote = useCallback((truckId: string, note: string) => {
    setFavoris(prev => prev.map(f => f.truckId === truckId ? { ...f, notePerso:note } : f));
    setEditNoteId(null);
    showToast("Note sauvegardée");
  }, [showToast]);

  // ─── Rendu ────────────────────────────────────────────────
  return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <OrganisateurSidebar active="/dashboard/organisateur/favoris" />

      <div style={{ padding:"3rem", maxWidth:1060, minWidth:0 }}>

        {/* Header */}
        <div style={{ marginBottom:"2.5rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>DASHBOARD — ORGANISATEUR</p>
          <h1 style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, lineHeight:1.1 }}>Mes trucks favoris</h1>
        </div>

        {/* ══════════════════════════════════════════════════
            SECTION 1 — RECHERCHE
        ══════════════════════════════════════════════════ */}
        <section style={{ marginBottom:"3rem" }}>
          <div style={{ marginBottom:"1.25rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}` }}>
            <h2 style={{ fontFamily:S.serif, fontSize:"1.2rem", fontWeight:700 }}>Rechercher un truck</h2>
            <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.2rem" }}>
              Trouvez et ajoutez de nouveaux trucks à vos favoris
            </p>
          </div>

          {/* Barre de recherche */}
          <div style={{ position:"relative", marginBottom:"1rem" }}>
            <Search size={15} color={S.muted} strokeWidth={1.5} style={{ position:"absolute", left:"0.875rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Nom du truck, type de cuisine, ville..."
              style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.75rem 0.875rem 0.75rem 2.5rem", fontFamily:S.sans, fontSize:"0.85rem", color:S.brown, outline:"none", boxSizing:"border-box" }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer" }}>
                <X size={14} color={S.muted} />
              </button>
            )}
          </div>

          {/* Filtres rapides */}
          <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", alignItems:"flex-start", marginBottom:"1.5rem" }}>
            {/* Cuisines */}
            <div>
              <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.4rem" }}>CUISINE</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.3rem" }}>
                {CUISINES.map(c => (
                  <CuisineTag key={c} label={c} active={cuisineTags.includes(c)} onClick={() => setCuisineTags(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} />
                ))}
              </div>
            </div>

            {/* Séparateur vertical */}
            <div style={{ width:1, backgroundColor:S.border, alignSelf:"stretch", margin:"0 0.25rem" }} />

            {/* Région */}
            <div style={{ position:"relative" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.4rem" }}>RÉGION</p>
              <button onClick={() => setShowRegion(v => !v)} style={{ display:"flex", alignItems:"center", gap:"0.5rem", border:`1px solid ${regionFilter !== "Toutes les régions" ? S.brown : S.border}`, backgroundColor: regionFilter !== "Toutes les régions" ? S.brown : "transparent", color: regionFilter !== "Toutes les régions" ? "#fff" : S.muted, padding:"0.3rem 0.75rem", fontFamily:S.sans, fontSize:"0.65rem", cursor:"pointer", whiteSpace:"nowrap" }}>
                {regionFilter === "Toutes les régions" ? "Toutes les régions" : regionFilter.slice(0, 20) + (regionFilter.length > 20 ? "…" : "")} <ChevronDown size={11} />
              </button>
              {showRegion && (
                <div style={{ position:"absolute", top:"100%", left:0, zIndex:200, backgroundColor:"#fff", border:`1px solid ${S.border}`, boxShadow:"0 8px 24px rgba(0,0,0,0.1)", minWidth:260, maxHeight:280, overflowY:"auto" }}>
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => { setRegionFilter(r); setShowRegion(false); }}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"0.65rem 1rem", fontFamily:S.sans, fontSize:"0.72rem", color: regionFilter === r ? S.terra : S.brown, backgroundColor: regionFilter === r ? "rgba(196,98,45,0.05)" : "transparent", border:"none", cursor:"pointer" }}>
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note min */}
            <div>
              <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.4rem" }}>NOTE MIN.</p>
              <div style={{ display:"flex", alignItems:"center", gap:"0.25rem" }}>
                <StarsDisplay n={noteMinFilter} size={18} interactive onSet={v => setNoteMinFilter(prev => prev === v ? 0 : v)} />
                {noteMinFilter > 0 && <button onClick={() => setNoteMinFilter(0)} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={11} color={S.muted} /></button>}
              </div>
            </div>

            {/* Plan */}
            <div>
              <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.4rem" }}>PLAN</p>
              <div style={{ display:"flex", gap:"0.25rem" }}>
                {(["tous","Pro","Premium"] as const).map(p => (
                  <button key={p} onClick={() => setPlanFilter(p)} style={{ padding:"0.3rem 0.65rem", fontFamily:S.sans, fontSize:"0.65rem", backgroundColor: planFilter === p ? S.brown : "transparent", color: planFilter === p ? "#fff" : S.muted, border:`1px solid ${planFilter === p ? S.brown : S.border}`, cursor:"pointer" }}>
                    {p === "tous" ? "Tous" : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Réinitialiser */}
            {hasFiltre && (
              <div style={{ alignSelf:"flex-end" }}>
                <button onClick={() => { setQuery(""); setCuisineTags([]); setRegionFilter("Toutes les régions"); setNoteMinFilter(0); setPlanFilter("tous"); }}
                  style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", color:S.terra, background:"none", border:`1px solid ${S.terra}`, padding:"0.3rem 0.75rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                  <X size={10} /> RÉINITIALISER
                </button>
              </div>
            )}
          </div>

          {/* Résultats */}
          {resultats.length === 0 ? (
            <div style={{ padding:"2.5rem", textAlign:"center", backgroundColor:S.card }}>
              <p style={{ fontFamily:S.serif, fontSize:"1.1rem", fontWeight:700, color:S.brown, marginBottom:"0.4rem" }}>Aucun truck trouvé</p>
              <p style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.muted }}>Modifiez vos filtres pour voir plus de résultats</p>
            </div>
          ) : (
            <>
              <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted, marginBottom:"0.75rem" }}>
                {resultats.length} truck{resultats.length > 1 ? "s" : ""} trouvé{resultats.length > 1 ? "s" : ""}
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"2px" }}>
                {resultats.map(t => {
                  const estFavori = favoriIds.has(t.id);
                  return (
                    <div key={t.id} style={{ backgroundColor:S.card, padding:"1.25rem", border:`1px solid ${t.plan === "Premium" ? S.gold : "transparent"}`, display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                      {/* Avatar + nom */}
                      <div style={{ display:"flex", alignItems:"center", gap:"0.65rem" }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", backgroundColor: t.plan === "Premium" ? S.gold : S.brown, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <span style={{ fontFamily:S.serif, fontSize:"0.9rem", fontWeight:700, color:"#fff" }}>{t.nom[0]}</span>
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontFamily:S.sans, fontSize:"0.8rem", fontWeight:600, color:S.brown, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.nom}</p>
                          <PlanBadge plan={t.plan} />
                        </div>
                      </div>
                      <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted }}>{t.cuisine} · {t.ville}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                        <StarsDisplay n={t.note} />
                        <span style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted }}>{t.note}/5</span>
                      </div>
                      <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.25rem" }}>
                        <button onClick={() => setProfileModal(t)} style={{ flex:1, backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.45rem 0.5rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.1em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.3rem" }}>
                          <User size={10} strokeWidth={1.5} /> PROFIL
                        </button>
                        {estFavori ? (
                          <div style={{ flex:1, backgroundColor:"rgba(196,98,45,0.1)", color:S.terra, padding:"0.45rem 0.5rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.1em", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.3rem" }}>
                            <Heart size={10} fill={S.terra} stroke={S.terra} /> EN FAVORIS
                          </div>
                        ) : (
                          <button onClick={() => addFavori(t)} style={{ flex:1, backgroundColor:S.green, color:"#fff", border:"none", padding:"0.45rem 0.5rem", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.1em", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.3rem" }}>
                            <Heart size={10} strokeWidth={2} /> AJOUTER
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 2 — MES FAVORIS ACTIFS
        ══════════════════════════════════════════════════ */}
        <section style={{ marginBottom:"2.5rem" }}>
          <div style={{ marginBottom:"1.5rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}` }}>
            <h2 style={{ fontFamily:S.serif, fontSize:"1.2rem", fontWeight:700 }}>
              Mes trucks favoris <span style={{ color:S.terra }}>({favoris.length})</span>
            </h2>
          </div>

          {favoris.length === 0 ? (
            <div style={{ padding:"2.5rem", textAlign:"center", backgroundColor:S.card }}>
              <Heart size={32} strokeWidth={1} color={S.border} style={{ marginBottom:"0.75rem" }} />
              <p style={{ fontFamily:S.serif, fontSize:"1.1rem", fontWeight:700, color:S.brown, marginBottom:"0.4rem" }}>Aucun favori pour l'instant</p>
              <p style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.muted }}>Utilisez la recherche ci-dessus pour ajouter des trucks</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
              {favoris.map(f => (
                <div key={f.truckId} style={{ backgroundColor:S.card, padding:"1.75rem", border:`1px solid ${f.plan === "Premium" ? S.gold : "transparent"}` }}>
                  {/* En-tête truck */}
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"1.25rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
                    <div style={{ width:52, height:52, borderRadius:"50%", backgroundColor: f.plan === "Premium" ? S.gold : S.brown, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontFamily:S.serif, fontSize:"1.1rem", fontWeight:700, color:"#fff" }}>{f.nom[0]}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.3rem", flexWrap:"wrap" }}>
                        <h3 style={{ fontFamily:S.serif, fontSize:"1.15rem", fontWeight:700, color:S.brown }}>{f.nom}</h3>
                        <PlanBadge plan={f.plan} />
                        <Heart size={14} fill={S.terra} stroke={S.terra} />
                      </div>
                      <p style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted, marginBottom:"0.35rem" }}>{f.cuisine} · {f.ville}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                        <StarsDisplay n={f.note} />
                        <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>{f.note}/5</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", justifyContent:"flex-end" }}>
                      <button onClick={() => { const t = TRUCKS_DB.find(x => x.id === f.truckId); if (t) setProfileModal(t); }}
                        style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.5rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                        <User size={11} strokeWidth={1.5} /> PROFIL
                      </button>
                      <button onClick={() => setInviteTarget(f)}
                        style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.5rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                        <Send size={11} strokeWidth={2} /> INVITER
                      </button>
                      <button onClick={() => retirerFavori(f.truckId)}
                        style={{ backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.5rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.35rem" }}>
                        <Trash2 size={11} strokeWidth={1.5} /> RETIRER
                      </button>
                    </div>
                  </div>

                  {/* Méta */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"2px", marginBottom:"1.25rem" }}>
                    {[
                      { l:"AJOUTÉ LE",          v:fmtDate(f.dateAjout) },
                      { l:"ÉVÉNEMENTS COMMUNS", v:`${f.nbEvenements} événement${f.nbEvenements > 1 ? "s" : ""}` },
                      { l:"PLAN",               v:f.plan },
                    ].map(i => (
                      <div key={i.l} style={{ backgroundColor:"rgba(44,26,16,0.04)", padding:"0.65rem 0.875rem" }}>
                        <p style={{ fontFamily:S.sans, fontSize:"0.55rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.2rem" }}>{i.l}</p>
                        <p style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight:600, color:S.brown }}>{i.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Note personnelle */}
                  <div style={{ borderLeft:`3px solid ${S.terra}`, paddingLeft:"1rem" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.4rem" }}>
                      <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.terra, fontWeight:700 }}>MA NOTE PERSONNELLE</p>
                      {editNoteId !== f.truckId && (
                        <button onClick={() => { setEditNoteId(f.truckId); setDraftNote(f.notePerso); }}
                          style={{ background:"none", border:"none", cursor:"pointer", fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", color:S.muted }}>
                          {f.notePerso ? "MODIFIER" : "AJOUTER"}
                        </button>
                      )}
                    </div>
                    {editNoteId === f.truckId ? (
                      <div>
                        <textarea value={draftNote} onChange={e => setDraftNote(e.target.value)} rows={2}
                          placeholder="Ajoutez une note personnelle... Ex: Excellent pour les mariages"
                          style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.5rem 0.65rem", fontFamily:S.sans, fontSize:"0.78rem", color:S.brown, outline:"none", resize:"none", boxSizing:"border-box" }} />
                        <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.4rem" }}>
                          <button onClick={() => saveNote(f.truckId, draftNote)}
                            style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.35rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                            SAUVEGARDER
                          </button>
                          <button onClick={() => setEditNoteId(null)}
                            style={{ background:"none", border:`1px solid ${S.border}`, color:S.muted, padding:"0.35rem 0.75rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                            ANNULER
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight:300, color: f.notePerso ? S.brown : S.muted, lineHeight:1.6, fontStyle: f.notePerso ? "normal" : "italic" }}>
                        {f.notePerso || "Aucune note — cliquez sur « Ajouter » pour en rédiger une"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════
            SECTION 3 — CORBEILLE
        ══════════════════════════════════════════════════ */}
        {(corbeille.length > 0 || true) && (
          <section>
            <button onClick={() => setCorbeilleOpen(v => !v)}
              style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.875rem 1.25rem", backgroundColor:"rgba(44,26,16,0.04)", border:`1px solid ${S.border}`, cursor:"pointer", marginBottom: corbeilleOpen ? "1rem" : 0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                <Trash2 size={14} strokeWidth={1.5} color={S.muted} />
                <span style={{ fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.18em", color:S.muted, fontWeight:600 }}>
                  TRUCKS RETIRÉS ({corbeille.length})
                </span>
                {corbeille.length > 0 && <span style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted }}>— cliquez pour récupérer ou supprimer</span>}
              </div>
              {corbeilleOpen ? <ChevronUp size={14} color={S.muted} /> : <ChevronDown size={14} color={S.muted} />}
            </button>

            {corbeilleOpen && (
              corbeille.length === 0 ? (
                <div style={{ padding:"1.5rem", textAlign:"center", backgroundColor:S.card }}>
                  <p style={{ fontFamily:S.sans, fontSize:"0.78rem", color:S.muted }}>La corbeille est vide</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  {corbeille.map(c => (
                    <div key={c.truckId} style={{ backgroundColor:S.card, padding:"1.25rem 1.5rem", opacity:0.75, display:"flex", alignItems:"center", gap:"1.25rem", flexWrap:"wrap" }}>
                      <div style={{ width:40, height:40, borderRadius:"50%", backgroundColor:S.muted, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ fontFamily:S.serif, fontSize:"0.9rem", fontWeight:700, color:"#fff" }}>{c.nom[0]}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontFamily:S.sans, fontSize:"0.85rem", fontWeight:600, color:S.muted }}>{c.nom}</p>
                        <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted }}>{c.cuisine} · {c.ville}</p>
                        <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted, marginTop:"0.2rem" }}>
                          Retiré le {fmtDate(c.dateRetrait)}
                        </p>
                      </div>
                      <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
                        <button onClick={() => recupererCorbeille(c.truckId)}
                          style={{ backgroundColor:S.green, color:"#fff", border:"none", padding:"0.45rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                          RÉCUPÉRER
                        </button>
                        <button onClick={() => setConfirmDelete(c.truckId)}
                          style={{ backgroundColor:"transparent", color:S.red, border:`1px solid ${S.red}`, padding:"0.45rem 0.875rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                          SUPPRIMER
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}

      </div>

      {/* ── Modales ── */}
      {profileModal && (
        <ProfileModal
          truck={profileModal}
          isFavori={favoriIds.has(profileModal.id)}
          onAddFav={addFavori}
          onClose={() => setProfileModal(null)}
        />
      )}
      {inviteTarget && (
        <InvitationModal
          favori={inviteTarget}
          onClose={() => setInviteTarget(null)}
          onSent={nom => { setInviteTarget(null); showToast(`Invitation envoyée à ${nom} !`); }}
        />
      )}
      {confirmDelete && (
        <ConfirmDeleteModal
          nom={corbeille.find(c => c.truckId === confirmDelete)?.nom ?? ""}
          onConfirm={() => supprimerDefinitif(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
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

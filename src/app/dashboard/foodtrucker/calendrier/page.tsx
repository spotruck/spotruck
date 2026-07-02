"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import {
  ChevronLeft, ChevronRight, X, Bell, CheckCircle,
  MapPin, Users, Euro, ChevronDown,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream:  "#F2EDE4",
  brown:  "#2C1810",
  terra:  "#C4622D",
  border: "#D4C9BC",
  muted:  "#8C7B6E",
  card:   "#EDE8DF",
  green:  "#2C7A4B",
  amber:  "#B8850A",
  blue:   "#2E6DA4",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

// ─── Types ────────────────────────────────────────────────────
type StatutOffre = "ouvert" | "avenir" | "prospecter" | "postule";
type TypeOffre   = "Droit de place" | "Privatisation" | "Variable";
type TypeEvt     = "Festival" | "Fête locale" | "Marché" | "Salon" | "Sportif" | "Culturel";
type TailleFilt  = "all" | "lt1000" | "1000-5000" | "5000-20000" | "gt20000";

interface EvenementFR {
  id: string;
  titre: string;
  ville: string;
  region: string;
  dateISO: string;
  dateFinISO?: string;
  typeEvt: TypeEvt;
  typeOffre: TypeOffre;
  statut: StatutOffre;
  visiteurs: number;
  visiteursTxt: string;
  budgetEstime: string;
  anneeCreation: number;
  nbTrucksHab: number;
  budgetHab: string;
  description: string;
  offreId?: string;
  semainesAvantOffre?: number;
}

// ─── Statuts config ───────────────────────────────────────────
const SC: Record<StatutOffre, { dot: string; bg: string; color: string; label: string }> = {
  ouvert:     { dot: S.terra, bg: "rgba(196,98,45,0.12)",  color: S.terra, label: "OFFRE OUVERTE" },
  avenir:     { dot: S.amber, bg: "rgba(184,133,10,0.12)", color: S.amber, label: "OFFRE À VENIR" },
  prospecter: { dot: S.blue,  bg: "rgba(46,109,164,0.12)", color: S.blue,  label: "À PROSPECTER" },
  postule:    { dot: S.green, bg: "rgba(44,122,75,0.12)",  color: S.green, label: "J'AI POSTULÉ" },
};

// ─── Régions France ───────────────────────────────────────────
const REGIONS = [
  "Toutes les régions",
  "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine",
  "Occitanie", "Hauts-de-France", "Grand Est", "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur", "Normandie", "Bretagne",
  "Bourgogne-Franche-Comté", "Centre-Val de Loire", "Corse",
  "Nationale",
];

const TYPES_EVT: TypeEvt[] = ["Festival", "Fête locale", "Marché", "Salon", "Sportif", "Culturel"];

// ─── 20 événements France ─────────────────────────────────────
const EVENTS_FR: EvenementFR[] = [
  // ── JUIN ──
  {
    id: "fr-001", titre: "Fête de la Musique",
    ville: "Partout en France", region: "Nationale",
    dateISO: "2026-06-21", typeEvt: "Fête locale", typeOffre: "Droit de place",
    statut: "prospecter", visiteurs: 50000, visiteursTxt: "50 000+",
    budgetEstime: "Gratuit – 800 €",
    anneeCreation: 1982, nbTrucksHab: 5, budgetHab: "0–600 €",
    description: "Événement national annuel le 21 juin, organisé par les mairies. Chaque ville propose ses propres scènes et espaces de restauration. Recrutement direct auprès des services culturels municipaux.",
  },
  {
    id: "fr-002", titre: "Bordeaux Fête le Vin",
    ville: "Bordeaux", region: "Nouvelle-Aquitaine",
    dateISO: "2026-06-19", dateFinISO: "2026-06-22", typeEvt: "Festival", typeOffre: "Droit de place",
    statut: "avenir", visiteurs: 90000, visiteursTxt: "90 000",
    budgetEstime: "1 200–2 500 €",
    anneeCreation: 1998, nbTrucksHab: 12, budgetHab: "1 000–2 000 €",
    description: "Grand festival biennal dédié aux vins de Bordeaux, sur les quais de la Garonne. 4 jours de festivités, 90 000 visiteurs, restauration de qualité exigée.",
    semainesAvantOffre: 3,
  },
  {
    id: "fr-003", titre: "Festival Garorock",
    ville: "Marmande", region: "Nouvelle-Aquitaine",
    dateISO: "2026-06-26", dateFinISO: "2026-06-29", typeEvt: "Festival", typeOffre: "Droit de place",
    statut: "ouvert", visiteurs: 40000, visiteursTxt: "40 000",
    budgetEstime: "900–1 800 €",
    anneeCreation: 1997, nbTrucksHab: 20, budgetHab: "800–1 500 €",
    description: "Festival de musique électronique et rock en bord de Garonne. Village foodtruck bien organisé, public jeune et festif, site camping. Fort renouvellement des enseignes.",
    offreId: "opp-garorock-2025",
  },
  {
    id: "fr-004", titre: "Portes Ouvertes Saint-Émilion",
    ville: "Saint-Émilion", region: "Nouvelle-Aquitaine",
    dateISO: "2026-06-21", dateFinISO: "2026-06-22", typeEvt: "Culturel", typeOffre: "Droit de place",
    statut: "prospecter", visiteurs: 30000, visiteursTxt: "30 000",
    budgetEstime: "600–1 200 €",
    anneeCreation: 2005, nbTrucksHab: 8, budgetHab: "500–1 000 €",
    description: "Week-end de découverte des châteaux et chais de Saint-Émilion. Public aisé, valorisation des produits locaux et artisanaux fortement appréciée.",
  },
  {
    id: "fr-005", titre: "Foire aux Vins d'Alsace",
    ville: "Colmar", region: "Grand Est",
    dateISO: "2026-07-25", dateFinISO: "2026-08-04", typeEvt: "Salon", typeOffre: "Droit de place",
    statut: "ouvert", visiteurs: 15000, visiteursTxt: "15 000",
    budgetEstime: "700–1 400 €",
    anneeCreation: 1948, nbTrucksHab: 10, budgetHab: "600–1 200 €",
    description: "La plus grande foire aux vins d'Alsace, 11 jours. Espace gastronomique élargi depuis 2018, les trucks proposant une cuisine régionale ou bistronomique sont très appréciés.",
    offreId: "opp-fvalsace-2025",
  },
  // ── JUILLET ──
  {
    id: "fr-006", titre: "Festival des Vieilles Charrues",
    ville: "Carhaix", region: "Bretagne",
    dateISO: "2026-07-17", dateFinISO: "2026-07-20", typeEvt: "Festival", typeOffre: "Droit de place",
    statut: "ouvert", visiteurs: 70000, visiteursTxt: "70 000",
    budgetEstime: "1 500–3 000 €",
    anneeCreation: 1992, nbTrucksHab: 35, budgetHab: "1 200–2 500 €",
    description: "Le plus grand festival de musique de Bretagne. Village food étendu avec sélection rigoureuse. Dossier de candidature complet requis. Public fidèle, excellente vitrine.",
    offreId: "opp-charrues-2025",
  },
  {
    id: "fr-007", titre: "Les Déferlantes",
    ville: "Argelès-sur-Mer", region: "Occitanie",
    dateISO: "2026-07-03", dateFinISO: "2026-07-06", typeEvt: "Festival", typeOffre: "Droit de place",
    statut: "avenir", visiteurs: 35000, visiteursTxt: "35 000",
    budgetEstime: "800–1 600 €",
    anneeCreation: 2003, nbTrucksHab: 15, budgetHab: "700–1 400 €",
    description: "Festival estival sur la Côte Vermeille, à 200m de la plage. Public familial et festif. Le village food outdoor est central dans le dispositif. Retour aux sources gastronomiques apprécié.",
    semainesAvantOffre: 5,
  },
  {
    id: "fr-008", titre: "Francofolies de La Rochelle",
    ville: "La Rochelle", region: "Nouvelle-Aquitaine",
    dateISO: "2026-07-11", dateFinISO: "2026-07-15", typeEvt: "Festival", typeOffre: "Droit de place",
    statut: "prospecter", visiteurs: 100000, visiteursTxt: "100 000",
    budgetEstime: "1 000–2 000 €",
    anneeCreation: 1985, nbTrucksHab: 25, budgetHab: "900–1 800 €",
    description: "Festival de musiques francophones depuis 40 ans. Sélection très compétitive pour les trucks. Recrutement souvent via réseau direct. Contacter le bureau de production dès janvier.",
  },
  {
    id: "fr-009", titre: "Marchés Nocturnes d'Arcachon",
    ville: "Arcachon", region: "Nouvelle-Aquitaine",
    dateISO: "2026-07-01", typeEvt: "Marché", typeOffre: "Droit de place",
    statut: "prospecter", visiteurs: 3000, visiteursTxt: "3 000",
    budgetEstime: "200–500 €",
    anneeCreation: 2010, nbTrucksHab: 6, budgetHab: "200–450 €",
    description: "Marchés nocturnes chaque mardi de juillet sur le front de mer. Ambiance estivale familiale. Candidatures directes auprès de la mairie d'Arcachon en mars-avril.",
  },
  {
    id: "fr-010", titre: "Tour de France — Étape Nantes",
    ville: "Nantes", region: "Pays de la Loire",
    dateISO: "2026-07-08", typeEvt: "Sportif", typeOffre: "Droit de place",
    statut: "ouvert", visiteurs: 20000, visiteursTxt: "20 000",
    budgetEstime: "400–900 €",
    anneeCreation: 1903, nbTrucksHab: 8, budgetHab: "350–800 €",
    description: "Passage du Tour de France avec village arrivée / départ. Espace restauration géré par ASO et la ville hôte. Offres ouvertes 3 mois avant, via les mairies partenaires.",
    offreId: "opp-tdf-nantes-2025",
  },
  // ── AOÛT ──
  {
    id: "fr-011", titre: "Rock en Seine",
    ville: "Saint-Cloud (Paris)", region: "Île-de-France",
    dateISO: "2026-08-21", dateFinISO: "2026-08-24", typeEvt: "Festival", typeOffre: "Droit de place",
    statut: "avenir", visiteurs: 120000, visiteursTxt: "120 000",
    budgetEstime: "2 000–4 000 €",
    anneeCreation: 2003, nbTrucksHab: 40, budgetHab: "1 800–3 500 €",
    description: "Le festival rock parisien dans le Domaine National de Saint-Cloud. Village food premium avec sélection très exigeante. Fort passage médiatique et visibilité nationale.",
    semainesAvantOffre: 8,
  },
  {
    id: "fr-012", titre: "Festival de Cornouaille",
    ville: "Quimper", region: "Bretagne",
    dateISO: "2026-07-20", dateFinISO: "2026-07-27", typeEvt: "Culturel", typeOffre: "Droit de place",
    statut: "prospecter", visiteurs: 60000, visiteursTxt: "60 000",
    budgetEstime: "600–1 200 €",
    anneeCreation: 1923, nbTrucksHab: 18, budgetHab: "500–1 100 €",
    description: "Festival des cultures bretonnes et celtiques, l'un des plus anciens de France. Recrutement local privilégié, cuisine bretonne très valorisée. Contacter l'office de tourisme de Quimper.",
  },
  {
    id: "fr-013", titre: "Fête du Lac d'Annecy",
    ville: "Annecy", region: "Auvergne-Rhône-Alpes",
    dateISO: "2026-08-09", typeEvt: "Fête locale", typeOffre: "Droit de place",
    statut: "prospecter", visiteurs: 100000, visiteursTxt: "100 000",
    budgetEstime: "800–1 500 €",
    anneeCreation: 1860, nbTrucksHab: 20, budgetHab: "700–1 300 €",
    description: "Fête emblématique avec le plus grand feu d'artifice de France. 100 000 personnes autour du lac. Organisation très structurée, candidatures via la mairie dès février.",
  },
  {
    id: "fr-014", titre: "Les Estivales de Montpellier",
    ville: "Montpellier", region: "Occitanie",
    dateISO: "2026-07-11", dateFinISO: "2026-08-29", typeEvt: "Marché", typeOffre: "Droit de place",
    statut: "ouvert", visiteurs: 8000, visiteursTxt: "8 000 / vendredi",
    budgetEstime: "350–700 €",
    anneeCreation: 2000, nbTrucksHab: 12, budgetHab: "300–650 €",
    description: "Marché nocturne estival chaque vendredi soir place de la Comédie. Ambiance conviviale, produits locaux. Format récurrent idéal pour remplir son agenda de juillet-août.",
    offreId: "opp-estivales-mtp-2025",
  },
  // ── SEPTEMBRE ──
  {
    id: "fr-015", titre: "Vendanges de Montmartre",
    ville: "Paris 18e", region: "Île-de-France",
    dateISO: "2026-10-08", dateFinISO: "2026-10-12", typeEvt: "Fête locale", typeOffre: "Droit de place",
    statut: "avenir", visiteurs: 30000, visiteursTxt: "30 000",
    budgetEstime: "700–1 400 €",
    anneeCreation: 1934, nbTrucksHab: 10, budgetHab: "600–1 200 €",
    description: "Fête des vendanges du seul vignoble de Paris intra-muros. Public très mélangé, nombreux touristes. Sélection par la mairie du 18e arrondissement chaque printemps.",
    semainesAvantOffre: 12,
  },
  {
    id: "fr-016", titre: "Festival du Vent",
    ville: "Calvi", region: "Corse",
    dateISO: "2026-10-22", dateFinISO: "2026-10-26", typeEvt: "Festival", typeOffre: "Droit de place",
    statut: "prospecter", visiteurs: 25000, visiteursTxt: "25 000",
    budgetEstime: "600–1 100 €",
    anneeCreation: 1994, nbTrucksHab: 8, budgetHab: "500–1 000 €",
    description: "Festival engagé autour des arts de rue et de l'environnement à Calvi. Trucks valorisant les produits corses et biologiques très bien reçus. Logistique maritime à prévoir.",
  },
  {
    id: "fr-017", titre: "Foire Internationale de Bordeaux",
    ville: "Bordeaux", region: "Nouvelle-Aquitaine",
    dateISO: "2026-09-13", dateFinISO: "2026-09-21", typeEvt: "Salon", typeOffre: "Droit de place",
    statut: "ouvert", visiteurs: 300000, visiteursTxt: "300 000",
    budgetEstime: "1 200–2 800 €",
    anneeCreation: 1926, nbTrucksHab: 30, budgetHab: "1 000–2 500 €",
    description: "La plus grande foire d'exposition du Sud-Ouest, 9 jours. Espace food très bien fréquenté, profil acheteur familial et CSP+. Forte récurrence des exposants.",
    offreId: "opp-foire-bordeaux-2025",
  },
  {
    id: "fr-018", titre: "Journées du Patrimoine",
    ville: "Partout en France", region: "Nationale",
    dateISO: "2026-09-20", dateFinISO: "2026-09-21", typeEvt: "Culturel", typeOffre: "Variable",
    statut: "prospecter", visiteurs: 12000, visiteursTxt: "Variable",
    budgetEstime: "0–600 €",
    anneeCreation: 1984, nbTrucksHab: 3, budgetHab: "Gratuit–400 €",
    description: "Week-end national d'ouverture des monuments historiques. Des centaines d'événements locaux simultanément. Contacter directement les sites patrimoniaux de votre secteur.",
  },
  // ── OCTOBRE ──
  {
    id: "fr-019", titre: "Fête de la Science",
    ville: "Partout en France", region: "Nationale",
    dateISO: "2026-10-10", dateFinISO: "2026-10-20", typeEvt: "Culturel", typeOffre: "Variable",
    statut: "prospecter", visiteurs: 8000, visiteursTxt: "Variable",
    budgetEstime: "0–500 €",
    anneeCreation: 1991, nbTrucksHab: 2, budgetHab: "Gratuit–350 €",
    description: "Événement national promouvant les sciences. Chaque ville organise ses propres journées portes ouvertes dans les universités, musées et places publiques.",
  },
  {
    id: "fr-020", titre: "Marché de Noël de Strasbourg",
    ville: "Strasbourg", region: "Grand Est",
    dateISO: "2026-11-28", dateFinISO: "2026-12-27", typeEvt: "Marché", typeOffre: "Droit de place",
    statut: "avenir", visiteurs: 2000000, visiteursTxt: "2 000 000",
    budgetEstime: "2 500–5 000 €",
    anneeCreation: 1570, nbTrucksHab: 15, budgetHab: "2 000–4 500 €",
    description: "Le plus ancien marché de Noël d'Europe, 4 semaines. Sélection ultra-compétitive, dossiers reçus jusqu'en mars pour la saison suivante. Cuisine alsacienne exigée.",
    semainesAvantOffre: 20,
  },
];

// ─── Helpers dates ────────────────────────────────────────────
const JOURS_COURT = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MOIS_FR     = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MOIS_COURT  = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];

function ymd(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}
function isoStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) {
  const d = new Date(y, m - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function fmtDate(iso: string) {
  const { y, m, d } = ymd(iso);
  return `${d} ${MOIS_COURT[m - 1]} ${y}`;
}
function fmtMoisKey(k: string) {
  const [y, m] = k.split("-").map(Number);
  return `${MOIS_FR[m - 1].toUpperCase()} ${y}`;
}

// ─── LocalStorage ─────────────────────────────────────────────
const LS_ALERTES = "spotruck_alertes_calendrier";
const LS_DISPO   = "spotruck_dispo_calendrier";
const LS_CAND    = "spotruck_candidatures";

function loadAlertes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(LS_ALERTES) ?? "[]")); }
  catch { return new Set(); }
}
function saveAlertes(s: Set<string>) {
  try { localStorage.setItem(LS_ALERTES, JSON.stringify([...s])); } catch {}
}
function loadDispo(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(LS_DISPO) ?? "[]")); }
  catch { return new Set(); }
}
function saveDispo(s: Set<string>) {
  try { localStorage.setItem(LS_DISPO, JSON.stringify([...s])); } catch {}
}
function loadPostules(): Set<string> {
  // Synchronise avec les candidatures acceptées du LS_CAND
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_CAND);
    if (!raw) return new Set(["fr-006"]); // Vieilles Charrues = déjà postulé (mock)
    const cands = JSON.parse(raw);
    const ids = new Set<string>();
    // cand-002 = Gala Tech Corp → simuler que fr-003 Garorock est postulé
    if (cands.some((c: { statut: string }) => c.statut === "acceptee")) ids.add("fr-006");
    return ids;
  } catch { return new Set(["fr-006"]); }
}

// ─── Taille helpers ───────────────────────────────────────────
function matchTaille(v: number, t: TailleFilt): boolean {
  if (t === "all") return true;
  if (t === "lt1000") return v < 1000;
  if (t === "1000-5000") return v >= 1000 && v < 5000;
  if (t === "5000-20000") return v >= 5000 && v < 20000;
  if (t === "gt20000") return v >= 20000;
  return true;
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, color = S.green, onDone }: { message: string; color?: string; onDone: () => void }) {
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

// ─── Modale base ──────────────────────────────────────────────
function Modale({ children, onClose, maxWidth = 580 }: { children: React.ReactNode; onClose: () => void; maxWidth?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,24,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: S.cream, width: "100%", maxWidth, maxHeight: "92vh", overflowY: "auto", border: `1px solid ${S.border}` }}>
        {children}
      </div>
    </div>
  );
}

// ─── Modale FICHE ÉVÉNEMENT ───────────────────────────────────
function ModaleFiche({
  evt, alertes, dispo, postules,
  onAlerte, onDispo, onClose,
}: {
  evt: EvenementFR;
  alertes: Set<string>; dispo: Set<string>; postules: Set<string>;
  onAlerte: (id: string) => void;
  onDispo: (id: string, val: boolean) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const cfg    = SC[evt.statut];
  const isPostule = postules.has(evt.id);
  const statut = isPostule ? "postule" : evt.statut;
  const statCfg = SC[statut];
  const hasAlerte  = alertes.has(evt.id);
  const isDispo    = dispo.has(evt.id);
  const isInDispo  = dispo.has(`${evt.id}:non`);

  const dateTxt = evt.dateFinISO
    ? `Du ${fmtDate(evt.dateISO)} au ${fmtDate(evt.dateFinISO)}`
    : fmtDate(evt.dateISO);

  return (
    <Modale onClose={onClose} maxWidth={620}>
      {/* En-tête */}
      <div style={{ padding: "1.75rem 2rem", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, paddingRight: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
            <span style={{ backgroundColor: statCfg.bg, color: statCfg.color, fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", fontWeight: 700, padding: "0.25rem 0.6rem" }}>
              {statCfg.label}
            </span>
            <span style={{ backgroundColor: S.card, color: S.muted, fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", padding: "0.25rem 0.6rem" }}>
              {evt.typeEvt.toUpperCase()}
            </span>
            <span style={{ backgroundColor: S.card, color: S.muted, fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", padding: "0.25rem 0.6rem" }}>
              {evt.typeOffre.toUpperCase()}
            </span>
          </div>
          <h2 style={{ fontFamily: S.serif, fontSize: "1.5rem", fontWeight: 800, color: S.brown, lineHeight: 1.2 }}>{evt.titre}</h2>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted, flexShrink: 0, marginTop: "0.25rem" }}>
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div style={{ padding: "1.75rem 2rem" }}>

        {/* ── SECTION 1 — Infos générales ── */}
        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.22em", color: S.terra, fontWeight: 700, marginBottom: "0.75rem" }}>
            INFORMATIONS GÉNÉRALES
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {[
              { icon: <span style={{ fontSize: "0.75rem" }}>📅</span>, label: "DATE", val: dateTxt },
              { icon: <MapPin size={12} strokeWidth={1.5} />, label: "LIEU", val: `${evt.ville}` },
              { icon: <MapPin size={12} strokeWidth={1.5} />, label: "RÉGION", val: evt.region },
              { icon: <Users size={12} strokeWidth={1.5} />, label: "VISITEURS", val: evt.visiteursTxt },
              { icon: <Euro size={12} strokeWidth={1.5} />, label: "BUDGET ESTIMÉ", val: evt.budgetEstime },
              { icon: <span style={{ fontSize: "0.75rem" }}>🔄</span>, label: "SOURCE", val: `Événement récurrent depuis ${evt.anneeCreation}` },
            ].map(({ icon, label, val }) => (
              <div key={label} style={{ backgroundColor: S.card, padding: "0.75rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.25rem" }}>
                  <span style={{ color: S.muted }}>{icon}</span>
                  <p style={{ fontFamily: S.sans, fontSize: "0.56rem", letterSpacing: "0.2em", color: S.muted }}>{label}</p>
                </div>
                <p style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, fontWeight: 300, lineHeight: 1.4 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 2 — Historique ── */}
        <div style={{ marginBottom: "1.75rem", padding: "1.25rem", backgroundColor: S.card, borderLeft: `3px solid ${S.border}` }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.22em", color: S.terra, fontWeight: 700, marginBottom: "0.75rem" }}>
            HISTORIQUE
          </p>
          <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.7, marginBottom: "0.75rem" }}>
            {evt.description}
          </p>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", paddingTop: "0.75rem", borderTop: `1px solid ${S.border}` }}>
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.56rem", letterSpacing: "0.18em", color: S.muted, marginBottom: "0.2rem" }}>TRUCKS HABITUELLEMENT</p>
              <p style={{ fontFamily: S.sans, fontSize: "0.85rem", fontWeight: 700, color: S.brown }}>{evt.nbTrucksHab} trucks</p>
            </div>
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.56rem", letterSpacing: "0.18em", color: S.muted, marginBottom: "0.2rem" }}>BUDGET HABITUEL</p>
              <p style={{ fontFamily: S.sans, fontSize: "0.85rem", fontWeight: 700, color: S.brown }}>{evt.budgetHab}</p>
            </div>
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.56rem", letterSpacing: "0.18em", color: S.muted, marginBottom: "0.2rem" }}>FRÉQUENTATION</p>
              <p style={{ fontFamily: S.sans, fontSize: "0.85rem", fontWeight: 700, color: S.brown }}>~{evt.visiteursTxt} visiteurs</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 3 — Statut de l'offre ── */}
        <div style={{ marginBottom: "1.75rem", padding: "1.25rem", border: `1px solid ${statCfg.dot}33` }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.22em", color: S.terra, fontWeight: 700, marginBottom: "0.75rem" }}>
            STATUT DE L'OFFRE
          </p>

          {isPostule ? (
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.6, marginBottom: "1rem" }}>
                ✓ Vous avez déjà postulé à cet événement. Suivez l'avancement dans votre espace <strong style={{ color: S.brown }}>Candidatures</strong>.
              </p>
              <button
                onClick={() => { router.push("/dashboard/foodtrucker/candidatures"); onClose(); }}
                style={{ backgroundColor: S.green, color: "#fff", border: "none", padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.63rem", letterSpacing: "0.2em", cursor: "pointer" }}
              >
                VOIR MES CANDIDATURES
              </button>
            </div>
          ) : evt.statut === "ouvert" ? (
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.6, marginBottom: "1rem" }}>
                Une offre est actuellement publiée pour cet événement. Consultez la fiche complète et déposez votre candidature.
              </p>
              <button
                onClick={() => {
                  router.push(`/dashboard/foodtrucker/opportunites${evt.offreId ? `?id=${evt.offreId}&modal=detail` : ""}`);
                  onClose();
                }}
                style={{ backgroundColor: S.terra, color: "#fff", border: "none", padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.63rem", letterSpacing: "0.2em", cursor: "pointer" }}
              >
                VOIR L'APPEL D'OFFRE ET POSTULER →
              </button>
            </div>
          ) : evt.statut === "avenir" ? (
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.6, marginBottom: "1rem" }}>
                L'offre sera publiée dans environ{" "}
                <strong style={{ color: S.brown }}>{evt.semainesAvantOffre} semaine{(evt.semainesAvantOffre ?? 0) > 1 ? "s" : ""}</strong>.
                Activez une alerte pour être notifié dès l'ouverture.
              </p>
              <button
                onClick={() => { onAlerte(evt.id); }}
                disabled={hasAlerte}
                style={{
                  backgroundColor: hasAlerte ? S.green : "transparent",
                  color: hasAlerte ? "#fff" : S.amber,
                  border: `1px solid ${hasAlerte ? S.green : S.amber}`,
                  padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.63rem", letterSpacing: "0.2em",
                  cursor: hasAlerte ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                }}
              >
                <Bell size={13} strokeWidth={1.5} />
                {hasAlerte ? "ALERTE ACTIVÉE ✓" : "M'ALERTER QUAND L'OFFRE EST PUBLIÉE"}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.6, marginBottom: "1rem" }}>
                Aucune offre publiée — cet événement recrute souvent directement auprès des organisateurs. Utilisez la base de prospection pour contacter l'organisateur.
              </p>
              <button
                onClick={() => { router.push("/dashboard/foodtrucker/prospection"); onClose(); }}
                style={{ backgroundColor: "transparent", color: S.blue, border: `1px solid ${S.blue}`, padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.63rem", letterSpacing: "0.2em", cursor: "pointer" }}
              >
                PROSPECTER CET ORGANISATEUR →
              </button>
            </div>
          )}
        </div>

        {/* ── SECTION 4 — Disponibilité ── */}
        <div style={{ padding: "1.25rem", backgroundColor: S.card }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.22em", color: S.terra, fontWeight: 700, marginBottom: "0.6rem" }}>
            MA DISPONIBILITÉ
          </p>
          <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted, marginBottom: "1rem" }}>
            Êtes-vous disponible à cette date ?
          </p>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              onClick={() => onDispo(evt.id, true)}
              style={{
                backgroundColor: isDispo ? S.green : "transparent",
                color: isDispo ? "#fff" : S.green,
                border: `1px solid ${S.green}`,
                padding: "0.65rem 1.1rem", fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.18em", cursor: "pointer",
              }}
            >
              {isDispo ? "✓ DISPONIBLE" : "OUI, JE SUIS DISPONIBLE"}
            </button>
            <button
              onClick={() => onDispo(evt.id, false)}
              style={{
                backgroundColor: isInDispo ? S.muted : "transparent",
                color: isInDispo ? "#fff" : S.muted,
                border: `1px solid ${S.border}`,
                padding: "0.65rem 1.1rem", fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.18em", cursor: "pointer",
              }}
            >
              {isInDispo ? "✗ INDISPONIBLE" : "NON, JE SUIS INDISPONIBLE"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer fermer */}
      <div style={{ padding: "1rem 2rem", borderTop: `1px solid ${S.border}`, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "0.65rem 1.5rem", fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", cursor: "pointer" }}>
          FERMER
        </button>
      </div>
    </Modale>
  );
}

// ─── Select filtre ────────────────────────────────────────────
function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", gap: "0.3rem" }}>
      <span style={{ fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.18em", color: S.muted }}>{label}</span>
      <div style={{ position: "relative" }}>
        <select
          value={value} onChange={e => onChange(e.target.value)}
          style={{
            appearance: "none", WebkitAppearance: "none",
            backgroundColor: "transparent", border: `1px solid ${S.border}`,
            color: S.brown, fontFamily: S.sans, fontSize: "0.72rem",
            padding: "0.45rem 2rem 0.45rem 0.75rem", outline: "none", cursor: "pointer",
            minWidth: 160,
          }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={12} strokeWidth={1.5} color={S.muted} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ─── VUE MENSUELLE ────────────────────────────────────────────
function VueMensuelle({
  annee, mois, events, postules,
  onPrevMois, onNextMois, onEvtClick,
}: {
  annee: number; mois: number; events: EvenementFR[]; postules: Set<string>;
  onPrevMois: () => void; onNextMois: () => void;
  onEvtClick: (e: EvenementFR) => void;
}) {
  const total   = daysInMonth(annee, mois);
  const premier = firstDayOfMonth(annee, mois);
  const today   = new Date().toISOString().slice(0, 10);

  // Map jour → events (on range chaque event sur toute sa plage)
  const byDay: Record<string, EvenementFR[]> = {};
  events.forEach(e => {
    const start = e.dateISO;
    const end   = e.dateFinISO ?? e.dateISO;
    let cur = start;
    while (cur <= end) {
      if (!byDay[cur]) byDay[cur] = [];
      // Évite doublons
      if (!byDay[cur].find(x => x.id === e.id)) byDay[cur].push(e);
      const { y, m, d } = ymd(cur);
      const next = new Date(y, m - 1, d + 1);
      cur = isoStr(next.getFullYear(), next.getMonth() + 1, next.getDate());
    }
  });

  const cells: (number | null)[] = [
    ...Array(premier).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Nav mois */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
        <button onClick={onPrevMois} style={{ background: "none", border: `1px solid ${S.border}`, cursor: "pointer", color: S.muted, padding: "0.5rem", display: "flex" }}>
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <h2 style={{ fontFamily: S.serif, fontSize: "1.6rem", fontWeight: 800, color: S.brown, minWidth: 260, textAlign: "center" }}>
          {MOIS_FR[mois - 1]} {annee}
        </h2>
        <button onClick={onNextMois} style={{ background: "none", border: `1px solid ${S.border}`, cursor: "pointer", color: S.muted, padding: "0.5rem", display: "flex" }}>
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* En-têtes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "2px" }}>
        {JOURS_COURT.map(j => (
          <div key={j} style={{ backgroundColor: S.card, padding: "0.65rem", textAlign: "center", fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted }}>
            {j}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} style={{ backgroundColor: "rgba(237,232,223,0.35)", minHeight: 90 }} />;
          const iso  = isoStr(annee, mois, day);
          const evts = byDay[iso] ?? [];
          const isToday = iso === today;
          return (
            <div
              key={iso}
              style={{ backgroundColor: S.card, minHeight: 90, padding: "0.45rem 0.5rem", border: isToday ? `2px solid ${S.terra}` : "2px solid transparent", transition: "background-color 0.12s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#E5DDD3"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = S.card; }}
            >
              <span style={{ fontFamily: S.sans, fontSize: "0.7rem", fontWeight: isToday ? 700 : 400, color: isToday ? S.terra : S.brown, display: "block", marginBottom: "0.3rem" }}>
                {day}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {evts.slice(0, 3).map(e => {
                  const statut: StatutOffre = postules.has(e.id) ? "postule" : e.statut;
                  const cfg = SC[statut];
                  return (
                    <button
                      key={e.id}
                      onClick={() => onEvtClick(e)}
                      style={{ display: "flex", alignItems: "center", gap: "3px", background: cfg.bg, border: "none", cursor: "pointer", padding: "2px 4px", textAlign: "left", width: "100%" }}
                    >
                      <div style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, backgroundColor: cfg.dot }} />
                      <span style={{ fontFamily: S.sans, fontSize: "0.56rem", color: S.brown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.titre}
                      </span>
                    </button>
                  );
                })}
                {evts.length > 3 && (
                  <span style={{ fontFamily: S.sans, fontSize: "0.52rem", color: S.muted, paddingLeft: "0.2rem" }}>+{evts.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: `1px solid ${S.border}` }}>
        {(Object.entries(SC) as [StatutOffre, typeof SC[StatutOffre]][]).map(([, cfg]) => (
          <div key={cfg.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: cfg.dot }} />
            <span style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.12em", color: S.muted }}>{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VUE PLANNING ─────────────────────────────────────────────
function VuePlanning({
  events, postules, onVoir,
}: { events: EvenementFR[]; postules: Set<string>; onVoir: (e: EvenementFR) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const futurs = [...events].filter(e => (e.dateFinISO ?? e.dateISO) >= today)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  const groupes: Record<string, EvenementFR[]> = {};
  futurs.forEach(e => {
    const { y, m } = ymd(e.dateISO);
    const k = `${y}-${String(m).padStart(2,"0")}`;
    if (!groupes[k]) groupes[k] = [];
    groupes[k].push(e);
  });
  const moisKeys = Object.keys(groupes).sort();

  if (moisKeys.length === 0) return (
    <div style={{ textAlign: "center", padding: "4rem 2rem", color: S.muted, fontFamily: S.sans, fontSize: "0.82rem" }}>
      Aucun événement correspondant aux filtres.
    </div>
  );

  return (
    <div>
      {moisKeys.map(mk => (
        <div key={mk} style={{ marginBottom: "2.5rem" }}>
          {/* Séparateur mois */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <span style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.25em", color: S.terra, fontWeight: 700 }}>{fmtMoisKey(mk)}</span>
            <div style={{ flex: 1, height: 1, backgroundColor: S.border }} />
          </div>

          <div style={{ border: `1px solid ${S.border}` }}>
            {groupes[mk].map((e, i) => {
              const statut: StatutOffre = postules.has(e.id) ? "postule" : e.statut;
              const cfg = SC[statut];
              const isLast = i === groupes[mk].length - 1;
              const dateTxt = e.dateFinISO ? `${ymd(e.dateISO).d}–${ymd(e.dateFinISO).d} ${MOIS_COURT[ymd(e.dateISO).m - 1]}` : fmtDate(e.dateISO);
              return (
                <div key={e.id} style={{
                  display: "grid", gridTemplateColumns: "110px 1fr auto",
                  padding: "1.1rem 1.5rem", alignItems: "center", gap: "1.5rem",
                  borderBottom: isLast ? "none" : `1px solid ${S.border}`,
                }}>
                  {/* Date */}
                  <div>
                    <div style={{ fontFamily: S.serif, fontSize: "1.5rem", fontWeight: 800, color: S.brown, lineHeight: 1 }}>
                      {ymd(e.dateISO).d}
                    </div>
                    <div style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", color: S.muted }}>
                      {MOIS_COURT[ymd(e.dateISO).m - 1].toUpperCase()} {e.dateFinISO ? `→ ${ymd(e.dateFinISO).d}` : ""}
                    </div>
                    <div style={{ fontFamily: S.sans, fontSize: "0.6rem", color: S.muted, marginTop: "0.2rem" }}>{e.ville}</div>
                  </div>

                  {/* Infos */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: S.sans, fontSize: "0.875rem", color: S.brown }}>{e.titre}</span>
                      <span style={{ backgroundColor: cfg.bg, color: cfg.color, fontFamily: S.sans, fontSize: "0.56rem", letterSpacing: "0.12em", fontWeight: 700, padding: "0.2rem 0.5rem" }}>{cfg.label}</span>
                      <span style={{ backgroundColor: S.card, color: S.muted, fontFamily: S.sans, fontSize: "0.56rem", letterSpacing: "0.1em", padding: "0.2rem 0.5rem" }}>{e.typeOffre.toUpperCase()}</span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: S.sans, fontSize: "0.7rem", fontWeight: 300, color: S.muted, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Users size={10} strokeWidth={1.5} /> {e.visiteursTxt}
                      </span>
                      <span style={{ fontFamily: S.sans, fontSize: "0.7rem", fontWeight: 300, color: S.muted, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Euro size={10} strokeWidth={1.5} /> {e.budgetEstime}
                      </span>
                      <span style={{ fontFamily: S.sans, fontSize: "0.7rem", fontWeight: 300, color: S.muted }}>
                        {e.typeEvt}
                      </span>
                    </div>
                  </div>

                  {/* Bouton */}
                  <button
                    onClick={() => onVoir(e)}
                    style={{ backgroundColor: "transparent", color: S.terra, border: `1px solid ${S.terra}`, padding: "0.5rem 1rem", fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.18em", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    VOIR
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────
type Vue = "mensuelle" | "planning";

export default function CalendrierPage() {
  const today = new Date();
  const [vue,       setVue]       = useState<Vue>("planning");
  const [annee,     setAnnee]     = useState(today.getFullYear());
  const [mois,      setMois]      = useState(today.getMonth() + 1);

  // Filtres
  const [filtRegion,  setFiltRegion]  = useState("Toutes les régions");
  const [filtType,    setFiltType]    = useState("Tous les types");
  const [filtStatut,  setFiltStatut]  = useState("Tous");
  const [filtTaille,  setFiltTaille]  = useState<TailleFilt>("all");
  const [filtDispo,   setFiltDispo]   = useState(false);

  // États persistés
  const [alertes,   setAlertes]   = useState<Set<string>>(new Set());
  const [dispo,     setDispo]     = useState<Set<string>>(new Set());
  const [postules,  setPostules]  = useState<Set<string>>(new Set());

  const [ficheEvt, setFicheEvt] = useState<EvenementFR | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; color?: string } | null>(null);

  // Hydration
  useEffect(() => {
    setAlertes(loadAlertes());
    setDispo(loadDispo());
    setPostules(loadPostules());
  }, []);

  // Navigation mois
  function prevMois() { if (mois === 1) { setMois(12); setAnnee(a => a - 1); } else setMois(m => m - 1); }
  function nextMois() { if (mois === 12) { setMois(1); setAnnee(a => a + 1); } else setMois(m => m + 1); }

  // Alerte
  function handleAlerte(id: string) {
    const next = new Set(alertes);
    next.add(id);
    setAlertes(next);
    saveAlertes(next);
    setToast({ msg: "Alerte activée — vous serez notifié dès la publication", color: S.amber });
  }

  // Disponibilité
  function handleDispo(id: string, val: boolean) {
    const next = new Set(dispo);
    if (val) { next.add(id); next.delete(`${id}:non`); }
    else     { next.add(`${id}:non`); next.delete(id); }
    setDispo(next);
    saveDispo(next);
    setToast({ msg: val ? "Marqué disponible pour cet événement" : "Marqué indisponible", color: val ? S.green : S.muted });
  }

  // Filtrage
  const STATUT_OPTS: Record<string, StatutOffre | "">= {
    "Tous": "", "Offre ouverte": "ouvert", "Offre à venir": "avenir",
    "À prospecter": "prospecter", "J'ai postulé": "postule",
  };
  const TAILLE_OPTS: { label: string; val: TailleFilt }[] = [
    { label: "Toutes les tailles", val: "all" },
    { label: "< 1 000 visiteurs", val: "lt1000" },
    { label: "1 000 – 5 000", val: "1000-5000" },
    { label: "5 000 – 20 000", val: "5000-20000" },
    { label: "+ 20 000 visiteurs", val: "gt20000" },
  ];

  const filtered = EVENTS_FR.filter(e => {
    const statut: StatutOffre = postules.has(e.id) ? "postule" : e.statut;
    if (filtRegion !== "Toutes les régions" && e.region !== filtRegion) return false;
    if (filtType   !== "Tous les types"     && e.typeEvt !== filtType) return false;
    if (filtStatut !== "Tous") {
      const wanted = STATUT_OPTS[filtStatut];
      if (wanted && statut !== wanted) return false;
    }
    if (!matchTaille(e.visiteurs, filtTaille)) return false;
    if (filtDispo && !dispo.has(e.id)) return false;
    return true;
  });

  // Pour la vue mensuelle : seulement les events du mois courant
  const filteredMois = filtered.filter(e => {
    const start = e.dateISO.slice(0, 7);
    const end   = (e.dateFinISO ?? e.dateISO).slice(0, 7);
    const cur   = `${annee}-${String(mois).padStart(2, "0")}`;
    return start <= cur && end >= cur;
  });

  const nbFiltres = [
    filtRegion !== "Toutes les régions",
    filtType !== "Tous les types",
    filtStatut !== "Tous",
    filtTaille !== "all",
    filtDispo,
  ].filter(Boolean).length;

  return (
    <>
      <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown, display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <FoodtruckerSidebar active="/dashboard/foodtrucker/calendrier" />

        <div style={{ padding: "3rem", minWidth: 0 }}>
          {/* ── Header ── */}
          <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>DASHBOARD — FOODTRUCKER</p>
              <h1 style={{ fontFamily: S.serif, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.1 }}>Calendrier des événements</h1>
              <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted, marginTop: "0.4rem" }}>
                {EVENTS_FR.length} événements récurrents en France — Cliquez pour voir la fiche et postuler
              </p>
            </div>
            {/* Bascule vue */}
            <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
              {(["planning", "mensuelle"] as Vue[]).map(v => (
                <button key={v} onClick={() => setVue(v)} style={{
                  backgroundColor: vue === v ? S.terra : "transparent",
                  color: vue === v ? "#fff" : S.muted,
                  border: `1px solid ${vue === v ? S.terra : S.border}`,
                  padding: "0.6rem 1.1rem", fontFamily: S.sans, fontSize: "0.62rem",
                  letterSpacing: "0.18em", cursor: "pointer", transition: "background-color 0.15s",
                }}>
                  {v === "mensuelle" ? "VUE MENSUELLE" : "VUE PLANNING"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Filtres ── */}
          <div style={{ backgroundColor: S.card, padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <FilterSelect
              label="RÉGION"
              value={filtRegion}
              options={REGIONS}
              onChange={setFiltRegion}
            />
            <FilterSelect
              label="TYPE D'ÉVÉNEMENT"
              value={filtType}
              options={["Tous les types", ...TYPES_EVT]}
              onChange={v => setFiltType(v)}
            />
            <FilterSelect
              label="STATUT"
              value={filtStatut}
              options={Object.keys(STATUT_OPTS)}
              onChange={setFiltStatut}
            />
            <FilterSelect
              label="TAILLE"
              value={TAILLE_OPTS.find(t => t.val === filtTaille)?.label ?? "Toutes les tailles"}
              options={TAILLE_OPTS.map(t => t.label)}
              onChange={v => setFiltTaille(TAILLE_OPTS.find(t => t.label === v)?.val ?? "all")}
            />
            {/* Toggle dispo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.18em", color: S.muted }}>MES DISPONIBILITÉS</span>
              <button
                onClick={() => setFiltDispo(v => !v)}
                style={{
                  backgroundColor: filtDispo ? S.green : "transparent",
                  color: filtDispo ? "#fff" : S.muted,
                  border: `1px solid ${filtDispo ? S.green : S.border}`,
                  padding: "0.45rem 0.9rem", fontFamily: S.sans, fontSize: "0.65rem",
                  letterSpacing: "0.12em", cursor: "pointer",
                }}
              >
                {filtDispo ? "✓ ACTIVÉ" : "UNIQUEMENT"}
              </button>
            </div>

            {/* Compteur + reset */}
            {nbFiltres > 0 && (
              <button
                onClick={() => { setFiltRegion("Toutes les régions"); setFiltType("Tous les types"); setFiltStatut("Tous"); setFiltTaille("all"); setFiltDispo(false); }}
                style={{ alignSelf: "flex-end", backgroundColor: "transparent", color: S.terra, border: `1px solid ${S.terra}`, padding: "0.45rem 0.75rem", fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", cursor: "pointer" }}
              >
                EFFACER ({nbFiltres})
              </button>
            )}

            <div style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
              <span style={{ fontFamily: S.sans, fontSize: "0.65rem", color: S.muted }}>
                <strong style={{ color: S.brown }}>{filtered.length}</strong> événement{filtered.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* ── Vues ── */}
          {vue === "mensuelle" ? (
            <VueMensuelle
              annee={annee} mois={mois}
              events={filteredMois}
              postules={postules}
              onPrevMois={prevMois} onNextMois={nextMois}
              onEvtClick={e => setFicheEvt(e)}
            />
          ) : (
            <VuePlanning
              events={filtered}
              postules={postules}
              onVoir={e => setFicheEvt(e)}
            />
          )}
        </div>
      </main>

      {/* ── Modale fiche ── */}
      {ficheEvt && (
        <ModaleFiche
          evt={ficheEvt}
          alertes={alertes}
          dispo={dispo}
          postules={postules}
          onAlerte={handleAlerte}
          onDispo={handleDispo}
          onClose={() => setFicheEvt(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} color={toast.color} onDone={() => setToast(null)} />}
    </>
  );
}

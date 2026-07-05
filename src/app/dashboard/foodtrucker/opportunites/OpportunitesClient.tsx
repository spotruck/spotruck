"use client";
import dynamic from "next/dynamic";
const OpportunitesMap = dynamic(() => import("./OpportunitesMap"), { ssr: false });

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import { createClient } from "@/lib/supabase/client";
import { getCoordonneesVille, getRegionVille } from "@/lib/geo";
import {
  MapPin, Users, Euro, CalendarDays, SlidersHorizontal, ArrowRight, X,
  Search, CheckCircle, AlertCircle, RotateCcw, Bookmark, BookmarkCheck,
  ExternalLink, Mail, Send, Copy, AlertTriangle, Clock, Map as MapIcon,
  Paperclip, FileText, Image as ImageIcon,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream: "#F2EDE4", brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  violet: "#7C3AED",
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Inter', Helvetica, sans-serif",
};

// ─── Types ────────────────────────────────────────────────────
type ModeCandidature = "email" | "lien_externe" | "formulaire_spotruck" | "courrier";

interface Evenement {
  id: number;
  titre: string;
  date: string;
  dateISO: string;
  heures: string;
  adresse: string;
  ville: string;
  region: string;
  type: string;
  visiteurs: number;
  trucks: number;
  budgetMin: number;
  budgetMax: number;
  budgetLabel: string;
  offre: "DROIT DE PLACE" | "PRIVATISATION";
  cuisinesRecherchees: string[];
  electricite: boolean;
  surfaceParTruck: string;
  nouveau: boolean;
  publicationISO: string;
  dateLimiteCandidatureISO: string;
  dateLimiteCandidatureLabel: string;
  source: string;
  urlSource: string;
  description: string;
  descriptionComplete: string;
  instructionsCandidature: string;
  modeCandidature: ModeCandidature;
  contactCandidature: string;
  documentsRequis: string[];
}

interface UserData {
  displayName: string;
  displaySubtitle: string;
  initials: string;
  planLabel: string;
}

interface Props {
  initialEvenements: Evenement[];
  userPlan: "free" | "pro" | "premium" | "saison";
  userData: UserData;
  foodtruckerId: string;
}

// Documents disponibles dans le profil mock du foodtrucker
const DOCS_PROFIL = ["KBIS", "HACCP", "Photos du truck", "Menu détaillé"];

const REGIONS = [
  "Toutes les régions", "Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine",
  "Occitanie", "Hauts-de-France", "Provence-Alpes-Côte d'Azur", "Grand Est",
  "Pays de la Loire", "Normandie", "Bretagne", "Bourgogne-Franche-Comté",
  "Centre-Val de Loire", "Corse",
];
const TYPES_EVENEMENT = ["Festival", "Mariage", "Fête de quartier", "Salon", "Marché", "Séminaire", "Autre"];

// ─── Helpers ──────────────────────────────────────────────────
function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function joursRestants(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
function isNouveau(iso: string): boolean {
  return (Date.now() - new Date(iso).getTime()) < 48 * 60 * 60 * 1000;
}

// ─── Pièces jointes candidature ────────────────────────────────
const ATTACH_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const ATTACH_MAX_FILES = 5;
const ATTACH_MAX_MB = 10;

function attachMimeOf(name: string): "pdf" | "image" {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ext === "pdf" ? "pdf" : "image";
}
function fmtFileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── LocalStorage hook ────────────────────────────────────────
const LS_KEY = "spotruck_favoris";

function loadFavoris(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch { return new Set(); }
}

function saveFavoris(s: Set<number>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify([...s])); } catch {}
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, color, onDone }: { message: string; color: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
      backgroundColor: color, color: "#fff", zIndex: 3000,
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

// ─── Modale fiche complète ────────────────────────────────────
function ModaleFiche({
  event, saved, submitting, onClose, onSave, onCandidature,
}: {
  event: Evenement;
  saved: boolean;
  submitting: boolean;
  onClose: () => void;
  onSave: () => void;
  onCandidature: (message: string, files: File[]) => void;
}) {
  const [message, setMessage] = useState("");
  const [joinDocs, setJoinDocs] = useState(true);
  const [copied, setCopied] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const MAX_CHARS = 500;
  const jours = joursRestants(event.dateLimiteCandidatureISO);

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const remaining = ATTACH_MAX_FILES - attachedFiles.length;
    const toAdd = picked.slice(0, remaining).filter(f => f.size <= ATTACH_MAX_MB * 1024 * 1024);
    setAttachedFiles(prev => [...prev, ...toAdd]);
    e.target.value = "";
  }
  function removeFile(idx: number) {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const modeLabel: Record<ModeCandidature, string> = {
    email: "EMAIL", lien_externe: "FORMULAIRE EN LIGNE",
    formulaire_spotruck: "FORMULAIRE SPOTRUCK", courrier: "COURRIER POSTAL",
  };
  const modeBadgeColor: Record<ModeCandidature, string> = {
    email: "#2C7A4B", lien_externe: "#1D6FA4", formulaire_spotruck: S.terra, courrier: "#7C3AED",
  };

  const btnBase: React.CSSProperties = {
    fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em",
    cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
    border: "none", padding: "0.875rem 1.5rem",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(44,24,16,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "1rem",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: S.cream, width: "100%", maxWidth: 760,
        height: "90vh", display: "flex", flexDirection: "column",
        border: `1px solid ${S.border}`, overflowY: "hidden",
      }}>
        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* SECTION 1 — EN-TÊTE */}
          <div style={{ padding: "2rem 2.5rem", borderBottom: `1px solid ${S.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                {/* Badges mode + offre */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  <span style={{
                    backgroundColor: event.offre === "DROIT DE PLACE" ? S.terra : S.violet,
                    color: "#fff", fontFamily: S.sans, fontSize: "0.58rem",
                    letterSpacing: "0.18em", padding: "0.3rem 0.7rem",
                  }}>{event.offre}</span>
                  <span style={{
                    backgroundColor: modeBadgeColor[event.modeCandidature],
                    color: "#fff", fontFamily: S.sans, fontSize: "0.58rem",
                    letterSpacing: "0.15em", padding: "0.3rem 0.7rem",
                  }}>CANDIDATURE : {modeLabel[event.modeCandidature]}</span>
                  {event.type && (
                    <span style={{ border: `1px solid ${S.border}`, color: S.muted, fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", padding: "0.3rem 0.7rem" }}>
                      {event.type.toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 style={{ fontFamily: S.serif, fontSize: "1.8rem", fontWeight: 800, color: S.brown, lineHeight: 1.15, marginBottom: "1rem" }}>
                  {event.titre}
                </h2>
                {/* Source */}
                {event.urlSource !== "#" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted }}>
                      Appel d'offre publié sur
                    </span>
                    <a href={event.urlSource} target="_blank" rel="noreferrer" style={{
                      fontFamily: S.sans, fontSize: "0.72rem", color: S.terra,
                      textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem",
                      fontWeight: 500,
                    }}>
                      {event.source} <ExternalLink size={11} strokeWidth={1.5} />
                    </a>
                  </div>
                )}
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted, flexShrink: 0 }}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            {/* Dates publication / limite */}
            <div style={{ display: "flex", gap: "2rem", marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: `1px solid ${S.border}` }}>
              <div>
                <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.25rem" }}>PUBLIÉ LE</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.82rem", color: S.brown, fontWeight: 400 }}>
                  {new Date(event.publicationISO).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.25rem" }}>DATE LIMITE</p>
                <p style={{
                  fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 600,
                  color: jours <= 7 ? "#C0392B" : S.brown,
                  display: "flex", alignItems: "center", gap: "0.35rem",
                }}>
                  {jours <= 7 && <AlertTriangle size={13} strokeWidth={2} />}
                  {event.dateLimiteCandidatureLabel}
                  {jours > 0 && jours <= 7 && <span style={{ fontWeight: 400, fontSize: "0.72rem" }}>({jours}j restants)</span>}
                  {jours <= 0 && <span style={{ fontWeight: 400, fontSize: "0.72rem", color: S.muted }}>(échue)</span>}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2 — DÉTAILS */}
          <div style={{ padding: "2rem 2.5rem", borderBottom: `1px solid ${S.border}` }}>
            <h3 style={{ fontFamily: S.serif, fontSize: "1.15rem", fontWeight: 700, color: S.brown, marginBottom: "1.5rem" }}>Détails de l'événement</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { label: "DATE & HORAIRES",       val: `${event.date}${event.heures ? ` · ${event.heures}` : ''}` },
                { label: "LIEU",                  val: event.adresse ? `${event.adresse}, ${event.ville}` : event.ville },
                { label: "VISITEURS ATTENDUS",    val: event.visiteurs > 0 ? event.visiteurs.toLocaleString("fr-FR") : "Non précisé" },
                { label: "TRUCKS RECHERCHÉS",     val: `${event.trucks} truck${event.trucks > 1 ? "s" : ""}` },
                { label: "BUDGET / DROIT DE PLACE", val: event.budgetLabel },
                { label: "SURFACE PAR TRUCK",     val: event.surfaceParTruck },
                { label: "ALIMENTATION ÉLEC.",    val: event.electricite ? "✅ Disponible" : "❌ Non disponible — groupe électrogène requis" },
                { label: "CUISINES RECHERCHÉES",  val: event.cuisinesRecherchees.length > 0 ? event.cuisinesRecherchees.join(", ") : "Non précisé" },
              ].map(({ label, val }) => (
                <div key={label} style={{ backgroundColor: S.card, padding: "0.875rem 1rem" }}>
                  <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.3rem" }}>{label}</p>
                  <p style={{ fontFamily: S.sans, fontSize: "0.82rem", color: S.brown, fontWeight: 300, lineHeight: 1.4 }}>{val}</p>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: S.sans, fontSize: "0.875rem", fontWeight: 300, color: S.muted, lineHeight: 1.8 }}>
              {event.descriptionComplete || "Aucune description disponible."}
            </p>
          </div>

          {/* SECTION 3 — DOCUMENTS REQUIS */}
          <div style={{ padding: "2rem 2.5rem", borderBottom: `1px solid ${S.border}` }}>
            <h3 style={{ fontFamily: S.serif, fontSize: "1.15rem", fontWeight: 700, color: S.brown, marginBottom: "1.25rem" }}>Documents requis</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {event.documentsRequis.map((doc) => {
                const dispo = DOCS_PROFIL.includes(doc);
                return (
                  <div key={doc} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0.75rem 1rem",
                    backgroundColor: dispo ? "rgba(44,122,75,0.06)" : "rgba(196,98,45,0.06)",
                    border: `1px solid ${dispo ? "rgba(44,122,75,0.2)" : "rgba(196,98,45,0.2)"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {dispo
                        ? <CheckCircle size={14} color="#2C7A4B" strokeWidth={2} />
                        : <AlertTriangle size={14} color={S.terra} strokeWidth={2} />
                      }
                      <span style={{ fontFamily: S.sans, fontSize: "0.82rem", color: S.brown }}>{doc}</span>
                    </div>
                    <span style={{
                      fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.15em",
                      color: dispo ? "#2C7A4B" : S.terra, fontWeight: 500,
                    }}>
                      {dispo ? "DISPONIBLE DANS VOTRE PROFIL" : "À AJOUTER DANS VOTRE PROFIL"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4 — COMMENT CANDIDATER */}
          <div style={{ padding: "2rem 2.5rem" }}>
            <h3 style={{ fontFamily: S.serif, fontSize: "1.15rem", fontWeight: 700, color: S.brown, marginBottom: "0.75rem" }}>Comment candidater</h3>
            <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, lineHeight: 1.7, marginBottom: "1.5rem" }}>
              {event.instructionsCandidature}
            </p>

            {/* ── MODE FORMULAIRE SPOTRUCK ── */}
            {event.modeCandidature === "formulaire_spotruck" && (
              <div style={{ backgroundColor: S.card, border: `1px solid ${S.border}`, padding: "1.5rem" }}>
                <p style={{ fontFamily: S.sans, fontSize: "0.72rem", letterSpacing: "0.15em", color: S.terra, marginBottom: "1rem", fontWeight: 500 }}>
                  CANDIDATURE DIRECTE VIA SPOTRUCK
                </p>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.5rem" }}>
                    VOTRE MESSAGE DE PRÉSENTATION
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Présentez votre truck et expliquez pourquoi vous êtes le bon choix pour cet événement..."
                    rows={5}
                    style={{
                      width: "100%", border: `1px solid ${S.border}`, backgroundColor: "transparent",
                      padding: "0.75rem 1rem", fontFamily: S.sans, fontSize: "0.875rem",
                      color: S.brown, outline: "none", resize: "vertical", lineHeight: 1.6,
                    }}
                  />
                  <p style={{ fontFamily: S.sans, fontSize: "0.65rem", color: message.length >= MAX_CHARS * 0.9 ? S.terra : S.muted, textAlign: "right", marginTop: "0.25rem" }}>
                    {message.length}/{MAX_CHARS}
                  </p>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginBottom: "1rem" }}>
                  <input type="checkbox" checked={joinDocs} onChange={e => setJoinDocs(e.target.checked)} style={{ accentColor: S.terra, width: 15, height: 15 }} />
                  <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.brown }}>
                    Joindre automatiquement mes documents disponibles ({DOCS_PROFIL.filter(d => event.documentsRequis.includes(d)).join(", ")})
                  </span>
                </label>

                {/* Pièces jointes manuelles */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.5rem" }}>
                    PIÈCES JOINTES (facultatif)
                  </label>
                  {attachedFiles.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.5rem" }}>
                      {attachedFiles.map((f, i) => {
                        const mime = attachMimeOf(f.name);
                        return (
                          <div key={`${f.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", backgroundColor: S.cream, border: `1px solid ${S.border}` }}>
                            {mime === "pdf"
                              ? <FileText size={14} color="#C0392B" strokeWidth={1.5} />
                              : <ImageIcon size={14} color="#2E6DA4" strokeWidth={1.5} />
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 500, color: S.brown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                              <p style={{ fontFamily: S.sans, fontSize: "0.6rem", color: S.muted }}>{fmtFileSize(f.size)}</p>
                            </div>
                            <button onClick={() => removeFile(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.2rem", flexShrink: 0, color: S.muted, display: "flex", alignItems: "center" }}>
                              <X size={13} strokeWidth={2} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {attachedFiles.length < ATTACH_MAX_FILES && (
                    <>
                      <input id="ft-candidature-files" type="file" multiple accept={ATTACH_ACCEPT} onChange={pickFiles} style={{ display: "none" }} />
                      <label htmlFor="ft-candidature-files" style={{ display: "flex", alignItems: "center", gap: "0.45rem", border: `1px dashed ${S.border}`, padding: "0.45rem 0.875rem", fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.15em", color: S.muted, cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
                        <Paperclip size={12} strokeWidth={1.5} />
                        AJOUTER UNE PIÈCE JOINTE
                        <span style={{ marginLeft: "auto", color: S.border }}>{attachedFiles.length}/{ATTACH_MAX_FILES} · PDF, JPG, PNG · max {ATTACH_MAX_MB}MB</span>
                      </label>
                    </>
                  )}
                </div>

                <button
                  disabled={message.trim().length < 20 || submitting}
                  onClick={() => onCandidature(message.trim(), attachedFiles)}
                  style={{
                    ...btnBase,
                    backgroundColor: message.trim().length >= 20 && !submitting ? S.terra : S.muted,
                    color: "#fff",
                    cursor: message.trim().length >= 20 && !submitting ? "pointer" : "not-allowed",
                  }}
                >
                  <Send size={14} strokeWidth={1.5} /> {submitting ? "ENVOI EN COURS…" : "ENVOYER MA CANDIDATURE"}
                </button>
                {message.trim().length > 0 && message.trim().length < 20 && (
                  <p style={{ fontFamily: S.sans, fontSize: "0.7rem", color: S.terra, marginTop: "0.5rem" }}>Minimum 20 caractères requis.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── BARRE D'ACTIONS BAS ── */}
        <div style={{
          borderTop: `1px solid ${S.border}`,
          padding: "1.25rem 2rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          backgroundColor: S.cream, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{ ...btnBase, backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}` }}>
            FERMER
          </button>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={onSave} style={{
              ...btnBase,
              backgroundColor: saved ? S.card : "transparent",
              color: saved ? S.terra : S.muted,
              border: `1px solid ${saved ? S.terra : S.border}`,
            }}>
              {saved ? <BookmarkCheck size={14} strokeWidth={2} /> : <Bookmark size={14} strokeWidth={1.5} />}
              {saved ? "SAUVEGARDÉ" : "SAUVEGARDER"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────
export default function OpportunitesClient({ initialEvenements, userPlan, userData, foodtruckerId }: Props) {
  const [query, setQuery]               = useState("");
  const [region, setRegion]             = useState("Toutes les régions");
  const [typesChecked, setTypesChecked] = useState<string[]>([]);
  const [budgetMin, setBudgetMin]       = useState("");
  const [budgetMax, setBudgetMax]       = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [offre, setOffre]               = useState<"Tous" | "DROIT DE PLACE" | "PRIVATISATION">("Tous");

  const [saved, setSaved]           = useState<Set<number>>(new Set());
  const [candide, setCandide]       = useState<Set<number>>(new Set());
  const [modalEvent, setModalEvent] = useState<Evenement | null>(null);
  const [toast, setToast]           = useState<{ msg: string; color: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMap, setShowMap]       = useState(false);

  // Hydration localStorage
  useEffect(() => {
    setSaved(loadFavoris());
  }, []);

  const anyFilter = region !== "Toutes les régions" || typesChecked.length > 0 ||
    budgetMin !== "" || budgetMax !== "" || dateFrom !== "" || dateTo !== "" || offre !== "Tous" || query !== "";

  const reset = useCallback(() => {
    setQuery(""); setRegion("Toutes les régions"); setTypesChecked([]);
    setBudgetMin(""); setBudgetMax(""); setDateFrom(""); setDateTo(""); setOffre("Tous");
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    const bMin = budgetMin ? parseInt(budgetMin) : 0;
    const bMax = budgetMax ? parseInt(budgetMax) : Infinity;
    const budgetFilterActive = bMin > 0 || bMax < Infinity;
    return initialEvenements.filter((ev) => {
      if (q && !normalize(`${ev.titre} ${ev.ville} ${ev.type} ${ev.region} ${getRegionVille(ev.ville) ?? ""}`).includes(q)) return false;
      if (region !== "Toutes les régions" && ev.region !== region) return false;
      if (typesChecked.length > 0 && !typesChecked.includes(ev.type)) return false;
      // Un budget non communiqué (0) ne peut pas être évalué par un filtre de prix actif
      if (budgetFilterActive && ev.budgetMax === 0) return false;
      if (bMin && ev.budgetMax < bMin) return false;
      if (bMax < Infinity && ev.budgetMin > bMax) return false;
      if (dateFrom && ev.dateISO < dateFrom) return false;
      if (dateTo   && ev.dateISO > dateTo)   return false;
      if (offre !== "Tous" && ev.offre !== offre) return false;
      return true;
    });
  }, [query, region, typesChecked, budgetMin, budgetMax, dateFrom, dateTo, offre, initialEvenements]);

  function toggleSave(id: number) {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setToast({ msg: "Événement retiré de vos favoris", color: S.muted });
      } else {
        next.add(id);
        setToast({ msg: "Événement sauvegardé dans vos favoris", color: "#2C7A4B" });
      }
      saveFavoris(next);
      return next;
    });
  }

  async function handleCandidature(ev: Evenement, message: string, files: File[]) {
    setSubmitting(true);
    const supabase = createClient();

    const piecesJointes: { nom: string; url: string; type: string }[] = [];
    let uploadFailures = 0;
    for (const file of files) {
      // Le premier segment du chemin doit être l'uid du foodtrucker : c'est ce que
      // vérifie la policy RLS "Foodtrucker uploads own files" sur storage.objects.
      const path = `${foodtruckerId}/candidatures/${ev.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("spotruck-uploads").upload(path, file);
      if (uploadError) { uploadFailures++; continue; }
      const { data: pub } = supabase.storage.from("spotruck-uploads").getPublicUrl(path);
      piecesJointes.push({ nom: file.name, url: pub.publicUrl, type: file.type });
    }

    const { error } = await supabase.from("candidatures").insert({
      evenement_id: String(ev.id),
      foodtrucker_id: foodtruckerId,
      message,
      statut: "en_attente",
      pieces_jointes: piecesJointes,
    });
    setSubmitting(false);

    if (error) {
      const dejaCandidate = error.code === "23505"; // contrainte UNIQUE(evenement_id, foodtrucker_id)
      setToast({
        msg: dejaCandidate ? "Vous avez déjà postulé à cet événement." : "Erreur lors de l'envoi de la candidature. Réessayez.",
        color: "#C0392B",
      });
      return;
    }

    setCandide(s => new Set(s).add(ev.id));
    setModalEvent(null);
    setToast({
      msg: uploadFailures > 0
        ? `Candidature envoyée pour "${ev.titre}" — ${uploadFailures} pièce${uploadFailures > 1 ? "s" : ""} jointe${uploadFailures > 1 ? "s" : ""} n'a pas pu être envoyée.`
        : `Candidature envoyée pour "${ev.titre}" !`,
      color: uploadFailures > 0 ? "#B8850A" : "#2C7A4B",
    });
  }

  const selectStyle: React.CSSProperties = {
    width: "100%", border: `1px solid ${S.border}`, backgroundColor: "transparent",
    padding: "0.65rem 0.75rem", fontFamily: S.sans, fontSize: "0.78rem",
    color: S.brown, outline: "none", appearance: "none",
  };

  return (
    <>
      <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown, display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <FoodtruckerSidebar
          active="/dashboard/foodtrucker/opportunites"
          badges={{ "/dashboard/foodtrucker/opportunites": saved.size }}
          userData={userData}
        />

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr" }}>

          {/* ══ SIDEBAR FILTRES ══ */}
          <aside style={{ borderRight: `1px solid ${S.border}`, padding: "2rem 1.5rem", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <SlidersHorizontal size={13} color={S.terra} strokeWidth={1.5} />
                <span style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.terra }}>FILTRES</span>
              </div>
              {anyFilter && (
                <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", cursor: "pointer", fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", color: S.muted }}>
                  <RotateCcw size={10} strokeWidth={2} /> RESET
                </button>
              )}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.5rem" }}>RÉGION</label>
              <select value={region} onChange={e => setRegion(e.target.value)} style={selectStyle}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.6rem" }}>TYPE D'ÉVÉNEMENT</label>
              {TYPES_EVENEMENT.map(t => (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.45rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={typesChecked.includes(t)} onChange={() => setTypesChecked(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} style={{ accentColor: S.terra, width: 14, height: 14 }} />
                  <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.brown, fontWeight: 300 }}>{t}</span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.5rem" }}>BUDGET (€)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[{ label: "MIN", val: budgetMin, set: setBudgetMin }, { label: "MAX", val: budgetMax, set: setBudgetMax }].map(({ label, val, set }) => (
                  <div key={label}>
                    <span style={{ fontFamily: S.sans, fontSize: "0.58rem", color: S.muted, display: "block", marginBottom: "0.25rem", letterSpacing: "0.1em" }}>{label}</span>
                    <input type="number" min={0} placeholder={label === "MIN" ? "0" : "∞"} value={val} onChange={e => set(e.target.value)} style={selectStyle} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.5rem" }}>PÉRIODE</label>
              {[{ label: "DU", val: dateFrom, set: setDateFrom }, { label: "AU", val: dateTo, set: setDateTo }].map(({ label, val, set }) => (
                <div key={label} style={{ marginBottom: "0.5rem" }}>
                  <span style={{ fontFamily: S.sans, fontSize: "0.58rem", color: S.muted, display: "block", marginBottom: "0.25rem", letterSpacing: "0.1em" }}>{label}</span>
                  <input type="date" value={val} onChange={e => set(e.target.value)} style={selectStyle} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.6rem" }}>TYPE D'OFFRE</label>
              {(["Tous", "DROIT DE PLACE", "PRIVATISATION"] as const).map(o => (
                <label key={o} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.45rem", cursor: "pointer" }}>
                  <input type="radio" name="offre" checked={offre === o} onChange={() => setOffre(o)} style={{ accentColor: S.terra, width: 14, height: 14 }} />
                  <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.brown, fontWeight: 300 }}>
                    {o === "Tous" ? "Tous" : o === "DROIT DE PLACE" ? "Droit de place" : "Privatisation"}
                  </span>
                </label>
              ))}
            </div>

            {anyFilter && (
              <button onClick={reset} style={{ width: "100%", backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "0.75rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                <RotateCcw size={12} strokeWidth={1.5} /> RÉINITIALISER LES FILTRES
              </button>
            )}
          </aside>

          {/* ══ LISTE ÉVÉNEMENTS ══ */}
          <div style={{ padding: "3rem" }}>
            <div style={{ marginBottom: "2rem" }}>
              <p style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>DASHBOARD — FOODTRUCKER</p>
              <h1 style={{ fontFamily: S.serif, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.1 }}>Opportunités</h1>
              <p style={{ fontFamily: S.sans, fontSize: "0.8rem", fontWeight: 300, color: anyFilter ? S.terra : S.muted, marginTop: "0.5rem" }}>
                <strong style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 800, color: S.brown }}>{filtered.length}</strong>{" "}
                appel{filtered.length !== 1 ? "s" : ""} d'offre{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
                {anyFilter && " · filtres actifs"}
              </p>
            </div>

            {/* Barre de recherche */}
            <div style={{ position: "relative", marginBottom: "2rem" }}>
              <Search size={16} color={S.muted} strokeWidth={1.5} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher par titre, ville, région, type..."
                style={{ width: "100%", border: `1px solid ${query ? S.terra : S.border}`, backgroundColor: "transparent", padding: "0.875rem 2.75rem", fontFamily: S.sans, fontSize: "0.875rem", color: S.brown, outline: "none", transition: "border-color 0.15s" }} />
              {query && (
                <button onClick={() => setQuery("")} style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: S.muted, display: "flex" }}>
                  <X size={15} strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Aucun résultat */}
            {filtered.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5rem 2rem", gap: "1rem", textAlign: "center" }}>
                <AlertCircle size={36} color={S.border} strokeWidth={1} />
                <h3 style={{ fontFamily: S.serif, fontSize: "1.4rem", fontWeight: 700, color: S.brown }}>
                  {initialEvenements.length === 0
                    ? "Aucune opportunité disponible pour le moment"
                    : "Aucun appel d'offre trouvé"}
                </h3>
                <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: S.muted, maxWidth: 360, lineHeight: 1.7 }}>
                  {initialEvenements.length === 0
                    ? "Revenez bientôt ! De nouvelles opportunités sont ajoutées régulièrement."
                    : anyFilter
                      ? <>Essayez d'élargir vos critères ou{" "}
                          <button onClick={reset} style={{ background: "none", border: "none", color: S.terra, cursor: "pointer", fontFamily: S.sans, fontSize: "0.82rem", padding: 0, fontWeight: 500 }}>
                            réinitialisez les filtres
                          </button>.</>
                      : "Aucun événement ne correspond à votre recherche."
                  }
                </p>
              </div>
            )}

            {/* ── Bandeau privatisations pour Free ── */}
            {userPlan === "free" && filtered.some(ev => ev.offre === "PRIVATISATION") && (
              <div style={{ backgroundColor: "rgba(196,98,45,0.08)", border: `1px solid rgba(196,98,45,0.3)`, padding: "1rem 1.5rem", marginBottom: "2px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔒</span>
                  <p style={{ fontFamily: S.sans, fontSize: "0.75rem", color: S.brown }}>
                    <strong style={{ fontWeight: 600 }}>{filtered.filter(ev => ev.offre === "PRIVATISATION").length} privatisation{filtered.filter(ev => ev.offre === "PRIVATISATION").length > 1 ? 's' : ''}</strong> disponible{filtered.filter(ev => ev.offre === "PRIVATISATION").length > 1 ? 's' : ''} — accessible{filtered.filter(ev => ev.offre === "PRIVATISATION").length > 1 ? 's' : ''} dès 15€/mois
                  </p>
                </div>
                <a
                  href="/dashboard/foodtrucker/parametres#abonnement"
                  style={{
                    fontFamily: S.sans,
                    fontSize: "0.62rem",
                    letterSpacing: "0.15em",
                    fontWeight: 500,
                    color: S.terra,
                    textDecoration: "none",
                    borderBottom: `1px solid ${S.terra}`,
                  }}
                >
                  VOIR LES PLANS
                </a>
              </div>
            )}

            {/* ── Bouton toggle carte ── */}
            <div style={{ marginBottom: "1rem" }}>
              <button onClick={() => setShowMap(v => !v)} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                backgroundColor: showMap ? S.terra : "transparent",
                color: showMap ? "#fff" : S.brown,
                border: `1px solid ${showMap ? S.terra : S.border}`,
                padding: "0.65rem 1.25rem", fontFamily: S.sans, fontSize: "0.62rem",
                letterSpacing: "0.2em", cursor: "pointer",
              }}>
                <MapIcon size={13} strokeWidth={1.5} />
                {showMap ? "MASQUER LA CARTE" : "VOIR LA CARTE"}
              </button>
            </div>

            {/* ── Cartes ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {showMap && (
                <OpportunitesMap
                  evenements={filtered.map(ev => ({ id: ev.id, titre: ev.titre, ville: ev.ville, date: ev.date, budgetLabel: ev.budgetLabel, coords: getCoordonneesVille(ev.ville) }))}
                  onVoirDetail={(id) => { const ev = filtered.find(e => e.id === id); if(ev) setModalEvent(ev); }}
                />
              )}
              {filtered.map((ev) => {
                const isSaved = saved.has(ev.id);
                const isCandide = candide.has(ev.id);
                const jours = joursRestants(ev.dateLimiteCandidatureISO);
                const urgentDeadline = jours >= 0 && jours <= 7;

                const isPrivatisation = ev.offre === "PRIVATISATION";
                const hasAccess = !isPrivatisation || userPlan !== "free";

                const displayBudget = isPrivatisation && !hasAccess
                  ? (ev.budgetMin > 0 ? `${ev.budgetMin.toLocaleString("fr-FR")} €` : "Tarif non communiqué")
                  : null;

                return (
                  <div
                    key={ev.id}
                    style={{
                      backgroundColor: S.card,
                      padding: "1.5rem 2rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "1rem",
                      position: "relative",
                      filter: !hasAccess ? "blur(1.5px)" : "none",
                      opacity: !hasAccess ? 0.7 : 1,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Badges */}
                      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                        <span style={{
                          backgroundColor: ev.offre === "DROIT DE PLACE" ? S.terra : S.violet,
                          color: "#fff", fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.18em", padding: "0.25rem 0.6rem",
                        }}>{ev.offre}</span>
                        {isNouveau(ev.publicationISO) && (
                          <span style={{ border: `1px solid ${S.terra}`, color: S.terra, fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.18em", padding: "0.25rem 0.6rem" }}>NOUVEAU</span>
                        )}
                        <span style={{ border: `1px solid ${S.border}`, color: S.muted, fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.15em", padding: "0.25rem 0.6rem" }}>
                          {ev.type.toUpperCase()}
                        </span>
                        {isCandide && (
                          <span style={{ backgroundColor: "#2C7A4B", color: "#fff", fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.15em", padding: "0.25rem 0.6rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <CheckCircle size={10} strokeWidth={2} /> CANDIDATURE ENVOYÉE
                          </span>
                        )}
                      </div>

                      {/* Titre */}
                      <h3 style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 700, color: S.brown, marginBottom: "0.5rem", lineHeight: 1.2 }}>
                        {ev.titre}
                      </h3>

                      {/* Méta */}
                      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                        {[
                          { icon: <CalendarDays size={11} strokeWidth={1.5} />, val: ev.date },
                          { icon: <MapPin size={11} strokeWidth={1.5} />,       val: ev.region ? `${ev.ville} — ${ev.region}` : ev.ville },
                          { icon: <Users size={11} strokeWidth={1.5} />,        val: `${ev.trucks} truck${ev.trucks > 1 ? "s" : ""}` },
                          { icon: <Euro size={11} strokeWidth={1.5} />,         val: ev.budgetLabel },
                        ].map(({ icon, val }, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: S.muted }}>
                            {icon}
                            <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300 }}>{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Source + date limite */}
                      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontFamily: S.sans, fontSize: "0.65rem", fontWeight: 300, color: S.muted }}>
                          Via <span style={{ color: S.brown }}>{ev.source}</span>
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Clock size={11} color={urgentDeadline ? "#C0392B" : S.muted} strokeWidth={1.5} />
                          <span style={{
                            fontFamily: S.sans, fontSize: "0.65rem",
                            color: urgentDeadline ? "#C0392B" : S.muted,
                            fontWeight: urgentDeadline ? 600 : 300,
                          }}>
                            Limite : {ev.dateLimiteCandidatureLabel}
                            {urgentDeadline && jours > 0 && ` (${jours}j)`}
                            {jours <= 0 && " — échue"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0, alignItems: "flex-end" }}>
                      {ev.urlSource && ev.urlSource !== "#" ? (
                        <a
                          href={ev.urlSource}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: S.terra, color: "#fff", border: "none",
                            padding: "0.75rem 1.25rem", fontFamily: S.sans, fontSize: "0.62rem",
                            letterSpacing: "0.2em", textDecoration: "none",
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          VOIR L'APPEL D'OFFRE <ExternalLink size={12} />
                        </a>
                      ) : (
                        <button
                          onClick={() => setModalEvent(ev)}
                          style={{
                            backgroundColor: S.terra, color: "#fff", border: "none",
                            padding: "0.75rem 1.25rem", fontFamily: S.sans, fontSize: "0.62rem",
                            letterSpacing: "0.2em", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          VOIR L'APPEL D'OFFRE <ArrowRight size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleSave(ev.id)}
                        style={{
                          backgroundColor: "transparent",
                          color: isSaved ? S.terra : S.muted,
                          border: `1px solid ${isSaved ? S.terra : S.border}`,
                          padding: "0.6rem 1.25rem", fontFamily: S.sans, fontSize: "0.6rem",
                          letterSpacing: "0.18em", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "0.35rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isSaved ? <BookmarkCheck size={12} strokeWidth={2} /> : <Bookmark size={12} strokeWidth={1.5} />}
                        {isSaved ? "SAUVEGARDÉ" : "SAUVEGARDER"}
                      </button>
                    </div>

                    {/* Overlay conversion pour privatisations bloquées */}
                    {!hasAccess && displayBudget && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(242,237,228,0.95)",
                          backdropFilter: "blur(3px)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "2rem",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ marginBottom: "1.5rem" }}>
                          <span
                            style={{
                              backgroundColor: S.terra,
                              color: "#fff",
                              fontFamily: S.sans,
                              fontSize: "0.6rem",
                              letterSpacing: "0.2em",
                              fontWeight: 700,
                              padding: "0.35rem 0.875rem",
                              display: "inline-block",
                              marginBottom: "1rem",
                            }}
                          >
                            🔒 PRIVATISATION
                          </span>
                          <div style={{ marginBottom: "1rem" }}>
                            <p
                              style={{
                                fontFamily: S.sans,
                                fontSize: "0.7rem",
                                letterSpacing: "0.15em",
                                color: S.muted,
                                marginBottom: "0.5rem",
                              }}
                            >
                              BUDGET
                            </p>
                            <p
                              style={{
                                fontFamily: displayBudget === "Tarif non communiqué" ? S.sans : S.serif,
                                fontSize: displayBudget === "Tarif non communiqué" ? "1.2rem" : "2.5rem",
                                fontWeight: displayBudget === "Tarif non communiqué" ? 500 : 800,
                                color: displayBudget === "Tarif non communiqué" ? S.muted : S.terra,
                                lineHeight: 1,
                              }}
                            >
                              {displayBudget === "Tarif non communiqué" ? displayBudget : `💰 ${displayBudget}`}
                            </p>
                          </div>
                        </div>
                        <p
                          style={{
                            fontFamily: S.sans,
                            fontSize: "0.85rem",
                            color: S.brown,
                            marginBottom: "1.5rem",
                            maxWidth: "400px",
                            lineHeight: 1.6,
                          }}
                        >
                          <strong style={{ fontWeight: 600 }}>Débloquez cette opportunité avec le plan Pro</strong>
                        </p>
                        <a
                          href="/dashboard/foodtrucker/parametres#abonnement"
                          style={{
                            backgroundColor: S.terra,
                            color: "#fff",
                            fontFamily: S.sans,
                            fontSize: "0.65rem",
                            letterSpacing: "0.2em",
                            fontWeight: 500,
                            padding: "1rem 2rem",
                            textDecoration: "none",
                            display: "inline-block",
                            marginBottom: "1rem",
                          }}
                        >
                          PASSER EN PRO — 15€/MOIS
                        </a>
                        <p
                          style={{
                            fontFamily: S.sans,
                            fontSize: "0.72rem",
                            color: S.muted,
                            maxWidth: "350px",
                            lineHeight: 1.6,
                            fontStyle: "italic",
                          }}
                        >
                          {displayBudget === "Tarif non communiqué"
                            ? "Pour 15€/mois, accédez à toutes les privatisations"
                            : `Pour 15€/mois, accédez à des privatisations comme celle-ci à ${displayBudget}`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ── Modale fiche ── */}
      {modalEvent && (
        <ModaleFiche
          event={modalEvent}
          saved={saved.has(modalEvent.id)}
          submitting={submitting}
          onClose={() => setModalEvent(null)}
          onSave={() => toggleSave(modalEvent.id)}
          onCandidature={(message, files) => handleCandidature(modalEvent, message, files)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} color={toast.color} onDone={() => setToast(null)} />}
    </>
  );
}

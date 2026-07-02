"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import {
  FileText, Euro, MessageSquare, AlertTriangle, Search,
  CheckCheck, Trash2, X, CheckCircle, ArrowRight,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream: "#F2EDE4", brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Inter', Helvetica, sans-serif",
};

// ─── Types ────────────────────────────────────────────────────
type Categorie = "candidature" | "paiement" | "message" | "document" | "opportunite";
type FilterKey  = "toutes" | "nonlues" | Categorie;

interface Notif {
  id: string;
  categorie: Categorie;
  titre: string;
  description: string;
  dateISO: string;
  lue: boolean;
  actionLabel: string;
  actionHref: string;
}

// ─── Données initiales ────────────────────────────────────────
// actionHref : deep-link vers la modale exacte sur la page cible
// linkedId   : identifiant de l'entité liée (candidature / transaction / event / document)
const MOCK: Notif[] = [
  {
    id: "n1",
    categorie: "candidature",
    titre: "Candidature acceptée 🎉",
    description: "Votre candidature pour le Gala d'entreprise Tech Corp — Paris a été acceptée. Contactez l'organisateur pour confirmer les détails logistiques.",
    dateISO: "2025-06-04T10:15:00.000Z",
    lue: false,
    actionLabel: "VOIR LA CANDIDATURE",
    // cand-002 = Gala Tech Corp, modal detail
    actionHref: "/dashboard/foodtrucker/candidatures?id=cand-002&modal=detail",
  },
  {
    id: "n2",
    categorie: "paiement",
    titre: "Paiement reçu — 4 180 €",
    description: "Le paiement TTC pour le Gala d'entreprise Tech Corp (3 800 € HT + TVA) a été versé sur votre compte Stripe. Délai de virement : 2–5 jours ouvrés.",
    dateISO: "2025-06-07T08:30:00.000Z",
    lue: false,
    actionLabel: "VOIR LE PAIEMENT",
    // t10 = transaction Gala Tech Corp
    actionHref: "/dashboard/foodtrucker/revenus?id=t10&modal=detail",
  },
  {
    id: "n3",
    categorie: "message",
    titre: "Nouveau message — Tech Corp Events",
    description: "L'organisateur du Gala Tech Corp vous a envoyé un message : « Parfait, l'accès se fait par la rue du Faubourg Saint-Honoré, largeur 3,5m. Nous finalisons le contrat cette semaine. »",
    dateISO: "2025-06-04T15:00:00.000Z",
    lue: false,
    actionLabel: "LIRE LE MESSAGE",
    // cand-002 = Gala Tech Corp, modal messagerie
    actionHref: "/dashboard/foodtrucker/candidatures?id=cand-002&modal=message",
  },
  {
    id: "n4",
    categorie: "document",
    titre: "Document expirant bientôt ⚠️",
    description: "Votre KBIS expire le 10 juillet 2025 (dans 6 jours). Plusieurs appels d'offres exigent ce document. Mettez-le à jour pour continuer à candidater.",
    dateISO: "2025-06-03T09:00:00.000Z",
    lue: false,
    actionLabel: "METTRE À JOUR",
    // doc=kbis : scroll + highlight dans la section documents du profil
    actionHref: "/dashboard/foodtrucker/profil?doc=kbis",
  },
  {
    id: "n5",
    categorie: "opportunite",
    titre: "Nouvelle opportunité dans votre région",
    description: "Un festival gastronomique vient d'être publié à Nantes (Pays de la Loire) : Festival des Saveurs de l'Ouest — 8 000 visiteurs, budget 800–1 200 €/jour. Date limite : 8 juin.",
    dateISO: "2025-06-01T11:20:00.000Z",
    lue: false,
    actionLabel: "VOIR L'OPPORTUNITÉ",
    // event id=1 = Festival des Saveurs de l'Ouest
    actionHref: "/dashboard/foodtrucker/opportunites?id=1&modal=detail",
  },
  {
    id: "n6",
    categorie: "candidature",
    titre: "Candidature non retenue",
    description: "Votre candidature pour le Marché de producteurs — Bordeaux Rive Droite n'a pas été retenue. L'association a sélectionné des trucks proposant exclusivement des produits locaux de la région.",
    dateISO: "2025-05-30T14:45:00.000Z",
    lue: true,
    actionLabel: "VOIR LA CANDIDATURE",
    // cand-003 = Marché Bordeaux
    actionHref: "/dashboard/foodtrucker/candidatures?id=cand-003&modal=detail",
  },
  {
    id: "n7",
    categorie: "paiement",
    titre: "Facture FAC-2025-008 émise",
    description: "Votre facture de 2 420 € TTC pour le Séminaire Orange Business — Laval est disponible en téléchargement dans votre espace revenus.",
    dateISO: "2025-05-18T10:00:00.000Z",
    lue: true,
    actionLabel: "VOIR LE PAIEMENT",
    // t08 = transaction Orange Business
    actionHref: "/dashboard/foodtrucker/revenus?id=t08&modal=detail",
  },
  {
    id: "n8",
    categorie: "opportunite",
    titre: "Nouvelle opportunité — Mariage en Bretagne",
    description: "Un mariage recherche un foodtruck premium à Rennes (Bretagne) : Mariage Fontaine — 160 convives, budget 2 000–3 200 €. Date limite de candidature : 30 juin.",
    dateISO: "2025-05-25T16:00:00.000Z",
    lue: true,
    actionLabel: "VOIR L'OPPORTUNITÉ",
    // event id=9 = Fête de la Musique Rennes (même région Bretagne)
    actionHref: "/dashboard/foodtrucker/opportunites?id=9&modal=detail",
  },
];

// ─── LocalStorage ─────────────────────────────────────────────
const LS_KEY = "spotruck_notifications";

function load(): Notif[] {
  if (typeof window === "undefined") return MOCK;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return MOCK;
    const saved: Notif[] = JSON.parse(raw);
    // Fusionne : conserve les nouvelles notifications mock non encore persistées
    const ids = new Set(saved.map(n => n.id));
    return [...saved, ...MOCK.filter(n => !ids.has(n.id))];
  } catch { return MOCK; }
}

function persist(list: Notif[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

// ─── Formatage date déterministe ──────────────────────────────
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / (1000 * 60 * 60));
  const d = Math.floor(h / 24);
  if (h < 1)  return "À l'instant";
  if (h < 24) return `Il y a ${h}h`;
  if (d < 7)  return `Il y a ${d} jour${d > 1 ? "s" : ""}`;
  return fmtDate(iso);
}

// ─── Icônes par catégorie ─────────────────────────────────────
const CAT_ICONS: Record<Categorie, React.ReactNode> = {
  candidature: <FileText   size={16} strokeWidth={1.5} />,
  paiement:    <Euro       size={16} strokeWidth={1.5} />,
  message:     <MessageSquare size={16} strokeWidth={1.5} />,
  document:    <AlertTriangle size={16} strokeWidth={1.5} />,
  opportunite: <Search     size={16} strokeWidth={1.5} />,
};

const CAT_COLORS: Record<Categorie, string> = {
  candidature: S.terra,
  paiement:    "#2C7A4B",
  message:     "#1D6FA4",
  document:    "#B7791F",
  opportunite: S.terra,
};

// ─── Filtres ──────────────────────────────────────────────────
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "toutes",      label: "TOUTES" },
  { key: "nonlues",     label: "NON LUES" },
  { key: "candidature", label: "CANDIDATURES" },
  { key: "paiement",    label: "PAIEMENTS" },
  { key: "message",     label: "MESSAGES" },
  { key: "document",    label: "DOCUMENTS" },
  { key: "opportunite", label: "OPPORTUNITÉS" },
];

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, color = "#2C7A4B", onDone }: { message: string; color?: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
      backgroundColor: color, color: "#fff", zIndex: 3000,
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

// ─── Modale confirmation suppression ─────────────────────────
function ModaleSupprimer({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,24,16,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: S.cream, border: `1px solid ${S.border}`, padding: "2rem", maxWidth: 400, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <Trash2 size={20} color="#C0392B" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 style={{ fontFamily: S.serif, fontSize: "1.2rem", fontWeight: 800, color: S.brown, marginBottom: "0.4rem" }}>
              Supprimer cette notification ?
            </h3>
            <p style={{ fontFamily: S.sans, fontSize: "0.8rem", fontWeight: 300, color: S.muted, lineHeight: 1.6 }}>
              Cette action est irréversible.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onConfirm} style={{ flex: 1, backgroundColor: "#C0392B", color: "#fff", border: "none", padding: "0.875rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer" }}>
            OUI, SUPPRIMER
          </button>
          <button onClick={onClose} style={{ backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "0.875rem 1.5rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer" }}>
            ANNULER
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function NotificationsPage() {
  const router = useRouter();
  // Initialisation server-safe : MOCK côté serveur, localStorage côté client après hydration
  const [notifs, setNotifs]           = useState<Notif[]>(MOCK);
  const [filtre, setFiltre]           = useState<FilterKey>("toutes");
  const [toast, setToast]             = useState<{ msg: string; color?: string } | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated]       = useState(false);

  // Hydration localStorage → uniquement côté client, après le premier rendu
  useEffect(() => {
    const base = load();
    // Merge notifications poussées par l'organisateur
    try {
      const raw = localStorage.getItem("spotruck_ft_notifications");
      if (raw) {
        const ftNotifs: Array<{ id:string; type:"acceptation"|"refus"; truck:string; candId:string; eventNom:string; dateISO:string; lue:boolean }> = JSON.parse(raw);
        const existingIds = new Set(base.map((n: Notif) => n.id));
        const converted: Notif[] = ftNotifs
          .filter(n => !existingIds.has(n.id))
          .map(n => ({
            id:          n.id,
            categorie:   "candidature" as const,
            titre:       n.type === "acceptation"
              ? `🎉 Votre candidature pour ${n.eventNom} a été acceptée !`
              : `Réponse reçue pour votre candidature à ${n.eventNom}`,
            description: n.type === "acceptation"
              ? `Félicitations ! L'organisateur a retenu votre candidature pour ${n.eventNom}. Un message vous a été envoyé avec les prochaines étapes.`
              : `L'organisateur de ${n.eventNom} a répondu à votre candidature. Consultez les détails dans votre espace candidatures.`,
            dateISO:     n.dateISO,
            lue:         n.lue,
            actionLabel: "VOIR LA CANDIDATURE",
            actionHref:  `/dashboard/foodtrucker/candidatures`,
          }));
        setNotifs([...converted, ...base]);
        setHydrated(true);
        return;
      }
    } catch {}
    setNotifs(base);
    setHydrated(true);
  }, []);

  // Persist à chaque changement (seulement après hydration pour ne pas écraser le LS)
  useEffect(() => { if (hydrated) persist(notifs); }, [notifs, hydrated]);

  // Compteurs
  const counts = useMemo(() => ({
    toutes:      notifs.length,
    nonlues:     notifs.filter(n => !n.lue).length,
    candidature: notifs.filter(n => n.categorie === "candidature").length,
    paiement:    notifs.filter(n => n.categorie === "paiement").length,
    message:     notifs.filter(n => n.categorie === "message").length,
    document:    notifs.filter(n => n.categorie === "document").length,
    opportunite: notifs.filter(n => n.categorie === "opportunite").length,
  }), [notifs]);

  const nonLuesTotales = counts.nonlues;

  // Filtrées + triées par date desc
  const visible = useMemo(() => {
    const base = notifs.filter(n => !removingIds.has(n.id));
    const filtered = filtre === "toutes"  ? base
      : filtre === "nonlues"              ? base.filter(n => !n.lue)
      : base.filter(n => n.categorie === filtre);
    return [...filtered].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }, [notifs, filtre, removingIds]);

  // ── Marquer une notif comme lue ──
  const marquerLue = useCallback((id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
  }, []);

  // ── Tout marquer lu ──
  const toutMarquerLu = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, lue: true })));
    setToast({ msg: "Toutes les notifications ont été marquées comme lues" });
  }, []);

  // ── Suppression avec animation ──
  const confirmerSuppression = useCallback(() => {
    if (!deletingId) return;
    // 1. ajoute à removingIds pour démarrer l'animation
    setRemovingIds(prev => new Set(prev).add(deletingId));
    setDeletingId(null);
    // 2. après l'animation, retire vraiment de la liste
    setTimeout(() => {
      setNotifs(prev => prev.filter(n => n.id !== deletingId));
      setRemovingIds(prev => { const s = new Set(prev); s.delete(deletingId!); return s; });
      setToast({ msg: "Notification supprimée", color: S.muted });
    }, 280);
  }, [deletingId]);

  return (
    <>
      <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown, display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <FoodtruckerSidebar
          active="/dashboard/foodtrucker/notifications"
          badges={{ "/dashboard/foodtrucker/notifications": nonLuesTotales }}
        />

        <div style={{ padding: "3rem", maxWidth: "860px" }}>
          {/* ── Header ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem" }}>
            <div>
              <p style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>DASHBOARD — FOODTRUCKER</p>
              <h1 style={{ fontFamily: S.serif, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.1 }}>
                Notifications
                {nonLuesTotales > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", backgroundColor: S.terra, fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 600, color: "#fff", marginLeft: "0.75rem", verticalAlign: "middle" }}>
                    {nonLuesTotales}
                  </span>
                )}
              </h1>
            </div>
            {nonLuesTotales > 0 && (
              <button onClick={toutMarquerLu} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted }}>
                <CheckCheck size={14} strokeWidth={1.5} /> TOUT MARQUER LU
              </button>
            )}
          </div>

          {/* ── Filtres ── */}
          <div style={{ display: "flex", gap: "2px", marginBottom: "2rem", flexWrap: "wrap" }}>
            {FILTERS.map(f => {
              const count = counts[f.key as keyof typeof counts] ?? 0;
              const isActive = filtre === f.key;
              // Masque les filtres vides sauf TOUTES et NON LUES
              if (f.key !== "toutes" && f.key !== "nonlues" && count === 0) return null;
              return (
                <button key={f.key} onClick={() => setFiltre(f.key)} style={{
                  backgroundColor: isActive ? S.terra : "transparent",
                  color: isActive ? "#fff" : S.muted,
                  border: `1px solid ${isActive ? S.terra : S.border}`,
                  padding: "0.5rem 1rem",
                  fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em",
                  cursor: "pointer", transition: "background-color 0.15s",
                }}>
                  {f.label}{" "}({count})
                </button>
              );
            })}
          </div>

          {/* ── Liste ── */}
          {visible.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: S.muted, fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300 }}>
              Aucune notification dans cette catégorie.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {visible.map(n => {
                const isRemoving = removingIds.has(n.id);
                const iconColor = CAT_COLORS[n.categorie];

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.lue && marquerLue(n.id)}
                    style={{
                      backgroundColor: n.lue ? "transparent" : S.card,
                      border: `1px solid ${n.lue ? S.border : "transparent"}`,
                      padding: "1.25rem 1.5rem",
                      display: "flex", gap: "1rem", alignItems: "flex-start",
                      cursor: n.lue ? "default" : "pointer",
                      position: "relative",
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving ? "translateX(16px)" : "translateX(0)",
                      transition: "opacity 0.25s ease, transform 0.25s ease, background-color 0.2s",
                    }}
                  >
                    {/* Pastille non lue */}
                    {!n.lue && (
                      <div style={{ position: "absolute", top: "1.1rem", right: "1.1rem", width: 8, height: 8, borderRadius: "50%", backgroundColor: S.terra, flexShrink: 0 }} />
                    )}

                    {/* Icône catégorie */}
                    <div style={{
                      width: 38, height: 38, flexShrink: 0,
                      backgroundColor: n.lue ? S.card : `${iconColor}18`,
                      border: `1px solid ${n.lue ? S.border : `${iconColor}40`}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: n.lue ? S.muted : iconColor,
                    }}>
                      {CAT_ICONS[n.categorie]}
                    </div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem", gap: "1rem" }}>
                        <h3 style={{ fontFamily: S.sans, fontSize: "0.875rem", fontWeight: n.lue ? 400 : 600, color: n.lue ? S.muted : S.brown, lineHeight: 1.3 }}>
                          {n.titre}
                        </h3>
                        {/* Bouton supprimer */}
                        <button
                          onClick={e => { e.stopPropagation(); setDeletingId(n.id); }}
                          title="Supprimer"
                          style={{ background: "none", border: "none", cursor: "pointer", color: S.border, flexShrink: 0, display: "flex", padding: "0.1rem" }}
                        >
                          <X size={13} strokeWidth={1.5} />
                        </button>
                      </div>

                      <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted, lineHeight: 1.6, marginBottom: "0.75rem" }}>
                        {n.description}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.1em", color: n.lue ? S.border : S.terra }}>
                          {relativeTime(n.dateISO)}
                        </span>
                        {/* Bouton action contextuel */}
                        <button
                          onClick={e => { e.stopPropagation(); marquerLue(n.id); router.push(n.actionHref); }}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.35rem",
                            backgroundColor: "transparent",
                            color: n.lue ? S.muted : S.terra,
                            border: `1px solid ${n.lue ? S.border : S.terra}`,
                            padding: "0.4rem 0.875rem",
                            fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.18em",
                            cursor: "pointer",
                          }}
                        >
                          {n.actionLabel} <ArrowRight size={10} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Modale suppression ── */}
      {deletingId && (
        <ModaleSupprimer
          onConfirm={confirmerSuppression}
          onClose={() => setDeletingId(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.msg} color={toast.color} onDone={() => setToast(null)} />}
    </>
  );
}

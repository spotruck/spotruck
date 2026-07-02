"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import {
  TrendingUp, Euro, CalendarCheck, BarChart3,
  Download, FileText, X, CheckCircle,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream: "#F2EDE4", brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Inter', Helvetica, sans-serif",
};

// ─── Types ────────────────────────────────────────────────────
type StatutPaiement = "PAYÉE" | "EN ATTENTE" | "EN COURS";

interface Transaction {
  id: string;
  dateISO: string;
  evenement: string;
  organisateur: string;
  type: "Droit de place" | "Privatisation";
  montantHT: number;
  statut: StatutPaiement;
  factureRef: string;
}

// ─── 12 mois de données réalistes ────────────────────────────
const ALL_TRANSACTIONS: Transaction[] = [
  // Janvier 2025
  { id:"t01", dateISO:"2025-01-18", evenement:"Marché de l'Épiphanie — Angers",        organisateur:"Mairie d'Angers",          type:"Droit de place", montantHT:720,  statut:"PAYÉE",       factureRef:"FAC-2025-001" },
  // Février 2025
  { id:"t02", dateISO:"2025-02-08", evenement:"Salon des Métiers d'Art — Nantes",      organisateur:"Chambre des Métiers 44",   type:"Droit de place", montantHT:850,  statut:"PAYÉE",       factureRef:"FAC-2025-002" },
  { id:"t03", dateISO:"2025-02-22", evenement:"Séminaire Crédit Agricole — Rennes",    organisateur:"Crédit Agricole RBF",      type:"Privatisation",  montantHT:1800, statut:"PAYÉE",       factureRef:"FAC-2025-003" },
  // Mars 2025
  { id:"t04", dateISO:"2025-03-15", evenement:"Festival Printemps Gourmand — Nantes",  organisateur:"Asso. Goût & Terroir",     type:"Droit de place", montantHT:960,  statut:"PAYÉE",       factureRef:"FAC-2025-004" },
  // Avril 2025
  { id:"t05", dateISO:"2025-04-06", evenement:"Mariage Lefèvre — Domaine des Ormes",   organisateur:"Événements Prestige",      type:"Privatisation",  montantHT:2600, statut:"PAYÉE",       factureRef:"FAC-2025-005" },
  { id:"t06", dateISO:"2025-04-20", evenement:"Forum Emploi Campus — Saint-Nazaire",   organisateur:"IUT Saint-Nazaire",        type:"Droit de place", montantHT:780,  statut:"PAYÉE",       factureRef:"FAC-2025-006" },
  // Mai 2025
  { id:"t07", dateISO:"2025-05-03", evenement:"Fête des Voisins — Nantes Nord",        organisateur:"Mairie de Nantes",         type:"Droit de place", montantHT:480,  statut:"PAYÉE",       factureRef:"FAC-2025-007" },
  { id:"t08", dateISO:"2025-05-17", evenement:"Séminaire Orange Business — Laval",     organisateur:"Orange Business Services", type:"Privatisation",  montantHT:2200, statut:"PAYÉE",       factureRef:"FAC-2025-008" },
  { id:"t09", dateISO:"2025-05-25", evenement:"Marché Bio Hebdo — Nantes Erdre",       organisateur:"AMAP Nantes",              type:"Droit de place", montantHT:520,  statut:"PAYÉE",       factureRef:"FAC-2025-009" },
  // Juin 2025
  { id:"t10", dateISO:"2025-06-07", evenement:"Gala d'entreprise — Tech Corp 2025",    organisateur:"Tech Corp Events",         type:"Privatisation",  montantHT:3800, statut:"PAYÉE",       factureRef:"FAC-2025-010" },
  { id:"t11", dateISO:"2025-06-14", evenement:"Festival des Saveurs de l'Ouest",       organisateur:"Nantes Métropole Events",  type:"Droit de place", montantHT:1050, statut:"EN ATTENTE",  factureRef:"FAC-2025-011" },
  { id:"t12", dateISO:"2025-06-21", evenement:"Fête de la Musique — Place des Lices",  organisateur:"Mairie de Rennes",         type:"Droit de place", montantHT:390,  statut:"EN COURS",    factureRef:"FAC-2025-012" },
  // Juillet 2025 (futur)
  { id:"t13", dateISO:"2025-07-05", evenement:"Marché Producteurs — Bordeaux",         organisateur:"Asso. La Bastide",         type:"Droit de place", montantHT:540,  statut:"EN ATTENTE",  factureRef:"FAC-2025-013" },
  { id:"t14", dateISO:"2025-07-12", evenement:"Mariage Dumoulin — Château de Loire",   organisateur:"Événements & Chocolat",    type:"Privatisation",  montantHT:2900, statut:"EN ATTENTE",  factureRef:"FAC-2025-014" },
];

// TVA 10% restauration mobile
const TVA_RATE = 0.10;

// ─── Helpers — formateurs déterministes (même résultat serveur + client) ──────
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function fmtEur(n: number): string {
  // Séparateur de milliers manuel — évite toLocaleString qui diverge Node/Browser
  const s = Math.round(n).toString();
  const integer = s.replace(/\B(?=(\d{3})+(?!\d))/g, " "); // espace fine insécable
  return integer + " €";
}

function fmtDate(iso: string): string {
  // Utilise UTC pour éviter les décalages de fuseau horaire
  const d = new Date(iso);
  const day   = String(d.getUTCDate()).padStart(2, "0");
  const month = MOIS[d.getUTCMonth()];
  const year  = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
function isoToMMYYYY(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

type Periode = "mois" | "3mois" | "6mois" | "annee" | "custom";

function filterByPeriode(list: Transaction[], p: Periode): Transaction[] {
  const now = new Date("2025-06-21"); // date de référence cohérente avec les données
  const from = new Date(now);
  if (p === "mois")  from.setMonth(from.getMonth() - 1);
  if (p === "3mois") from.setMonth(from.getMonth() - 3);
  if (p === "6mois") from.setMonth(from.getMonth() - 6);
  if (p === "annee") from.setFullYear(from.getFullYear() - 1);
  return list.filter(t => new Date(t.dateISO) >= from);
}

// ─── Génération PDF via jsPDF ─────────────────────────────────
async function genererPDF(t: Transaction) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const montantTVA = Math.round(t.montantHT * TVA_RATE * 100) / 100;
  const montantTTC = t.montantHT + montantTVA;
  const dateEmission = fmtDate(t.dateISO);

  // ── Fond en-tête ──
  doc.setFillColor(44, 24, 16); // brun foncé
  doc.rect(0, 0, 210, 40, "F");

  // ── Logo ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("SPOTRUCK", 15, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(196, 98, 43); // terracotta
  doc.text("MARKETPLACE FOODTRUCK & ÉVÉNEMENTS", 15, 26);

  // ── Numéro de facture ──
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(t.factureRef, 195, 18, { align: "right" });
  doc.setFontSize(8);
  doc.text(`Émise le ${dateEmission}`, 195, 25, { align: "right" });

  // ── Séparateur ──
  doc.setDrawColor(212, 201, 188);
  doc.line(15, 50, 195, 50);

  // ── Émetteur / Destinataire ──
  doc.setTextColor(44, 24, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ÉMETTEUR", 15, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 90, 80);
  doc.text("Le Burger Breton", 15, 67);
  doc.text("Jean Martin", 15, 73);
  doc.text("Nantes, Pays de la Loire", 15, 79);
  doc.text("jean.martin@leburgerbreton.fr", 15, 85);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(44, 24, 16);
  doc.text("ORGANISATEUR", 120, 60);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 90, 80);
  doc.text(t.organisateur, 120, 67);

  // ── Ligne séparatrice ──
  doc.setDrawColor(212, 201, 188);
  doc.line(15, 95, 195, 95);

  // ── Détails événement ──
  doc.setTextColor(44, 24, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("DÉTAIL DE LA PRESTATION", 15, 107);

  // Tableau header
  const colW = [95, 35, 30];
  const tableX = 15;
  const tableY = 115;
  doc.setFillColor(237, 232, 223);
  doc.rect(tableX, tableY, 180, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(140, 123, 110);
  doc.text("DESCRIPTION", tableX + 3, tableY + 6);
  doc.text("TYPE", tableX + colW[0] + 3, tableY + 6);
  doc.text("MONTANT HT", tableX + colW[0] + colW[1] + 3, tableY + 6);

  // Ligne prestation
  const rowY = tableY + 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(44, 24, 16);
  const titreLines = doc.splitTextToSize(t.evenement, colW[0] - 5);
  doc.text(titreLines, tableX + 3, rowY);
  doc.text(t.type, tableX + colW[0] + 3, rowY);
  doc.text(fmtEur(t.montantHT), tableX + colW[0] + colW[1] + 3, rowY);

  // ── Totaux ──
  const totY = rowY + 22;
  doc.setDrawColor(212, 201, 188);
  doc.line(15, totY - 4, 195, totY - 4);

  const totals = [
    { label: "TOTAL HT",  val: fmtEur(t.montantHT) },
    { label: "TVA (10%)", val: fmtEur(montantTVA) },
  ];
  totals.forEach((row, i) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 90, 80);
    doc.text(row.label, 140, totY + i * 8);
    doc.setTextColor(44, 24, 16);
    doc.text(row.val, 195, totY + i * 8, { align: "right" });
  });

  // Total TTC en évidence
  const ttcY = totY + 22;
  doc.setFillColor(44, 24, 16);
  doc.rect(130, ttcY - 6, 65, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL TTC", 134, ttcY + 1);
  doc.text(fmtEur(montantTTC), 193, ttcY + 1, { align: "right" });

  // ── Statut ──
  const stY = ttcY + 20;
  doc.setFillColor(44, 122, 75); // vert
  doc.rect(15, stY - 5, 35, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("PAYÉE", 17, stY + 1);

  // ── Footer ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(140, 123, 110);
  doc.text("Spotruck SAS — SIRET 123 456 789 00012 — TVA intracommunautaire FR12 123456789", 105, 285, { align: "center" });
  doc.text("www.spotruck.fr — contact@spotruck.fr", 105, 290, { align: "center" });

  doc.save(`${t.factureRef}.pdf`);
}

// ─── Export CSV ───────────────────────────────────────────────
function exportCSV(transactions: Transaction[], periode: Periode) {
  const header = ["Date", "Événement", "Organisateur", "Type", "Montant HT (€)", "TVA (€)", "TTC (€)", "Statut"];
  const rows = transactions.map(t => {
    const tva = Math.round(t.montantHT * TVA_RATE * 100) / 100;
    return [
      fmtDate(t.dateISO),
      `"${t.evenement}"`,
      `"${t.organisateur}"`,
      t.type,
      t.montantHT,
      tva,
      (t.montantHT + tva).toFixed(2),
      t.statut,
    ].join(";");
  });
  const csv = [header.join(";"), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }); // BOM pour Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date("2025-06-21");
  const suffix = periode === "annee" ? `annee-${now.getFullYear()}` : isoToMMYYYY(now.toISOString());
  a.href = url;
  a.download = `spotruck-transactions-${suffix}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Modale détail transaction ────────────────────────────────
function ModaleDetail({ t, onClose }: { t: Transaction; onClose: () => void }) {
  const tva = Math.round(t.montantHT * TVA_RATE * 100) / 100;
  const stColor: Record<StatutPaiement, string> = { "PAYÉE": "#2C7A4B", "EN ATTENTE": S.terra, "EN COURS": "#1D6FA4" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,24,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: S.cream, width: "100%", maxWidth: 500, border: `1px solid ${S.border}` }}>
        {/* Header */}
        <div style={{ padding: "1.75rem 2rem", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.terra, marginBottom: "0.35rem" }}>TRANSACTION — {t.factureRef}</p>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.3rem", fontWeight: 800, color: S.brown, lineHeight: 1.2, maxWidth: 360 }}>{t.evenement}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted, marginLeft: "1rem", flexShrink: 0 }}>
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ padding: "1.75rem 2rem" }}>
          {/* Grille infos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {[
              { label: "DATE",         val: fmtDate(t.dateISO) },
              { label: "TYPE",         val: t.type },
              { label: "ORGANISATEUR", val: t.organisateur },
              { label: "STATUT",       val: t.statut, color: stColor[t.statut] },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ backgroundColor: S.card, padding: "0.75rem 1rem" }}>
                <p style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.25rem" }}>{label}</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: color ?? S.brown, fontWeight: color ? 600 : 300 }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Montants */}
          <div style={{ border: `1px solid ${S.border}`, marginBottom: "1.5rem" }}>
            {[
              { label: "MONTANT HT", val: fmtEur(t.montantHT), bold: false },
              { label: `TVA (${TVA_RATE * 100}%)`, val: fmtEur(tva), bold: false },
              { label: "TOTAL TTC",  val: fmtEur(t.montantHT + tva), bold: true },
            ].map(({ label, val, bold }, i, arr) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.875rem 1.25rem",
                borderBottom: i < arr.length - 1 ? `1px solid ${S.border}` : "none",
                backgroundColor: bold ? S.card : "transparent",
              }}>
                <span style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: bold ? S.brown : S.muted, fontWeight: bold ? 600 : 400 }}>{label}</span>
                <span style={{ fontFamily: S.serif, fontSize: bold ? "1.2rem" : "0.95rem", fontWeight: bold ? 800 : 600, color: S.brown }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={onClose} style={{ backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`, padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer" }}>
              FERMER
            </button>
            <button onClick={() => genererPDF(t)} style={{ backgroundColor: S.terra, color: "#fff", border: "none", padding: "0.75rem 1.5rem", fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Download size={13} strokeWidth={1.5} /> TÉLÉCHARGER FACTURE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <div style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", backgroundColor: "#2C7A4B", color: "#fff", zIndex: 3000, display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.875rem 1.75rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontFamily: S.sans, fontSize: "0.78rem", letterSpacing: "0.08em", animation: "toastIn 0.25s ease" }}>
      <CheckCircle size={16} strokeWidth={2} /> {message}
      <button onClick={onDone} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", marginLeft: "0.5rem", display: "flex" }}><X size={13} /></button>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
const PERIODES: { key: Periode; label: string }[] = [
  { key: "mois",  label: "CE MOIS" },
  { key: "3mois", label: "3 MOIS" },
  { key: "6mois", label: "6 MOIS" },
  { key: "annee", label: "CETTE ANNÉE" },
];

const STATUT_COLORS: Record<StatutPaiement, string> = {
  "PAYÉE":      "#2C7A4B",
  "EN ATTENTE": S.terra,
  "EN COURS":   "#1D6FA4",
};

function RevenusPageInner() {
  const [periode, setPeriode]           = useState<Periode>("mois");
  const [detailTx, setDetailTx]         = useState<Transaction | null>(null);
  const [toast, setToast]               = useState("");

  // ── Période personnalisée ──
  const TODAY = "2025-06-21"; // date de référence cohérente avec les données
  const [customFrom, setCustomFrom]     = useState("");
  const [customTo,   setCustomTo]       = useState("");
  const [customActive, setCustomActive] = useState<{ from: string; to: string } | null>(null);
  const [customError, setCustomError]   = useState("");

  const showCustomPicker = periode === "custom";

  function applyCustom() {
    if (customTo && customFrom && customTo < customFrom) {
      setCustomError("La date de fin doit être après la date de début.");
      return;
    }
    setCustomError("");
    setCustomActive({ from: customFrom, to: customTo });
  }

  function clearCustom() {
    setPeriode("mois");
    setCustomFrom("");
    setCustomTo("");
    setCustomActive(null);
    setCustomError("");
  }

  const transactions = useMemo(() => {
    if (periode === "custom" && customActive) {
      return ALL_TRANSACTIONS.filter(t =>
        t.dateISO >= customActive.from && t.dateISO <= customActive.to
      );
    }
    return filterByPeriode(ALL_TRANSACTIONS, periode);
  }, [periode, customActive]);

  const kpis = useMemo(() => {
    const payees = transactions.filter(t => t.statut === "PAYÉE");
    const caHT   = payees.reduce((s, t) => s + t.montantHT, 0);
    const caTTC  = payees.reduce((s, t) => s + t.montantHT * (1 + TVA_RATE), 0);
    const totalAnnee = filterByPeriode(ALL_TRANSACTIONS, "annee")
      .filter(t => t.statut === "PAYÉE")
      .reduce((s, t) => s + t.montantHT, 0);
    return {
      caHT:     Math.round(caHT),
      caTTC:    Math.round(caTTC),
      nbEvents: payees.length,
      moyenne:  payees.length ? Math.round(caHT / payees.length) : 0,
      annee:    Math.round(totalAnnee),
    };
  }, [transactions]);

  // ── Auto-ouverture depuis un deep-link ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id     = params.get("id");
    const modal  = params.get("modal");
    if (!id || modal !== "detail") return;
    const tx = ALL_TRANSACTIONS.find(t => t.id === id);
    if (tx) setDetailTx(tx);
  }, []);

  const handleExportCSV = useCallback(() => {
    exportCSV(transactions, periode);
    setToast("Export CSV téléchargé !");
    setTimeout(() => setToast(""), 3000);
  }, [transactions, periode]);

  return (
    <>
      <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown, display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <FoodtruckerSidebar active="/dashboard/foodtrucker/revenus" />

        <div style={{ padding: "3rem" }}>
          {/* ── Header ── */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: showCustomPicker ? "1rem" : 0 }}>
              <div>
                <p style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>DASHBOARD — FOODTRUCKER</p>
                <h1 style={{ fontFamily: S.serif, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.1 }}>Revenus</h1>
              </div>

              {/* Filtres période */}
              <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {PERIODES.map(p => (
                  <button key={p.key} onClick={() => { setPeriode(p.key); setCustomActive(null); setCustomError(""); }} style={{
                    backgroundColor: periode === p.key ? S.terra : "transparent",
                    color: periode === p.key ? "#fff" : S.muted,
                    border: `1px solid ${periode === p.key ? S.terra : S.border}`,
                    padding: "0.5rem 1rem",
                    fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em",
                    cursor: "pointer", transition: "background-color 0.15s",
                  }}>
                    {p.label}
                  </button>
                ))}
                {/* Bouton période personnalisée */}
                <button onClick={() => setPeriode("custom")} style={{
                  backgroundColor: periode === "custom" ? S.terra : "transparent",
                  color: periode === "custom" ? "#fff" : S.muted,
                  border: `1px solid ${periode === "custom" ? S.terra : S.border}`,
                  padding: "0.5rem 1rem",
                  fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em",
                  cursor: "pointer", transition: "background-color 0.15s",
                }}>
                  PÉRIODE PERSONNALISÉE
                </button>
              </div>
            </div>

            {/* ── Picker personnalisé — apparition douce ── */}
            <div style={{
              overflow: "hidden",
              maxHeight: showCustomPicker ? "120px" : "0",
              opacity: showCustomPicker ? 1 : 0,
              transition: "max-height 0.25s ease, opacity 0.2s ease",
            }}>
              <div style={{
                display: "flex", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap",
                padding: "1rem 1.25rem",
                border: `1px solid ${S.terra}`,
                backgroundColor: S.cream,
                marginTop: "0.75rem",
              }}>
                {/* Du */}
                <div>
                  <label style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.4rem" }}>DU</label>
                  <input
                    type="date"
                    value={customFrom}
                    max={TODAY}
                    onChange={e => { setCustomFrom(e.target.value); setCustomError(""); }}
                    style={{
                      border: `1px solid ${S.terra}`, backgroundColor: "transparent",
                      padding: "0.55rem 0.75rem", fontFamily: S.sans, fontSize: "0.82rem",
                      color: S.brown, outline: "none", cursor: "pointer",
                    }}
                  />
                </div>

                {/* Au */}
                <div>
                  <label style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted, display: "block", marginBottom: "0.4rem" }}>AU</label>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom || undefined}
                    max={TODAY}
                    onChange={e => { setCustomTo(e.target.value); setCustomError(""); }}
                    style={{
                      border: `1px solid ${S.terra}`, backgroundColor: "transparent",
                      padding: "0.55rem 0.75rem", fontFamily: S.sans, fontSize: "0.82rem",
                      color: S.brown, outline: "none", cursor: "pointer",
                    }}
                  />
                </div>

                {/* Bouton Appliquer */}
                <button
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo}
                  style={{
                    backgroundColor: (!customFrom || !customTo) ? S.muted : S.terra,
                    color: "#fff", border: "none",
                    padding: "0.6rem 1.25rem", fontFamily: S.sans, fontSize: "0.62rem",
                    letterSpacing: "0.2em", cursor: (!customFrom || !customTo) ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s",
                  }}
                >
                  APPLIQUER
                </button>

                {/* Bouton effacer */}
                <button
                  onClick={clearCustom}
                  title="Effacer et revenir à Ce mois"
                  style={{ background: "none", border: "none", cursor: "pointer", color: S.muted, display: "flex", alignItems: "center", padding: "0.4rem" }}
                >
                  <X size={16} strokeWidth={1.5} />
                </button>

                {/* Période active affichée */}
                {customActive && (
                  <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.brown, marginLeft: "0.25rem" }}>
                    Du <strong style={{ fontWeight: 600 }}>{fmtDate(customActive.from)}</strong> au <strong style={{ fontWeight: 600 }}>{fmtDate(customActive.to)}</strong>
                  </span>
                )}
              </div>

              {/* Erreur validation */}
              {customError && (
                <p style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "#C0392B", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ fontSize: "0.8rem" }}>⚠</span> {customError}
                </p>
              )}
            </div>
          </div>

          {/* ── KPIs ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", marginBottom: "3rem" }}>
            {[
              { icon: <Euro size={18} strokeWidth={1.5} color={S.terra} />,          label: "CA HT (PÉRIODE)",        value: fmtEur(kpis.caHT) },
              { icon: <TrendingUp size={18} strokeWidth={1.5} color={S.terra} />,    label: "CA HT (ANNÉE EN COURS)", value: fmtEur(kpis.annee) },
              { icon: <CalendarCheck size={18} strokeWidth={1.5} color={S.terra} />, label: "ÉVÉNEMENTS PAYÉS",       value: String(kpis.nbEvents) },
              { icon: <BarChart3 size={18} strokeWidth={1.5} color={S.terra} />,     label: "MOYENNE PAR ÉVÉNEMENT",  value: fmtEur(kpis.moyenne) },
            ].map(k => (
              <div key={k.label} style={{ backgroundColor: S.card, padding: "1.75rem" }}>
                <div style={{ marginBottom: "0.875rem" }}>{k.icon}</div>
                <div style={{ fontFamily: S.serif, fontSize: "1.8rem", fontWeight: 800, color: S.brown, lineHeight: 1, marginBottom: "0.4rem" }}>{k.value}</div>
                <div style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.2em", color: S.muted }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* ── Transactions ── */}
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontFamily: S.serif, fontSize: "1.4rem", fontWeight: 700 }}>
                Transactions
                <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted, marginLeft: "0.75rem" }}>
                  {transactions.length} résultat{transactions.length !== 1 ? "s" : ""}
                </span>
              </h2>
              <button onClick={handleExportCSV} style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                backgroundColor: "transparent", color: S.muted, border: `1px solid ${S.border}`,
                padding: "0.6rem 1.25rem", fontFamily: S.sans, fontSize: "0.62rem",
                letterSpacing: "0.2em", cursor: "pointer",
              }}>
                <Download size={13} strokeWidth={1.5} /> EXPORTER CSV
              </button>
            </div>

            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: S.muted, fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, border: `1px solid ${S.border}` }}>
                Aucune transaction sur cette période.
              </div>
            ) : (
              <div style={{ border: `1px solid ${S.border}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr auto", padding: "1rem 1.5rem", borderBottom: `1px solid ${S.border}`, gap: "1rem" }}>
                  {["DATE", "ÉVÉNEMENT", "TYPE", "MONTANT HT", "STATUT", ""].map((h, i) => (
                    <span key={i} style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted }}>{h}</span>
                  ))}
                </div>
                {transactions.map((t, i) => (
                  <div key={t.id} style={{
                    display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1fr auto",
                    padding: "1.1rem 1.5rem", alignItems: "center", gap: "1rem",
                    borderBottom: i < transactions.length - 1 ? `1px solid ${S.border}` : "none",
                    opacity: t.statut === "EN ATTENTE" ? 0.75 : 1,
                  }}>
                    <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted }}>{fmtDate(t.dateISO)}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.875rem", color: S.brown }}>{t.evenement}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted }}>{t.type}</span>
                    <span style={{ fontFamily: S.serif, fontSize: "1rem", fontWeight: 700, color: S.brown }}>{fmtEur(t.montantHT)}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", color: STATUT_COLORS[t.statut], fontWeight: 600 }}>{t.statut}</span>
                    <button onClick={() => setDetailTx(t)} style={{
                      display: "flex", alignItems: "center", gap: "0.3rem",
                      backgroundColor: "transparent", border: `1px solid ${S.border}`,
                      padding: "0.4rem 0.75rem", cursor: "pointer",
                      fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", color: S.muted,
                    }}>
                      <FileText size={11} strokeWidth={1.5} /> DÉTAIL
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Factures ── */}
          <div>
            <h2 style={{ fontFamily: S.serif, fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.25rem" }}>Mes factures</h2>
            <div style={{ border: `1px solid ${S.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", padding: "1rem 1.5rem", borderBottom: `1px solid ${S.border}`, gap: "1rem" }}>
                {["RÉFÉRENCE", "DATE", "MONTANT TTC", "STATUT", ""].map((h, i) => (
                  <span key={i} style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted }}>{h}</span>
                ))}
              </div>
              {ALL_TRANSACTIONS.slice().reverse().map((t, i, arr) => {
                const ttc = Math.round(t.montantHT * (1 + TVA_RATE));
                return (
                  <div key={t.id} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                    padding: "1.1rem 1.5rem", alignItems: "center", gap: "1rem",
                    borderBottom: i < arr.length - 1 ? `1px solid ${S.border}` : "none",
                  }}>
                    <span style={{ fontFamily: S.sans, fontSize: "0.82rem", color: S.brown, fontWeight: 500 }}>{t.factureRef}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted }}>{fmtDate(t.dateISO)}</span>
                    <span style={{ fontFamily: S.serif, fontSize: "0.95rem", fontWeight: 700, color: S.brown }}>{fmtEur(ttc)}</span>
                    <span style={{ fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", color: STATUT_COLORS[t.statut], fontWeight: 600 }}>{t.statut}</span>
                    <button
                      onClick={() => { genererPDF(t); setToast(`${t.factureRef} téléchargée !`); setTimeout(() => setToast(""), 3000); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.35rem",
                        backgroundColor: t.statut === "PAYÉE" ? S.terra : "transparent",
                        color: t.statut === "PAYÉE" ? "#fff" : S.muted,
                        border: `1px solid ${t.statut === "PAYÉE" ? S.terra : S.border}`,
                        padding: "0.4rem 0.875rem", cursor: t.statut === "PAYÉE" ? "pointer" : "not-allowed",
                        fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em",
                      }}
                    >
                      <Download size={12} strokeWidth={1.5} /> PDF
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ── Modale détail ── */}
      {detailTx && <ModaleDetail t={detailTx} onClose={() => setDetailTx(null)} />}

      {/* ── Toast ── */}
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </>
  );
}

export default function RevenusPage() {
  return <Suspense><RevenusPageInner /></Suspense>;
}

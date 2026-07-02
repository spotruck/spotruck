"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, X, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

const S = {
  cream: "#F2EDE4",
  brown: "#2C1810",
  terra: "#C4622D",
  border: "#D4C9BC",
  muted: "#8C7B6E",
  card: "#EDE8DF",
  green: "#2C7A4B",
  gold: "#D4A017",
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', Helvetica, sans-serif",
};

export default function TarifsPage() {
  const [comparatifFoodtruckerOpen, setComparatifFoodtruckerOpen] = useState(false);
  const [comparatifOrganisateurOpen, setComparatifOrganisateurOpen] = useState(false);

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            max-height: 0;
            overflow: hidden;
          }
          to {
            opacity: 1;
            max-height: 5000px;
          }
        }
      `}</style>
      <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${S.border}`, padding: "2rem 2rem 3rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <Link
            href="/"
            style={{
              fontFamily: S.serif,
              fontSize: "1.1rem",
              fontWeight: 800,
              letterSpacing: "0.05em",
              color: S.brown,
              textDecoration: "none",
              display: "inline-block",
              marginBottom: "2rem",
            }}
          >
            ← SPOTRUCK
          </Link>
          <p
            style={{
              fontFamily: S.sans,
              fontSize: "0.62rem",
              letterSpacing: "0.2em",
              color: S.muted,
              marginBottom: "1rem",
            }}
          >
            TARIFS
          </p>
          <h1
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: "1rem",
            }}
          >
            Des tarifs clairs et transparents
          </h1>
          <p
            style={{
              fontFamily: S.sans,
              fontSize: "1rem",
              fontWeight: 300,
              color: S.muted,
              maxWidth: "600px",
              lineHeight: 1.8,
            }}
          >
            Choisissez le plan qui correspond à vos besoins. Sans engagement, résiliable à tout moment.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TARIFS FOODTRUCKER
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              marginBottom: "0.75rem",
            }}
          >
            Tarifs Foodtrucker
          </h2>
          <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.muted }}>
            Accédez aux opportunités partout en France
          </p>
        </div>

        {/* Cards plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", marginBottom: "3rem" }}>
          {[
            {
              plan: "FREE",
              prix: "0€",
              badge: null,
              popular: false,
              items: null,
            },
            {
              plan: "PRO",
              prix: "15€",
              prixNormal: "29€",
              sub: "/mois",
              badge: "OFFRE LANCEMENT",
              popular: true,
              items: ["Événements privés accessibles"],
            },
            {
              plan: "PREMIUM",
              prix: "29€",
              prixNormal: "59€",
              sub: "/mois",
              badge: "OFFRE LANCEMENT",
              popular: false,
              items: null,
            },
            {
              plan: "SAISON",
              prix: "199€",
              prixNormal: "399€",
              sub: "/8 mois consécutifs",
              badge: "OFFRE LANCEMENT",
              popular: false,
              items: null,
            },
          ].map((p) => (
            <div
              key={p.plan}
              style={{
                backgroundColor: p.popular ? "rgba(196,98,45,0.05)" : S.card,
                border: p.popular ? `2px solid ${S.terra}` : "none",
                padding: "2rem 1.75rem",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {p.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "-1px",
                    right: "-1px",
                    backgroundColor: S.terra,
                    color: "#fff",
                    fontFamily: S.sans,
                    fontSize: "0.5rem",
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                  }}
                >
                  {p.badge}
                </div>
              )}
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.6rem",
                  letterSpacing: "0.2em",
                  color: p.popular ? S.terra : S.muted,
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                {p.plan}
              </p>
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span
                    style={{
                      fontFamily: S.serif,
                      fontSize: "3rem",
                      fontWeight: 800,
                      color: S.brown,
                      lineHeight: 1,
                    }}
                  >
                    {p.prix}
                  </span>
                  {p.prixNormal && (
                    <span
                      style={{
                        fontFamily: S.sans,
                        fontSize: "0.85rem",
                        color: S.muted,
                        textDecoration: "line-through",
                      }}
                    >
                      {p.prixNormal}
                    </span>
                  )}
                </div>
                {p.sub && (
                  <p style={{ fontFamily: S.sans, fontSize: "0.7rem", color: S.muted }}>{p.sub}</p>
                )}
              </div>
              {p.items && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  {p.items.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <CheckCircle size={13} color={S.terra} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.brown, lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link
                href={`/auth/register?role=foodtrucker&plan=${p.plan.toLowerCase()}`}
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  fontWeight: 500,
                  backgroundColor: p.popular ? S.terra : "transparent",
                  color: p.popular ? "#fff" : S.brown,
                  border: p.popular ? "none" : `1px solid ${S.border}`,
                  padding: "0.875rem 1.5rem",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "block",
                  marginTop: "auto",
                }}
              >
                S'INSCRIRE
              </Link>
            </div>
          ))}
        </div>

        {/* Tableau comparatif */}
        <div>
          <div
            onClick={() => setComparatifFoodtruckerOpen(!comparatifFoodtruckerOpen)}
            style={{
              backgroundColor: S.brown,
              padding: "0.75rem 1.5rem",
              marginBottom: "2px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontFamily: S.sans,
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 700,
              }}
            >
              {comparatifFoodtruckerOpen ? "MASQUER LE COMPARATIF" : "COMPARATIF COMPLET DES FONCTIONNALITÉS"}
            </p>
            {comparatifFoodtruckerOpen ? (
              <ChevronUp size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            ) : (
              <ChevronDown size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            )}
          </div>

          {comparatifFoodtruckerOpen && (
            <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  gap: 0,
                  backgroundColor: S.card,
                  padding: "0.875rem 1.5rem",
              borderBottom: `1px solid ${S.border}`,
            }}
          >
            <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.muted, fontWeight: 700 }}></p>
            <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.brown, fontWeight: 700, textAlign: "center" }}>FREE</p>
            <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.terra, fontWeight: 700, textAlign: "center" }}>PRO</p>
            <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.brown, fontWeight: 700, textAlign: "center" }}>PREMIUM</p>
            <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.brown, fontWeight: 700, textAlign: "center" }}>SAISON</p>
          </div>

          {/* Lignes */}
          {[
            { label: "Consulter les opportunités", free: true, pro: true, premium: true, saison: true },
            { label: "Profil visible dans l'annuaire", free: true, pro: true, premium: true, saison: true },
            { label: "Candidatures par mois", free: "3", pro: "∞", premium: "∞", saison: "∞" },
            { label: "Accès aux privatisations", free: false, pro: true, premium: true, saison: true },
            { label: "Calendrier événementiel complet", free: false, pro: true, premium: true, saison: true },
            { label: "Badge Vérifié sur votre profil", free: false, pro: true, premium: true, saison: true },
            { label: "Alertes email quotidiennes", free: false, pro: true, premium: true, saison: true },
            { label: "Accès anticipé 24h aux nouvelles offres", free: false, pro: false, premium: true, saison: true },
            { label: "Profil en tête de liste", free: false, pro: false, premium: true, saison: true },
            { label: "Base de lieux événementiels (prospection)", free: false, pro: false, premium: true, saison: true },
            { label: "Contact direct organisateurs", free: false, pro: false, premium: true, saison: true },
            { label: "Analytics détaillés", free: false, pro: false, premium: true, saison: true },
            { label: "Support prioritaire", free: false, pro: false, premium: true, saison: true },
            { label: "Date d'activation", free: "—", pro: "—", premium: "—", saison: "Flexible" },
            { label: "Engagement", free: "—", pro: "Sans", premium: "Sans", saison: "8 mois" },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                gap: 0,
                backgroundColor: i % 2 === 0 ? "rgba(44,26,16,0.02)" : "transparent",
                padding: "0.875rem 1.5rem",
                borderBottom: `1px solid ${S.border}`,
                alignItems: "center",
              }}
            >
              <p style={{ fontFamily: S.sans, fontSize: "0.75rem", color: S.brown }}>{row.label}</p>
              {[row.free, row.pro, row.premium, row.saison].map((val, idx) => (
                <div key={idx} style={{ textAlign: "center" }}>
                  {typeof val === "boolean" ? (
                    val ? (
                      <CheckCircle size={16} color={S.green} strokeWidth={2} />
                    ) : (
                      <X size={16} color={S.muted} strokeWidth={1.5} />
                    )
                  ) : (
                    <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.brown, fontWeight: 500 }}>{val}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
            </div>
          )}
        </div>
      </section>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${S.border}`, margin: "0 2rem" }} />

      {/* ══════════════════════════════════════════════════════
          TARIFS ORGANISATEUR
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              marginBottom: "0.75rem",
            }}
          >
            Tarifs Organisateur
          </h2>
          <p style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.muted }}>
            Trouvez les meilleurs trucks pour vos événements
          </p>
        </div>

        {/* Cards plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", marginBottom: "3rem" }}>
          {[
            {
              plan: "GRATUIT",
              prix: "0€",
              badge: null,
              popular: false,
            },
            {
              plan: "PRO EVENT",
              prix: "19€",
              sub: "/événement",
              badge: null,
              popular: true,
            },
            {
              plan: "PRO SEMESTRIEL",
              prix: "79€",
              sub: "/6 mois",
              badge: null,
              popular: false,
            },
            {
              plan: "PRO ANNUEL",
              prix: "129€",
              sub: "/an",
              badge: "MEILLEUR RAPPORT",
              popular: false,
            },
          ].map((p) => (
            <div
              key={p.plan}
              style={{
                backgroundColor: p.popular ? "rgba(196,98,45,0.05)" : S.card,
                border: p.popular ? `2px solid ${S.terra}` : p.badge ? `2px solid ${S.gold}` : "none",
                padding: "2rem 1.75rem",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {p.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: "-1px",
                    right: "-1px",
                    backgroundColor: p.plan === "PRO ANNUEL" ? S.gold : S.terra,
                    color: "#fff",
                    fontFamily: S.sans,
                    fontSize: "0.5rem",
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                  }}
                >
                  {p.badge}
                </div>
              )}
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.6rem",
                  letterSpacing: "0.2em",
                  color: p.popular ? S.terra : p.plan === "PRO ANNUEL" ? S.gold : S.muted,
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                {p.plan}
              </p>
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span
                    style={{
                      fontFamily: S.serif,
                      fontSize: "3rem",
                      fontWeight: 800,
                      color: S.brown,
                      lineHeight: 1,
                    }}
                  >
                    {p.prix}
                  </span>
                </div>
                {p.sub && (
                  <p style={{ fontFamily: S.sans, fontSize: "0.7rem", color: S.muted }}>{p.sub}</p>
                )}
              </div>
              <Link
                href={`/auth/register?role=organisateur&plan=${p.plan.toLowerCase().replace(" ", "-")}`}
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  fontWeight: 500,
                  backgroundColor: p.popular ? S.terra : p.plan === "PRO ANNUEL" ? S.gold : "transparent",
                  color: p.popular || p.plan === "PRO ANNUEL" ? "#fff" : S.brown,
                  border: p.popular || p.plan === "PRO ANNUEL" ? "none" : `1px solid ${S.border}`,
                  padding: "0.875rem 1.5rem",
                  textDecoration: "none",
                  textAlign: "center",
                  display: "block",
                  marginTop: "auto",
                }}
              >
                S'INSCRIRE
              </Link>
            </div>
          ))}
        </div>

        {/* Tableau comparatif */}
        <div>
          <div
            onClick={() => setComparatifOrganisateurOpen(!comparatifOrganisateurOpen)}
            style={{
              backgroundColor: S.brown,
              padding: "0.75rem 1.5rem",
              marginBottom: "2px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontFamily: S.sans,
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 700,
              }}
            >
              {comparatifOrganisateurOpen ? "MASQUER LE COMPARATIF" : "COMPARATIF COMPLET DES FONCTIONNALITÉS"}
            </p>
            {comparatifOrganisateurOpen ? (
              <ChevronUp size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            ) : (
              <ChevronDown size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            )}
          </div>

          {comparatifOrganisateurOpen && (
            <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  gap: 0,
                  backgroundColor: S.card,
                  padding: "0.875rem 1.5rem",
                  borderBottom: `1px solid ${S.border}`,
                }}
              >
                <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.muted, fontWeight: 700 }}></p>
                <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.brown, fontWeight: 700, textAlign: "center" }}>GRATUIT</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.terra, fontWeight: 700, textAlign: "center" }}>PRO EVENT</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.brown, fontWeight: 700, textAlign: "center" }}>PRO SEMESTRIEL</p>
                <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.gold, fontWeight: 700, textAlign: "center" }}>PRO ANNUEL</p>
              </div>

          {/* Lignes */}
          {[
            { label: "Publication d'événements", gratuit: "∞", proEvent: "∞", proSem: "∞", proAn: "∞" },
            { label: "Sélection de trucks adaptés", gratuit: true, proEvent: true, proSem: true, proAn: true },
            { label: "Messagerie intégrée", gratuit: true, proEvent: true, proSem: true, proAn: true },
            { label: "Contrat standard Spotruck", gratuit: true, proEvent: false, proSem: false, proAn: false },
            { label: "Frais de service réduits", gratuit: false, proEvent: true, proSem: true, proAn: true },
            { label: "Contrat personnalisable", gratuit: false, proEvent: true, proSem: true, proAn: true },
            { label: "Support prioritaire 7j/7", gratuit: false, proEvent: true, proSem: true, proAn: true },
            { label: "Badge « Organisateur de confiance »", gratuit: false, proEvent: "1 event", proSem: true, proAn: true },
            { label: "Garantie annulation renforcée", gratuit: false, proEvent: true, proSem: true, proAn: true },
            { label: "Multi-utilisateurs (équipe)", gratuit: "1", proEvent: "1 event", proSem: "∞", proAn: "∞" },
            { label: "Analytics avancés", gratuit: false, proEvent: false, proSem: true, proAn: true },
            { label: "Modèles de messages illimités", gratuit: "1", proEvent: "1", proSem: "∞", proAn: "∞" },
            { label: "Modèles de contrats illimités", gratuit: false, proEvent: false, proSem: true, proAn: true },
            { label: "Historique complet", gratuit: true, proEvent: true, proSem: true, proAn: true },
            { label: "Engagement", gratuit: "—", proEvent: "1 event", proSem: "6 mois", proAn: "1 an" },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                gap: 0,
                backgroundColor: i % 2 === 0 ? "rgba(44,26,16,0.02)" : "transparent",
                padding: "0.875rem 1.5rem",
                borderBottom: `1px solid ${S.border}`,
                alignItems: "center",
              }}
            >
              <p style={{ fontFamily: S.sans, fontSize: "0.75rem", color: S.brown }}>{row.label}</p>
              {[row.gratuit, row.proEvent, row.proSem, row.proAn].map((val, idx) => (
                <div key={idx} style={{ textAlign: "center" }}>
                  {typeof val === "boolean" ? (
                    val ? (
                      <CheckCircle size={16} color={S.green} strokeWidth={2} />
                    ) : (
                      <X size={16} color={S.muted} strokeWidth={1.5} />
                    )
                  ) : (
                    <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.brown, fontWeight: 500 }}>{val}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section
        style={{
          backgroundColor: S.brown,
          padding: "4rem 2rem",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: S.serif,
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 800,
            color: S.cream,
            marginBottom: "1.5rem",
            lineHeight: 1.1,
          }}
        >
          Prêt à rejoindre Spotruck ?
        </h2>
        <p
          style={{
            fontFamily: S.sans,
            fontSize: "0.9rem",
            color: S.muted,
            marginBottom: "2.5rem",
          }}
        >
          Inscription gratuite. Sans engagement.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/auth/register?role=foodtrucker"
            style={{
              fontFamily: S.sans,
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              fontWeight: 500,
              backgroundColor: S.terra,
              color: "#fff",
              padding: "1.1rem 2.5rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            JE SUIS FOODTRUCKER <ArrowRight size={14} />
          </Link>
          <Link
            href="/auth/register?role=organisateur"
            style={{
              fontFamily: S.sans,
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              fontWeight: 400,
              backgroundColor: "transparent",
              color: S.cream,
              border: `1px solid ${S.cream}`,
              padding: "1.1rem 2.5rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            J'ORGANISE DES ÉVÉNEMENTS <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${S.border}`,
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontFamily: S.sans, fontSize: "0.7rem", color: S.muted }}>
          © 2026 Spotruck — Tous droits réservés
        </p>
      </footer>
    </main>
    </>
  );
}

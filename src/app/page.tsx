"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck, Calendar, MapPin, Search, Shield, CheckCircle,
  ArrowRight, Users, Target, Clock, Star, Menu, X,
} from "lucide-react";

const S = {
  cream: "#F2EDE4",
  brown: "#2C1810",
  terra: "#C4622D",
  border: "#D4C9BC",
  muted: "#8C7B6E",
  card: "#EDE8DF",
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', Helvetica, sans-serif",
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main style={{ backgroundColor: S.cream, color: S.brown }}>

      {/* ══════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════ */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: scrolled ? "rgba(242,237,228,0.95)" : S.cream,
          borderBottom: `1px solid ${S.border}`,
          backdropFilter: scrolled ? "blur(10px)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "1.25rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: S.serif,
              fontSize: "1.1rem",
              fontWeight: 800,
              letterSpacing: "0.05em",
              color: S.brown,
              textDecoration: "none",
            }}
          >
            SPOTRUCK
          </Link>

          {/* Desktop menu */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2.5rem",
            }}
            className="desktop-menu"
          >
            <a
              href="#comment-ca-marche"
              style={{
                fontFamily: S.sans,
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: S.muted,
                textDecoration: "none",
                fontWeight: 400,
              }}
            >
              COMMENT ÇA MARCHE
            </a>
            <a
              href="#tarifs"
              style={{
                fontFamily: S.sans,
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: S.muted,
                textDecoration: "none",
                fontWeight: 400,
              }}
            >
              TARIFS
            </a>
            <Link
              href="/auth/login"
              style={{
                fontFamily: S.sans,
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: S.muted,
                textDecoration: "none",
                fontWeight: 400,
              }}
            >
              CONNEXION
            </Link>
            <Link
              href="/auth/register"
              style={{
                fontFamily: S.sans,
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: S.brown,
                textDecoration: "none",
                fontWeight: 500,
                border: `1px solid ${S.terra}`,
                padding: "0.65rem 1.5rem",
              }}
            >
              S'INSCRIRE
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: S.brown,
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="mobile-menu"
            style={{
              display: "none",
              flexDirection: "column",
              gap: "1rem",
              padding: "1.5rem 2rem",
              borderTop: `1px solid ${S.border}`,
              backgroundColor: S.cream,
            }}
          >
            <a href="#comment-ca-marche" style={{ fontFamily: S.sans, fontSize: "0.75rem", letterSpacing: "0.15em", color: S.brown }}>
              COMMENT ÇA MARCHE
            </a>
            <a href="#tarifs" style={{ fontFamily: S.sans, fontSize: "0.75rem", letterSpacing: "0.15em", color: S.brown }}>
              TARIFS
            </a>
            <Link href="/auth/login" style={{ fontFamily: S.sans, fontSize: "0.75rem", letterSpacing: "0.15em", color: S.brown }}>
              CONNEXION
            </Link>
            <Link
              href="/auth/register"
              style={{
                fontFamily: S.sans,
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                color: "#fff",
                backgroundColor: S.terra,
                padding: "0.75rem 1.5rem",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              S'INSCRIRE
            </Link>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "2rem 2rem 0", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "3rem" }}>
          {["MARKETPLACE", "FRANCE", "STREET FOOD", "ÉVÉNEMENTS"].map((t, i) => (
            <span
              key={t}
              style={{
                fontFamily: S.sans,
                fontSize: "0.55rem",
                letterSpacing: "0.25em",
                color: i === 0 ? S.terra : S.muted,
                fontWeight: 400,
                marginRight: i < 3 ? "2rem" : 0,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Hero content */}
        <div style={{ maxWidth: "900px", marginBottom: "4rem" }}>
          <h1
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(2.5rem, 8vw, 6.5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              marginBottom: "2rem",
            }}
          >
            Là où les{" "}
            <span style={{ color: S.terra, fontStyle: "italic" }}>meilleurs trucks</span>
            <br />
            rencontrent les meilleurs événements.
          </h1>

          <p
            style={{
              fontFamily: S.sans,
              fontSize: "1rem",
              fontWeight: 300,
              color: S.muted,
              lineHeight: 1.8,
              maxWidth: "540px",
              marginBottom: "3rem",
            }}
          >
            Spotruck connecte les foodtruckers ambitieux aux organisateurs d'événements en France.
            Simple, direct, authentique.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              href="/auth/register?role=foodtrucker"
              style={{
                fontFamily: S.sans,
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                fontWeight: 500,
                backgroundColor: S.terra,
                color: "#fff",
                padding: "1.1rem 2.25rem",
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
                color: S.brown,
                border: `1px solid ${S.brown}`,
                padding: "1.1rem 2.25rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              J'ORGANISE DES ÉVÉNEMENTS <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${S.border}`, margin: "0 2rem" }} />

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0" }}>
          {[
            { value: "500+", label: "FOODTRUCKERS" },
            { value: "2 000+", label: "ÉVÉNEMENTS RÉFÉRENCÉS" },
            { value: "15", label: "RÉGIONS COUVERTES" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "2.5rem",
                borderRight: i < 2 ? `1px solid ${S.border}` : "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: S.serif,
                  fontSize: "3.5rem",
                  fontWeight: 800,
                  color: S.terra,
                  lineHeight: 1,
                  marginBottom: "0.75rem",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  color: S.muted,
                  fontWeight: 400,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${S.border}`, margin: "0 2rem" }} />

      {/* ══════════════════════════════════════════════════════
          POUR LES FOODTRUCKERS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem", textAlign: "center", maxWidth: "700px", margin: "0 auto 4rem" }}>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 800,
              marginBottom: "1.5rem",
              lineHeight: 1.1,
            }}
          >
            Vous êtes foodtrucker ?
          </h2>
          <p
            style={{
              fontFamily: S.sans,
              fontSize: "1rem",
              fontWeight: 300,
              color: S.muted,
              lineHeight: 1.8,
            }}
          >
            Fini les heures de recherche sur Google, Facebook et les sites de mairies. Spotruck centralise
            automatiquement toutes les opportunités disponibles en France.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", marginBottom: "3rem" }}>
          {[
            {
              icon: <Search size={28} strokeWidth={1.5} color={S.terra} />,
              titre: "Toutes les opportunités",
              desc: "Appels d'offres officiels, événements privés, festivals, marchés — tout au même endroit, mis à jour en temps réel.",
            },
            {
              icon: <Calendar size={28} strokeWidth={1.5} color={S.terra} />,
              titre: "Anticipez votre saison",
              desc: "Consultez le calendrier des événements récurrents en France et positionnez-vous avant vos concurrents.",
            },
            {
              icon: <Target size={28} strokeWidth={1.5} color={S.terra} />,
              titre: "Prospectez intelligemment",
              desc: "Accédez à une base de lieux événementiels et contactez directement les organisateurs qui ne publient pas d'appel d'offres.",
            },
          ].map((item) => (
            <div key={item.titre} style={{ backgroundColor: S.card, padding: "2.5rem 2rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>{item.icon}</div>
              <h3
                style={{
                  fontFamily: S.serif,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: S.brown,
                }}
              >
                {item.titre}
              </h3>
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.875rem",
                  fontWeight: 300,
                  color: S.muted,
                  lineHeight: 1.7,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <Link
            href="/tarifs"
            style={{
              fontFamily: S.sans,
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              fontWeight: 500,
              backgroundColor: "transparent",
              color: S.terra,
              border: `1px solid ${S.terra}`,
              padding: "1rem 2rem",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            DÉCOUVRIR LES PLANS FOODTRUCKER
          </Link>
        </div>
      </section>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${S.border}`, margin: "0 2rem" }} />

      {/* ══════════════════════════════════════════════════════
          POUR LES ORGANISATEURS
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 800,
              marginBottom: "3rem",
              lineHeight: 1.1,
            }}
          >
            Vous organisez un événement ?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2px",
              marginBottom: "3rem",
              textAlign: "left",
            }}
          >
            <div style={{ backgroundColor: S.card, padding: "2rem 2.25rem" }}>
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.75rem",
                  letterSpacing: "0.15em",
                  color: S.terra,
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                GRAND ÉVÉNEMENT
              </p>
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.9rem",
                  fontWeight: 300,
                  color: S.brown,
                  lineHeight: 1.8,
                }}
              >
                Vous postez partout, vous recevez des dizaines de messages non qualifiés et vous passez des heures
                à trier sans garantie que le truck sera là le jour J.
              </p>
            </div>
            <div style={{ backgroundColor: S.card, padding: "2rem 2.25rem" }}>
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.75rem",
                  letterSpacing: "0.15em",
                  color: S.terra,
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                ÉVÉNEMENT CONFIDENTIEL
              </p>
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.9rem",
                  fontWeight: 300,
                  color: S.brown,
                  lineHeight: 1.8,
                }}
              >
                Vous ne savez pas où trouver le bon truck, vous manquez de visibilité et vos recherches
                restent sans réponse.
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(196,98,45,0.08)",
              padding: "2.5rem 3rem",
              marginBottom: "3rem",
              borderLeft: `4px solid ${S.terra}`,
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontFamily: S.sans,
                fontSize: "1.1rem",
                fontWeight: 300,
                color: S.brown,
                lineHeight: 1.8,
              }}
            >
              <strong style={{ fontWeight: 600 }}>Avec Spotruck,</strong> publiez votre événement en 5 minutes.
              Recevez une sélection des meilleurs trucks adaptés à votre public. Vous choisissez. C'est tout.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", marginBottom: "3rem" }}>
            {[
              "Gratuit pour publier",
              "Trucks vérifiés et notés",
              "Contrat et paiement sécurisés",
              "Remplacement garanti si annulation",
            ].map((arg) => (
              <div
                key={arg}
                style={{
                  backgroundColor: S.card,
                  padding: "1.75rem 1.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  flexDirection: "column",
                  textAlign: "center",
                }}
              >
                <CheckCircle size={20} strokeWidth={2} color={S.terra} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: S.sans,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: S.brown,
                  }}
                >
                  {arg}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/auth/register?role=organisateur"
            style={{
              fontFamily: S.sans,
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              fontWeight: 500,
              backgroundColor: S.terra,
              color: "#fff",
              padding: "1.1rem 2.5rem",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            PUBLIER MON ÉVÉNEMENT GRATUITEMENT
          </Link>
        </div>
      </section>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${S.border}`, margin: "0 2rem" }} />

      {/* ══════════════════════════════════════════════════════
          COMMENT ÇA MARCHE
      ══════════════════════════════════════════════════════ */}
      <section id="comment-ca-marche" style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem", textAlign: "center" }}>
          <span
            style={{
              fontFamily: S.sans,
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: S.terra,
              fontWeight: 400,
            }}
          >
            COMMENT ÇA MARCHE
          </span>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 800,
              marginTop: "1rem",
              lineHeight: 1.1,
            }}
          >
            Simple. Rapide. Fiable.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
          {/* FOODTRUCKER */}
          <div>
            <div
              style={{
                backgroundColor: S.brown,
                padding: "1rem 1.5rem",
                marginBottom: "2px",
              }}
            >
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 700,
                }}
              >
                CÔTÉ FOODTRUCKER
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {[
                {
                  num: "01",
                  titre: "Créez votre profil",
                  desc: "Renseignez votre truck, vos spécialités et uploadez vos documents en 10 minutes.",
                },
                {
                  num: "02",
                  titre: "Trouvez vos événements",
                  desc: "Consultez toutes les opportunités disponibles dans votre région et postulez en 2 clics.",
                },
                {
                  num: "03",
                  titre: "Développez votre activité",
                  desc: "Gérez vos candidatures, contrats et revenus depuis votre tableau de bord.",
                },
              ].map((step) => (
                <div key={step.num} style={{ backgroundColor: S.card, padding: "2rem" }}>
                  <p
                    style={{
                      fontFamily: S.sans,
                      fontSize: "0.6rem",
                      letterSpacing: "0.2em",
                      color: S.muted,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {step.num}
                  </p>
                  <h3
                    style={{
                      fontFamily: S.serif,
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                      color: S.brown,
                    }}
                  >
                    {step.titre}
                  </h3>
                  <p
                    style={{
                      fontFamily: S.sans,
                      fontSize: "0.85rem",
                      fontWeight: 300,
                      color: S.muted,
                      lineHeight: 1.7,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ORGANISATEUR */}
          <div>
            <div
              style={{
                backgroundColor: S.brown,
                padding: "1rem 1.5rem",
                marginBottom: "2px",
              }}
            >
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 700,
                }}
              >
                CÔTÉ ORGANISATEUR
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {[
                {
                  num: "01",
                  titre: "Publiez votre événement",
                  desc: "Décrivez votre événement, votre public et vos besoins en 5 minutes.",
                },
                {
                  num: "02",
                  titre: "Recevez une sélection",
                  desc: "Spotruck identifie les trucks les plus adaptés à votre événement parmi les profils disponibles.",
                },
                {
                  num: "03",
                  titre: "Choisissez et sécurisez",
                  desc: "Sélectionnez votre truck, signez le contrat et sécurisez le paiement directement sur Spotruck.",
                },
              ].map((step) => (
                <div key={step.num} style={{ backgroundColor: S.card, padding: "2rem" }}>
                  <p
                    style={{
                      fontFamily: S.sans,
                      fontSize: "0.6rem",
                      letterSpacing: "0.2em",
                      color: S.muted,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {step.num}
                  </p>
                  <h3
                    style={{
                      fontFamily: S.serif,
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                      color: S.brown,
                    }}
                  >
                    {step.titre}
                  </h3>
                  <p
                    style={{
                      fontFamily: S.sans,
                      fontSize: "0.85rem",
                      fontWeight: 300,
                      color: S.muted,
                      lineHeight: 1.7,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${S.border}`, margin: "0 2rem" }} />

      {/* ══════════════════════════════════════════════════════
          TARIFS RÉSUMÉS
      ══════════════════════════════════════════════════════ */}
      <section id="tarifs" style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            Des tarifs clairs et transparents
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
          {/* FOODTRUCKER */}
          <div>
            <div
              style={{
                backgroundColor: S.brown,
                padding: "1rem 1.5rem",
                marginBottom: "2px",
              }}
            >
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 700,
                }}
              >
                CÔTÉ FOODTRUCKER
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
              {[
                {
                  plan: "FREE",
                  prix: "0€",
                  items: ["Consulter les opportunités", "Profil visible"],
                },
                {
                  plan: "PRO",
                  prix: "15€",
                  sub: "/mois",
                  badge: "OFFRE LANCEMENT",
                  items: ["Candidatures illimitées", "Événements privés accessibles", "Calendrier événementiel", "Badge Vérifié"],
                },
                {
                  plan: "PREMIUM",
                  prix: "29€",
                  sub: "/mois",
                  badge: "OFFRE LANCEMENT",
                  items: ["Tête de liste", "Accès anticipé 24h", "Outils de prospection"],
                },
              ].map((p) => (
                <div
                  key={p.plan}
                  style={{
                    backgroundColor: S.card,
                    padding: "2rem 1.5rem",
                    position: "relative",
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
                      color: S.muted,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {p.plan}
                  </p>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span
                      style={{
                        fontFamily: S.serif,
                        fontSize: "2.5rem",
                        fontWeight: 800,
                        color: S.brown,
                        lineHeight: 1,
                      }}
                    >
                      {p.prix}
                    </span>
                    {p.sub && (
                      <span
                        style={{
                          fontFamily: S.sans,
                          fontSize: "0.75rem",
                          color: S.muted,
                        }}
                      >
                        {p.sub}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                    {p.items.map((item) => (
                      <div key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                        <CheckCircle size={13} color={S.terra} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.brown }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ORGANISATEUR */}
          <div>
            <div
              style={{
                backgroundColor: S.brown,
                padding: "1rem 1.5rem",
                marginBottom: "2px",
              }}
            >
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 700,
                }}
              >
                CÔTÉ ORGANISATEUR
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px" }}>
              {[
                { plan: "GRATUIT", prix: "0€" },
                { plan: "PRO EVENT", prix: "19€", sub: "/event" },
                { plan: "PRO SEMESTRIEL", prix: "79€", sub: "/6 mois" },
                { plan: "PRO ANNUEL", prix: "129€", sub: "/an" },
              ].map((p) => (
                <div key={p.plan} style={{ backgroundColor: S.card, padding: "1.5rem 1.25rem", textAlign: "center" }}>
                  <p
                    style={{
                      fontFamily: S.sans,
                      fontSize: "0.55rem",
                      letterSpacing: "0.15em",
                      color: S.muted,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {p.plan}
                  </p>
                  <div>
                    <span
                      style={{
                        fontFamily: S.serif,
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: S.brown,
                        lineHeight: 1,
                      }}
                    >
                      {p.prix}
                    </span>
                    {p.sub && (
                      <div
                        style={{
                          fontFamily: S.sans,
                          fontSize: "0.65rem",
                          color: S.muted,
                          marginTop: "0.25rem",
                        }}
                      >
                        {p.sub}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link
            href="/tarifs"
            style={{
              fontFamily: S.sans,
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              fontWeight: 500,
              backgroundColor: "transparent",
              color: S.terra,
              border: `1px solid ${S.terra}`,
              padding: "1rem 2rem",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            VOIR LES TARIFS COMPLETS
          </Link>
        </div>
      </section>

      {/* Separator */}
      <div style={{ borderTop: `1px solid ${S.border}`, margin: "0 2rem" }} />

      {/* ══════════════════════════════════════════════════════
          TÉMOIGNAGES
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "6rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "4rem", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            Ils font confiance à Spotruck
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
          {[
            {
              texte:
                "Avant je passais mes dimanches à chercher des événements sur des dizaines de sites. Maintenant tout arrive directement sur Spotruck.",
              auteur: "Marc, Le Burger du Chef",
              lieu: "Bordeaux",
            },
            {
              texte:
                "J'ai reçu 8 candidatures qualifiées en 24h. J'ai choisi mon truck en 20 minutes. Zéro stress.",
              auteur: "Sophie, Festival des Saveurs",
              lieu: "Nantes",
            },
            {
              texte:
                "Le calendrier des événements m'a permis de remplir tout mon été en janvier. C'est un vrai changement.",
              auteur: "Karim, Taco Loco",
              lieu: "Lyon",
            },
          ].map((t) => (
            <div key={t.auteur} style={{ backgroundColor: S.card, padding: "2.5rem 2rem" }}>
              <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.25rem" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} fill={S.terra} stroke={S.terra} strokeWidth={1.5} />
                ))}
              </div>
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.9rem",
                  fontWeight: 300,
                  color: S.brown,
                  lineHeight: 1.7,
                  marginBottom: "1.5rem",
                  fontStyle: "italic",
                }}
              >
                "{t.texte}"
              </p>
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: S.brown,
                }}
              >
                {t.auteur}
              </p>
              <p
                style={{
                  fontFamily: S.sans,
                  fontSize: "0.7rem",
                  color: S.muted,
                }}
              >
                {t.lieu}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: S.brown,
          padding: "6rem 2rem",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: S.serif,
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 800,
            color: S.cream,
            marginBottom: "2.5rem",
            lineHeight: 1.1,
          }}
        >
          Prêt à rejoindre Spotruck ?
        </h2>
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
            }}
          >
            JE SUIS FOODTRUCKER
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
            }}
          >
            J'ORGANISE DES ÉVÉNEMENTS
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer
        style={{
          borderTop: `1px solid ${S.border}`,
          padding: "4rem 2rem 2rem",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
          {/* Logo & Tagline */}
          <div>
            <p
              style={{
                fontFamily: S.serif,
                fontSize: "1.1rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                color: S.brown,
                marginBottom: "0.75rem",
              }}
            >
              SPOTRUCK
            </p>
            <p
              style={{
                fontFamily: S.sans,
                fontSize: "0.8rem",
                fontWeight: 300,
                color: S.muted,
                lineHeight: 1.6,
              }}
            >
              La marketplace des foodtruckers en France
            </p>
          </div>

          {/* Produit */}
          <div>
            <p
              style={{
                fontFamily: S.sans,
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: S.muted,
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              PRODUIT
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <a
                href="#comment-ca-marche"
                style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, textDecoration: "none" }}
              >
                Comment ça marche
              </a>
              <a href="#tarifs" style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, textDecoration: "none" }}>
                Tarifs
              </a>
              <Link href="/auth/register" style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, textDecoration: "none" }}>
                S'inscrire
              </Link>
            </div>
          </div>

          {/* Foodtruckers */}
          <div>
            <p
              style={{
                fontFamily: S.sans,
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: S.muted,
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              FOODTRUCKERS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/auth/register?role=foodtrucker"
                style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, textDecoration: "none" }}
              >
                Opportunités
              </Link>
              <Link
                href="/auth/register?role=foodtrucker"
                style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, textDecoration: "none" }}
              >
                Calendrier
              </Link>
              <Link
                href="/auth/register?role=foodtrucker"
                style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, textDecoration: "none" }}
              >
                Prospection
              </Link>
            </div>
          </div>

          {/* Organisateurs */}
          <div>
            <p
              style={{
                fontFamily: S.sans,
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: S.muted,
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              ORGANISATEURS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/auth/register?role=organisateur"
                style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, textDecoration: "none" }}
              >
                Publier un événement
              </Link>
              <a
                href="#comment-ca-marche"
                style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.brown, textDecoration: "none" }}
              >
                Comment ça marche
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop: `1px solid ${S.border}`,
            paddingTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              fontFamily: S.sans,
              fontSize: "0.7rem",
              color: S.muted,
            }}
          >
            © 2026 Spotruck — Tous droits réservés
          </p>
          <p
            style={{
              fontFamily: S.sans,
              fontSize: "0.68rem",
              color: S.muted,
              maxWidth: "500px",
              lineHeight: 1.6,
            }}
          >
            Spotruck est une plateforme de mise en relation et n'est pas responsable des prestations réalisées.
          </p>
        </div>
      </footer>

      {/* CSS for responsive */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-menu {
            display: flex !important;
          }
        }
      `}</style>
    </main>
  );
}

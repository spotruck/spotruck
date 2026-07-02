import Link from "next/link";
import LoginForm from "./LoginForm";

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

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: S.cream,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      {/* Panneau gauche — décoratif */}
      <div
        style={{
          backgroundColor: S.brown,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3rem",
        }}
        className="hidden md:flex"
      >
        <Link
          href="/"
          style={{
            fontFamily: S.serif,
            fontSize: "1.4rem",
            fontWeight: 800,
            color: S.cream,
            letterSpacing: "0.08em",
            textDecoration: "none",
          }}
        >
          SPOTRUCK
        </Link>
        <div>
          <p
            style={{
              fontFamily: S.sans,
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: S.terra,
              marginBottom: "1rem",
            }}
          >
            REJOIGNEZ LA COMMUNAUTÉ
          </p>
          <h2
            style={{
              fontFamily: S.serif,
              fontSize: "2.8rem",
              fontWeight: 800,
              color: S.cream,
              lineHeight: 1.1,
              fontStyle: "italic",
            }}
          >
            La scène street food française vous attend.
          </h2>
        </div>
        <p
          style={{
            fontFamily: S.sans,
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            color: S.muted,
          }}
        >
          500+ FOODTRUCKS — 1 200+ ÉVÉNEMENTS
        </p>
      </div>

      {/* Panneau droit — formulaire */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem 3rem",
          maxWidth: "480px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Mobile logo */}
        <Link
          href="/"
          style={{
            fontFamily: S.serif,
            fontSize: "1.3rem",
            fontWeight: 800,
            color: S.brown,
            textDecoration: "none",
            display: "block",
            marginBottom: "3rem",
          }}
          className="md:hidden"
        >
          SPOTRUCK
        </Link>

        <p
          style={{
            fontFamily: S.sans,
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            color: S.terra,
            marginBottom: "0.75rem",
          }}
        >
          ESPACE MEMBRE
        </p>
        <h1
          style={{
            fontFamily: S.serif,
            fontSize: "2.2rem",
            fontWeight: 800,
            color: S.brown,
            marginBottom: "2.5rem",
            lineHeight: 1.1,
          }}
        >
          Bon retour parmi nous.
        </h1>

        <LoginForm />

        <div
          style={{
            borderTop: `1px solid ${S.border}`,
            marginTop: "2.5rem",
            paddingTop: "2rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: S.sans,
              fontSize: "0.8rem",
              fontWeight: 300,
              color: S.muted,
            }}
          >
            Pas encore de compte ?{" "}
            <Link
              href="/auth/register"
              style={{ color: S.terra, textDecoration: "none", fontWeight: 500 }}
            >
              S'inscrire gratuitement
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

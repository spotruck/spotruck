import Link from "next/link";
import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

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

export default function RegisterPage() {
  return (
    <main
      style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown }}
    >
      {/* Header minimal */}
      <div
        style={{
          borderBottom: `1px solid ${S.border}`,
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: S.serif,
            fontSize: "1.3rem",
            fontWeight: 800,
            color: S.brown,
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}
        >
          SPOTRUCK
        </Link>
        <Link
          href="/auth/login"
          style={{
            fontFamily: S.sans,
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            color: S.muted,
            textDecoration: "none",
          }}
        >
          DÉJÀ UN COMPTE ? SE CONNECTER
        </Link>
      </div>

      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "5rem 2rem",
        }}
      >
        <p
          style={{
            fontFamily: S.sans,
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            color: S.terra,
            marginBottom: "0.75rem",
          }}
        >
          INSCRIPTION GRATUITE
        </p>
        <h1
          style={{
            fontFamily: S.serif,
            fontSize: "2.5rem",
            fontWeight: 800,
            color: S.brown,
            marginBottom: "0.75rem",
            lineHeight: 1.1,
          }}
        >
          Rejoignez Spotruck.
        </h1>
        <p
          style={{
            fontFamily: S.sans,
            fontSize: "0.875rem",
            fontWeight: 300,
            color: S.muted,
            marginBottom: "3rem",
            lineHeight: 1.7,
          }}
        >
          Choisissez votre profil pour personnaliser votre expérience.
        </p>

        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>

      </div>
    </main>
  );
}

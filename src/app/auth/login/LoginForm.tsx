"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, getDashboardPath } from "@/lib/auth/supabase-auth";
import { AlertCircle, Loader2 } from "lucide-react";

const S = {
  cream: "#F2EDE4",
  brown: "#2C1810",
  terra: "#C4622D",
  border: "#D4C9BC",
  muted: "#8C7B6E",
  danger: "#C0392B",
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', Helvetica, sans-serif",
};

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation basique
    if (!email || !email.includes("@")) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }
    if (!password) {
      setError("Veuillez saisir votre mot de passe.");
      return;
    }

    setLoading(true);

    const result = await signIn(email, password);
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      router.push(getDashboardPath(result.user.role));
    }
  }

  const inputStyle = {
    width: "100%",
    border: `1px solid ${S.border}`,
    backgroundColor: "transparent",
    padding: "0.875rem 1rem",
    fontFamily: S.sans,
    fontSize: "0.9rem",
    color: S.brown,
    outline: "none",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Erreur */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: S.danger,
            fontFamily: S.sans,
            fontSize: "0.8rem",
            fontWeight: 400,
            border: `1px solid ${S.danger}`,
            padding: "0.75rem 1rem",
          }}
        >
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </div>
      )}

      <div>
        <label
          style={{
            fontFamily: S.sans,
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            color: S.muted,
            display: "block",
            marginBottom: "0.5rem",
          }}
        >
          ADRESSE EMAIL
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          autoComplete="email"
          style={inputStyle}
        />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <label
            style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", color: S.muted }}
          >
            MOT DE PASSE
          </label>
          <Link
            href="#"
            style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em", color: S.terra, textDecoration: "none" }}
          >
            OUBLIÉ ?
          </Link>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: loading ? S.muted : S.terra,
          color: "#fff",
          border: "none",
          padding: "1rem",
          fontFamily: S.sans,
          fontSize: "0.72rem",
          letterSpacing: "0.2em",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          marginTop: "0.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          transition: "background-color 0.2s",
        }}
      >
        {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
        {loading ? "CONNEXION..." : "SE CONNECTER"}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

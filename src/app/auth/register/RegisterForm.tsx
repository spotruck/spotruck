"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Truck, Calendar, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/auth/supabase-auth";

const S = {
  cream: "#F2EDE4",
  brown: "#2C1810",
  terra: "#C4622D",
  border: "#D4C9BC",
  muted: "#8C7B6E",
  card: "#EDE8DF",
  danger: "#C0392B",
  success: "#2C7A4B",
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', Helvetica, sans-serif",
};

function validate(fields: {
  businessName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): string | null {
  if (!fields.businessName.trim()) return "Le nom du truck ou de l'organisation est requis.";
  if (!fields.email || !fields.email.includes("@") || !fields.email.includes("."))
    return "Veuillez saisir une adresse email valide.";
  if (fields.password.length < 8)
    return "Le mot de passe doit contenir au moins 8 caractères.";
  return null;
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "foodtrucker";

  const [role, setRole] = useState<UserRole>(initialRole);
  const [businessName, setBusinessName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate({ businessName, firstName, lastName, email, password });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Appeler l'API Route pour l'inscription
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          businessName,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Erreur lors de l\'inscription');
        setLoading(false);
        return;
      }

      // Succès !
      setSuccess(true);
      setLoading(false);
      await new Promise((r) => setTimeout(r, 1500));

      // Redirection vers le dashboard approprié
      const dashboardPath = role === 'foodtrucker'
        ? '/dashboard/foodtrucker'
        : '/dashboard/organisateur';
      router.push(dashboardPath);

    } catch (err: any) {
      console.error('Erreur inscription:', err);
      setError('Erreur de connexion au serveur');
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${S.border}`,
    backgroundColor: "transparent",
    padding: "0.875rem 1rem",
    fontFamily: S.sans,
    fontSize: "0.9rem",
    color: S.brown,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: S.sans,
    fontSize: "0.62rem",
    letterSpacing: "0.2em",
    color: S.muted,
    display: "block",
    marginBottom: "0.5rem",
  };

  if (success) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem",
          gap: "1rem",
          textAlign: "center",
        }}
      >
        <CheckCircle size={48} color={S.success} strokeWidth={1.5} />
        <h2 style={{ fontFamily: S.serif, fontSize: "1.8rem", fontWeight: 800, color: S.brown }}>
          Bienvenue sur Spotruck{firstName ? `, ${firstName}` : ""}&nbsp;!
        </h2>
        <p style={{ fontFamily: S.sans, fontSize: "0.85rem", fontWeight: 300, color: S.muted }}>
          Votre compte {role} a été créé. Redirection en cours…
        </p>
        <div style={{ width: "40px", height: "2px", backgroundColor: S.terra, marginTop: "0.5rem" }} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Sélecteur de rôle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
        {[
          { icon: <Truck size={20} strokeWidth={1.5} />, label: "FOODTRUCKER", desc: "Je propose mes services culinaires", value: "foodtrucker" as UserRole },
          { icon: <Calendar size={20} strokeWidth={1.5} />, label: "ORGANISATEUR", desc: "Je cherche des foodtrucks", value: "organisateur" as UserRole },
        ].map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            style={{
              backgroundColor: role === r.value ? S.terra : S.card,
              color: role === r.value ? "#fff" : S.brown,
              border: "none",
              padding: "1.75rem 1.5rem",
              textAlign: "left",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
          >
            <div style={{ marginBottom: "0.75rem", opacity: role === r.value ? 1 : 0.5 }}>
              {r.icon}
            </div>
            <div style={{ fontFamily: S.sans, fontSize: "0.7rem", letterSpacing: "0.2em", fontWeight: 500, marginBottom: "0.3rem" }}>
              {r.label}
            </div>
            <div style={{ fontFamily: S.sans, fontSize: "0.75rem", fontWeight: 300, opacity: 0.75, lineHeight: 1.4 }}>
              {r.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          color: S.danger, fontFamily: S.sans, fontSize: "0.8rem",
          border: `1px solid ${S.danger}`, padding: "0.75rem 1rem",
        }}>
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </div>
      )}

      {/* Nom du truck / organisation */}
      <div>
        <label style={labelStyle}>
          {role === "foodtrucker" ? "NOM DU TRUCK" : "NOM DE L'ÉVÉNEMENT OU DE L'ORGANISATION"}
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={
            role === "foodtrucker"
              ? "Ex: Le Burger du Chef"
              : "Ex: Festival des Saveurs, Mairie de Bordeaux, Wedding by Sophie..."
          }
          autoComplete="organization"
          style={inputStyle}
        />
      </div>

      {/* Email */}
      <div>
        <label style={labelStyle}>ADRESSE EMAIL</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          autoComplete="email"
          style={inputStyle}
        />
      </div>

      {/* Mot de passe */}
      <div>
        <label style={labelStyle}>MOT DE PASSE</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 caractères"
          autoComplete="new-password"
          style={inputStyle}
        />
        {password.length > 0 && (
          <div style={{ marginTop: "0.4rem", display: "flex", gap: "3px" }}>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "2px",
                  backgroundColor:
                    password.length >= (i + 1) * 2
                      ? password.length < 8 ? "#C4622D" : "#2C7A4B"
                      : S.border,
                  transition: "background-color 0.2s",
                }}
              />
            ))}
          </div>
        )}
        {password.length > 0 && password.length < 8 && (
          <p style={{ fontFamily: S.sans, fontSize: "0.7rem", color: S.terra, marginTop: "0.3rem", fontWeight: 300 }}>
            {8 - password.length} caractère{8 - password.length > 1 ? "s" : ""} supplémentaire{8 - password.length > 1 ? "s" : ""} requis
          </p>
        )}
      </div>

      {/* Prénom + Nom (optionnel) */}
      <div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={labelStyle}>
            {role === "foodtrucker" ? "PRÉNOM ET NOM DU GÉRANT (OPTIONNEL)" : "PRÉNOM ET NOM DU RESPONSABLE (OPTIONNEL)"}
          </label>
          <p style={{ fontFamily: S.sans, fontSize: "0.7rem", color: S.muted, fontWeight: 300, marginTop: "0.25rem" }}>
            Optionnel — pour personnaliser vos échanges
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom"
            autoComplete="given-name"
            style={inputStyle}
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            autoComplete="family-name"
            style={inputStyle}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          backgroundColor: loading ? S.muted : S.terra,
          color: "#fff",
          border: "none",
          padding: "1.1rem",
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
        {loading ? "CRÉATION EN COURS..." : "CRÉER MON COMPTE GRATUIT"}
      </button>

      <p style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted, textAlign: "center", lineHeight: 1.6 }}>
        En créant un compte, vous acceptez nos{" "}
        <Link href="#" style={{ color: S.terra, textDecoration: "none" }}>Conditions d'utilisation</Link>{" "}
        et notre{" "}
        <Link href="#" style={{ color: S.terra, textDecoration: "none" }}>Politique de confidentialité</Link>.
      </p>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

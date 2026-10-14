"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DossierPage() {
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  async function generer() {
    setLoading(true);
    setErreur("");
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnecte-toi.");
      const evenementId = new URLSearchParams(window.location.search).get("evenement");
      const res = await fetch("/api/dossier-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ evenementId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur de génération");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dossier-candidature.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Mon dossier de candidature</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Génère en un clic un PDF complet à partir de ton profil : présentation, photos, informations techniques et
        documents réglementaires, prêt à envoyer à l&apos;organisateur.
      </p>
      <button
        onClick={generer}
        disabled={loading}
        style={{ background: "#e85d1a", color: "#fff", fontWeight: 700, padding: "14px 24px", borderRadius: 8, border: 0, cursor: "pointer" }}
      >
        {loading ? "GÉNÉRATION…" : "TÉLÉCHARGER MON DOSSIER PDF"}
      </button>
      {erreur && <p style={{ color: "#e11", marginTop: 16 }}>{erreur}</p>}
    </div>
  );
}

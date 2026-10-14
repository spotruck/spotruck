"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DossierButton({ evenementId, compact }: { evenementId?: string; compact?: boolean }) {
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
      const res = await fetch("/api/dossier-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ evenementId: evenementId || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur de génération du dossier");
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
    <div style={compact ? { order: 2 } : { marginBottom: "1.5rem" }}>
      <button
        type="button"
        onClick={generer}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          border: "1px solid #C4622D", color: "#C4622D", backgroundColor: "transparent",
          padding: "0.75rem 1.25rem", fontSize: compact ? "0.62rem" : "0.7rem", letterSpacing: compact ? "0.2em" : "0.15em", whiteSpace: "nowrap",
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
        }}
      >
        <FileText size={14} />
        {loading ? "GÉNÉRATION…" : compact ? "MON DOSSIER PDF" : "TÉLÉCHARGER MON DOSSIER POUR CETTE ANNONCE"}
      </button>
      {!compact && (
        <p style={{ fontSize: "0.7rem", color: "#8C7B6E", marginTop: "0.5rem" }}>
          Un PDF prêt à envoyer à l&apos;organisateur : présentation, photos, carte, informations techniques et documents.
        </p>
      )}
      {erreur && <p style={{ fontSize: "0.72rem", color: "#B3261E", marginTop: "0.5rem" }}>{erreur}</p>}
    </div>
  );
}

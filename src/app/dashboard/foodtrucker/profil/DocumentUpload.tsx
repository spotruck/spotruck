"use client";

import { useRef } from "react";
import { CheckCircle, XCircle, Upload, Eye, RefreshCw, AlertTriangle } from "lucide-react";

const S = {
  brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  sans: "'Inter', Helvetica, sans-serif",
};

const MAX_MB = 10;

interface DocDef {
  key: string;
  label: string;
  expiresAt?: Date;
}

// Ce qui est persisté en localStorage (sans data URL — trop lourd)
export interface DocMeta {
  name: string;
  size: number;
  uploadedAt: string; // ISO string
}

// État en mémoire d'un doc uploadé (data URL disponible seulement en session)
export interface UploadedDoc extends DocMeta {
  url: string; // "" si restauré depuis localStorage
}

export const DOC_DEFS: DocDef[] = [
  { key: "kbis",    label: "KBIS",                  expiresAt: new Date("2025-07-10") },
  { key: "haccp",   label: "HACCP",                 expiresAt: new Date("2025-12-01") },
  { key: "rc_pro",  label: "RC Pro" },
  { key: "gaz",     label: "Conformité gaz",        expiresAt: new Date("2025-06-20") },
  { key: "elec",    label: "Conformité électrique" },
  { key: "hygiene", label: "Contrôle hygiène",      expiresAt: new Date("2025-09-15") },
];

interface Props {
  docs: Record<string, UploadedDoc>;
  errors: Record<string, string>;
  onChange: (key: string, doc: UploadedDoc | null) => void;
  onError: (key: string, msg: string) => void;
  highlightKey?: string; // doc key à mettre en évidence (depuis URL ?doc=)
}

function fmtSize(bytes: number) {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} Mo` : `${Math.round(bytes / 1_024)} Ko`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function expiringSoon(d?: Date) {
  if (!d) return false;
  const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

function expired(d?: Date) {
  return d ? d.getTime() < Date.now() : false;
}

export default function DocumentUpload({ docs, errors, onChange, onError, highlightKey }: Props) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function handleFile(key: string, file: File | null) {
    if (!file) return;
    onError(key, "");
    if (file.type !== "application/pdf") { onError(key, "Format invalide — PDF uniquement."); return; }
    if (file.size > MAX_MB * 1024 * 1024) { onError(key, `Fichier trop lourd (max ${MAX_MB} Mo).`); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(key, {
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: ev.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ border: `1px solid ${S.border}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", padding: "0.75rem 1.5rem", borderBottom: `1px solid ${S.border}`, gap: "1rem" }}>
        {["DOCUMENT", "STATUT", "DÉPOSÉ LE — TAILLE", "ACTIONS"].map((h) => (
          <span key={h} style={{ fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em", color: S.muted }}>{h}</span>
        ))}
      </div>

      {/* Animation highlight pour le doc pointé par l'URL */}
      <style>{`
        @keyframes pulseHighlight {
          0%,100% { box-shadow: inset 0 0 0 2px #C4622D; }
          50%      { box-shadow: inset 0 0 0 2px transparent; }
        }
        .doc-highlight { animation: pulseHighlight 1s ease-in-out 3; }
      `}</style>

      {DOC_DEFS.map((doc, i) => {
        const uploaded  = docs[doc.key];
        const soon      = expiringSoon(doc.expiresAt);
        const exp       = expired(doc.expiresAt);
        const err       = errors[doc.key];
        const isHighlit = highlightKey === doc.key;

        return (
          <div key={doc.key}>
            <div
              className={isHighlit ? "doc-highlight" : undefined}
              style={{
                display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto",
                padding: "1.1rem 1.5rem", alignItems: "center", gap: "1rem",
                borderBottom: i < DOC_DEFS.length - 1 ? `1px solid ${S.border}` : "none",
                backgroundColor: isHighlit ? "rgba(196,98,45,0.06)" : "transparent",
                transition: "background-color 0.3s",
              }}>
              {/* Nom + badges expiration */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: S.sans, fontSize: "0.875rem", color: S.brown }}>{doc.label}</span>
                {soon && !exp && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", backgroundColor: "rgba(196,98,45,0.12)", color: S.terra, padding: "0.2rem 0.5rem", fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.15em", fontWeight: 600 }}>
                    <AlertTriangle size={10} strokeWidth={2} /> EXPIRE BIENTÔT
                  </span>
                )}
                {exp && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", backgroundColor: "rgba(192,57,43,0.1)", color: "#C0392B", padding: "0.2rem 0.5rem", fontFamily: S.sans, fontSize: "0.55rem", letterSpacing: "0.15em", fontWeight: 600 }}>
                    <AlertTriangle size={10} strokeWidth={2} /> EXPIRÉ
                  </span>
                )}
              </div>

              {/* Statut */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {uploaded
                  ? <><CheckCircle size={14} color="#2C7A4B" strokeWidth={2} /><span style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.12em", color: "#2C7A4B" }}>DÉPOSÉ</span></>
                  : <><XCircle size={14} color="#C0392B" strokeWidth={1.5} /><span style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.12em", color: "#C0392B" }}>MANQUANT</span></>
                }
              </div>

              {/* Méta */}
              <div>
                {uploaded ? (
                  <>
                    <p style={{ fontFamily: S.sans, fontSize: "0.72rem", color: S.brown, marginBottom: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{uploaded.name}</p>
                    <p style={{ fontFamily: S.sans, fontSize: "0.65rem", fontWeight: 300, color: S.muted }}>{fmtDate(uploaded.uploadedAt)} · {fmtSize(uploaded.size)}</p>
                  </>
                ) : (
                  <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted }}>—</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                {uploaded ? (
                  <>
                    {/* Voir — seulement si data URL disponible (session courante) */}
                    {uploaded.url && (
                      <a href={uploaded.url} target="_blank" rel="noreferrer" title="Voir" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: `1px solid ${S.border}`, color: S.muted, textDecoration: "none" }}>
                        <Eye size={13} strokeWidth={1.5} />
                      </a>
                    )}
                    <button onClick={() => inputRefs.current[doc.key]?.click()} style={{ display: "flex", alignItems: "center", gap: "0.3rem", border: `1px solid ${S.border}`, backgroundColor: "transparent", padding: "0.4rem 0.75rem", cursor: "pointer", fontFamily: S.sans, fontSize: "0.58rem", letterSpacing: "0.15em", color: S.muted }}>
                      <RefreshCw size={11} strokeWidth={1.5} /> REMPLACER
                    </button>
                  </>
                ) : (
                  <button onClick={() => inputRefs.current[doc.key]?.click()} style={{ display: "flex", alignItems: "center", gap: "0.35rem", backgroundColor: S.terra, color: "#fff", border: "none", padding: "0.5rem 0.875rem", cursor: "pointer", fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.15em" }}>
                    <Upload size={12} strokeWidth={1.5} /> DÉPOSER
                  </button>
                )}
              </div>
            </div>

            {err && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.5rem", backgroundColor: "rgba(192,57,43,0.06)", borderBottom: i < DOC_DEFS.length - 1 ? `1px solid ${S.border}` : "none" }}>
                <AlertTriangle size={12} color="#C0392B" strokeWidth={2} />
                <span style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "#C0392B" }}>{err}</span>
              </div>
            )}

            <input type="file" accept="application/pdf" style={{ display: "none" }}
              ref={(el) => { inputRefs.current[doc.key] = el; }}
              onChange={(e) => handleFile(doc.key, e.target.files?.[0] ?? null)}
            />
          </div>
        );
      })}
    </div>
  );
}

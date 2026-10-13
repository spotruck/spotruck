"use client";

import { useRef } from "react";
import { Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import type { MessageAttachment } from "@/lib/messages";

const MAX_FILES = 3;
const MAX_MB = 50;
const ACCEPT = ".pdf,.jpg,.jpeg,.png";
const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];

const sans = "'Inter', Helvetica, sans-serif";

// Pièces jointes affichées sous le texte d'un message
export function AttachmentList({ items, mine }: { items?: MessageAttachment[] | null; mine: boolean }) {
  const list = items ?? [];
  if (list.length === 0) return null;
  return (
    <div style={{ marginTop: "0.6rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      {list.map((f, i) => (
        <a key={i} href={f.url} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.65rem", borderRadius: 4, textDecoration: "none",
            backgroundColor: mine ? "rgba(255,255,255,0.15)" : "rgba(44,26,16,0.06)" }}>
          {f.type === "application/pdf"
            ? <FileText size={12} color={mine ? "#fff" : "#C0392B"} strokeWidth={1.5} />
            : <ImageIcon size={12} color={mine ? "#fff" : "#2E6DA4"} strokeWidth={1.5} />}
          <span style={{ fontFamily: sans, fontSize: "0.68rem", fontWeight: 500, color: mine ? "#fff" : "#2C1810", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nom}</span>
          <span style={{ fontFamily: sans, fontSize: "0.58rem", color: mine ? "rgba(255,255,255,0.7)" : "#8C7B6E" }}>↓</span>
        </a>
      ))}
    </div>
  );
}

// Bouton trombone + fichiers en attente d'envoi
export function AttachPicker({ pending, onChange }: { pending: File[]; onChange: (f: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const valid = picked.filter(f => ALLOWED.includes(f.type) && f.size <= MAX_MB * 1024 * 1024);
    if (valid.length < picked.length) {
      window.alert(`Seuls les PDF, JPG et PNG de ${MAX_MB} Mo maximum sont acceptés.`);
    }
    onChange([...pending, ...valid].slice(0, MAX_FILES));
    if (ref.current) ref.current.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "stretch", maxWidth: 150 }}>
      {pending.map((f, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.45rem", backgroundColor: "#EDE8DF", border: "1px solid #D4C9BC" }}>
          <span style={{ fontFamily: sans, fontSize: "0.6rem", color: "#2C1810", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
          <button onClick={() => onChange(pending.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
            <X size={11} color="#8C7B6E" />
          </button>
        </div>
      ))}
      {pending.length < MAX_FILES && (
        <>
          <input ref={ref} type="file" multiple accept={ACCEPT} onChange={pick} style={{ display: "none" }} />
          <button onClick={() => ref.current?.click()} title="Joindre un fichier (PDF, JPG, PNG, 50 Mo max, 3 fichiers)"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", background: "none", border: "1px dashed #D4C9BC", padding: "0.5rem", cursor: "pointer", color: "#8C7B6E", fontFamily: sans, fontSize: "0.6rem", letterSpacing: "0.1em" }}>
            <Paperclip size={13} strokeWidth={1.5} /> JOINDRE
          </button>
        </>
      )}
    </div>
  );
}

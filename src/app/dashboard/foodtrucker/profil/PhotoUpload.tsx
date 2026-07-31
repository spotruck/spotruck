"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const S = {
  cream: "#F2EDE4", brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  sans: "'Inter', Helvetica, sans-serif",
};

const MAX = 15;
const MAX_MB = 25;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export interface Photo { id: string; url: string; name: string; }

interface Props {
  userId: string;
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

export default function PhotoUpload({ userId, photos, onChange }: Props) {
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    const remaining = MAX - photos.length;
    const candidates = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      setError(`Seulement ${remaining} photo${remaining > 1 ? "s" : ""} ajoutée${remaining > 1 ? "s" : ""} (maximum ${MAX} atteint).`);
    }

    const valid = candidates.filter((file) => {
      if (!ACCEPT.includes(file.type)) {
        setError("Format non supporté. Utilisez JPG, PNG ou WEBP.");
        return false;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`"${file.name}" dépasse ${MAX_MB} Mo.`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    setUploading(true);
    (async () => {
      const supabase = createClient();
      const uploaded: Photo[] = [];
      for (const file of valid) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("spotruck-uploads").upload(path, file);
        if (uploadError) {
          setError(`Échec de l'envoi de "${file.name}".`);
          continue;
        }
        const { data: pub } = supabase.storage.from("spotruck-uploads").getPublicUrl(path);
        uploaded.push({ id: path, url: pub.publicUrl, name: file.name });
      }
      if (uploaded.length > 0) onChange([...photos, ...uploaded]);
      setUploading(false);
    })();
  }, [photos, userId, onChange]);

  const remove = (id: string) => onChange(photos.filter((ph) => ph.id !== id));
  const full = photos.length >= MAX;

  return (
    <div>
      {/* Grille photos existantes */}
      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
          {photos.map((ph) => (
            <div key={ph.id} style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ph.url}
                alt={ph.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Overlay au hover */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(44,24,16,0.5)",
                display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
                padding: "0.4rem",
              }}>
                <button
                  onClick={() => remove(ph.id)}
                  title="Supprimer"
                  style={{
                    background: "rgba(192,57,43,0.9)", border: "none", cursor: "pointer",
                    width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
              {/* Nom tronqué */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(44,24,16,0.65)", padding: "0.3rem 0.5rem",
              }}>
                <p style={{
                  fontFamily: S.sans, fontSize: "0.6rem", color: "#fff",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{ph.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone de dépôt */}
      <div
        onClick={() => !full && !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!full) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${full ? S.border : dragging ? S.terra : S.terra}`,
          backgroundColor: dragging ? "rgba(196,98,45,0.06)" : full ? S.card : "transparent",
          padding: "2.5rem",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "0.75rem", cursor: full || uploading ? "not-allowed" : "pointer",
          opacity: full ? 0.6 : 1,
          transition: "background-color 0.15s",
        }}
      >
        {uploading
          ? <Loader2 size={28} color={S.terra} strokeWidth={1.5} className="spin" />
          : <ImagePlus size={28} color={full ? S.muted : S.terra} strokeWidth={1.5} />
        }
        <div style={{ textAlign: "center" }}>
          {uploading ? (
            <p style={{ fontFamily: S.sans, fontSize: "0.75rem", letterSpacing: "0.1em", color: S.terra, fontWeight: 500 }}>
              ENVOI EN COURS…
            </p>
          ) : full ? (
            <p style={{ fontFamily: S.sans, fontSize: "0.75rem", letterSpacing: "0.1em", color: S.muted, fontWeight: 500 }}>
              MAXIMUM ATTEINT ({MAX}/{MAX})
            </p>
          ) : (
            <>
              <p style={{ fontFamily: S.sans, fontSize: "0.78rem", color: S.brown, marginBottom: "0.25rem" }}>
                Glissez vos photos ici ou <span style={{ color: S.terra, fontWeight: 500 }}>cliquez pour sélectionner</span>
              </p>
              <p style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.1em", color: S.muted }}>
                JPG · PNG · WEBP — MAX {MAX_MB} Mo PAR PHOTO
              </p>
            </>
          )}
        </div>
        {/* Compteur */}
        <span style={{
          fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em",
          color: photos.length === MAX ? "#C0392B" : S.muted,
          fontWeight: 500,
        }}>
          {photos.length}/{MAX} PHOTOS
        </span>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem",
          color: "#C0392B", fontFamily: S.sans, fontSize: "0.75rem",
          border: "1px solid rgba(192,57,43,0.3)", padding: "0.6rem 0.875rem",
        }}>
          <AlertCircle size={13} strokeWidth={2} />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(",")}
        multiple
        style={{ display: "none" }}
        onChange={(e) => { processFiles(e.target.files); e.target.value = ""; }}
      />
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

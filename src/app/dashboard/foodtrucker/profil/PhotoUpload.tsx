"use client";

import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, AlertCircle } from "lucide-react";

const S = {
  cream: "#F2EDE4", brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  sans: "'Inter', Helvetica, sans-serif",
};

const MAX = 15;
const MAX_MB = 25;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

interface Photo { id: string; url: string; name: string; }

export default function PhotoUpload() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    setError("");
    const remaining = MAX - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);

    toAdd.forEach((file) => {
      if (!ACCEPT.includes(file.type)) {
        setError("Format non supporté. Utilisez JPG, PNG ou WEBP.");
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`"${file.name}" dépasse ${MAX_MB} Mo.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos((prev) => {
          if (prev.length >= MAX) return prev;
          return [...prev, { id: `${Date.now()}-${Math.random()}`, url: e.target?.result as string, name: file.name }];
        });
      };
      reader.readAsDataURL(file);
    });

    if (files.length > remaining) {
      setError(`Seulement ${remaining} photo${remaining > 1 ? "s" : ""} ajoutée${remaining > 1 ? "s" : ""} (maximum ${MAX} atteint).`);
    }
  }, [photos.length]);

  const remove = (id: string) => setPhotos((p) => p.filter((ph) => ph.id !== id));
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
        onClick={() => !full && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!full) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${full ? S.border : dragging ? S.terra : S.terra}`,
          backgroundColor: dragging ? "rgba(196,98,45,0.06)" : full ? S.card : "transparent",
          padding: "2.5rem",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "0.75rem", cursor: full ? "not-allowed" : "pointer",
          opacity: full ? 0.6 : 1,
          transition: "background-color 0.15s",
        }}
      >
        <ImagePlus size={28} color={full ? S.muted : S.terra} strokeWidth={1.5} />
        <div style={{ textAlign: "center" }}>
          {full ? (
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
        onChange={(e) => processFiles(e.target.files)}
      />
    </div>
  );
}

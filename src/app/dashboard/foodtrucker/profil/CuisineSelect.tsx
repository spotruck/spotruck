"use client";

const S = {
  brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E", card: "#EDE8DF",
  sans: "'Inter', Helvetica, sans-serif",
};

export const CUISINE_OPTIONS = [
  "Burgers", "Tacos", "Pizza", "Asiatique", "BBQ",
  "Végétarien", "Desserts & Sucrés", "Fruits de mer",
  "Kebab", "Tex-Mex", "Français", "Italien", "Autre",
];

const MAX_SELECT = 5;

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export default function CuisineSelect({ value, onChange }: Props) {
  function toggle(c: string) {
    if (value.includes(c)) {
      onChange(value.filter((x) => x !== c));
    } else if (value.length < MAX_SELECT) {
      onChange([...value, c]);
    }
  }

  const atMax = value.length >= MAX_SELECT;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted }}>
          Cliquez pour sélectionner — maximum {MAX_SELECT} types
        </p>
        <span style={{
          fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em",
          color: atMax ? S.terra : S.muted, fontWeight: atMax ? 600 : 400,
          backgroundColor: atMax ? "rgba(196,98,45,0.1)" : S.card,
          padding: "0.25rem 0.6rem",
        }}>
          {value.length}/{MAX_SELECT} SÉLECTIONNÉS
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {CUISINE_OPTIONS.map((c) => {
          const active = value.includes(c);
          const disabled = !active && atMax;
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              disabled={disabled}
              style={{
                backgroundColor: active ? S.terra : "transparent",
                color: active ? "#fff" : disabled ? S.border : S.brown,
                border: `1px solid ${active ? S.terra : disabled ? S.border : S.border}`,
                padding: "0.45rem 1rem",
                fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.15em",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "background-color 0.15s, color 0.15s",
                userSelect: "none",
              }}
            >
              {c.toUpperCase()}
            </button>
          );
        })}
      </div>

      {value.length === 0 && (
        <p style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "#C0392B", marginTop: "0.75rem", fontWeight: 300 }}>
          Sélectionnez au moins un type de cuisine.
        </p>
      )}
    </div>
  );
}

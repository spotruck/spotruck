import Navbar from "@/components/layout/Navbar";
import { Truck, MapPin, Star, SlidersHorizontal, ArrowRight } from "lucide-react";

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

const trucks = [
  { id: 1, name: "Le Burger Breton", cuisine: "Burgers artisanaux", city: "Nantes", rating: 4.8, guests: "50–300", price: "Moyen" },
  { id: 2, name: "Tacos del Sol", cuisine: "Mexicain authentique", city: "Bordeaux", rating: 4.6, guests: "30–200", price: "Économique" },
  { id: 3, name: "Sushi Express", cuisine: "Japonais fusion", city: "Paris", rating: 4.9, guests: "20–150", price: "Premium" },
  { id: 4, name: "Pizza Napolitana", cuisine: "Italien traditionnel", city: "Lyon", rating: 4.7, guests: "40–250", price: "Moyen" },
  { id: 5, name: "L'Auvergnat", cuisine: "Terroir français", city: "Clermont-Ferrand", rating: 4.5, guests: "30–180", price: "Moyen" },
  { id: 6, name: "Curry Palace", cuisine: "Indien & épices", city: "Marseille", rating: 4.8, guests: "50–300", price: "Économique" },
];

export default function MarketplacePage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown }}>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ borderBottom: `1px solid ${S.border}`, padding: "0.75rem 2rem", display: "flex", gap: "2rem" }}>
        {["MARKETPLACE", "FRANCE", `${trucks.length} FOODTRUCKS`].map((t, i) => (
          <span
            key={t}
            style={{
              fontFamily: S.sans,
              fontSize: "0.62rem",
              letterSpacing: "0.2em",
              color: i === 0 ? S.terra : S.muted,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "calc(100vh - 120px)" }}>

        {/* Sidebar filtres */}
        <aside
          style={{
            borderRight: `1px solid ${S.border}`,
            padding: "2.5rem 2rem",
            position: "sticky",
            top: "72px",
            height: "calc(100vh - 72px)",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
            <SlidersHorizontal size={14} color={S.terra} strokeWidth={1.5} />
            <span style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.2em", color: S.terra }}>
              FILTRES
            </span>
          </div>

          {[
            {
              label: "LOCALISATION",
              input: <input
                type="text"
                placeholder="Ville ou région..."
                style={{
                  width: "100%",
                  border: `1px solid ${S.border}`,
                  backgroundColor: "transparent",
                  padding: "0.75rem",
                  fontFamily: S.sans,
                  fontSize: "0.85rem",
                  color: S.brown,
                  outline: "none",
                }}
              />,
            },
            {
              label: "TYPE DE CUISINE",
              input: <select
                style={{
                  width: "100%",
                  border: `1px solid ${S.border}`,
                  backgroundColor: "transparent",
                  padding: "0.75rem",
                  fontFamily: S.sans,
                  fontSize: "0.85rem",
                  color: S.brown,
                  outline: "none",
                  appearance: "none",
                }}
              >
                <option value="">Toutes</option>
                {["Burgers", "Mexicain", "Japonais", "Italien", "Indien", "Français"].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>,
            },
            {
              label: "BUDGET",
              input: <select
                style={{
                  width: "100%",
                  border: `1px solid ${S.border}`,
                  backgroundColor: "transparent",
                  padding: "0.75rem",
                  fontFamily: S.sans,
                  fontSize: "0.85rem",
                  color: S.brown,
                  outline: "none",
                  appearance: "none",
                }}
              >
                <option value="">Tous budgets</option>
                {["Économique", "Moyen", "Premium"].map(b => <option key={b}>{b}</option>)}
              </select>,
            },
          ].map((filter) => (
            <div key={filter.label} style={{ marginBottom: "1.75rem" }}>
              <label style={{
                fontFamily: S.sans,
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: S.muted,
                display: "block",
                marginBottom: "0.6rem",
              }}>
                {filter.label}
              </label>
              {filter.input}
            </div>
          ))}

          <button
            style={{
              width: "100%",
              backgroundColor: S.terra,
              color: "#fff",
              border: "none",
              padding: "0.875rem",
              fontFamily: S.sans,
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              fontWeight: 500,
              cursor: "pointer",
              marginTop: "0.5rem",
            }}
          >
            APPLIQUER
          </button>
        </aside>

        {/* Grille de trucks */}
        <div style={{ padding: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
            <div>
              <h1 style={{ fontFamily: S.serif, fontSize: "2rem", fontWeight: 800, lineHeight: 1.1 }}>
                Tous les foodtrucks
              </h1>
              <p style={{ fontFamily: S.sans, fontSize: "0.8rem", fontWeight: 300, color: S.muted, marginTop: "0.4rem" }}>
                {trucks.length} résultats
              </p>
            </div>
            <select
              style={{
                border: `1px solid ${S.border}`,
                backgroundColor: "transparent",
                padding: "0.6rem 1rem",
                fontFamily: S.sans,
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                color: S.muted,
                outline: "none",
                appearance: "none",
              }}
            >
              <option>TRIER : MIEUX NOTÉS</option>
              <option>TRIER : PRIX CROISSANT</option>
              <option>TRIER : RÉCENTS</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2px" }}>
            {trucks.map((truck) => (
              <div
                key={truck.id}
                style={{ backgroundColor: S.card, overflow: "hidden", cursor: "pointer" }}
              >
                {/* Photo placeholder */}
                <div
                  style={{
                    height: "160px",
                    backgroundColor: S.border,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Truck size={32} color={S.muted} strokeWidth={1} />
                </div>

                <div style={{ padding: "1.5rem" }}>
                  {/* Header card */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                    <h3 style={{ fontFamily: S.serif, fontSize: "1.1rem", fontWeight: 700, color: S.brown, lineHeight: 1.2 }}>
                      {truck.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, marginLeft: "0.5rem" }}>
                      <Star size={11} fill={S.terra} color={S.terra} strokeWidth={0} />
                      <span style={{ fontFamily: S.sans, fontSize: "0.75rem", fontWeight: 500, color: S.brown }}>
                        {truck.rating}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontFamily: S.sans, fontSize: "0.78rem", fontWeight: 300, color: S.muted, marginBottom: "0.75rem" }}>
                    {truck.cuisine}
                  </p>

                  <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <MapPin size={11} color={S.muted} strokeWidth={1.5} />
                      <span style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted }}>{truck.city}</span>
                    </div>
                    <span style={{ fontFamily: S.sans, fontSize: "0.65rem", letterSpacing: "0.1em", color: S.terra }}>{truck.price}</span>
                  </div>

                  <button
                    style={{
                      width: "100%",
                      backgroundColor: "transparent",
                      border: `1px solid ${S.brown}`,
                      color: S.brown,
                      padding: "0.7rem",
                      fontFamily: S.sans,
                      fontSize: "0.62rem",
                      letterSpacing: "0.2em",
                      fontWeight: 400,
                      cursor: "pointer",
                      marginTop: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    VOIR LE PROFIL <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

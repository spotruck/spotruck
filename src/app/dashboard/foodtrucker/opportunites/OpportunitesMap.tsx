"use client";
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export interface MapEvenement {
  id: number;
  titre: string;
  ville: string;
  date: string;
  budgetLabel: string;
  coords: [number, number] | null;
}
const pinIcon = L.divIcon({
  className: "spotruck-map-pin",
  html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.3 21.7 0 14 0z" fill="#C4622D"/>
    <circle cx="14" cy="14" r="5.5" fill="#fff"/>
  </svg>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -34],
});
const FRANCE_CENTER: [number, number] = [46.6, 2.4];
interface Props {
  evenements: MapEvenement[];
  onVoirDetail: (id: number) => void;
}
export default function OpportunitesMap({ evenements, onVoirDetail }: Props) {
  const withCoords = useMemo(() => evenements.filter((ev) => ev.coords), [evenements]);
  return (
    <MapContainer
      center={FRANCE_CENTER}
      zoom={6}
      scrollWheelZoom={true}
      style={{ height: "420px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((ev) => (
        <Marker key={ev.id} position={ev.coords as [number, number]} icon={pinIcon}>
          <Popup>
            <div style={{ fontFamily: "sans-serif", minWidth: 170 }}>
              <strong>{ev.titre}</strong><br />
              {ev.ville}<br />
              {ev.date}<br />
              {ev.budgetLabel}<br />
              <button
                onClick={() => onVoirDetail(ev.id)}
                style={{ marginTop: 8, cursor: "pointer", border: "none", backgroundColor: "#C4622D", color: "#fff", padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
              >
                Voir le détail
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

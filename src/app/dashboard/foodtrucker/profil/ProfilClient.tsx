"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import { Save, CheckCircle } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import CuisineSelect from "./CuisineSelect";
import DocumentUpload, { type UploadedDoc, type DocMeta } from "./DocumentUpload";
import { createClient } from "@/lib/supabase/client";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream: "#F2EDE4", brown: "#2C1810", terra: "#C4622D",
  border: "#D4C9BC", muted: "#8C7B6E",
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Inter', Helvetica, sans-serif",
};

// ─── Types ───────────────────────────────────────────────────
interface ProfilData {
  nom: string;
  prenom: string;
  nomGerant: string;
  ville: string;
  telephone: string;
  instagram: string;
  siteWeb: string;
  description: string;
  cuisines: string[];
  longueur: string;
  largeur: string;
  consommation: string;
  typePrise: string;
  amperage: string;
  alimentation: string;
  plan: string;
}

// ─── Helpers UI ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", border: `1px solid ${S.border}`, backgroundColor: "transparent",
  padding: "0.75rem 1rem", fontFamily: S.sans, fontSize: "0.875rem",
  color: S.brown, outline: "none",
};
const labelStyle: React.CSSProperties = {
  fontFamily: S.sans, fontSize: "0.6rem", letterSpacing: "0.2em",
  color: S.muted, display: "block", marginBottom: "0.5rem",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${S.border}` }}>
      <h2 style={{ fontFamily: S.serif, fontSize: "1.3rem", fontWeight: 700, color: S.brown }}>{title}</h2>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
      backgroundColor: "#2C7A4B", color: "#fff", zIndex: 3000,
      display: "flex", alignItems: "center", gap: "0.6rem",
      padding: "0.875rem 1.75rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      fontFamily: S.sans, fontSize: "0.78rem", letterSpacing: "0.08em",
      animation: "toastIn 0.25s ease",
    }}>
      <CheckCircle size={16} strokeWidth={2} /> Profil sauvegardé avec succès
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ─── Types userData ────────────────────────────────────────────
interface UserData {
  displayName: string;
  displaySubtitle: string;
  initials: string;
  planLabel: string;
}

// ─── Composant Inner ──────────────────────────────────────────
function ProfilClientInner({ initialData, userId, userData }: { initialData: ProfilData; userId: string; userData: UserData }) {
  const searchParams   = useSearchParams();
  const docsSectionRef = useRef<HTMLElement>(null);

  // États initialisés avec les données du serveur
  const [nom,          setNom]          = useState(initialData.nom);
  const [prenom,       setPrenom]       = useState(initialData.prenom);
  const [nomGerant,    setNomGerant]    = useState(initialData.nomGerant);
  const [ville,        setVille]        = useState(initialData.ville);
  const [telephone,    setTelephone]    = useState(initialData.telephone);
  const [instagram,    setInstagram]    = useState(initialData.instagram);
  const [siteWeb,      setSiteWeb]      = useState(initialData.siteWeb);
  const [description,  setDescription]  = useState(initialData.description);
  const [cuisines,     setCuisines]     = useState<string[]>(initialData.cuisines);
  const [longueur,     setLongueur]     = useState(initialData.longueur);
  const [largeur,      setLargeur]      = useState(initialData.largeur);
  const [consommation, setConsommation] = useState(initialData.consommation);
  const [typePrise,    setTypePrise]    = useState(initialData.typePrise);
  const [amperage,     setAmperage]     = useState(initialData.amperage);
  const [alimentation, setAlimentation] = useState(initialData.alimentation);

  // Documents
  const [docState, setDocState] = useState<Record<string, UploadedDoc>>({});
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});

  // ── Deep-link depuis les notifications (?doc=kbis) ──
  const highlightDoc = searchParams.get("doc") ?? "";
  useEffect(() => {
    if (!highlightDoc) return;
    const t = setTimeout(() => {
      docsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 400);
    return () => clearTimeout(t);
  }, [highlightDoc]);

  // État bouton + toast
  const [savedAnim, setSavedAnim] = useState(false);
  const [showToast,  setShowToast]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleDocChange = useCallback((key: string, doc: UploadedDoc | null) => {
    setDocState(prev => {
      const next = { ...prev };
      if (doc) next[key] = doc; else delete next[key];
      return next;
    });
  }, []);

  const handleDocError = useCallback((key: string, msg: string) => {
    setDocErrors(prev => ({ ...prev, [key]: msg }));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      // Mettre à jour les données dans Supabase
      const { error: updateError } = await supabase
        .from('foodtruckers')
        .update({
          nom_truck: nom,
          prenom_gerant: prenom || null,
          nom_gerant: nomGerant || null,
          ville: ville || null,
          telephone: telephone || null,
          instagram: instagram || null,
          site_web: siteWeb || null,
          description: description || null,
          cuisines: cuisines.length > 0 ? cuisines : null,
          longueur: longueur ? parseFloat(longueur) : null,
          largeur: largeur ? parseFloat(largeur) : null,
          consommation_electrique: consommation ? parseFloat(consommation) : null,
          type_prise: typePrise || null,
          amperage: amperage ? parseInt(amperage) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Feedback bouton
      setSavedAnim(true);
      setTimeout(() => setSavedAnim(false), 2000);

      // Toast
      setShowToast(true);
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh", backgroundColor: S.cream, color: S.brown,
      display: "grid", gridTemplateColumns: "260px 1fr",
    }}>
      <FoodtruckerSidebar active="/dashboard/foodtrucker/profil" userData={userData} />

      <div style={{ padding: "3rem", maxWidth: "860px" }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontFamily: S.sans, fontSize: "0.62rem", letterSpacing: "0.2em", color: S.muted, marginBottom: "0.5rem" }}>
            DASHBOARD — FOODTRUCKER
          </p>
          <h1 style={{ fontFamily: S.serif, fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.1 }}>Mon profil</h1>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            padding: '1rem',
            marginBottom: '2rem',
            fontFamily: S.sans,
            fontSize: '0.875rem',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

        {/* ── 1. Photos ── */}
        <section style={{ marginBottom: "3rem" }}>
          <SectionHeader title="Photos du truck" />
          <PhotoUpload />
        </section>

        {/* ── 2. Informations générales ── */}
        <section style={{ marginBottom: "3rem" }}>
          <SectionHeader title="Informations générales" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>NOM DU TRUCK</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>PRÉNOM DU GÉRANT</label>
              <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} style={inputStyle} placeholder="Optionnel" />
            </div>
            <div>
              <label style={labelStyle}>NOM DU GÉRANT</label>
              <input type="text" value={nomGerant} onChange={e => setNomGerant(e.target.value)} style={inputStyle} placeholder="Optionnel" />
            </div>
            <div>
              <label style={labelStyle}>VILLE DE BASE</label>
              <input type="text" value={ville} onChange={e => setVille(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>TÉLÉPHONE</label>
              <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>INSTAGRAM</label>
              <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} style={inputStyle} placeholder="@votre_compte" />
            </div>
            <div>
              <label style={labelStyle}>SITE WEB</label>
              <input type="url" value={siteWeb} onChange={e => setSiteWeb(e.target.value)} style={inputStyle} placeholder="https://" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>DESCRIPTION</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Décrivez votre foodtruck, votre cuisine, vos spécialités..."
              />
            </div>
          </div>
        </section>

        {/* ── 3. Type de cuisine ── */}
        <section style={{ marginBottom: "3rem" }}>
          <SectionHeader title="Type de cuisine" />
          <CuisineSelect value={cuisines} onChange={setCuisines} />
        </section>

        {/* ── 4. Infos techniques ── */}
        <section style={{ marginBottom: "3rem" }}>
          <SectionHeader title="Informations techniques" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
            {([
              { label: "LONGUEUR (M)",            val: longueur,     set: setLongueur },
              { label: "LARGEUR (M)",             val: largeur,      set: setLargeur },
              { label: "CONSOMMATION ÉLEC. (KW)", val: consommation, set: setConsommation },
              { label: "TYPE DE PRISE",           val: typePrise,    set: setTypePrise },
              { label: "AMPÉRAGE (A)",            val: amperage,     set: setAmperage },
              { label: "ALIMENTATION GAZ",        val: alimentation, set: setAlimentation },
            ] as { label: string; val: string; set: (v: string) => void }[]).map((f) => (
              <div key={f.label}>
                <label style={labelStyle}>{f.label}</label>
                <input type="text" value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} />
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. Documents réglementaires ── */}
        <section ref={docsSectionRef} id="section-documents" style={{ marginBottom: "3rem" }}>
          <SectionHeader title="Documents réglementaires" />
          <p style={{ fontFamily: S.sans, fontSize: "0.72rem", fontWeight: 300, color: S.muted, marginBottom: "1.25rem", lineHeight: 1.6 }}>
            PDF uniquement — max 10 Mo par document. Les documents expirant dans moins de 30 jours sont signalés.
          </p>
          <DocumentUpload
            docs={docState}
            errors={docErrors}
            onChange={handleDocChange}
            onError={handleDocError}
            highlightKey={highlightDoc}
          />
        </section>

        {/* ── Sauvegarder ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "1rem", borderTop: `1px solid ${S.border}` }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: savedAnim ? "#2C7A4B" : S.terra,
              color: "#fff", border: "none",
              padding: "1rem 2.5rem", fontFamily: S.sans, fontSize: "0.7rem",
              letterSpacing: "0.2em", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "0.5rem",
              transition: "background-color 0.2s",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving
              ? <>SAUVEGARDE...</>
              : savedAnim
                ? <><CheckCircle size={14} strokeWidth={2} /> SAUVEGARDÉ ✓</>
                : <><Save size={14} /> SAUVEGARDER</>
            }
          </button>
        </div>
      </div>

      {showToast && <Toast onDone={() => setShowToast(false)} />}
    </main>
  );
}

export default function ProfilClient({ initialData, userId, userData }: { initialData: ProfilData; userId: string; userData: UserData }) {
  return <Suspense><ProfilClientInner initialData={initialData} userId={userId} userData={userData} /></Suspense>;
}

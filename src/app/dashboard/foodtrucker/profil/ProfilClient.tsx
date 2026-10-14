"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import { Save, CheckCircle } from "lucide-react";
import PhotoUpload, { type Photo } from "./PhotoUpload";
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
  photos: Photo[];
  documents: Record<string, UploadedDoc>;
  logoUrl: string;
  couleurPrincipale: string;
  couleurSecondaire: string;
  carteUrl: string;
  carteNom: string;
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

  // Photos
  const [photos, setPhotos] = useState<Photo[]>(initialData.photos);

  // Identité visuelle (logo + couleurs, utilisés dans le dossier PDF)
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl);
  const [couleurPrincipale, setCouleurPrincipale] = useState(initialData.couleurPrincipale);
  const [couleurSecondaire, setCouleurSecondaire] = useState(initialData.couleurSecondaire);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  // Carte / menu (PDF ou image, ajoutée au dossier PDF)
  const [carteUrl, setCarteUrl] = useState(initialData.carteUrl);
  const [carteNom, setCarteNom] = useState(initialData.carteNom);
  const [carteUploading, setCarteUploading] = useState(false);
  const [carteError, setCarteError] = useState("");

  async function handleCarte(file: File | null) {
    if (!file) return;
    setCarteError("");
    if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type)) { setCarteError("Format invalide — PDF, PNG ou JPG."); return; }
    if (file.size > 10 * 1024 * 1024) { setCarteError("Fichier trop lourd (max 10 Mo)."); return; }
    setCarteUploading(true);
    const supabase = createClient();
    const safe = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
    const path = `${userId}/carte/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from("spotruck-uploads").upload(path, file);
    setCarteUploading(false);
    if (upErr) { console.error("[carte] Échec upload:", upErr.message); setCarteError("Échec de l'envoi de la carte."); return; }
    const { data: pub } = supabase.storage.from("spotruck-uploads").getPublicUrl(path);
    setCarteUrl(pub.publicUrl);
    setCarteNom(file.name);
  }
  const logoBtn: React.CSSProperties = {
    border: `1px solid ${S.border}`, backgroundColor: "transparent", color: S.brown,
    padding: "0.5rem 1rem", fontFamily: S.sans, fontSize: "0.65rem",
    letterSpacing: "0.15em", cursor: "pointer",
  };

  type Rgb = { r: number; g: number; b: number };
  async function detectColors(src: Blob | string) {
    let objUrl = "";
    try {
      const url = typeof src === "string" ? src : (objUrl = URL.createObjectURL(src));
      const img = new Image();
      if (typeof src === "string") img.crossOrigin = "anonymous";
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("img")); img.src = url; });
      const N = 64;
      const c = document.createElement("canvas");
      c.width = N; c.height = N;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const sc = Math.min(N / img.width, N / img.height);
      ctx.drawImage(img, 0, 0, img.width * sc, img.height * sc);
      const { data } = ctx.getImageData(0, 0, N, N);
      const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (Math.min(r, g, b) > 235) continue;
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
        e.n++; e.r += r; e.g += g; e.b += b;
        buckets.set(key, e);
      }
      const list = Array.from(buckets.values()).map((e) => {
        const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const sat = mx === 0 ? 0 : (mx - mn) / mx;
        return { r, g, b, score: e.n * (0.25 + sat) };
      }).sort((x, y) => y.score - x.score);
      if (!list.length) return;
      const hex = (c: Rgb) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
      const dist = (p: Rgb, q: Rgb) => Math.hypot(p.r - q.r, p.g - q.g, p.b - q.b);
      const first = list[0];
      const second = list.find((c) => dist(c, first) > 90);
      setCouleurPrincipale(hex(first));
      if (second) setCouleurSecondaire(hex(second));
    } catch {
      setLogoError("Couleurs non détectées automatiquement — choisis-les à la main.");
    } finally {
      if (objUrl) URL.revokeObjectURL(objUrl);
    }
  }

  async function handleLogo(file: File | null) {
    if (!file) return;
    setLogoError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setLogoError("Format invalide — PNG, JPG ou WebP."); return; }
    if (file.size > 5 * 1024 * 1024) { setLogoError("Fichier trop lourd (max 5 Mo)."); return; }
    setLogoUploading(true);
    const supabase = createClient();
    const safe = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
    const path = `${userId}/logo/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from("spotruck-uploads").upload(path, file);
    setLogoUploading(false);
    if (upErr) { console.error("[logo] Échec upload:", upErr.message); setLogoError("Échec de l'envoi du logo."); return; }
    const { data: pub } = supabase.storage.from("spotruck-uploads").getPublicUrl(path);
    setLogoUrl(pub.publicUrl);
    detectColors(file);
  }

  // Documents
  const [docState, setDocState] = useState<Record<string, UploadedDoc>>(initialData.documents);
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
      const { data: updated, error: updateError } = await supabase
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
          photo_truck_url: photos[0]?.url ?? null,
          photos_plats: photos.slice(1).map(p => p.url),
          documents: docState,
          logo_url: logoUrl || null,
          couleur_principale: couleurPrincipale,
          couleur_secondaire: couleurSecondaire,
          carte_url: carteUrl || null,
          carte_nom: carteNom || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('id')
        .single();

      if (updateError) {
        throw updateError;
      }
      if (!updated) {
        throw new Error('Votre session a peut-être expiré : le profil n\'a pas été mis à jour. Reconnectez-vous et réessayez.');
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

        {/* ── 0. Identité visuelle ── */}
        <section style={{ marginBottom: "3rem" }}>
          <SectionHeader title="Identité visuelle" />
          <p style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.muted, marginBottom: "1.25rem" }}>
            Ton logo et tes couleurs apparaissent sur la couverture de ton dossier de candidature PDF.
          </p>
          <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <span style={labelStyle}>LOGO</span>
              <div style={{ width: 160, height: 160, border: `1px dashed ${S.border}`, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
                {logoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={logoUrl} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  : <span style={{ fontFamily: S.sans, fontSize: "0.7rem", color: S.muted }}>Aucun logo</span>}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                <label style={logoBtn}>
                  {logoUploading ? "ENVOI…" : logoUrl ? "CHANGER" : "AJOUTER"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }}
                    onChange={(e) => { handleLogo(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                </label>
                {logoUrl && <button type="button" style={logoBtn} onClick={() => setLogoUrl("")}>RETIRER</button>}
                {logoUrl && <button type="button" style={logoBtn} onClick={() => detectColors(logoUrl)}>DÉTECTER LES COULEURS</button>}
              </div>
              {logoError && <p style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "#B3261E", marginTop: "0.5rem" }}>{logoError}</p>}
            </div>
            <div>
              <span style={labelStyle}>COULEUR PRINCIPALE</span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.25rem" }}>
                <input type="color" value={couleurPrincipale} onChange={(e) => setCouleurPrincipale(e.target.value)} style={{ width: 48, height: 40, border: "none", background: "none", cursor: "pointer" }} />
                <input type="text" value={couleurPrincipale} onChange={(e) => setCouleurPrincipale(e.target.value)} style={{ ...inputStyle, width: 110 }} />
              </div>
              <span style={labelStyle}>COULEUR SECONDAIRE</span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input type="color" value={couleurSecondaire} onChange={(e) => setCouleurSecondaire(e.target.value)} style={{ width: 48, height: 40, border: "none", background: "none", cursor: "pointer" }} />
                <input type="text" value={couleurSecondaire} onChange={(e) => setCouleurSecondaire(e.target.value)} style={{ ...inputStyle, width: 110 }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Carte / menu ── */}
        <section style={{ marginBottom: "3rem" }}>
          <SectionHeader title="Notre carte" />
          <p style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.muted, marginBottom: "1.25rem" }}>
            Ta carte (PDF ou photo) est ajoutée à ton dossier de candidature PDF.
          </p>
          <div style={{ marginBottom: "0.75rem" }}>
            {carteUrl
              ? <a href={carteUrl} target="_blank" rel="noreferrer" style={{ fontFamily: S.sans, fontSize: "0.85rem", color: S.terra }}>{carteNom || "Voir la carte"} ↗</a>
              : <span style={{ fontFamily: S.sans, fontSize: "0.8rem", color: S.muted }}>Aucune carte ajoutée</span>}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <label style={logoBtn}>
              {carteUploading ? "ENVOI…" : carteUrl ? "CHANGER" : "AJOUTER LA CARTE"}
              <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" style={{ display: "none" }}
                onChange={(e) => { handleCarte(e.target.files?.[0] ?? null); e.target.value = ""; }} />
            </label>
            {carteUrl && <button type="button" style={logoBtn} onClick={() => { setCarteUrl(""); setCarteNom(""); }}>RETIRER</button>}
          </div>
          {carteError && <p style={{ fontFamily: S.sans, fontSize: "0.72rem", color: "#B3261E", marginTop: "0.5rem" }}>{carteError}</p>}
        </section>

        {/* ── 1. Photos ── */}
        <section style={{ marginBottom: "3rem" }}>
          <SectionHeader title="Photos du truck" />
          <PhotoUpload userId={userId} photos={photos} onChange={setPhotos} />
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
            {" "}Pensez à cliquer sur <strong>Sauvegarder</strong> pour enregistrer vos documents.
          </p>
          <DocumentUpload
            userId={userId}
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

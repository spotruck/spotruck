import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkPdfQuota, logPdf } from "@/lib/billing/gating";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage } from "pdf-lib";

export const runtime = "nodejs";
export const maxDuration = 60;

const W = 595;
const H = 842;
const M = 48;
const DEFAULT_ACCENT = rgb(0.91, 0.36, 0.1);
function hexToRgb(h: unknown) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
const DARK = rgb(0.1, 0.1, 0.12);
const GREY = rgb(0.45, 0.45, 0.5);

function s(t: unknown): string {
  return String(t ?? "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF€Œœ]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of s(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(test, size) > maxW && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

function label(type: string): string {
  const t = (type || "document").replace(/[_-]+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch {
    return null;
  }
}

async function toEmbeddable(b: Uint8Array): Promise<{ bytes: Uint8Array; kind: "jpg" | "png" } | null> {
  if (b[0] === 0xff && b[1] === 0xd8) return { bytes: b, kind: "jpg" };
  if (b[0] === 0x89 && b[1] === 0x50) return { bytes: b, kind: "png" };
  try {
    const name = "sharp";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(/* webpackIgnore: true */ name);
    const sharp = mod.default || mod;
    const out = await sharp(Buffer.from(b)).jpeg({ quality: 85 }).toBuffer();
    return { bytes: new Uint8Array(out), kind: "jpg" };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  let evenementId: string | null = null;
  try {
    const body = await req.json();
    evenementId = body?.evenementId || null;
  } catch {}

  const { data: ft } = await sb.from("foodtruckers").select("*").eq("id", u.user.id).maybeSingle();
  if (!ft) return NextResponse.json({ error: "Profil foodtrucker introuvable" }, { status: 404 });

  const quota = await checkPdfQuota(ft);
  if (!quota.ok) return NextResponse.json({ error: quota.message, code: "limite_plan" }, { status: 402 });

  type Doc = { type: string; url: string; name?: string; date_expiration?: string | null };
  const docList: Doc[] = [];
  const jd = ft.documents;
  if (jd && typeof jd === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const [k, v] of Object.entries(jd as Record<string, any>)) {
      if (v && typeof v === "object" && v.url) docList.push({ type: k, url: v.url, name: v.name, date_expiration: v.expiration || v.date_expiration || null });
    }
  }
  if (!docList.length) {
    const { data: docs } = await sb.from("documents").select("*").eq("foodtrucker_id", ft.id).order("created_at");
    for (const d of docs || []) if (d.url) docList.push({ type: d.type, url: d.url, name: d.nom_fichier, date_expiration: d.date_expiration });
  }

  let ev: { titre?: string; ville?: string; date_debut?: string } | null = null;
  if (evenementId) {
    const { data } = await sb.from("evenements").select("titre, ville, date_debut").eq("id", evenementId).maybeSingle();
    ev = data;
  }

  const ACCENT = hexToRgb(ft.couleur_principale) ?? DEFAULT_ACCENT;
  const SECOND = hexToRgb(ft.couleur_secondaire) ?? DARK;

  const pdf = await PDFDocument.create();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let logo: PDFImage | null = null;
  if (ft.logo_url) {
    const lb = await fetchBytes(ft.logo_url);
    const le = lb ? await toEmbeddable(lb) : null;
    if (le) logo = le.kind === "jpg" ? await pdf.embedJpg(le.bytes) : await pdf.embedPng(le.bytes);
  }
  const drawLogo = (p: PDFPage, x: number, y: number, maxW: number, maxH: number) => {
    if (!logo) return;
    const sc = Math.min(maxW / logo.width, maxH / logo.height);
    p.drawImage(logo, { x, y, width: logo.width * sc, height: logo.height * sc });
  };

  const newPage = (title: string) => {
    const p = pdf.addPage([W, H]);
    drawLogo(p, W - M - 50, H - 62, 50, 40);
    p.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: ACCENT });
    p.drawText(s(title).toUpperCase(), { x: M, y: H - 60, size: 18, font: bold, color: DARK });
    p.drawRectangle({ x: M, y: H - 70, width: 40, height: 3, color: ACCENT });
    p.drawText(s(ft.nom_truck), { x: M, y: 28, size: 8, font: reg, color: GREY });
    return p;
  };

  const para = (p: PDFPage, text: string, x: number, y: number, size: number, maxW: number, font = reg, color = DARK) => {
    for (const l of wrap(text, font, size, maxW)) {
      p.drawText(l, { x, y, size, font, color });
      y -= size + 4;
    }
    return y;
  };

  // --- Couverture : fond blanc, logo + "Dossier de candidature"
  const c = pdf.addPage([W, H]);
  const centered = (page: PDFPage, text: string, yy: number, size: number, font: PDFFont, color = DARK) => {
    const t = s(text);
    page.drawText(t, { x: (W - font.widthOfTextAtSize(t, size)) / 2, y: yy, size, font, color });
  };
  let y = H - 110;
  if (logo) {
    const sc = Math.min(320 / logo.width, 280 / logo.height);
    const lw = logo.width * sc;
    const lh = logo.height * sc;
    c.drawImage(logo, { x: (W - lw) / 2, y: y - lh, width: lw, height: lh });
    y = y - lh - 70;
  } else {
    for (const l of wrap(ft.nom_truck || "Foodtruck", bold, 36, W - 2 * M)) {
      centered(c, l, y - 36, 36, bold, ACCENT);
      y -= 44;
    }
    y -= 40;
  }
  centered(c, "DOSSIER DE CANDIDATURE", y, 22, bold, DARK);
  c.drawRectangle({ x: (W - 60) / 2, y: y - 14, width: 60, height: 3, color: ACCENT });
  y -= 60;
  if (ev?.titre) {
    centered(c, "Candidature pour", y, 10, reg, GREY);
    y -= 22;
    for (const l of wrap(ev.titre, bold, 16, W - 2 * M)) {
      centered(c, l, y, 16, bold, DARK);
      y -= 22;
    }
    const meta = [ev.ville, ev.date_debut ? new Date(ev.date_debut).toLocaleDateString("fr-FR") : ""].filter(Boolean).join(" - ");
    if (meta) centered(c, meta, y - 2, 11, reg, GREY);
  }
  const contact = [
    [ft.prenom_gerant, ft.nom_gerant].filter(Boolean).join(" "),
    ft.telephone,
    u.user.email,
    ft.site_web,
    ft.instagram ? "Instagram : " + ft.instagram : "",
    ft.ville,
  ].filter(Boolean);
  let cy = 60 + contact.length * 16;
  for (const l of contact) {
    centered(c, String(l), cy, 10, reg, DARK);
    cy -= 16;
  }
  centered(c, "Dossier genere via Spotruck", 28, 8, reg, GREY);

  // --- Presentation
  const p1 = newPage("Presentation");
  y = H - 100;
  const cuisines: string[] = Array.isArray(ft.cuisines) ? ft.cuisines : [];
  if (cuisines.length) {
    p1.drawText("TYPE DE CUISINE", { x: M, y, size: 9, font: bold, color: ACCENT });
    y -= 16;
    y = para(p1, cuisines.join("  -  "), M, y, 12, W - 2 * M, bold) - 12;
  }
  if (ft.ville) {
    p1.drawText("BASE", { x: M, y, size: 9, font: bold, color: ACCENT });
    y -= 16;
    y = para(p1, ft.ville, M, y, 12, W - 2 * M) - 12;
  }
  p1.drawText("NOTRE HISTOIRE", { x: M, y, size: 9, font: bold, color: ACCENT });
  y -= 16;
  y = para(p1, ft.description || "Description non renseignee.", M, y, 11, W - 2 * M);
  if (ft.note_moyenne && ft.nombre_avis) {
    y -= 14;
    para(p1, `Note moyenne ${Number(ft.note_moyenne).toFixed(1)}/5 sur ${ft.nombre_avis} avis Spotruck`, M, y, 11, W - 2 * M, bold, ACCENT);
  }

  // --- Technique
  const p2 = newPage("Informations techniques");
  y = H - 110;
  const rows: [string, string][] = [
    ["Dimensions du stand", ft.longueur && ft.largeur ? `${ft.longueur} m x ${ft.largeur} m` : "Non renseigne"],
    ["Surface au sol", ft.longueur && ft.largeur ? `${(Number(ft.longueur) * Number(ft.largeur)).toFixed(1)} m2` : "Non renseigne"],
    ["Consommation electrique", ft.consommation_electrique != null ? `${ft.consommation_electrique} kW` : "Non renseigne"],
    ["Type de prise", ft.type_prise || "Non renseigne"],
    ["Amperage", ft.amperage ? `${ft.amperage} A` : "Non renseigne"],
    ["Autonomie sans electricite", ft.autonomie_sans_elec ? "Oui (groupe / batterie)" : "Non"],
  ];
  for (const [k, v] of rows) {
    p2.drawRectangle({ x: M, y: y - 8, width: W - 2 * M, height: 30, color: rgb(0.96, 0.96, 0.97) });
    p2.drawText(s(k), { x: M + 10, y: y + 2, size: 10, font: bold, color: GREY });
    p2.drawText(s(v), { x: M + 230, y: y + 2, size: 12, font: bold, color: DARK });
    y -= 38;
  }

  // --- Photos (une par page)
  const photos: string[] = [ft.photo_truck_url, ...(Array.isArray(ft.photos_plats) ? ft.photos_plats : [])].filter(Boolean);
  let numPhoto = 0;
  for (const url of photos) {
    const raw = await fetchBytes(url);
    const em = raw ? await toEmbeddable(raw) : null;
    if (!em) continue;
    const img = em.kind === "jpg" ? await pdf.embedJpg(em.bytes) : await pdf.embedPng(em.bytes);
    numPhoto++;
    const page = newPage(numPhoto === 1 ? "Notre truck" : "Nos plats");
    const boxW = W - 2 * M;
    const boxH = H - 95 - 60;
    const sc = Math.min(boxW / img.width, boxH / img.height);
    const w = img.width * sc;
    const h = img.height * sc;
    page.drawImage(img, { x: M + (boxW - w) / 2, y: H - 95 - h, width: w, height: h });
  }

  // --- Carte / menu
  if (ft.carte_url) {
    try {
      const raw = await fetchBytes(ft.carte_url);
      if (!raw) console.error("[dossier-pdf] carte introuvable", ft.carte_url);
      else if (raw[0] === 0x25 && raw[1] === 0x50) {
        const src = await PDFDocument.load(raw, { ignoreEncryption: true });
        const pages = await pdf.copyPages(src, src.getPageIndices());
        pages.forEach((pg) => pdf.addPage(pg));
      } else {
        const em = await toEmbeddable(raw);
        if (em) {
          const img = em.kind === "jpg" ? await pdf.embedJpg(em.bytes) : await pdf.embedPng(em.bytes);
          const page = newPage("Notre carte");
          const boxW = W - 2 * M;
          const boxH = H - 95 - 60;
          const sc = Math.min(boxW / img.width, boxH / img.height);
          page.drawImage(img, { x: M + (boxW - img.width * sc) / 2, y: H - 95 - img.height * sc, width: img.width * sc, height: img.height * sc });
        }
      }
    } catch (e) {
      console.error("[dossier-pdf] carte", e);
    }
  }

  // --- Documents
  const dl = docList;
  const p3 = newPage("Documents reglementaires");
  const statut: { d: Doc; ok: boolean; why: string }[] = [];
  for (const d of dl) {
    let ok = false;
    let why = "";
    try {
      if (!d.url) why = "lien manquant";
      else {
        const raw = await fetchBytes(d.url);
        if (!raw) why = "fichier introuvable";
        else if (raw[0] === 0x25 && raw[1] === 0x50) {
          const src = await PDFDocument.load(raw, { ignoreEncryption: true });
          const pages = await pdf.copyPages(src, src.getPageIndices());
          pages.forEach((pg) => pdf.addPage(pg));
          ok = true;
        } else {
          const em = await toEmbeddable(raw);
          if (!em) why = "format non lisible";
          else {
            const img = em.kind === "jpg" ? await pdf.embedJpg(em.bytes) : await pdf.embedPng(em.bytes);
            const pg = pdf.addPage([W, H]);
            const sc = Math.min((W - 2 * M) / img.width, (H - 2 * M) / img.height);
            pg.drawImage(img, { x: M, y: H - M - img.height * sc, width: img.width * sc, height: img.height * sc });
            ok = true;
          }
        }
      }
    } catch (e) {
      why = "erreur de lecture";
      console.error("[dossier-pdf] document", d.type, e);
    }
    if (!ok) console.error("[dossier-pdf] document non joint:", d.type, why, d.url);
    statut.push({ d, ok, why });
  }
  y = H - 110;
  if (!dl.length) para(p3, "Aucun document n'a ete depose dans le profil.", M, y, 11, W - 2 * M);
  for (const { d, ok, why } of statut) {
    const exp = d.date_expiration ? `valable jusqu'au ${new Date(d.date_expiration).toLocaleDateString("fr-FR")}` : "";
    p3.drawText(s(label(d.type)), { x: M, y, size: 12, font: bold, color: DARK });
    if (exp) p3.drawText(s(exp), { x: M + 200, y, size: 9, font: reg, color: GREY });
    p3.drawText(ok ? "joint" : s("NON JOINT - " + why), { x: W - M - 150, y, size: 10, font: bold, color: ok ? rgb(0.1, 0.55, 0.25) : rgb(0.8, 0.1, 0.1) });
    y -= 20;
    if (y < 80) break;
  }

  const out = await pdf.save();
  const fname = `dossier-${s(ft.nom_truck).toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  await logPdf(ft.id, evenementId);
  return new NextResponse(Buffer.from(out), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${fname}"` },
  });
}

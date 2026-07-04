// ─── Paliers annulation par défaut ────────────────────────────
export const DEFAULT_PALIERS = [
  { delai:"> 15 jours", remboursement:100 },
  { delai:"7 à 15 jours", remboursement:50 },
  { delai:"< 7 jours", remboursement:0 },
];

// ─── Obligations par défaut ───────────────────────────────────
export const OBL_FT_DEFAULT = [
  { label:"Arriver avant l'ouverture", checked:true, heures:"2" },
  { label:"Respecter les normes d'hygiène en vigueur", checked:true, heures:"" },
  { label:"Assurer la propreté de son emplacement", checked:true, heures:"" },
  { label:"Rester jusqu'à la fin de l'événement", checked:true, heures:"" },
  { label:"Porter une tenue aux couleurs de l'événement", checked:false, heures:"" },
];
export const OBL_ORG_DEFAULT = [
  { label:"Fournir l'emplacement convenu", checked:true },
  { label:"Assurer l'accès électrique (si applicable)", checked:true },
  { label:"Informer le truck des règles du site", checked:true },
  { label:"Payer dans les délais convenus", checked:true },
];

function fmtDateFR(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export interface ContratPDFData {
  organisateurNom: string;
  siretOrga: string;
  adresseOrga: string;
  titre: string;
  typeEvt: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  heureDebut: string;
  heureFin: string;
  lieu: string;
  visiteurs: string;
  nbTrucks: number;
  truckDetails: string[];
  surface: string;
  elec: boolean;
  typeElec: string;
  amperage: string;
  acces: boolean;
  modeleLabel: string;
  modeleMontant: string;
  acompte: number;
  soldeDate: string;
  precisions: string;
  docs: string[];
  noteMin: number;
  exclu: boolean;
  excluType: string;
  dateLimite: string;
  modeCandidature: string;
  oblFt: { label: string; checked: boolean; heures: string }[];
  autreOblFt: string;
  oblOrg: { label: string; checked: boolean }[];
  autreOblOrg: string;
  paliers: { delai: string; remboursement: number }[];
}

// ─── Génération du contrat PDF (modèle inspiré du cahier des charges
//     des Fêtes de Bayonne — convention d'occupation pour foodtrucks) ──
export async function genererContratPDF(d: ContratPDFData) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const marginX = 15;
  const pageW = 210;
  const contentW = pageW - marginX * 2;
  const pageBottom = 280;
  let y = 20;

  const setBrown = () => doc.setTextColor(44, 24, 16);
  const setMuted = () => doc.setTextColor(100, 90, 80);
  const setTerra = () => doc.setTextColor(196, 98, 43);

  const checkBreak = (need: number) => {
    if (y + need > pageBottom) {
      doc.addPage();
      y = 20;
    }
  };

  const h1 = (title: string) => {
    checkBreak(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setBrown();
    doc.text(title, marginX, y);
    y += 3;
    doc.setDrawColor(212, 201, 188);
    doc.line(marginX, y, pageW - marginX, y);
    y += 7;
  };

  const h2 = (title: string) => {
    checkBreak(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setTerra();
    doc.text(title, marginX, y);
    y += 5.5;
  };

  const paragraph = (text: string, opts?: { bold?: boolean; size?: number }) => {
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(opts?.size ?? 9.5);
    setMuted();
    const lines = doc.splitTextToSize(text, contentW);
    lines.forEach((line: string) => {
      checkBreak(6);
      doc.text(line, marginX, y);
      y += 5.5;
    });
    y += 2;
  };

  const bullet = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setMuted();
    const lines = doc.splitTextToSize(text, contentW - 6);
    checkBreak(lines.length * 5.5);
    doc.text("•", marginX, y);
    doc.text(lines, marginX + 5, y);
    y += lines.length * 5.5 + 1;
  };

  const ref = `CT-${(d.titre || "EVT").replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase()}-${d.dateDebut.replace(/-/g, "") || "XXXX"}`;

  // ── En-tête ──
  doc.setFillColor(44, 24, 16);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("SPOTRUCK", marginX, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTerra();
  doc.text("MARKETPLACE FOODTRUCK & ÉVÉNEMENTS", marginX, 25);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("CONTRAT DE PRESTATION", pageW - marginX, 17, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Réf. ${ref}`, pageW - marginX, 24, { align: "right" });
  doc.text(`Généré le ${fmtDateFR(new Date().toISOString().slice(0, 10))}`, pageW - marginX, 30, { align: "right" });

  y = 48;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  setBrown();
  doc.text(`Convention d'occupation temporaire — "${d.titre || "Événement à préciser"}"`, pageW / 2, y, { align: "center" });
  y += 10;

  // ── Préambule / Parties ──
  h1("ENTRE LES SOUSSIGNÉS");
  paragraph(
    `${d.organisateurNom}${d.siretOrga ? `, SIRET ${d.siretOrga}` : ""}${d.adresseOrga ? `, domicilié(e) au ${d.adresseOrga}` : ""}, ci-après dénommé « l'Organisateur »,`
  );
  paragraph(`ET`, { bold: true, size: 9 });
  paragraph(`Le prestataire de restauration mobile (foodtruck) retenu par l'Organisateur à l'issue de la consultation décrite ci-après, ci-après dénommé « le Prestataire ».`);
  y += 2;
  paragraph(`Il est convenu ce qui suit :`, { bold: true });

  // ── Article 1 — Objet de la consultation ──
  h1("ARTICLE 1 — OBJET DE LA CONSULTATION");
  paragraph(
    `L'Organisateur organise, sur la base du présent cahier des charges, une consultation en vue de sélectionner un ou plusieurs prestataires de restauration mobile (foodtrucks) pour assurer une prestation de restauration à l'occasion de la manifestation intitulée "${d.titre || "[titre]"}"${d.typeEvt ? ` (${d.typeEvt})` : ""}.`
  );
  if (d.description) paragraph(d.description);
  if (d.precisions) paragraph(`Précisions complémentaires : ${d.precisions}`);
  paragraph(`Le présent document, une fois signé par le Prestataire retenu à l'issue de cette consultation, vaut convention d'occupation temporaire et engage les deux parties dans les conditions définies ci-après.`);

  // ── Article 2 — Identification des espaces / emplacements ──
  h1("ARTICLE 2 — IDENTIFICATION DES ESPACES ET EMPLACEMENTS");
  paragraph(`La manifestation se tient à l'adresse suivante : ${d.lieu || "[lieu à préciser]"}.`);
  paragraph(`Nombre d'emplacements proposés à la consultation : ${d.nbTrucks} emplacement(s)${d.surface ? `, d'une surface d'environ ${d.surface} m² chacun` : ""}.`);
  const detailsRenseignes = d.truckDetails.filter(t => t.trim());
  if (detailsRenseignes.length > 0) {
    paragraph("Type de cuisine souhaité par emplacement :");
    d.truckDetails.forEach((t, i) => { if (t.trim()) bullet(`Emplacement n°${i + 1} : ${t.trim()}`); });
  }
  paragraph("L'emplacement attribué au Prestataire est strictement réservé à l'activité de restauration mobile objet du présent contrat ; il ne peut être cédé, sous-loué ou modifié sans accord préalable et écrit de l'Organisateur.");

  // ── Article 3 — Durée de l'autorisation ──
  h1("ARTICLE 3 — DURÉE DE L'AUTORISATION");
  const periode = d.dateFin && d.dateFin !== d.dateDebut
    ? `du ${fmtDateFR(d.dateDebut)} au ${fmtDateFR(d.dateFin)}`
    : `le ${fmtDateFR(d.dateDebut)}`;
  paragraph(`La présente autorisation d'occupation est consentie ${periode}${d.heureDebut ? `, de ${d.heureDebut}${d.heureFin ? ` à ${d.heureFin}` : ""}` : ""}. Elle est strictement limitée à cette période et ne pourra en aucun cas donner lieu à une reconduction tacite.`);
  if (d.visiteurs) paragraph(`Fréquentation estimée : ${d.visiteurs} visiteurs.`);

  // ── Article 4 — Modalités d'exploitation ──
  h1("ARTICLE 4 — MODALITÉS D'EXPLOITATION");
  h2("Horaires");
  paragraph(`Le Prestataire exerce son activité durant les horaires d'ouverture au public de la manifestation, soit de ${d.heureDebut || "[heure de début]"} à ${d.heureFin || "la fin de la manifestation"}.`);
  h2("Installation");
  const oblInstallation = d.oblFt.find(o => o.label === "Arriver avant l'ouverture" && o.checked);
  paragraph(`L'installation du foodtruck sur son emplacement doit être achevée${oblInstallation?.heures ? ` au moins ${oblInstallation.heures} heure(s) avant l'ouverture au public` : " avant l'ouverture au public"}, selon les modalités communiquées par l'Organisateur.`);
  h2("Démontage");
  paragraph("Le démontage et l'évacuation du matériel et des déchets ne peuvent intervenir qu'après la fermeture au public de la manifestation, dans les délais fixés par l'Organisateur. Le Prestataire s'engage à rester sur place jusqu'à la fin de la manifestation, sauf autorisation contraire.");
  h2("Approvisionnement");
  paragraph(`Les opérations d'approvisionnement et de livraison s'effectuent en dehors des horaires d'ouverture au public dans la mesure du possible${d.acces ? ", l'accès des véhicules utilitaires étant autorisé sur le site aux horaires convenus avec l'Organisateur" : ", l'accès des véhicules étant limité sur le site et devant être organisé au préalable avec l'Organisateur"}.`);

  // ── Article 5 — Prescriptions techniques et sanitaires ──
  h1("ARTICLE 5 — PRESCRIPTIONS TECHNIQUES ET SANITAIRES");
  h2("Eau");
  paragraph("Sauf disposition contraire expressément prévue par l'Organisateur, le Prestataire doit disposer de sa propre autonomie en eau potable et assurer l'évacuation de ses eaux usées dans le respect de la réglementation en vigueur.");
  h2("Électricité");
  if (d.elec) {
    paragraph(`L'Organisateur met à disposition du Prestataire une alimentation électrique de type ${d.typeElec}${d.amperage ? `, d'un ampérage de ${d.amperage}A` : ""}. Le Prestataire demeure responsable de la conformité de son propre matériel de raccordement.`);
  } else {
    paragraph("Aucune alimentation électrique n'est fournie par l'Organisateur. Le Prestataire doit prévoir son propre dispositif d'alimentation autonome (groupe électrogène ou équivalent), dans le respect des normes de sécurité en vigueur.");
  }
  h2("Hygiène");
  paragraph("Le Prestataire s'engage à respecter l'intégralité de la réglementation applicable en matière d'hygiène alimentaire (méthode HACCP) et à être en mesure de présenter, à première demande, tout document justificatif attestant de sa conformité.");
  h2("Déchets");
  paragraph("Le Prestataire assure le tri, la collecte et l'évacuation de ses propres déchets, dans le respect des consignes de tri de l'Organisateur, et s'engage à restituer son emplacement dans un parfait état de propreté à l'issue de la manifestation.");

  // ── Article 6 — Redevance d'occupation ──
  h1("ARTICLE 6 — REDEVANCE D'OCCUPATION");
  paragraph(`Modèle de redevance retenu : ${d.modeleLabel || "—"}.`);
  paragraph(`Montant convenu : ${d.modeleMontant || "—"}.`);
  paragraph(`Un acompte de ${d.acompte}% est exigible à la signature du présent contrat. Le solde (${100 - d.acompte}%) sera versé au plus tard le ${fmtDateFR(d.soldeDate)}.`);

  // ── Article 7 — Critères de sélection des candidatures ──
  h1("ARTICLE 7 — CRITÈRES DE SÉLECTION DES CANDIDATURES");
  paragraph("Les candidatures des prestataires sont examinées par l'Organisateur au regard des critères suivants :");
  bullet(`Note minimale exigée du Prestataire sur la plateforme Spotruck : ${d.noteMin}★`);
  if (d.exclu) bullet(`Exclusivité accordée sur le type de cuisine suivant : ${d.excluType || "à préciser"}`);
  if (d.dateLimite) bullet(`Date limite de dépôt des candidatures : ${fmtDateFR(d.dateLimite)}`);
  bullet(`Mode de dépôt des candidatures : ${d.modeCandidature}`);

  // ── Article 8 — Documents à fournir ──
  h1("ARTICLE 8 — DOCUMENTS À FOURNIR PAR LE PRESTATAIRE");
  if (d.docs.length > 0) {
    paragraph("Préalablement à la manifestation, le Prestataire s'engage à transmettre à l'Organisateur les documents suivants :");
    d.docs.forEach(doc_ => bullet(doc_));
  } else {
    paragraph("Aucun document spécifique n'est exigé pour cette manifestation.");
  }

  // ── Article 9 — Obligations et sanctions ──
  h1("ARTICLE 9 — OBLIGATIONS ET SANCTIONS");
  h2("Obligations du Prestataire");
  const oblFtChecked = d.oblFt.filter(o => o.checked);
  oblFtChecked.forEach((o, i) => bullet(`${o.label}${o.heures && i === 0 ? ` (${o.heures}h avant l'ouverture)` : ""}.`));
  if (d.autreOblFt) bullet(`${d.autreOblFt}.`);
  h2("Obligations de l'Organisateur");
  d.oblOrg.filter(o => o.checked).forEach(o => bullet(`${o.label}.`));
  if (d.autreOblOrg) bullet(`${d.autreOblOrg}.`);
  h2("Sanctions en cas d'annulation");
  paragraph("En cas d'annulation par l'une des parties, le remboursement des sommes versées s'effectue selon le barème suivant :");
  checkBreak(10 + d.paliers.length * 7);
  doc.setFillColor(237, 232, 223);
  doc.rect(marginX, y, contentW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(140, 123, 110);
  doc.text("DÉLAI AVANT L'ÉVÉNEMENT", marginX + 3, y + 5.5);
  doc.text("REMBOURSEMENT", marginX + contentW / 2 + 3, y + 5.5);
  y += 8;
  d.paliers.forEach((p, i) => {
    checkBreak(8);
    if (i % 2 === 0) {
      doc.setFillColor(249, 246, 241);
      doc.rect(marginX, y, contentW, 7.5, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setBrown();
    doc.text(p.delai, marginX + 3, y + 5.2);
    doc.text(`${p.remboursement}%`, marginX + contentW / 2 + 3, y + 5.2);
    y += 7.5;
  });
  y += 4;
  h2("Manquement et résiliation");
  paragraph("En cas de manquement grave de l'une des parties à ses obligations contractuelles ou aux présentes prescriptions, l'autre partie peut résilier le présent contrat avec un préavis de 48 heures, notifié par écrit. Les sommes versées restent acquises selon le barème défini ci-dessus. Le présent contrat est soumis au droit français ; en cas de différend, les parties s'efforceront de trouver une solution amiable avant toute saisine des juridictions compétentes.");

  // ── Signatures ──
  checkBreak(55);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setMuted();
  doc.text(`Fait à ${d.lieu ? d.lieu.split(",").pop()?.trim() || "__________" : "__________"}, le ${fmtDateFR(new Date().toISOString().slice(0, 10))}, en deux exemplaires originaux.`, marginX, y);
  y += 14;

  const sigColW = contentW / 2 - 5;
  [
    { label: "L'ORGANISATEUR", name: d.organisateurNom },
    { label: "LE PRESTATAIRE (FOODTRUCK)", name: "___________________________" },
  ].forEach((s, i) => {
    const x = marginX + i * (sigColW + 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setBrown();
    doc.text(s.label, x, y);
    doc.setDrawColor(44, 24, 16);
    doc.line(x, y + 22, x + sigColW, y + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setMuted();
    doc.text(`${s.name} — Date : ___________`, x, y + 27);
  });

  // ── Pied de page (toutes les pages) ──
  const nbPages = doc.getNumberOfPages();
  for (let p = 1; p <= nbPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(140, 123, 110);
    doc.text("Spotruck SAS — Contrat généré via la plateforme Spotruck — document contractuel à valeur probante après signature", pageW / 2, 290, { align: "center" });
    doc.text(`Page ${p}/${nbPages}`, pageW - marginX, 290, { align: "right" });
  }

  doc.save(`${ref}.pdf`);
}

// ─── Reconstruction d'un contrat à partir d'un événement déjà
//     enregistré en base (ex: revoir le contrat depuis une candidature) ──
export interface EvenementForContrat {
  titre: string;
  type: string;
  description: string | null;
  date_debut: string;
  date_fin: string | null;
  heure_debut: string | null;
  heure_fin: string | null;
  lieu: string;
  visiteurs_attendus: number | null;
  nombre_trucks: number | null;
  modele_financier: string | null;
  budget_truck: number | null;
  droit_de_place: number | null;
  pourcentage_ca: number | null;
  electricite_disponible: boolean | null;
  type_prise: string | null;
  amperage: number | null;
  surface_disponible: number | null;
  acces_vehicule: boolean | null;
  documents_requis: string[] | null;
  note_minimum: number | null;
  exclusivite_cuisine: boolean | null;
  mode_candidature: string | null;
  date_limite_candidature: string | null;
}

const MODELE_FIN_LABELS: Record<string, string> = {
  droit_de_place: "Droit de place",
  privatisation: "Privatisation",
  mixte: "Droit de place + % du CA",
  pourcentage_ca: "Uniquement % du CA",
};
const MODE_CAND_LABELS: Record<string, string> = {
  spotruck: "Via Spotruck (formulaire intégré)",
  email: "Par email",
  lien_externe: "Via lien externe",
};

function visiteursIntToFourchette(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  if (n < 500) return "Moins de 500";
  if (n < 1000) return "500-1000";
  if (n < 5000) return "1000-5000";
  if (n < 10000) return "5000-10000";
  return "Plus de 10000";
}

function modeleMontantLabel(e: EvenementForContrat): string {
  if (e.modele_financier === "droit_de_place") {
    const montant = e.droit_de_place ?? e.budget_truck;
    if (montant == null) return "—";
    const total = e.nombre_trucks && e.nombre_trucks > 1 ? Number(montant) * e.nombre_trucks : null;
    return `${montant}€/truck${total ? ` · Total : ${total}€` : ""}`;
  }
  if (e.modele_financier === "privatisation") {
    return e.budget_truck != null ? `Privatisation ${e.budget_truck}€/truck` : "Privatisation";
  }
  if (e.modele_financier === "mixte") {
    return `${e.droit_de_place ?? "—"}€ droit + ${e.pourcentage_ca ?? 0}% CA HT`;
  }
  if (e.modele_financier === "pourcentage_ca") {
    return `${e.pourcentage_ca ?? 0}% du CA HT uniquement`;
  }
  return "—";
}

export function buildContratDataFromEvenement(
  e: EvenementForContrat,
  organisateurNom: string,
  siretOrga = "",
  adresseOrga = "",
): ContratPDFData {
  return {
    organisateurNom,
    siretOrga,
    adresseOrga,
    titre: e.titre,
    typeEvt: e.type,
    description: e.description || "",
    dateDebut: e.date_debut,
    dateFin: e.date_fin || "",
    heureDebut: e.heure_debut?.slice(0, 5) || "",
    heureFin: e.heure_fin?.slice(0, 5) || "",
    lieu: e.lieu,
    visiteurs: visiteursIntToFourchette(e.visiteurs_attendus),
    nbTrucks: e.nombre_trucks || 1,
    truckDetails: [],
    surface: e.surface_disponible != null ? String(e.surface_disponible) : "",
    elec: e.electricite_disponible ?? false,
    typeElec: e.type_prise || "Monophasé",
    amperage: e.amperage != null ? String(e.amperage) : "",
    acces: e.acces_vehicule ?? true,
    modeleLabel: e.modele_financier ? (MODELE_FIN_LABELS[e.modele_financier] ?? "") : "",
    modeleMontant: modeleMontantLabel(e),
    acompte: 30,
    soldeDate: "",
    precisions: "",
    docs: e.documents_requis ?? [],
    noteMin: Number(e.note_minimum ?? 0),
    exclu: e.exclusivite_cuisine ?? false,
    excluType: "",
    dateLimite: e.date_limite_candidature || "",
    modeCandidature: e.mode_candidature ? (MODE_CAND_LABELS[e.mode_candidature] ?? e.mode_candidature) : "Via Spotruck (formulaire intégré)",
    oblFt: OBL_FT_DEFAULT.map(o => ({ ...o })),
    autreOblFt: "",
    oblOrg: OBL_ORG_DEFAULT.map(o => ({ ...o })),
    autreOblOrg: "",
    paliers: DEFAULT_PALIERS.map(p => ({ ...p })),
  };
}

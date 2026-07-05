// Coordonnées GPS et rattachement département/région des principales villes
// françaises, utilisés pour positionner les pins sur la carte des opportunités
// et pour permettre à la recherche texte de remonter jusqu'à la région d'une ville.

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

interface VilleInfo {
  coords: [number, number];
  dept: string; // code département (ex: "33" pour la Gironde)
}

const VILLES: Record<string, VilleInfo> = {
  "paris": { coords: [48.8566, 2.3522], dept: "75" },
  "marseille": { coords: [43.2965, 5.3698], dept: "13" },
  "lyon": { coords: [45.7640, 4.8357], dept: "69" },
  "toulouse": { coords: [43.6047, 1.4442], dept: "31" },
  "nice": { coords: [43.7102, 7.2620], dept: "06" },
  "nantes": { coords: [47.2184, -1.5536], dept: "44" },
  "strasbourg": { coords: [48.5734, 7.7521], dept: "67" },
  "montpellier": { coords: [43.6108, 3.8767], dept: "34" },
  "bordeaux": { coords: [44.8378, -0.5792], dept: "33" },
  "pessac": { coords: [44.8060, -0.6310], dept: "33" },
  "lege cap ferret": { coords: [44.7500, -1.2000], dept: "33" },
  "merignac": { coords: [44.8410, -0.6500], dept: "33" },
  "talence": { coords: [44.8060, -0.5850], dept: "33" },
  "arcachon": { coords: [44.6586, -1.1689], dept: "33" },
  "libourne": { coords: [44.9145, -0.2430], dept: "33" },
  "gradignan": { coords: [44.7690, -0.6150], dept: "33" },
  "lille": { coords: [50.6292, 3.0573], dept: "59" },
  "rennes": { coords: [48.1173, -1.6778], dept: "35" },
  "reims": { coords: [49.2583, 4.0317], dept: "51" },
  "toulon": { coords: [43.1242, 5.9280], dept: "83" },
  "saint etienne": { coords: [45.4397, 4.3872], dept: "42" },
  "le havre": { coords: [49.4944, 0.1079], dept: "76" },
  "grenoble": { coords: [45.1885, 5.7245], dept: "38" },
  "dijon": { coords: [47.3220, 5.0415], dept: "21" },
  "angers": { coords: [47.4784, -0.5632], dept: "49" },
  "nimes": { coords: [43.8367, 4.3601], dept: "30" },
  "villeurbanne": { coords: [45.7667, 4.8794], dept: "69" },
  "clermont ferrand": { coords: [45.7772, 3.0870], dept: "63" },
  "le mans": { coords: [48.0061, 0.1996], dept: "72" },
  "aix en provence": { coords: [43.5297, 5.4474], dept: "13" },
  "brest": { coords: [48.3904, -4.4861], dept: "29" },
  "tours": { coords: [47.3941, 0.6848], dept: "37" },
  "limoges": { coords: [45.8336, 1.2611], dept: "87" },
  "amiens": { coords: [49.8941, 2.2958], dept: "80" },
  "annecy": { coords: [45.8992, 6.1294], dept: "74" },
  "perpignan": { coords: [42.6886, 2.8948], dept: "66" },
  "besancon": { coords: [47.2378, 6.0241], dept: "25" },
  "metz": { coords: [49.1193, 6.1757], dept: "57" },
  "orleans": { coords: [47.9029, 1.9093], dept: "45" },
  "mulhouse": { coords: [47.7508, 7.3359], dept: "68" },
  "rouen": { coords: [49.4431, 1.0993], dept: "76" },
  "caen": { coords: [49.1829, -0.3707], dept: "14" },
  "nancy": { coords: [48.6921, 6.1844], dept: "54" },
  "avignon": { coords: [43.9493, 4.8055], dept: "84" },
  "poitiers": { coords: [46.5802, 0.3404], dept: "86" },
  "biarritz": { coords: [43.4832, -1.5586], dept: "64" },
  "bayonne": { coords: [43.4933, -1.4748], dept: "64" },
  "anglet": { coords: [43.4816, -1.5218], dept: "64" },
  "pau": { coords: [43.2951, -0.3708], dept: "64" },
  "la rochelle": { coords: [46.1603, -1.1511], dept: "17" },
  "chambery": { coords: [45.5646, 5.9178], dept: "73" },
  "colmar": { coords: [48.0794, 7.3585], dept: "68" },
  "cannes": { coords: [43.5528, 7.0174], dept: "06" },
  "antibes": { coords: [43.5804, 7.1251], dept: "06" },
  "saint etienne du rouvray": { coords: [49.3833, 1.1], dept: "76" },
  "valence": { coords: [44.9334, 4.8924], dept: "26" },
  "troyes": { coords: [48.2973, 4.0744], dept: "10" },
  "niort": { coords: [46.3236, -0.4587], dept: "79" },
  "bourges": { coords: [47.0810, 2.3987], dept: "18" },
  "vannes": { coords: [47.6582, -2.7603], dept: "56" },
  "quimper": { coords: [47.9960, -4.1023], dept: "29" },
  "lorient": { coords: [47.7482, -3.3661], dept: "56" },
  "saint nazaire": { coords: [47.2734, -2.2137], dept: "44" },
  "la roche sur yon": { coords: [46.6702, -1.4266], dept: "85" },
  "cholet": { coords: [47.0596, -0.8788], dept: "49" },
  "laval": { coords: [48.0736, -0.7699], dept: "53" },
  "chartres": { coords: [48.4439, 1.4894], dept: "28" },
  "blois": { coords: [47.5861, 1.3359], dept: "41" },
  "beziers": { coords: [43.3442, 3.2158], dept: "34" },
  "narbonne": { coords: [43.1839, 3.0039], dept: "11" },
  "carcassonne": { coords: [43.2130, 2.3491], dept: "11" },
  "albi": { coords: [43.9298, 2.1480], dept: "81" },
  "montauban": { coords: [44.0181, 1.3540], dept: "82" },
  "agen": { coords: [44.2049, 0.6218], dept: "47" },
  "tarbes": { coords: [43.2327, 0.0784], dept: "65" },
  "bayeux": { coords: [49.2764, -0.7024], dept: "14" },
  "cherbourg": { coords: [49.6337, -1.6222], dept: "50" },
  "saint malo": { coords: [48.6493, -2.0257], dept: "35" },
  "dinard": { coords: [48.6317, -2.0587], dept: "35" },
  "angouleme": { coords: [45.6484, 0.1560], dept: "16" },
  "perigueux": { coords: [45.1839, 0.7213], dept: "24" },
  "brive la gaillarde": { coords: [45.1590, 1.5330], dept: "19" },
  "bergerac": { coords: [44.8501, 0.4816], dept: "24" },
  "chateauroux": { coords: [46.8106, 1.6910], dept: "36" },
  "vichy": { coords: [46.1274, 3.4265], dept: "03" },
  "roanne": { coords: [46.0339, 4.0725], dept: "42" },
  "macon": { coords: [46.3069, 4.8286], dept: "71" },
  "chalon sur saone": { coords: [46.7803, 4.8524], dept: "71" },
  "auxerre": { coords: [47.7982, 3.5730], dept: "89" },
  "sens": { coords: [48.1975, 3.2831], dept: "89" },
  "nevers": { coords: [46.9896, 3.1601], dept: "58" },
  "moulins": { coords: [46.5654, 3.3327], dept: "03" },
  "epinal": { coords: [48.1747, 6.4497], dept: "88" },
  "verdun": { coords: [49.1593, 5.3842], dept: "55" },
  "thionville": { coords: [49.3579, 6.1710], dept: "57" },
  "sarreguemines": { coords: [49.1103, 7.0651], dept: "57" },
  "haguenau": { coords: [48.8156, 7.7907], dept: "67" },
  "belfort": { coords: [47.6379, 6.8629], dept: "90" },
  "vesoul": { coords: [47.6234, 6.1541], dept: "70" },
  "lons le saunier": { coords: [46.6741, 5.5551], dept: "39" },
  "bourg en bresse": { coords: [46.2058, 5.2258], dept: "01" },
  "annemasse": { coords: [46.1953, 6.2361], dept: "74" },
  "thonon les bains": { coords: [46.3705, 6.4795], dept: "74" },
  "gap": { coords: [44.5594, 6.0786], dept: "05" },
  "digne les bains": { coords: [44.0917, 6.2357], dept: "04" },
  "manosque": { coords: [43.8296, 5.7871], dept: "04" },
  "draguignan": { coords: [43.5375, 6.4658], dept: "83" },
  "frejus": { coords: [43.4330, 6.7370], dept: "83" },
  "hyeres": { coords: [43.1204, 6.1286], dept: "83" },
  "martigues": { coords: [43.4055, 5.0473], dept: "13" },
  "arles": { coords: [43.6768, 4.6280], dept: "13" },
  "istres": { coords: [43.5133, 4.9877], dept: "13" },
  "salon de provence": { coords: [43.6403, 5.0967], dept: "13" },
  "carpentras": { coords: [44.0554, 5.0489], dept: "84" },
  "orange": { coords: [44.1385, 4.8085], dept: "84" },
  "montelimar": { coords: [44.5581, 4.7503], dept: "26" },
  "romans sur isere": { coords: [45.0500, 5.0500], dept: "26" },
  "vienne": { coords: [45.5252, 4.8760], dept: "38" },
  "bourgoin jallieu": { coords: [45.5900, 5.2745], dept: "38" },
  "aix les bains": { coords: [45.6887, 5.9153], dept: "73" },
  "albertville": { coords: [45.6758, 6.3921], dept: "73" },
  "sallanches": { coords: [45.9364, 6.6314], dept: "74" },
  "chamonix": { coords: [45.9237, 6.8694], dept: "74" },
  "evian les bains": { coords: [46.4009, 6.5900], dept: "74" },
  "cergy": { coords: [49.0369, 2.0770], dept: "95" },
  "pontoise": { coords: [49.0511, 2.1013], dept: "95" },
  "argenteuil": { coords: [48.9474, 2.2482], dept: "95" },
  "versailles": { coords: [48.8049, 2.1204], dept: "78" },
  "saint germain en laye": { coords: [48.8977, 2.0930], dept: "78" },
  "meaux": { coords: [48.9601, 2.8788], dept: "77" },
  "melun": { coords: [48.5388, 2.6598], dept: "77" },
  "fontainebleau": { coords: [48.4084, 2.7016], dept: "77" },
  "evry": { coords: [48.6296, 2.4291], dept: "91" },
  "dreux": { coords: [48.7358, 1.3661], dept: "28" },
  "evreux": { coords: [49.0269, 1.1510], dept: "27" },
  "alencon": { coords: [48.4322, 0.0910], dept: "61" },
  "flers": { coords: [48.7500, -0.5720], dept: "61" },
  "avranches": { coords: [48.6844, -1.3573], dept: "50" },
  "granville": { coords: [48.8378, -1.5964], dept: "50" },
  "coutances": { coords: [49.0464, -1.4448], dept: "50" },
  "saint lo": { coords: [49.1153, -1.0899], dept: "50" },
  "vitre": { coords: [48.1236, -1.2103], dept: "35" },
  "fougeres": { coords: [48.3524, -1.2043], dept: "35" },
  "redon": { coords: [47.6509, -2.0844], dept: "35" },
  "pontivy": { coords: [48.0667, -2.9667], dept: "56" },
  "concarneau": { coords: [47.8747, -3.9200], dept: "29" },
  "douarnenez": { coords: [48.0925, -4.3292], dept: "29" },
  "morlaix": { coords: [48.5779, -3.8280], dept: "29" },
  "guingamp": { coords: [48.5619, -3.1517], dept: "22" },
  "saint brieuc": { coords: [48.5136, -2.7652], dept: "22" },
  "lannion": { coords: [48.7324, -3.4581], dept: "22" },
  "dinan": { coords: [48.4536, -2.0475], dept: "22" },
};

const DEPT_TO_REGION: Record<string, string> = {
  // Auvergne-Rhône-Alpes
  "01": "Auvergne-Rhône-Alpes", "03": "Auvergne-Rhône-Alpes", "07": "Auvergne-Rhône-Alpes",
  "15": "Auvergne-Rhône-Alpes", "26": "Auvergne-Rhône-Alpes", "38": "Auvergne-Rhône-Alpes",
  "42": "Auvergne-Rhône-Alpes", "43": "Auvergne-Rhône-Alpes", "63": "Auvergne-Rhône-Alpes",
  "69": "Auvergne-Rhône-Alpes", "73": "Auvergne-Rhône-Alpes", "74": "Auvergne-Rhône-Alpes",
  // Bourgogne-Franche-Comté
  "21": "Bourgogne-Franche-Comté", "25": "Bourgogne-Franche-Comté", "39": "Bourgogne-Franche-Comté",
  "58": "Bourgogne-Franche-Comté", "70": "Bourgogne-Franche-Comté", "71": "Bourgogne-Franche-Comté",
  "89": "Bourgogne-Franche-Comté", "90": "Bourgogne-Franche-Comté",
  // Bretagne
  "22": "Bretagne", "29": "Bretagne", "35": "Bretagne", "56": "Bretagne",
  // Centre-Val de Loire
  "18": "Centre-Val de Loire", "28": "Centre-Val de Loire", "36": "Centre-Val de Loire",
  "37": "Centre-Val de Loire", "41": "Centre-Val de Loire", "45": "Centre-Val de Loire",
  // Corse
  "2A": "Corse", "2B": "Corse",
  // Grand Est
  "08": "Grand Est", "10": "Grand Est", "51": "Grand Est", "52": "Grand Est",
  "54": "Grand Est", "55": "Grand Est", "57": "Grand Est", "67": "Grand Est",
  "68": "Grand Est", "88": "Grand Est",
  // Hauts-de-France
  "02": "Hauts-de-France", "59": "Hauts-de-France", "60": "Hauts-de-France",
  "62": "Hauts-de-France", "80": "Hauts-de-France",
  // Île-de-France
  "75": "Île-de-France", "77": "Île-de-France", "78": "Île-de-France", "91": "Île-de-France",
  "92": "Île-de-France", "93": "Île-de-France", "94": "Île-de-France", "95": "Île-de-France",
  // Normandie
  "14": "Normandie", "27": "Normandie", "50": "Normandie", "61": "Normandie", "76": "Normandie",
  // Nouvelle-Aquitaine
  "16": "Nouvelle-Aquitaine", "17": "Nouvelle-Aquitaine", "19": "Nouvelle-Aquitaine",
  "23": "Nouvelle-Aquitaine", "24": "Nouvelle-Aquitaine", "33": "Nouvelle-Aquitaine",
  "40": "Nouvelle-Aquitaine", "47": "Nouvelle-Aquitaine", "64": "Nouvelle-Aquitaine",
  "79": "Nouvelle-Aquitaine", "86": "Nouvelle-Aquitaine", "87": "Nouvelle-Aquitaine",
  // Occitanie
  "09": "Occitanie", "11": "Occitanie", "12": "Occitanie", "30": "Occitanie",
  "31": "Occitanie", "32": "Occitanie", "34": "Occitanie", "46": "Occitanie",
  "48": "Occitanie", "65": "Occitanie", "66": "Occitanie", "81": "Occitanie", "82": "Occitanie",
  // Pays de la Loire
  "44": "Pays de la Loire", "49": "Pays de la Loire", "53": "Pays de la Loire",
  "72": "Pays de la Loire", "85": "Pays de la Loire",
  // Provence-Alpes-Côte d'Azur
  "04": "Provence-Alpes-Côte d'Azur", "05": "Provence-Alpes-Côte d'Azur", "06": "Provence-Alpes-Côte d'Azur",
  "13": "Provence-Alpes-Côte d'Azur", "83": "Provence-Alpes-Côte d'Azur", "84": "Provence-Alpes-Côte d'Azur",
  // Outre-mer
  "971": "Guadeloupe", "972": "Martinique", "973": "Guyane", "974": "La Réunion", "976": "Mayotte",
};

/**
 * Renvoie les coordonnées GPS [lat, lng] d'une ville française à partir de son
 * nom, ou null si la ville n'est pas dans le référentiel local.
 */
export function getCoordonneesVille(ville: string | null | undefined): [number, number] | null {
  if (!ville) return null;
  const v = VILLES[normalize(ville)];
  return v ? v.coords : null;
}

/**
 * Renvoie le code département d'une ville, ou null si inconnue.
 */
export function getDepartementVille(ville: string | null | undefined): string | null {
  if (!ville) return null;
  const v = VILLES[normalize(ville)];
  return v ? v.dept : null;
}

/**
 * Renvoie la région d'une ville en passant par son département
 * (ville → département → région), ou null si inconnue.
 */
export function getRegionVille(ville: string | null | undefined): string | null {
  const dept = getDepartementVille(ville);
  if (!dept) return null;
  return DEPT_TO_REGION[dept] ?? null;
}

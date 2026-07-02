-- ══════════════════════════════════════════════════════
-- DEBUG - Vérifier les événements dans la base
-- ══════════════════════════════════════════════════════

-- 1. Compter tous les événements
SELECT
  COUNT(*) as total_evenements,
  COUNT(*) FILTER (WHERE statut = 'publie') as evenements_publies,
  COUNT(*) FILTER (WHERE statut = 'brouillon') as evenements_brouillons
FROM evenements;

-- 2. Lister tous les événements avec leur statut
SELECT
  id,
  titre,
  statut,
  date_debut,
  ville,
  created_at
FROM evenements
ORDER BY created_at DESC;

-- 3. Lister uniquement les événements publiés
SELECT
  id,
  titre,
  statut,
  date_debut,
  ville,
  type,
  visiteurs_attendus,
  nombre_trucks,
  budget_truck,
  modele_financier,
  source,
  url_source
FROM evenements
WHERE statut = 'publie'
ORDER BY created_at DESC;

-- 4. Vérifier les valeurs de statut distinctes
SELECT DISTINCT statut, COUNT(*)
FROM evenements
GROUP BY statut;

-- 5. Exemple d'INSERT pour tester
/*
INSERT INTO evenements (
  titre,
  type,
  description,
  date_debut,
  date_fin,
  heure_debut,
  heure_fin,
  lieu,
  ville,
  region,
  visiteurs_attendus,
  nombre_trucks,
  budget_truck,
  modele_financier,
  statut,
  source,
  url_source,
  organisateur_id
) VALUES (
  'Festival Street Food Bordeaux 2026',
  'Festival',
  'Grand festival de street food en plein air au cœur de Bordeaux.',
  '2026-07-15',
  '2026-07-17',
  '11:00',
  '22:00',
  'Place des Quinconces',
  'Bordeaux',
  'Nouvelle-Aquitaine',
  5000,
  8,
  1000,
  'droit_de_place',
  'publie',
  'Google Alerts',
  'https://bordeaux.fr/festivals/street-food-2026',
  NULL  -- Mettre NULL ou un UUID valide d'organisateur
);
*/

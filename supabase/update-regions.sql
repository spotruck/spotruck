-- ══════════════════════════════════════════════════════
-- Met à jour la région des événements en fonction de leur ville
-- Utilise le même référentiel ville → département → région que
-- src/lib/geo.ts (fonction getRegionVille), afin de rester cohérent
-- avec le mapping utilisé côté application.
-- ══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS unaccent;

UPDATE evenements
SET region = CASE
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'paris', 'cergy', 'pontoise', 'argenteuil', 'versailles', 'saint germain en laye', 'meaux', 'melun', 'fontainebleau', 'evry'
  ) THEN 'Île-de-France'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'marseille', 'nice', 'toulon', 'aix en provence', 'avignon', 'cannes', 'antibes', 'gap', 'digne les bains', 'manosque', 'draguignan', 'frejus', 'hyeres', 'martigues', 'arles', 'istres', 'salon de provence', 'carpentras', 'orange'
  ) THEN 'Provence-Alpes-Côte d''Azur'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'lyon', 'saint etienne', 'grenoble', 'villeurbanne', 'clermont ferrand', 'annecy', 'chambery', 'valence', 'vichy', 'roanne', 'moulins', 'bourg en bresse', 'annemasse', 'thonon les bains', 'montelimar', 'romans sur isere', 'vienne', 'bourgoin jallieu', 'aix les bains', 'albertville', 'sallanches', 'chamonix', 'evian les bains'
  ) THEN 'Auvergne-Rhône-Alpes'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'toulouse', 'montpellier', 'nimes', 'perpignan', 'beziers', 'narbonne', 'carcassonne', 'albi', 'montauban', 'tarbes'
  ) THEN 'Occitanie'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'nantes', 'angers', 'le mans', 'saint nazaire', 'la roche sur yon', 'cholet', 'laval'
  ) THEN 'Pays de la Loire'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'strasbourg', 'reims', 'metz', 'mulhouse', 'nancy', 'colmar', 'troyes', 'epinal', 'verdun', 'thionville', 'sarreguemines', 'haguenau'
  ) THEN 'Grand Est'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'bordeaux', 'pessac', 'lege cap ferret', 'merignac', 'talence', 'arcachon', 'libourne', 'gradignan', 'limoges', 'poitiers', 'biarritz', 'bayonne', 'anglet', 'pau', 'la rochelle', 'niort', 'agen', 'angouleme', 'perigueux', 'brive la gaillarde', 'bergerac'
  ) THEN 'Nouvelle-Aquitaine'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'lille', 'amiens'
  ) THEN 'Hauts-de-France'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'rennes', 'brest', 'vannes', 'quimper', 'lorient', 'saint malo', 'dinard', 'vitre', 'fougeres', 'redon', 'pontivy', 'concarneau', 'douarnenez', 'morlaix', 'guingamp', 'saint brieuc', 'lannion', 'dinan'
  ) THEN 'Bretagne'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'le havre', 'rouen', 'caen', 'saint etienne du rouvray', 'bayeux', 'cherbourg', 'evreux', 'alencon', 'flers', 'avranches', 'granville', 'coutances', 'saint lo'
  ) THEN 'Normandie'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'dijon', 'besancon', 'macon', 'chalon sur saone', 'auxerre', 'sens', 'nevers', 'belfort', 'vesoul', 'lons le saunier'
  ) THEN 'Bourgogne-Franche-Comté'
  WHEN lower(unaccent(trim(regexp_replace(ville, '[^a-zA-Z0-9]+', ' ', 'g')))) IN (
    'tours', 'orleans', 'bourges', 'chartres', 'blois', 'chateauroux', 'dreux'
  ) THEN 'Centre-Val de Loire'
  ELSE region
END
WHERE (region IS NULL OR region = '')
  AND ville IS NOT NULL;

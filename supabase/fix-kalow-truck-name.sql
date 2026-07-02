-- ══════════════════════════════════════════════════════
-- FIX - Corriger le nom du truck KALOW
-- ══════════════════════════════════════════════════════

-- 1. Vérifier l'état actuel
SELECT
  id,
  nom_truck,
  prenom_gerant,
  nom_gerant,
  plan,
  created_at
FROM foodtruckers
WHERE id = '4da4f6e6-325e-4884-9e37-bef1bf703627';

-- 2. Vérifier les metadata de l'utilisateur auth
SELECT
  id,
  email,
  raw_user_meta_data->>'business_name' as business_name,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE id = '4da4f6e6-325e-4884-9e37-bef1bf703627';

-- 3. UPDATE - Corriger le nom du truck
UPDATE foodtruckers
SET
  nom_truck = 'KALOW',
  prenom_gerant = 'Florian',
  nom_gerant = 'Escamilla'
WHERE id = '4da4f6e6-325e-4884-9e37-bef1bf703627';

-- 4. Vérifier que la correction a fonctionné
SELECT
  id,
  nom_truck,
  prenom_gerant,
  nom_gerant,
  plan,
  updated_at
FROM foodtruckers
WHERE id = '4da4f6e6-325e-4884-9e37-bef1bf703627';

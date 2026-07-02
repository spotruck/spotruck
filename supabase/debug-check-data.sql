-- ══════════════════════════════════════════════════════
-- SCRIPT DE VÉRIFICATION - DIAGNOSTIC NOM DU TRUCK
-- Exécutez ce script dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. VÉRIFIER LES DONNÉES DANS foodtruckers
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  id,
  nom_truck,
  prenom_gerant,
  nom_gerant,
  plan,
  created_at
FROM foodtruckers
ORDER BY created_at DESC
LIMIT 5;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. VÉRIFIER LES METADATA DES UTILISATEURS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  id,
  email,
  raw_user_meta_data->>'business_name' as business_name,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. JOINTURE COMPLÈTE - VOIR TOUT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'business_name' as metadata_business_name,
  u.raw_user_meta_data->>'first_name' as metadata_first_name,
  u.raw_user_meta_data->>'last_name' as metadata_last_name,
  p.role,
  f.nom_truck as db_nom_truck,
  f.prenom_gerant as db_prenom_gerant,
  f.nom_gerant as db_nom_gerant,
  f.plan,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.foodtruckers f ON f.id = u.id
ORDER BY u.created_at DESC
LIMIT 5;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. VÉRIFIER SI LE TRIGGER EXISTE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. VÉRIFIER LA FONCTION DU TRIGGER
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELECT
  routine_name,
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- ══════════════════════════════════════════════════════
-- INTERPRÉTATION DES RÉSULTATS
-- ══════════════════════════════════════════════════════

/*
REQUÊTE 1 (foodtruckers) :
  ✅ Si nom_truck = 'KALOW' → Tout est OK
  ❌ Si nom_truck = NULL → Le trigger n'a pas fonctionné

REQUÊTE 2 (metadata) :
  ✅ Si business_name = 'KALOW' → Les metadata sont bien envoyées
  ❌ Si business_name = NULL → Problème dans l'API signup

REQUÊTE 3 (jointure) :
  Compare les metadata VS les données en base

  Cas 1 : metadata_business_name = 'KALOW' ET db_nom_truck = NULL
    → Le trigger ne fonctionne pas
    → Solution : Exécuter complete-signup-trigger.sql

  Cas 2 : metadata_business_name = NULL
    → L'API n'envoie pas les données
    → Vérifier src/app/api/auth/signup/route.ts

  Cas 3 : metadata_business_name = 'KALOW' ET db_nom_truck = 'KALOW'
    → Tout fonctionne !
    → Si le dashboard affiche "TRUCK", c'est un problème d'affichage

REQUÊTE 4 (trigger) :
  ✅ Si résultat → Le trigger existe
  ❌ Si vide → Exécuter complete-signup-trigger.sql

REQUÊTE 5 (fonction) :
  ✅ Si résultat → La fonction existe
  ❌ Si vide → Exécuter complete-signup-trigger.sql
*/

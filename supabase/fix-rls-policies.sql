-- ══════════════════════════════════════════════════════
-- FIX RLS POLICIES - SPOTRUCK
-- Correction des politiques d'insertion manquantes
-- ══════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLE: profiles
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Créer la nouvelle politique d'insertion
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Vérifier que les autres policies existent
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLE: foodtruckers
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Foodtruckers can insert own data" ON foodtruckers;

-- Créer la nouvelle politique d'insertion
CREATE POLICY "Foodtruckers can insert own data" ON foodtruckers
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Vérifier que les autres policies existent
DROP POLICY IF EXISTS "Foodtruckers can view own data" ON foodtruckers;
CREATE POLICY "Foodtruckers can view own data" ON foodtruckers
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Foodtruckers can update own data" ON foodtruckers;
CREATE POLICY "Foodtruckers can update own data" ON foodtruckers
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view foodtruckers profiles" ON foodtruckers;
CREATE POLICY "Public can view foodtruckers profiles" ON foodtruckers
  FOR SELECT USING (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLE: organisateurs
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Organisateurs can insert own data" ON organisateurs;

-- Créer la nouvelle politique d'insertion
CREATE POLICY "Organisateurs can insert own data" ON organisateurs
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Vérifier que les autres policies existent
DROP POLICY IF EXISTS "Organisateurs can view own data" ON organisateurs;
CREATE POLICY "Organisateurs can view own data" ON organisateurs
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Organisateurs can update own data" ON organisateurs;
CREATE POLICY "Organisateurs can update own data" ON organisateurs
  FOR UPDATE USING (auth.uid() = id);

-- ══════════════════════════════════════════════════════
-- VÉRIFICATION
-- ══════════════════════════════════════════════════════

-- Afficher toutes les policies pour vérification
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'foodtruckers', 'organisateurs')
ORDER BY tablename, policyname;

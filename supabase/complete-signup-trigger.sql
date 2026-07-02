-- ══════════════════════════════════════════════════════
-- TRIGGER COMPLET D'INSCRIPTION
-- Crée automatiquement profile + foodtrucker/organisateur
-- ══════════════════════════════════════════════════════

-- Fonction qui crée le profil ET les données spécifiques au rôle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  business_name TEXT;
  first_name TEXT;
  last_name TEXT;
BEGIN
  -- Récupérer les métadonnées
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'foodtrucker');
  business_name := NEW.raw_user_meta_data->>'business_name';
  first_name := NEW.raw_user_meta_data->>'first_name';
  last_name := NEW.raw_user_meta_data->>'last_name';

  -- 1. Créer l'entrée dans profiles
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_role
  );

  -- 2. Créer l'entrée spécifique au rôle
  IF user_role = 'foodtrucker' THEN
    INSERT INTO public.foodtruckers (
      id,
      nom_truck,
      prenom_gerant,
      nom_gerant,
      plan
    )
    VALUES (
      NEW.id,
      business_name,
      first_name,
      last_name,
      'free'
    );
  ELSIF user_role = 'organisateur' THEN
    INSERT INTO public.organisateurs (
      id,
      nom_organisation,
      prenom_responsable,
      nom_responsable,
      plan
    )
    VALUES (
      NEW.id,
      business_name,
      first_name,
      last_name,
      'gratuit'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════
-- VÉRIFICATION
-- ══════════════════════════════════════════════════════

-- Vérifier que le trigger existe
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Vérifier que la fonction existe
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- ══════════════════════════════════════════════════════
-- TEST
-- ══════════════════════════════════════════════════════

-- Pour tester, vous pouvez vérifier les données d'un utilisateur :
-- SELECT
--   u.id,
--   u.email,
--   u.raw_user_meta_data,
--   p.role,
--   f.nom_truck,
--   f.prenom_gerant,
--   f.nom_gerant
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- LEFT JOIN public.foodtruckers f ON f.id = u.id
-- WHERE u.email = 'votre_email@example.com';

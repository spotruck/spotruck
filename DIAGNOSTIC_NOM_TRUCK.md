# 🔍 DIAGNOSTIC COMPLET - Affichage du nom du truck

## 📋 1. FICHIERS ANALYSÉS

### ✅ src/app/api/auth/signup/route.ts (lignes 28-40)

```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role,                           // ← 'foodtrucker'
      business_name: businessName,    // ← CLÉ: 'business_name' (snake_case)
      first_name: firstName,          // ← CLÉ: 'first_name'
      last_name: lastName,            // ← CLÉ: 'last_name'
    },
    emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  },
});
```

**CLÉS ENVOYÉES DANS LES METADATA :**
- ✅ `business_name` (snake_case avec underscore)
- ✅ `first_name`
- ✅ `last_name`
- ✅ `role`

---

### ✅ src/app/dashboard/foodtrucker/page.tsx (lignes 28-32 et 56)

```typescript
// Requête Supabase
const { data: foodtrucker } = await supabase
  .from('foodtruckers')
  .select('nom_truck, prenom_gerant, nom_gerant, plan')
  .eq('id', user.id)
  .single();

// Affichage (ligne 56)
const displayName = foodtrucker?.nom_truck?.toUpperCase() || 'TRUCK';
```

**CE QUE LE CODE LIT :**
- Lit la colonne `nom_truck` depuis la table `foodtruckers`
- Si NULL ou undefined → affiche "TRUCK" (fallback)

---

## 🔍 2. VÉRIFICATIONS SUPABASE À FAIRE

### Requête 1 : Vérifier les données dans foodtruckers

```sql
SELECT id, nom_truck, prenom_gerant, nom_gerant, plan 
FROM foodtruckers 
ORDER BY created_at DESC 
LIMIT 5;
```

**RÉSULTAT ATTENDU :**
```
┌──────────────────────────────────┬──────────┬─────────┬───────────┬──────┐
│ id                               │nom_truck │prenom   │nom_gerant │ plan │
├──────────────────────────────────┼──────────┼─────────┼───────────┼──────┤
│ abc-123-def                      │ KALOW    │ Karim   │ Escamilla │ free │
└──────────────────────────────────┴──────────┴─────────┴───────────┴──────┘
```

**SI nom_truck EST NULL :**
- ❌ Le trigger n'a pas fonctionné
- ❌ Les données ne sont pas créées lors de l'inscription

---

### Requête 2 : Vérifier les metadata de l'utilisateur auth

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'business_name' as business_name,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

**RÉSULTAT ATTENDU :**
```
business_name: KALOW
first_name: Karim
last_name: Escamilla
role: foodtrucker
```

**SI business_name EST NULL :**
- ❌ Le formulaire n'envoie pas les données correctement
- ❌ Problème dans l'API signup

---

### Requête 3 : Vérifier si le trigger existe

```sql
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**RÉSULTAT ATTENDU :**
```
trigger_name: on_auth_user_created
event_object_table: users
action_timing: AFTER
event_manipulation: INSERT
```

**SI LE TRIGGER N'EXISTE PAS :**
- ❌ Le fichier `complete-signup-trigger.sql` n'a pas été exécuté dans Supabase

---

### Requête 4 : Vérifier la fonction du trigger

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';
```

**RÉSULTAT ATTENDU :**
```
routine_name: handle_new_user
routine_type: FUNCTION
```

---

## 🔧 3. TRIGGER SUPABASE CORRECT

Le trigger doit lire les clés **EXACTEMENT** comme elles sont envoyées :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  business_name TEXT;
  first_name TEXT;
  last_name TEXT;
BEGIN
  -- Récupérer les métadonnées avec les bonnes clés (snake_case)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'foodtrucker');
  business_name := NEW.raw_user_meta_data->>'business_name';  -- ← CLÉS AVEC UNDERSCORE
  first_name := NEW.raw_user_meta_data->>'first_name';
  last_name := NEW.raw_user_meta_data->>'last_name';

  -- 1. Créer profiles
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, user_role);

  -- 2. Créer foodtruckers OU organisateurs
  IF user_role = 'foodtrucker' THEN
    INSERT INTO public.foodtruckers (
      id,
      nom_truck,        -- ← business_name va ici
      prenom_gerant,    -- ← first_name va ici
      nom_gerant,       -- ← last_name va ici
      plan
    )
    VALUES (
      NEW.id,
      business_name,    -- ← DOIT CORRESPONDRE
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
```

---

## 🎯 4. CORRESPONDANCES DES CLÉS

| Formulaire/API       | Metadata Key       | Trigger Lit            | Table Column     |
|---------------------|--------------------|------------------------|------------------|
| `businessName`      | `business_name`    | `->>'business_name'`   | `nom_truck`      |
| `firstName`         | `first_name`       | `->>'first_name'`      | `prenom_gerant`  |
| `lastName`          | `last_name`        | `->>'last_name'`       | `nom_gerant`     |
| `role`              | `role`             | `->>'role'`            | N/A (profiles)   |

**⚠️ IMPORTANT :**
- Les clés dans `options.data` sont envoyées en **snake_case** : `business_name`
- Le trigger DOIT lire avec **snake_case** : `->>'business_name'`
- Les noms de variables TypeScript (`businessName`) n'ont pas d'importance

---

## ✅ 5. PLAN D'ACTION

### Étape 1 : Vérifier les données actuelles
Exécuter les requêtes 1 et 2 ci-dessus dans Supabase SQL Editor

### Étape 2 : Si nom_truck est NULL
- Exécuter le fichier `supabase/complete-signup-trigger.sql` dans SQL Editor
- Supprimer l'utilisateur actuel dans Supabase Dashboard → Authentication
- Se réinscrire avec le formulaire

### Étape 3 : Si vous voulez corriger manuellement
```sql
UPDATE public.foodtruckers
SET 
  nom_truck = 'KALOW',
  prenom_gerant = 'Karim',
  nom_gerant = 'Escamilla'
WHERE id = 'VOTRE_USER_ID';
```

### Étape 4 : Vérifier le résultat
```sql
SELECT * FROM foodtruckers WHERE id = 'VOTRE_USER_ID';
```

### Étape 5 : Tester le dashboard
Aller sur http://localhost:3000/dashboard/foodtrucker
- Header doit afficher : "Bonjour, KALOW."
- Sidebar doit afficher : "KALOW" (ligne 1)

---

## 📊 6. DÉBOGAGE RAPIDE

Si le dashboard affiche toujours "TRUCK" :

1. **Vérifier que foodtrucker n'est pas null :**
   ```typescript
   console.log('foodtrucker:', foodtrucker);
   console.log('nom_truck:', foodtrucker?.nom_truck);
   ```

2. **Ajouter logs temporaires dans page.tsx (ligne 33) :**
   ```typescript
   const { data: foodtrucker, error: ftError } = await supabase
     .from('foodtruckers')
     .select('nom_truck, prenom_gerant, nom_gerant, plan')
     .eq('id', user.id)
     .single();
   
   console.log('🔍 Query result:', { foodtrucker, ftError });
   ```

3. **Vérifier les logs serveur** dans le terminal où `npm run dev` tourne

---

## 📝 RÉSUMÉ

✅ **Clés correctes dans l'API :** `business_name`, `first_name`, `last_name` (snake_case)

✅ **Code dashboard correct :** Lit `nom_truck` depuis la table `foodtruckers`

❌ **Problème probable :** Le trigger Supabase n'est pas exécuté ou lit les mauvaises clés

🎯 **Solution :** Exécuter `complete-signup-trigger.sql` dans Supabase SQL Editor

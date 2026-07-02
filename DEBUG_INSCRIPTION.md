# 🔍 DIAGNOSTIC - Problèmes d'inscription et d'affichage

## ❌ PROBLÈME 1 : Dashboard affiche "Bonjour, truck"

### Code actuel (page.tsx ligne 28-56)

```typescript
// Récupérer les données du foodtrucker
const { data: foodtrucker, error: foodtruckerError } = await supabase
  .from('foodtruckers')
  .select('nom_truck, prenom_gerant, nom_gerant, plan')
  .eq('id', user.id)
  .single();

// Nom d'affichage
const displayName = foodtrucker?.nom_truck?.toUpperCase() || 'TRUCK';
```

### Pourquoi "TRUCK" s'affiche ?

**Cas 1 : `foodtrucker` est `null`**
- La table `foodtruckers` n'a PAS d'entrée pour cet utilisateur
- Le trigger Supabase n'a pas créé l'entrée lors de l'inscription
- **Solution** : Exécuter `complete-signup-trigger.sql`

**Cas 2 : `foodtrucker.nom_truck` est `null`**
- L'entrée existe mais `nom_truck` est vide
- Le trigger lit mal les metadata ou les metadata sont vides
- **Solution** : Vérifier avec les requêtes SQL de diagnostic

### Debug ajouté

J'ai ajouté des logs dans le fichier. Regardez la console serveur (terminal où tourne `npm run dev`) pour voir :

```
🔍 Dashboard Debug: {
  userId: 'abc-123...',
  userEmail: 'test@example.com',
  foodtruckerData: { nom_truck: 'KALOW', ... } ou null,
  foodtruckerError: { ... } ou null,
  nomTruck: 'KALOW' ou undefined
}
```

### Vérifications à faire dans Supabase

```sql
-- 1. Vérifier si l'entrée existe
SELECT * FROM foodtruckers WHERE id = 'VOTRE_USER_ID';

-- 2. Vérifier les metadata
SELECT 
  id,
  email,
  raw_user_meta_data->>'business_name' as business_name
FROM auth.users 
WHERE email = 'VOTRE_EMAIL';

-- 3. Si business_name est vide dans metadata
-- → L'API n'envoie pas les données

-- 4. Si business_name existe mais nom_truck est NULL
-- → Le trigger ne fonctionne pas
```

---

## ❌ PROBLÈME 2 : Même email peut être utilisé plusieurs fois

### Symptôme

- Remplir le formulaire avec le même email plusieurs fois
- Pas d'erreur "Email déjà utilisé"
- L'inscription semble réussir à chaque fois

### Causes possibles

**Cause A : Supabase ne persiste pas l'utilisateur**
- L'utilisateur est créé mais immédiatement supprimé
- Erreur silencieuse dans le trigger
- Les données ne sont pas sauvegardées

**Cause B : Confirmation d'email requise**
- Supabase est configuré pour demander la confirmation d'email
- L'utilisateur est créé mais en statut "pending"
- Sans confirmation, il peut être recréé

**Cause C : L'API ne gère pas les erreurs de doublon**
- L'erreur existe mais n'est pas renvoyée au client
- Le code ne vérifie pas `authError.code === 'user_already_exists'`

### Code actuel (signup/route.ts ligne 42-48)

```typescript
if (authError) {
  console.error('❌ Erreur auth:', authError);
  return NextResponse.json(
    { error: authError.message },
    { status: 400 }
  );
}
```

Ce code **renvoie** l'erreur, donc si Supabase dit "email déjà utilisé", le frontend devrait l'afficher.

### Test diagnostic

1. **Vérifier dans Supabase Dashboard → Authentication → Users**
   - Combien d'utilisateurs avec le même email ?
   - Quel est leur statut ? (active, pending, etc.)

2. **Regarder les logs serveur** lors de l'inscription
   - Est-ce que `authError` est loggé ?
   - Quel est le message d'erreur ?

3. **Tester manuellement**
   - S'inscrire avec `test@example.com`
   - Regarder la console serveur
   - S'inscrire À NOUVEAU avec `test@example.com`
   - Regarder si une erreur apparaît

### Solutions possibles

**Solution 1 : Vérifier la config Supabase**
```
Dashboard → Authentication → Settings → Email Auth
- "Enable email confirmations" devrait être OFF pour le dev
- Ou gérer la confirmation côté app
```

**Solution 2 : Améliorer la gestion d'erreur dans l'API**

Ajouter un logging détaillé :

```typescript
if (authError) {
  console.error('❌ Erreur auth complète:', {
    message: authError.message,
    status: authError.status,
    code: authError.code, // ← Important !
    name: authError.name
  });
  
  // Message spécifique pour doublon
  if (authError.message.includes('already') || authError.message.includes('exists')) {
    return NextResponse.json(
      { error: 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.' },
      { status: 409 }
    );
  }
  
  return NextResponse.json(
    { error: authError.message },
    { status: 400 }
  );
}
```

**Solution 3 : Vérifier si le trigger échoue silencieusement**

Si le trigger a une erreur et lève une exception, Supabase **annule** la création de l'utilisateur (ROLLBACK).

Vérifier dans Supabase Dashboard → Logs (si disponible) ou dans Database → Functions → handle_new_user

---

## 🔧 ACTIONS IMMÉDIATES

### 1. Diagnostic du nom du truck

```bash
# Dans le terminal où tourne npm run dev
# Rafraîchir http://localhost:3000/dashboard/foodtrucker
# Regarder les logs "🔍 Dashboard Debug:"
```

Si `foodtruckerData: null` :
→ **Problème :** Pas d'entrée dans la table foodtruckers
→ **Cause :** Le trigger ne fonctionne pas
→ **Solution :** Exécuter `complete-signup-trigger.sql` dans Supabase

Si `foodtruckerData: { nom_truck: null }` :
→ **Problème :** L'entrée existe mais nom_truck est vide
→ **Cause :** Le trigger ne lit pas les bonnes metadata
→ **Solution :** Vérifier les metadata dans Supabase (requête 2)

### 2. Diagnostic de l'inscription

**Test rapide :**
```
1. Ouvrir Supabase Dashboard → Authentication → Users
2. Noter le nombre d'utilisateurs
3. S'inscrire avec un nouveau email (ex: test123@example.com)
4. Regarder les logs serveur
5. S'inscrire À NOUVEAU avec test123@example.com
6. Voir si une erreur apparaît
7. Vérifier dans Supabase si 2 utilisateurs sont créés
```

**Si aucune erreur mais 2 utilisateurs créés :**
→ **Problème :** Supabase accepte les doublons (bizarre)
→ **Cause :** Configuration Supabase ou bug

**Si une erreur apparaît dans les logs mais pas dans le formulaire :**
→ **Problème :** L'erreur n'est pas renvoyée au frontend
→ **Cause :** Bug dans la gestion d'erreur
→ **Solution :** Améliorer le logging

**Si aucun utilisateur n'est créé :**
→ **Problème :** Le trigger échoue et rollback tout
→ **Cause :** Erreur dans le trigger (contrainte, type, etc.)
→ **Solution :** Vérifier les logs Supabase

---

## 📊 REQUÊTES SQL DE VÉRIFICATION

Exécuter dans Supabase SQL Editor :

```sql
-- Voir tous les utilisateurs
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Voir les foodtruckers
SELECT * FROM foodtruckers ORDER BY created_at DESC;

-- Voir la jointure complète
SELECT
  u.email,
  u.created_at as user_created,
  p.role,
  f.nom_truck,
  f.created_at as truck_created
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN foodtruckers f ON f.id = u.id
ORDER BY u.created_at DESC;
```

---

## 🎯 RÉSUMÉ

**Problème 1 (nom truck) :**
- Logs ajoutés dans page.tsx
- Regarder la console serveur pour diagnostiquer
- Probablement un problème de trigger

**Problème 2 (doublons) :**
- Tester manuellement en s'inscrivant 2 fois
- Vérifier dans Supabase combien d'users sont créés
- Regarder les logs serveur pour voir les erreurs
- Améliorer la gestion d'erreur si nécessaire

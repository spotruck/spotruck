# 🚀 Configuration Supabase - SPOTRUCK

## ✅ CE QUI A ÉTÉ FAIT

### 1. Structure de la base de données
- ✅ Fichier `supabase/schema.sql` créé avec toutes les tables :
  - `profiles` (profils utilisateurs)
  - `foodtruckers` (profils foodtruckers)
  - `organisateurs` (profils organisateurs)
  - `evenements` (événements publiés)
  - `candidatures` (candidatures aux événements)
  - `documents` (documents administratifs)
  - `avis` (système de notation)
  - `notifications` (notifications utilisateurs)

### 2. Sécurité (Row Level Security)
- ✅ Policies RLS configurées pour chaque table
- ✅ Chaque utilisateur ne peut voir/modifier que ses propres données
- ✅ Les événements publics sont visibles par tous
- ✅ Les candidatures sont visibles par le foodtrucker et l'organisateur concernés

### 3. Authentification Supabase
- ✅ Fichier `src/lib/auth/supabase-auth.ts` créé
- ✅ Fonctions d'inscription (`signUp`)
- ✅ Fonctions de connexion (`signIn`)
- ✅ Fonction de déconnexion (`signOut`)
- ✅ Récupération de l'utilisateur connecté (`getCurrentUser`)

### 4. Clients Supabase
- ✅ `src/lib/supabase/client.ts` (client navigateur)
- ✅ `src/lib/supabase/server.ts` (client serveur)
- ✅ `src/lib/supabase/types.ts` (types TypeScript)

### 5. Pages d'authentification
- ✅ `/auth/register` mis à jour pour utiliser Supabase
- ✅ `/auth/login` mis à jour pour utiliser Supabase
- ✅ Suppression du système mock

### 6. Protection des routes
- ✅ Middleware créé (`src/middleware.ts`)
- ✅ Redirection automatique vers login si non authentifié
- ✅ Redirection vers le bon dashboard selon le rôle
- ✅ Empêche l'accès croisé entre dashboards

---

## 🔧 ÉTAPES RESTANTES

### ÉTAPE 1 : Vérifier les variables d'environnement

Ouvrir le fichier `.env.local` et vérifier que ces 3 variables sont remplies :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Si vides**, les obtenir depuis :
1. https://supabase.com/dashboard
2. Votre projet → Settings → API
3. Copier les 3 valeurs

### ÉTAPE 2 : Créer les tables dans Supabase

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Cliquer sur **SQL Editor** dans le menu de gauche
4. Créer une nouvelle requête (bouton **New query**)
5. Copier tout le contenu du fichier `supabase/schema.sql`
6. Coller dans l'éditeur
7. Cliquer sur **Run** (ou Ctrl/Cmd + Enter)

**Vérification** : Aller dans **Table Editor** et vérifier que les 8 tables apparaissent.

### ÉTAPE 3 : Configurer l'authentification par email

1. Dans Supabase Dashboard → **Authentication** → **Providers**
2. Vérifier que **Email** est activé
3. Dans **Authentication** → **Email Templates**, personnaliser si besoin :
   - Email de confirmation
   - Email de réinitialisation de mot de passe

**Options recommandées** :
- ✅ Enable email confirmations (pour production)
- ⚠️ Disable email confirmations (pour développement/tests)

Pour désactiver temporairement la confirmation email en dev :
1. **Authentication** → **Settings**
2. Décocher "Enable email confirmations"

### ÉTAPE 4 : Installer les dépendances Supabase (si pas déjà fait)

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### ÉTAPE 5 : Redémarrer le serveur Next.js

```bash
npm run dev
```

---

## 🧪 TESTS

### Test 1 : Inscription Foodtrucker

1. Aller sur http://localhost:3000/auth/register
2. Sélectionner **FOODTRUCKER**
3. Remplir le formulaire :
   - Nom du truck : "Le Burger du Test"
   - Email : votre email de test
   - Mot de passe : minimum 8 caractères
   - (Optionnel) Prénom/Nom du gérant
4. Cliquer sur **CRÉER MON COMPTE GRATUIT**

**Vérifications** :
- ✅ Message de succès affiché
- ✅ Redirection vers `/dashboard/foodtrucker`
- ✅ Dans Supabase Dashboard → **Authentication** → **Users** : le user apparaît
- ✅ Dans **Table Editor** → `profiles` : l'entrée apparaît avec `role = 'foodtrucker'`
- ✅ Dans **Table Editor** → `foodtruckers` : l'entrée apparaît avec le nom du truck

### Test 2 : Inscription Organisateur

1. Aller sur http://localhost:3000/auth/register
2. Sélectionner **ORGANISATEUR**
3. Remplir le formulaire :
   - Nom de l'organisation : "Festival Test"
   - Email : un autre email de test
   - Mot de passe : minimum 8 caractères
4. Cliquer sur **CRÉER MON COMPTE GRATUIT**

**Vérifications** :
- ✅ Message de succès
- ✅ Redirection vers `/dashboard/organisateur`
- ✅ Données dans les tables `profiles` et `organisateurs`

### Test 3 : Connexion

1. Se déconnecter (si connecté)
2. Aller sur http://localhost:3000/auth/login
3. Entrer l'email et le mot de passe d'un compte créé
4. Cliquer sur **SE CONNECTER**

**Vérifications** :
- ✅ Redirection vers le bon dashboard selon le rôle
- ✅ Pas d'erreur console

### Test 4 : Protection des routes

1. Se déconnecter
2. Essayer d'accéder à http://localhost:3000/dashboard/foodtrucker
3. **Résultat attendu** : Redirection automatique vers `/auth/login`

---

## 🐛 DÉPANNAGE

### Erreur : "Invalid API key"
→ Vérifier que les variables d'environnement sont bien remplies dans `.env.local`
→ Redémarrer le serveur après modification de `.env.local`

### Erreur : "relation 'profiles' does not exist"
→ Les tables n'ont pas été créées
→ Retourner à l'ÉTAPE 2 et exécuter `schema.sql` dans le SQL Editor

### Erreur : "new row violates row-level security policy"
→ Problème de RLS (Row Level Security)
→ Vérifier que les policies ont bien été créées dans `schema.sql`

### L'inscription fonctionne mais aucune donnée dans les tables
→ Vérifier les erreurs dans la console navigateur
→ Vérifier les logs Supabase Dashboard → **Logs** → **Postgres Logs**

### Email de confirmation non reçu
→ En développement, désactiver les confirmations email (voir ÉTAPE 3)
→ Ou vérifier les spams
→ Ou vérifier **Authentication** → **Logs** dans Supabase

---

## 📊 PROCHAINES ÉTAPES

Une fois l'authentification fonctionnelle :

1. **Dashboard Foodtrucker** :
   - Afficher le profil depuis la table `foodtruckers`
   - Lister les événements depuis `evenements`
   - Créer des candidatures dans `candidatures`

2. **Dashboard Organisateur** :
   - Créer des événements dans `evenements`
   - Voir les candidatures reçues
   - Accepter/refuser les candidatures

3. **Système de notifications** :
   - Créer des notifications lors des actions (nouvelle candidature, acceptation, etc.)

4. **Upload de documents** :
   - Configurer Supabase Storage pour les documents (KBIS, HACCP, etc.)

---

## 📞 AIDE

Si problème persistant :
1. Vérifier les logs navigateur (F12 → Console)
2. Vérifier les logs Supabase (Dashboard → Logs)
3. Vérifier que toutes les étapes ont bien été suivies

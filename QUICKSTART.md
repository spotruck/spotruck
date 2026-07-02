# ⚡ QUICKSTART - Spotruck avec Supabase

## 🚀 Démarrage rapide (10 minutes)

### 1️⃣ Configurer Supabase (5 min)

1. **Créer un projet Supabase** (si pas déjà fait)
   - Aller sur https://supabase.com
   - Cliquer sur "New Project"
   - Choisir un nom : "spotruck"
   - Choisir un mot de passe fort
   - Choisir une région proche (Europe West par exemple)
   - Attendre 1-2 minutes que le projet soit créé

2. **Copier les clés API**
   - Dans votre projet → **Settings** (icône ⚙️ en bas à gauche)
   - Cliquer sur **API**
   - Copier ces 3 valeurs :

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Remplir `.env.local`**
   
   Ouvrir le fichier `.env.local` et remplacer :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2️⃣ Créer les tables (3 min)

1. **Ouvrir le SQL Editor**
   - Dans Supabase Dashboard → **SQL Editor** (dans le menu de gauche)
   - Cliquer sur **New query**

2. **Copier le schéma**
   - Ouvrir le fichier `supabase/schema.sql`
   - Tout sélectionner (Ctrl/Cmd + A)
   - Copier (Ctrl/Cmd + C)

3. **Exécuter le schéma**
   - Coller dans l'éditeur SQL de Supabase
   - Cliquer sur **Run** (ou Ctrl/Cmd + Enter)
   - Attendre quelques secondes
   - Message de succès : "Success. No rows returned"

4. **Vérifier les tables**
   - Aller dans **Table Editor** (menu de gauche)
   - Vérifier que ces 8 tables apparaissent :
     - profiles
     - foodtruckers
     - organisateurs
     - evenements
     - candidatures
     - documents
     - avis
     - notifications

### 3️⃣ Configurer l'authentification (1 min)

Pour faciliter les tests en développement :

1. **Désactiver la confirmation email**
   - **Authentication** → **Settings**
   - Trouver "Enable email confirmations"
   - **Décocher** cette option
   - Cliquer sur **Save**

   ⚠️ En production, il faudra réactiver cette option pour la sécurité.

### 4️⃣ Démarrer l'application (1 min)

```bash
# Redémarrer le serveur Next.js
npm run dev
```

Ouvrir http://localhost:3000

### 5️⃣ Tester l'inscription (2 min)

1. **Aller sur** http://localhost:3000/auth/register

2. **Créer un compte Foodtrucker**
   - Cliquer sur **FOODTRUCKER**
   - Nom du truck : "Test Burger"
   - Email : votre_email@test.com
   - Mot de passe : Test1234
   - Cliquer sur **CRÉER MON COMPTE GRATUIT**

3. **Vérifier**
   - ✅ Message "Bienvenue sur Spotruck !"
   - ✅ Redirection vers `/dashboard/foodtrucker`
   - ✅ Pas d'erreur console (F12)

4. **Vérifier dans Supabase**
   - **Authentication** → **Users** : le user apparaît
   - **Table Editor** → **profiles** : entrée avec role = 'foodtrucker'
   - **Table Editor** → **foodtruckers** : entrée avec nom_truck = 'Test Burger'

---

## ✅ C'EST TERMINÉ !

Vous avez maintenant :
- ✅ Supabase configuré
- ✅ 8 tables créées avec sécurité RLS
- ✅ Authentification fonctionnelle
- ✅ Protection des routes
- ✅ Inscription/Connexion opérationnelles

---

## 🎯 PROCHAINES ÉTAPES

### Tester la connexion
1. Se déconnecter
2. Aller sur http://localhost:3000/auth/login
3. Se reconnecter avec l'email et le mot de passe créés
4. Vérifier la redirection vers le dashboard

### Créer un compte Organisateur
1. Se déconnecter
2. Aller sur http://localhost:3000/auth/register
3. Sélectionner **ORGANISATEUR**
4. Remplir avec un autre email
5. Vérifier la redirection vers `/dashboard/organisateur`

### Développer les fonctionnalités
Voir `INTEGRATION_SUPABASE_RECAP.md` pour la liste des fonctionnalités à développer.

---

## 🆘 BESOIN D'AIDE ?

### Commande de vérification
```bash
node scripts/check-supabase.js
```

### Problèmes courants

**"Invalid API key"**
→ Vérifier `.env.local` et redémarrer `npm run dev`

**"relation 'profiles' does not exist"**
→ Retourner à l'étape 2️⃣ et exécuter `schema.sql`

**"User already registered"**
→ Normal si vous testez plusieurs fois avec le même email
→ Utiliser un autre email ou supprimer le user dans Supabase → Authentication → Users

**Pas de redirection après inscription**
→ Ouvrir la console (F12) et vérifier les erreurs
→ Vérifier les logs Supabase : Dashboard → Logs → Postgres Logs

### Documentation complète
- **Installation détaillée** : `SUPABASE_SETUP.md`
- **Récapitulatif technique** : `INTEGRATION_SUPABASE_RECAP.md`
- **README Supabase** : `supabase/README.md`

---

## 📊 VÉRIFICATION RAPIDE

Après avoir suivi toutes les étapes :

```bash
# Vérifier la configuration
node scripts/check-supabase.js

# Résultat attendu :
# ✅ NEXT_PUBLIC_SUPABASE_URL
# ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
# ✅ SUPABASE_SERVICE_ROLE_KEY
# ✅ Tous les fichiers de configuration
# ✅ Dépendances npm
```

Si tout est vert → **Prêt à développer !** 🎉

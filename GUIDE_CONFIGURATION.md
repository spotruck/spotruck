# 🚀 GUIDE DE CONFIGURATION SUPABASE - SPOTRUCK

## 📋 CE QUE VOUS ALLEZ FAIRE

1. ✅ Créer un projet Supabase
2. ✅ Obtenir les clés API
3. ✅ Configurer `.env.local`
4. ✅ Créer les tables dans Supabase
5. ✅ Configurer l'authentification
6. ✅ Tester l'application

**Temps total : 10-15 minutes**

---

## 🎯 OPTION 1 : SCRIPT AUTOMATIQUE (RECOMMANDÉ)

### Étape 1 : Lancer le script

```bash
./scripts/setup-supabase.sh
```

Le script vous guidera étape par étape et configurera automatiquement :
- ✅ Les variables d'environnement dans `.env.local`
- ✅ La vérification de la connexion à Supabase
- ✅ Les instructions pour créer les tables
- ✅ Les instructions pour configurer l'authentification

---

## 📝 OPTION 2 : CONFIGURATION MANUELLE

### ÉTAPE 1 : Créer un projet Supabase

1. **Aller sur https://supabase.com**

2. **Se connecter** (ou créer un compte si vous n'en avez pas)

3. **Cliquer sur "New Project"**

4. **Remplir les informations** :
   - **Organization** : Sélectionner ou créer une organisation
   - **Name** : `spotruck` (ou le nom de votre choix)
   - **Database Password** : Choisir un mot de passe fort (gardez-le bien !)
   - **Region** : `Europe West (eu-west-1)` ou proche de vous
   - **Pricing Plan** : Free tier (gratuit)

5. **Cliquer sur "Create new project"**

6. **Attendre 1-2 minutes** que le projet soit créé ⏳

---

### ÉTAPE 2 : Récupérer les clés API

1. **Dans votre projet Supabase**, cliquer sur l'icône **⚙️ Settings** (en bas à gauche)

2. **Cliquer sur "API"** dans le menu de gauche

3. **Copier ces 3 valeurs** :

   **a) Project URL**
   ```
   Configuration → URL
   
   Ressemble à : https://xxxxxxxxxxxxx.supabase.co
   ```

   **b) anon public key**
   ```
   Project API keys → anon → public
   
   Ressemble à : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX...
   ```

   **c) service_role secret key**
   ```
   Project API keys → service_role → secret
   
   ⚠️ CLIQUEZ SUR "Reveal" pour voir la clé
   
   Ressemble à : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX...
   ```

---

### ÉTAPE 3 : Configurer .env.local

1. **Ouvrir le fichier `.env.local`** dans votre éditeur

2. **Remplacer les lignes vides** par vos vraies valeurs :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (laisser vide pour l'instant)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Sauvegarder le fichier** (Ctrl/Cmd + S)

---

### ÉTAPE 4 : Créer les tables dans Supabase

1. **Dans Supabase Dashboard**, cliquer sur **SQL Editor** dans le menu de gauche

2. **Cliquer sur "+ New query"**

3. **Ouvrir le fichier** `supabase/schema.sql` dans votre éditeur

4. **Tout sélectionner** (Ctrl/Cmd + A) et **copier** (Ctrl/Cmd + C)

5. **Retourner dans Supabase** et **coller** (Ctrl/Cmd + V) dans l'éditeur SQL

6. **Cliquer sur "Run"** (ou Ctrl/Cmd + Enter)

7. **Attendre quelques secondes** ⏳

8. **Vérifier le message de succès** :
   ```
   Success. No rows returned
   ```

9. **Vérifier que les tables ont été créées** :
   - Cliquer sur **Table Editor** dans le menu de gauche
   - Vous devez voir **8 tables** :
     - ✅ profiles
     - ✅ foodtruckers
     - ✅ organisateurs
     - ✅ evenements
     - ✅ candidatures
     - ✅ documents
     - ✅ avis
     - ✅ notifications

---

### ÉTAPE 5 : Configurer l'authentification

**Pour faciliter les tests en développement**, désactivons temporairement la confirmation email :

1. **Dans Supabase Dashboard**, cliquer sur **Authentication** dans le menu de gauche

2. **Cliquer sur "Settings"**

3. **Trouver la section "Email Auth"**

4. **DÉCOCHER "Enable email confirmations"**

5. **Cliquer sur "Save"**

⚠️ **Note** : En production, vous devrez réactiver cette option pour la sécurité !

---

### ÉTAPE 6 : Tester la configuration

**Vérifier que tout est bien configuré :**

```bash
node scripts/check-supabase.js
```

**Résultat attendu :**
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ Tous les fichiers de configuration
✅ Dépendances npm
```

---

### ÉTAPE 7 : Démarrer l'application

```bash
npm run dev
```

**Ouvrir dans le navigateur :**
```
http://localhost:3000
```

---

### ÉTAPE 8 : Tester l'inscription

1. **Aller sur** http://localhost:3000/auth/register

2. **Sélectionner "FOODTRUCKER"**

3. **Remplir le formulaire** :
   - **Nom du truck** : `Test Burger`
   - **Email** : `test@example.com` (ou votre vrai email)
   - **Mot de passe** : `Test1234`
   - *(Optionnel)* Prénom et Nom du gérant

4. **Cliquer sur "CRÉER MON COMPTE GRATUIT"**

**✅ Vérifications** :
- Message "Bienvenue sur Spotruck !"
- Redirection vers `/dashboard/foodtrucker`
- Pas d'erreur dans la console (F12)

---

### ÉTAPE 9 : Vérifier dans Supabase

1. **Dans Supabase Dashboard**, aller dans **Authentication** → **Users**
   - ✅ Votre utilisateur doit apparaître

2. **Aller dans Table Editor** → **profiles**
   - ✅ Une ligne avec `role = 'foodtrucker'`

3. **Aller dans Table Editor** → **foodtruckers**
   - ✅ Une ligne avec `nom_truck = 'Test Burger'`

---

## 🎉 CONFIGURATION TERMINÉE !

Vous avez maintenant :
- ✅ Supabase configuré et connecté
- ✅ 8 tables créées avec sécurité RLS
- ✅ Authentification fonctionnelle
- ✅ Protection des routes active
- ✅ Un compte de test créé et vérifié

---

## 🧪 TESTS SUPPLÉMENTAIRES

### Test 2 : Connexion

1. **Se déconnecter** (si connecté)

2. **Aller sur** http://localhost:3000/auth/login

3. **Se connecter** avec l'email et le mot de passe créés

4. **Vérifier** : Redirection vers `/dashboard/foodtrucker`

### Test 3 : Compte Organisateur

1. **Se déconnecter**

2. **Aller sur** http://localhost:3000/auth/register

3. **Sélectionner "ORGANISATEUR"**

4. **Remplir** avec un autre email

5. **Vérifier** : Redirection vers `/dashboard/organisateur`

### Test 4 : Protection des routes

1. **Se déconnecter**

2. **Essayer d'accéder à** http://localhost:3000/dashboard/foodtrucker

3. **Vérifier** : Redirection automatique vers `/auth/login`

---

## 🐛 DÉPANNAGE

### Erreur : "Invalid API key"
**Solution** :
1. Vérifier que les clés dans `.env.local` sont correctes
2. Redémarrer le serveur : `npm run dev`

### Erreur : "relation 'profiles' does not exist"
**Solution** :
1. Les tables n'ont pas été créées
2. Retourner à l'ÉTAPE 4 et exécuter `schema.sql`

### Erreur : "User already registered"
**Solution** :
1. Normal si vous testez plusieurs fois avec le même email
2. Utiliser un autre email OU
3. Supprimer le user dans Supabase → Authentication → Users

### Pas de redirection après inscription
**Solution** :
1. Ouvrir la console (F12) et vérifier les erreurs
2. Vérifier les logs Supabase : Dashboard → Logs → Postgres Logs
3. Vérifier que les tables `profiles` et `foodtruckers` existent

### Le serveur npm ne démarre pas
**Solution** :
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install
npm run dev
```

---

## 📚 DOCUMENTATION COMPLÈTE

- **Guide rapide** : `QUICKSTART.md`
- **Configuration détaillée** : `SUPABASE_SETUP.md`
- **Architecture** : `ARCHITECTURE.md`
- **Récapitulatif technique** : `INTEGRATION_SUPABASE_RECAP.md`

---

## 🎯 PROCHAINES ÉTAPES

Maintenant que Supabase est configuré, vous pouvez :

1. **Développer le dashboard foodtrucker**
   - Afficher le profil
   - Lister les événements
   - Créer des candidatures

2. **Développer le dashboard organisateur**
   - Créer des événements
   - Voir les candidatures
   - Gérer les événements

3. **Ajouter des fonctionnalités**
   - Upload de documents
   - Notifications temps réel
   - Paiements Stripe

---

**🎊 Félicitations ! Votre application Spotruck est maintenant connectée à Supabase !**

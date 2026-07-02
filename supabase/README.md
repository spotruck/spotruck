# Configuration Supabase pour Spotruck

## Étape 1 : Créer les tables

1. Allez sur votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **SQL Editor**
4. Créez une nouvelle requête
5. Copiez tout le contenu du fichier `schema.sql`
6. Collez-le dans l'éditeur SQL
7. Cliquez sur **Run** pour exécuter

## Étape 2 : Vérifier que les tables sont créées

1. Dans le menu de gauche, cliquez sur **Table Editor**
2. Vous devriez voir les tables suivantes :
   - `profiles`
   - `foodtruckers`
   - `organisateurs`
   - `evenements`
   - `candidatures`
   - `documents`
   - `avis`
   - `notifications`

## Étape 3 : Configurer l'authentification

Les paramètres d'authentification sont déjà configurés dans le code.
Supabase gère automatiquement la table `auth.users`.

## Étape 4 : Tester l'inscription

Une fois les tables créées, vous pouvez tester l'inscription via l'application.

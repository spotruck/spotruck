# 🎯 PLAN DE BRANCHEMENT - Dashboard Foodtrucker

## 📋 État actuel

**Compte de test :**
- Email : kalow group@gmail.com (probablement)
- UUID : `4da4f6e6-325e-4884-9e37-bef1bf703627`
- Problème : `nom_truck` = NULL dans la table `foodtruckers`

**Supabase :**
- URL : https://batfihpuwengjtdoflbl.supabase.co
- Tables : evenements, candidatures, foodtruckers, organisateurs, profiles, etc.

---

## 🔧 ÉTAPE 1 : Corriger le nom du truck KALOW

### Fichier créé : `supabase/fix-kalow-truck-name.sql`

```sql
-- Vérifier l'état actuel
SELECT id, nom_truck, prenom_gerant, nom_gerant 
FROM foodtruckers
WHERE id = '4da4f6e6-325e-4884-9e37-bef1bf703627';

-- UPDATE
UPDATE foodtruckers
SET
  nom_truck = 'KALOW',
  prenom_gerant = 'Florian',
  nom_gerant = 'Escamilla'
WHERE id = '4da4f6e6-325e-4884-9e37-bef1bf703627';
```

**Action :** Exécuter ce script dans Supabase SQL Editor

---

## 📄 ÉTAPE 2 : Brancher les pages du dashboard

### 2.1 `/dashboard/foodtrucker/opportunites` ✅ DÉJÀ FAIT

**Fichiers :**
- `src/app/dashboard/foodtrucker/opportunites/page.tsx` (Server Component)
- `src/app/dashboard/foodtrucker/opportunites/OpportunitesClient.tsx` (Client Component)

**Table Supabase :** `evenements` (statut = 'publie')

**Statut :** ✅ Déjà branché, à vérifier que ça affiche bien

---

### 2.2 `/dashboard/foodtrucker/candidatures` 🔄 À BRANCHER

**Architecture actuelle :**
- Un seul fichier Client Component avec données mock
- LocalStorage pour la persistence

**Architecture cible :**
- **Server Component** (`page.tsx`) : Récupère les candidatures depuis Supabase
- **Client Component** (`CandidaturesClient.tsx`) : Gère l'interactivité (modales, messages)

**Table Supabase :** `candidatures`

**Schéma :**
```sql
CREATE TABLE candidatures (
  id UUID PRIMARY KEY,
  evenement_id UUID REFERENCES evenements(id),
  foodtrucker_id UUID REFERENCES foodtruckers(id),
  message TEXT,
  statut TEXT ('en_attente', 'acceptee', 'refusee', 'annulee'),
  message_reponse TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Données à récupérer :**
```typescript
const { data: candidatures } = await supabase
  .from('candidatures')
  .select(`
    id,
    message,
    statut,
    created_at,
    evenements (
      titre,
      date_debut,
      ville,
      region,
      type,
      modele_financier,
      budget_truck,
      visiteurs_attendus,
      description
    )
  `)
  .eq('foodtrucker_id', user.id)
  .order('created_at', { ascending: false });
```

**Mapping :**
| Supabase | Interface actuelle |
|----------|-------------------|
| `candidatures.id` | `id` |
| `evenements.titre` | `titre` |
| `evenements.date_debut` | `date` |
| `evenements.ville` | `ville` |
| `candidatures.statut` | `statut` |
| `candidatures.message` | `messageCandidature` |

---

### 2.3 `/dashboard/foodtrucker/profil` 🔄 À BRANCHER

**Table Supabase :** `foodtruckers`

**Schéma :**
```sql
CREATE TABLE foodtruckers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nom_truck TEXT,
  prenom_gerant TEXT,
  nom_gerant TEXT,
  email_contact TEXT,
  telephone TEXT,
  adresse TEXT,
  ville TEXT,
  region TEXT,
  description TEXT,
  cuisines TEXT[],
  equipements TEXT[],
  plan TEXT ('free', 'pro', 'premium', 'saison'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Données à récupérer :**
```typescript
const { data: foodtrucker } = await supabase
  .from('foodtruckers')
  .select('*')
  .eq('id', user.id)
  .single();
```

**Actions :**
- Afficher les données dans le formulaire
- Permettre la modification
- Sauvegarder avec `UPDATE`

---

### 2.4 `/dashboard/foodtrucker/parametres` 🔄 À BRANCHER

**Tables :**
- `auth.users` (email, metadata)
- `foodtruckers` (plan, etc.)

**Données à récupérer :**
```typescript
// Email et auth
const { data: { user } } = await supabase.auth.getUser();

// Plan actuel
const { data: foodtrucker } = await supabase
  .from('foodtruckers')
  .select('plan, plan_expire_at')
  .eq('id', user.id)
  .single();
```

**Actions :**
- Afficher le plan actuel
- Permettre le changement de plan (upgrade)
- Gérer la modification de l'email
- Gérer la modification du mot de passe

---

## 🔑 SCHÉMA DES TABLES SUPABASE

### Table `evenements`
```sql
id UUID PRIMARY KEY
organisateur_id UUID
titre TEXT
type TEXT
description TEXT
date_debut DATE
date_fin DATE
heure_debut TIME
heure_fin TIME
lieu TEXT
ville TEXT
region TEXT
visiteurs_attendus INTEGER
nombre_trucks INTEGER
modele_financier TEXT ('droit_de_place', 'privatisation', ...)
budget_truck DECIMAL
statut TEXT ('publie', 'brouillon', ...)
source TEXT
url_source TEXT
created_at TIMESTAMP
```

### Table `candidatures`
```sql
id UUID PRIMARY KEY
evenement_id UUID → evenements(id)
foodtrucker_id UUID → foodtruckers(id)
message TEXT
statut TEXT ('en_attente', 'acceptee', 'refusee', 'annulee')
message_reponse TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Table `foodtruckers`
```sql
id UUID PRIMARY KEY → auth.users(id)
nom_truck TEXT
prenom_gerant TEXT
nom_gerant TEXT
email_contact TEXT
telephone TEXT
adresse TEXT
ville TEXT
region TEXT
description TEXT
cuisines TEXT[]
equipements TEXT[]
plan TEXT ('free', 'pro', 'premium', 'saison')
plan_expire_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## 📝 ORDRE D'EXÉCUTION

1. ✅ **Corriger le nom du truck**
   - Exécuter `supabase/fix-kalow-truck-name.sql`

2. ✅ **Vérifier /opportunites**
   - Aller sur http://localhost:3000/dashboard/foodtrucker/opportunites
   - Vérifier que les événements s'affichent

3. 🔄 **Brancher /candidatures**
   - Créer `page.tsx` (Server Component)
   - Créer `CandidaturesClient.tsx` (Client Component)
   - Mapper les données Supabase

4. 🔄 **Brancher /profil**
   - Modifier le Server Component existant
   - Connecter le formulaire à Supabase

5. 🔄 **Brancher /parametres**
   - Afficher le plan actuel
   - Gérer les changements de plan

---

## 🎯 RÉSULTAT FINAL

Toutes les pages du dashboard foodtrucker connectées aux vraies données Supabase :
- ✅ Opportunités → Table `evenements`
- ✅ Candidatures → Table `candidatures` + jointure `evenements`
- ✅ Profil → Table `foodtruckers`
- ✅ Paramètres → `auth.users` + `foodtruckers`

Le nom du truck KALOW s'affiche correctement partout.

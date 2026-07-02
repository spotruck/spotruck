# 🔍 DEBUG - Page Opportunités ne s'affiche pas

## ❌ PROBLÈME

La page `/dashboard/foodtrucker/opportunites` affiche "Aucune opportunité" alors que la table `evenements` contient des données.

## ✅ CORRECTIONS APPORTÉES

### 1. Noms de colonnes corrigés

**Avant (INCORRECT)** → **Après (CORRECT)**

| Requête erronée | Nom réel dans schema.sql |
|-----------------|--------------------------|
| `type_evenement` | `type` |
| `nombre_invites` | `visiteurs_attendus` |
| `adresse` | `lieu` |
| `electricite` | `electricite_disponible` |
| `surface_par_truck` | `surface_disponible` |
| `cuisines_recherchees` | ❌ N'existe pas dans le schéma |
| `budget_min`, `budget_max` | ❌ N'existent pas (utiliser `budget_truck`) |

### 2. Requête Supabase corrigée

**Avant :**
```typescript
.select(`
  type_evenement,     // ❌ ERREUR
  nombre_invites,     // ❌ ERREUR
  adresse,            // ❌ ERREUR
  electricite,        // ❌ ERREUR
  surface_par_truck   // ❌ ERREUR
`)
```

**Après :**
```typescript
.select(`
  type,                      // ✅ CORRECT
  visiteurs_attendus,        // ✅ CORRECT
  lieu,                      // ✅ CORRECT
  electricite_disponible,    // ✅ CORRECT
  surface_disponible         // ✅ CORRECT
`)
```

### 3. Logs de debug ajoutés

```typescript
// Dans page.tsx (lignes 24-38)

// Log 1 : TOUS les événements (sans filtre)
const { data: allEvents } = await supabase
  .from('evenements')
  .select('id, titre, statut, created_at');

console.log('🔍 Debug - TOUS les événements:', {
  count: allEvents?.length || 0,
  events: allEvents
});

// Log 2 : Événements PUBLIÉS uniquement
console.log('🔍 Debug - Événements PUBLIÉS:', {
  count: evenements?.length || 0,
  events: evenements?.map(e => ({ id: e.id, titre: e.titre, statut: e.statut })),
  error: eventsError
});
```

### 4. Mapping des données corrigé

```typescript
return {
  id: ev.id,
  titre: ev.titre,
  adresse: ev.lieu || "",                          // ← Corrigé
  ville: ev.ville || "",
  type: ev.type || "Autre",                        // ← Corrigé
  visiteurs: ev.visiteurs_attendus || 0,           // ← Corrigé
  electricite: ev.electricite_disponible || false, // ← Corrigé
  surfaceParTruck: ev.surface_disponible 
    ? `${ev.surface_disponible} m²` 
    : "Non précisé",                               // ← Corrigé
  // ...
};
```

## 🧪 VÉRIFICATIONS À FAIRE

### Étape 1 : Vérifier les données dans Supabase

Exécutez ce script dans **Supabase SQL Editor** :

```sql
-- Compter les événements
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE statut = 'publie') as publies
FROM evenements;

-- Lister les événements publiés
SELECT id, titre, statut, date_debut, ville
FROM evenements
WHERE statut = 'publie';
```

**Résultat attendu :**
- Si `publies = 0` → Aucun événement avec `statut = 'publie'`
- Si `publies > 0` → Il y a des événements, le problème est ailleurs

### Étape 2 : Vérifier les logs serveur

Dans le terminal où tourne `npm run dev`, regardez les logs :

```
🔍 Debug - TOUS les événements: { count: X, events: [...] }
🔍 Debug - Événements PUBLIÉS: { count: Y, events: [...] }
🔍 Opportunités Debug: { nombreEvenements: Y, ... }
```

**Interprétation :**
- `count: 0` → Aucune donnée en base
- `count: X` mais `error` présent → Problème de permissions RLS
- `count: X` et pas d'erreur → Les données sont bien récupérées

### Étape 3 : Si aucun événement en base

Insérez un événement de test :

```sql
INSERT INTO evenements (
  titre,
  type,
  description,
  date_debut,
  lieu,
  ville,
  region,
  visiteurs_attendus,
  nombre_trucks,
  budget_truck,
  modele_financier,
  statut,
  source,
  url_source
) VALUES (
  'Festival Street Food Bordeaux',
  'Festival',
  'Grand festival de street food.',
  '2026-07-15',
  'Place des Quinconces',
  'Bordeaux',
  'Nouvelle-Aquitaine',
  5000,
  8,
  1000,
  'droit_de_place',
  'publie',  -- ← IMPORTANT : bien mettre 'publie'
  'Google Alerts',
  'https://bordeaux.fr/festivals'
);
```

### Étape 4 : Vérifier la politique RLS

La politique doit permettre la lecture publique :

```sql
-- Vérifier la politique
SELECT * FROM pg_policies 
WHERE tablename = 'evenements';
```

**Politique attendue :**
```sql
CREATE POLICY "Public events visible" ON evenements
  FOR SELECT USING (statut = 'publie');
```

## 📊 SCHÉMA COMPLET DE LA TABLE evenements

Colonnes disponibles selon `schema.sql` :

```sql
CREATE TABLE evenements (
  id UUID PRIMARY KEY,
  organisateur_id UUID,
  titre TEXT NOT NULL,
  type TEXT NOT NULL,                    -- ← Pas "type_evenement"
  description TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE,
  heure_debut TIME,
  heure_fin TIME,
  lieu TEXT NOT NULL,                    -- ← Pas "adresse"
  ville TEXT,
  region TEXT,
  visiteurs_attendus INTEGER,            -- ← Pas "nombre_invites"
  nombre_trucks INTEGER DEFAULT 1,
  modele_financier TEXT,
  budget_organisateur DECIMAL,
  budget_truck DECIMAL,                  -- ← Prix vu par le truck
  commission_rate DECIMAL DEFAULT 0.13,
  droit_de_place DECIMAL,
  pourcentage_ca DECIMAL,
  electricite_disponible BOOLEAN,        -- ← Pas "electricite"
  type_prise TEXT,
  amperage INTEGER,
  surface_disponible DECIMAL,            -- ← Pas "surface_par_truck"
  acces_vehicule BOOLEAN DEFAULT TRUE,
  documents_requis TEXT[],
  note_minimum DECIMAL DEFAULT 0,
  exclusivite_cuisine BOOLEAN DEFAULT FALSE,
  instructions_candidature TEXT,
  mode_candidature TEXT,
  contact_candidature TEXT,
  date_limite_candidature DATE,
  statut TEXT DEFAULT 'publie',
  source TEXT DEFAULT 'spotruck',
  url_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## 🎯 RÉSUMÉ

**Cause du problème :**
- Noms de colonnes incorrects dans la requête Supabase
- La requête retournait une erreur silencieuse
- `evenements` était `null` ou vide
- La page affichait "Aucune opportunité"

**Solution appliquée :**
- ✅ Corrigé tous les noms de colonnes pour correspondre au schéma
- ✅ Ajouté des logs de debug détaillés
- ✅ Créé un script SQL de vérification (`debug-evenements.sql`)
- ✅ Documenté le mapping correct

**Prochaine étape :**
1. Redémarrer le serveur
2. Aller sur `/dashboard/foodtrucker/opportunites`
3. Regarder les logs serveur (terminal)
4. Vérifier que les événements s'affichent

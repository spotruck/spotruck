# ✅ Gestion "Tarif non communiqué"

## 📋 Objectif

Afficher **"Tarif non communiqué"** au lieu d'un montant lorsque le budget est NULL ou égal à 0.

## 🎯 Emplacements modifiés

### 1. **Server Component** (`page.tsx`)

**Ligne 96-101** — Formatage du budget :

```typescript
// Budget pour les foodtruckers (ce qu'ils voient réellement)
const budgetTruck = ev.budget_truck || 0;
const budgetLabel = budgetTruck > 0
  ? (ev.modele_financier === 'privatisation'
      ? `${budgetTruck.toLocaleString('fr-FR')} € (prestation)`
      : `${budgetTruck.toLocaleString('fr-FR')} € / jour`)
  : "Tarif non communiqué";
```

**Logique :**
- Si `budget_truck > 0` → Affiche le montant formaté
- Sinon → Affiche "Tarif non communiqué"

**Impact :**
- ✅ Cartes de la liste d'événements
- ✅ Fiche détail de l'événement (modale)

---

### 2. **Client Component** (`OpportunitesClient.tsx`)

#### 2.1 Overlay de conversion (privatisations Plan Free)

**Ligne 677-679** — Calcul du displayBudget :

```typescript
const displayBudget = isPrivatisation && !hasAccess
  ? (ev.budgetMin > 0 ? `${ev.budgetMin.toLocaleString("fr-FR")} €` : "Tarif non communiqué")
  : null;
```

**Ligne 836-860** — Affichage conditionnel dans l'overlay :

```typescript
<p
  style={{
    fontFamily: displayBudget === "Tarif non communiqué" ? S.sans : S.serif,
    fontSize: displayBudget === "Tarif non communiqué" ? "1.2rem" : "2.5rem",
    fontWeight: displayBudget === "Tarif non communiqué" ? 500 : 800,
    color: displayBudget === "Tarif non communiqué" ? S.muted : S.terra,
    lineHeight: 1,
  }}
>
  {displayBudget === "Tarif non communiqué" 
    ? displayBudget 
    : `💰 ${displayBudget}`
  }
</p>
```

**Style adapté pour "Tarif non communiqué" :**
- Police : `Inter` (sans-serif) au lieu de `Playfair Display` (serif)
- Taille : `1.2rem` au lieu de `2.5rem`
- Couleur : `#8C7B6E` (muted) au lieu de `#C4622D` (terra)
- Pas d'emoji 💰

**Ligne 890-903** — Texte de conversion adapté :

```typescript
{displayBudget === "Tarif non communiqué"
  ? "Pour 15€/mois, accédez à toutes les privatisations"
  : `Pour 15€/mois, accédez à des privatisations comme celle-ci à ${displayBudget}`
}
```

---

## 🎨 Design adapté selon le contexte

### Budget affiché (montant > 0)

**Liste / Cartes :**
```
[Euro icon] 1 000 € / jour
```

**Modale / Fiche détail :**
```
BUDGET / DROIT DE PLACE
1 000 € / jour
```

**Overlay privatisation :**
```
BUDGET
💰 1 000 €

[grand titre terra en serif]
```

### Budget non communiqué (NULL ou 0)

**Liste / Cartes :**
```
[Euro icon] Tarif non communiqué
```

**Modale / Fiche détail :**
```
BUDGET / DROIT DE PLACE
Tarif non communiqué
```

**Overlay privatisation :**
```
BUDGET
Tarif non communiqué

[texte muted en sans-serif, plus petit]
```

---

## 🧪 Cas de test

### Test 1 : Événement avec budget

```sql
INSERT INTO evenements (
  titre, type, date_debut, lieu, ville,
  budget_truck, modele_financier, statut
) VALUES (
  'Festival Test',
  'Festival',
  '2026-07-15',
  'Place des Quinconces',
  'Bordeaux',
  1000,  -- ← Budget renseigné
  'droit_de_place',
  'publie'
);
```

**Résultat attendu :**
- Carte : `1 000 € / jour`
- Fiche : `1 000 € / jour`

---

### Test 2 : Événement sans budget (NULL)

```sql
INSERT INTO evenements (
  titre, type, date_debut, lieu, ville,
  budget_truck, modele_financier, statut
) VALUES (
  'Festival Sans Budget',
  'Festival',
  '2026-08-20',
  'Esplanade',
  'Nantes',
  NULL,  -- ← Budget NULL
  'droit_de_place',
  'publie'
);
```

**Résultat attendu :**
- Carte : `Tarif non communiqué`
- Fiche : `Tarif non communiqué`

---

### Test 3 : Événement avec budget = 0

```sql
INSERT INTO evenements (
  titre, type, date_debut, lieu, ville,
  budget_truck, modele_financier, statut
) VALUES (
  'Festival Gratuit',
  'Festival',
  '2026-09-10',
  'Parc',
  'Lyon',
  0,  -- ← Budget à 0
  'droit_de_place',
  'publie'
);
```

**Résultat attendu :**
- Carte : `Tarif non communiqué`
- Fiche : `Tarif non communiqué`

---

### Test 4 : Privatisation sans budget (Plan Free)

```sql
INSERT INTO evenements (
  titre, type, date_debut, lieu, ville,
  budget_truck, modele_financier, statut
) VALUES (
  'Mariage Privé',
  'Mariage',
  '2026-10-05',
  'Château',
  'Aix-en-Provence',
  NULL,  -- ← Budget NULL
  'privatisation',
  'publie'
);
```

**Résultat attendu (utilisateur Plan Free) :**
- Carte : Floutée avec overlay
- Overlay affiche :
  ```
  BUDGET
  Tarif non communiqué
  
  Pour 15€/mois, accédez à toutes les privatisations
  ```

---

## 📝 Résumé

| Contexte | Budget > 0 | Budget = NULL ou 0 |
|----------|------------|-------------------|
| **Carte événement** | `1 000 € / jour` | `Tarif non communiqué` |
| **Fiche détail** | `1 000 € / jour` | `Tarif non communiqué` |
| **Overlay privatisation (affichage)** | `💰 1 000 €` (grand, terra, serif) | `Tarif non communiqué` (petit, muted, sans) |
| **Overlay privatisation (texte)** | `...à 1 000 €` | `...à toutes les privatisations` |

**Style DA conservé :**
- ✅ Police serif pour les montants (Playfair Display)
- ✅ Police sans pour "Tarif non communiqué" (Inter)
- ✅ Couleur terra (#C4622D) pour les montants
- ✅ Couleur muted (#8C7B6E) pour "Tarif non communiqué"
- ✅ Layout et espacement identiques

# Système de Prix Double Spotruck — Exemples

## Principe

L'organisateur saisit son **budget total** (ce qu'il paie).  
Le foodtrucker voit sa **rémunération nette** (ce qu'il reçoit).  
Spotruck garde la différence automatiquement (frais de service).

---

## Exemple 1 : Organisateur plan Gratuit

**Budget organisateur saisi** : 900€  
**Commission Spotruck** : 13%  
**Rémunération truck** : 783€ (900€ - 13%)  
**Frais Spotruck** : 117€

### Affichage côté organisateur
- Formulaire : "Votre budget pour cette prestation : 900€"
- Fiche événement : "Budget : 900€ (frais de service inclus)"
- Historique : "Festival Garorock — 900€ payés"

### Affichage côté foodtrucker
- Carte opportunité : "Rémunération : 783€"
- Fiche complète : "Rémunération nette : 783€" + note "Frais de service Spotruck inclus"
- Revenus : "Festival Garorock — 783€ reçus"

---

## Exemple 2 : Organisateur plan Pro Event

**Budget organisateur saisi** : 900€  
**Commission Spotruck** : 10%  
**Rémunération truck** : 810€ (900€ - 10%)  
**Frais Spotruck** : 90€  
**Abonnement Pro Event** : 19€ (facturé séparément)

### Affichage côté organisateur
- Formulaire : "Votre budget pour cette prestation : 900€"
- Note : "Avec Pro Event actif, vous bénéficiez d'une commission réduite à 10%"
- Historique : "Festival Garorock — 900€ payés"

### Affichage côté foodtrucker
- Carte opportunité : "Rémunération : 810€"
- Badge : "🛡️ Organisateur Pro Event"
- Fiche complète : "Rémunération nette : 810€"

---

## Exemple 3 : Organisateur plan Pro Annuel

**Budget organisateur saisi** : 900€  
**Commission Spotruck** : 10%  
**Rémunération truck** : 810€ (900€ - 10%)  
**Frais Spotruck** : 90€  
**Abonnement Pro Annuel** : 129€/an (facturé séparément)

### Affichage côté organisateur
- Formulaire : "Votre budget pour cette prestation : 900€"
- Note : "Avec Pro Annuel, commission réduite à 10% sur tous vos événements"
- Historique : "Festival Garorock — 900€ payés"

### Affichage côté foodtrucker
- Carte opportunité : "Rémunération : 810€"
- Badge : "★ Organisateur Premium"
- Fiche complète : "Rémunération nette : 810€"

---

## Tableau récapitulatif

| Budget organisateur | Plan Gratuit (13%) | Pro Event (10%) | Pro Annuel (10%) |
|---------------------|-------------------|-----------------|------------------|
| 600€                | 522€ pour truck   | 540€ pour truck | 540€ pour truck  |
| 900€                | 783€ pour truck   | 810€ pour truck | 810€ pour truck  |
| 1 200€              | 1 044€ pour truck | 1 080€ pour truck | 1 080€ pour truck |
| 3 500€              | 3 045€ pour truck | 3 150€ pour truck | 3 150€ pour truck |

---

## Utilisation dans le code

```typescript
import { getPriceForTruck, getSpotruckFee, formatPrice } from "@/lib/pricing";

// Budget saisi par l'organisateur
const organizerBudget = 900;
const organizerPlan = "gratuit"; // ou "pro-event", "pro-semestriel", "pro-annuel"

// Calcul de la rémunération truck
const truckPrice = getPriceForTruck(organizerBudget, organizerPlan);
// => 783€ (pour plan gratuit)

// Calcul des frais Spotruck
const spotruckFee = getSpotruckFee(organizerBudget, organizerPlan);
// => 117€

// Affichage formaté
console.log(`Rémunération : ${formatPrice(truckPrice)}`);
// => "Rémunération : 783 €"
```

---

## Transparence vs Discrétion

### ✅ Ce qu'on affiche
- Côté organisateur : "Budget total : 900€ (frais de service inclus)"
- Côté truck : "Rémunération nette : 783€"

### ❌ Ce qu'on N'affiche PAS
- Le montant exact de la commission côté truck
- Le budget organisateur côté truck
- Le détail "900€ - 117€ = 783€"

Le truck sait qu'il y a des frais de service (note discrète), mais ne voit que ce qu'il va recevoir.

---

## Migration des données existantes

Pour les événements existants dans les données fictives :
- `budgetMin` et `budgetMax` = budget organisateur (ce qu'il saisit)
- Calculer dynamiquement le prix truck avec `getPriceForTruck()`
- Afficher le bon montant selon le rôle (organisateur vs truck)

Exemple :
```typescript
// Dans les données événement
const event = {
  budgetMin: 800,
  budgetMax: 1200,
  organizerPlan: "gratuit"
};

// Côté foodtrucker
const truckMin = getPriceForTruck(800, "gratuit"); // 696€
const truckMax = getPriceForTruck(1200, "gratuit"); // 1044€
// Afficher : "Rémunération : 696–1 044€"

// Côté organisateur
// Afficher : "Budget : 800–1 200€"
```

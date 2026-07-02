# 🏗️ ARCHITECTURE SPOTRUCK

## 📂 STRUCTURE DU PROJET

```
truckos/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   │   ├── page.tsx              # Page d'inscription
│   │   │   │   └── RegisterForm.tsx      # Formulaire (utilise Supabase)
│   │   │   └── login/
│   │   │       ├── page.tsx              # Page de connexion
│   │   │       └── LoginForm.tsx         # Formulaire (utilise Supabase)
│   │   ├── dashboard/
│   │   │   ├── foodtrucker/
│   │   │   │   └── page.tsx              # Dashboard foodtrucker
│   │   │   └── organisateur/
│   │   │       └── page.tsx              # Dashboard organisateur
│   │   ├── tarifs/
│   │   │   └── page.tsx                  # Page tarifs
│   │   └── page.tsx                      # Landing page
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── supabase-auth.ts          # ✅ Authentification Supabase
│   │   │   └── mock-auth.ts              # ⚠️ Ancien système (à supprimer)
│   │   └── supabase/
│   │       ├── client.ts                 # ✅ Client navigateur
│   │       ├── server.ts                 # ✅ Client serveur
│   │       └── types.ts                  # ✅ Types TypeScript
│   │
│   └── middleware.ts                     # ✅ Protection des routes
│
├── supabase/
│   ├── schema.sql                        # ✅ Schéma complet de la DB
│   └── README.md                         # ✅ Instructions courtes
│
├── scripts/
│   └── check-supabase.js                 # ✅ Vérification config
│
├── .env.local                            # ⚠️ À remplir avec clés Supabase
├── .env.local.example                    # ✅ Exemple de format
├── QUICKSTART.md                         # ✅ Guide rapide 10 min
├── SUPABASE_SETUP.md                     # ✅ Guide détaillé
├── INTEGRATION_SUPABASE_RECAP.md         # ✅ Récap technique
└── package.json
```

---

## 🗄️ SCHÉMA DE BASE DE DONNÉES

### Tables principales

```
┌─────────────────┐
│   auth.users    │  ← Géré par Supabase Auth
│  (id, email)    │
└────────┬────────┘
         │
         │ 1:1
         │
    ┌────▼────────┐
    │  profiles   │  ← Profil de base
    │ id, role    │
    └────┬────────┘
         │
    ┌────┴─────────────────┐
    │                      │
    │ 1:1                  │ 1:1
    │                      │
┌───▼──────────┐    ┌──────▼────────┐
│ foodtruckers │    │ organisateurs │
│ nom_truck    │    │ nom_org       │
│ plan         │    │ plan          │
└───┬──────────┘    └──────┬────────┘
    │                      │
    │                      │ 1:N
    │                      │
    │                 ┌────▼────────┐
    │                 │ evenements  │
    │                 │ titre, type │
    │                 └────┬────────┘
    │                      │
    │ N:M                  │ 1:N
    └──────────┬───────────┘
               │
          ┌────▼──────────┐
          │ candidatures  │
          │ statut        │
          └───────────────┘
```

### Tables connexes

```
foodtruckers ──1:N──> documents (KBIS, HACCP, etc.)

candidatures ──1:N──> avis (notes & commentaires)

profiles ──1:N──> notifications
```

---

## 🔐 FLUX D'AUTHENTIFICATION

### Inscription

```
┌─────────────┐
│   User      │
│  formulaire │
└──────┬──────┘
       │
       │ POST /auth/register
       │
┌──────▼──────────────────────────┐
│  RegisterForm.tsx               │
│  ─────────────────              │
│  1. Validation côté client      │
│  2. signUp(...)                 │
└──────┬──────────────────────────┘
       │
       │
┌──────▼──────────────────────────┐
│  src/lib/auth/supabase-auth.ts  │
│  ──────────────────────────────│
│  1. supabase.auth.signUp()     │  ← Créer compte auth
│  2. Insert dans profiles       │  ← Créer profil
│  3. Insert dans foodtruckers   │  ← Créer données rôle
│     ou organisateurs           │
└──────┬──────────────────────────┘
       │
       │ Success
       │
┌──────▼──────────────────────────┐
│  Redirection automatique        │
│  /dashboard/foodtrucker         │
│  ou                             │
│  /dashboard/organisateur        │
└─────────────────────────────────┘
```

### Connexion

```
┌─────────────┐
│   User      │
│  formulaire │
└──────┬──────┘
       │
       │ POST /auth/login
       │
┌──────▼──────────────────────────┐
│  LoginForm.tsx                  │
│  ─────────────                  │
│  1. Validation                  │
│  2. signIn(email, password)     │
└──────┬──────────────────────────┘
       │
       │
┌──────▼──────────────────────────┐
│  src/lib/auth/supabase-auth.ts  │
│  ──────────────────────────────│
│  1. supabase.auth              │
│     .signInWithPassword()       │  ← Authentifier
│  2. Récupérer profil           │  ← Obtenir rôle
│  3. Retourner user + role      │
└──────┬──────────────────────────┘
       │
       │ Success
       │
┌──────▼──────────────────────────┐
│  Redirection selon rôle         │
│  /dashboard/foodtrucker         │
│  ou                             │
│  /dashboard/organisateur        │
└─────────────────────────────────┘
```

---

## 🛡️ PROTECTION DES ROUTES

### Middleware (src/middleware.ts)

```
┌─────────────────────┐
│  Toute requête      │
│  vers /dashboard/*  │
│  ou /auth/*         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│  middleware.ts              │
│  ──────────────             │
│  1. Récupérer session       │
│     Supabase                │
│  2. Vérifier user existe    │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
    NO            YES
    │             │
    ▼             ▼
┌───────┐    ┌────────────────┐
│ Login │    │ Vérifier rôle  │
│       │    │ correspond à   │
│       │    │ la route       │
└───────┘    └────┬───────────┘
                  │
           ┌──────┴──────┐
           │             │
        Match         No match
           │             │
           ▼             ▼
       ┌───────┐    ┌─────────┐
       │ Allow │    │Redirect │
       └───────┘    └─────────┘
```

---

## 🔒 ROW LEVEL SECURITY (RLS)

### Principles

Chaque table a des **policies** qui définissent :
- Qui peut **SELECT** (lire)
- Qui peut **INSERT** (créer)
- Qui peut **UPDATE** (modifier)
- Qui peut **DELETE** (supprimer)

### Exemples de policies

**Profiles**
```sql
-- User peut voir son propre profil
SELECT: auth.uid() = id

-- User peut modifier son propre profil
UPDATE: auth.uid() = id
```

**Evenements**
```sql
-- Tous peuvent voir les événements publics
SELECT: statut = 'publie'

-- Organisateur gère ses événements
ALL: auth.uid() = organisateur_id
```

**Candidatures**
```sql
-- Foodtrucker gère ses candidatures
ALL: auth.uid() = foodtrucker_id

-- Organisateur voit candidatures de ses events
SELECT: auth.uid() IN (
  SELECT organisateur_id FROM evenements WHERE id = evenement_id
)
```

---

## 📊 FLUX DE DONNÉES

### Dashboard Foodtrucker

```
┌──────────────────────┐
│  Dashboard FT        │
└──────────┬───────────┘
           │
           │ 1. Récupérer profil
           │
┌──────────▼───────────┐
│  supabase            │
│  .from('foodtruckers')│
│  .select('*')        │
│  .eq('id', user.id)  │
└──────────┬───────────┘
           │
           │ 2. Lister événements
           │
┌──────────▼───────────┐
│  supabase            │
│  .from('evenements') │
│  .select('*')        │
│  .eq('statut',       │
│       'publie')      │
└──────────┬───────────┘
           │
           │ 3. Mes candidatures
           │
┌──────────▼───────────┐
│  supabase            │
│  .from('candidatures')│
│  .select(`           │
│    *,                │
│    evenement:        │
│      evenements(*)   │
│  `)                  │
│  .eq('foodtrucker_id'│
│      , user.id)      │
└──────────────────────┘
```

### Dashboard Organisateur

```
┌──────────────────────┐
│  Dashboard Org       │
└──────────┬───────────┘
           │
           │ 1. Mes événements
           │
┌──────────▼───────────┐
│  supabase            │
│  .from('evenements') │
│  .select('*')        │
│  .eq('organisateur_id'│
│      , user.id)      │
└──────────┬───────────┘
           │
           │ 2. Candidatures reçues
           │
┌──────────▼───────────┐
│  supabase            │
│  .from('candidatures')│
│  .select(`           │
│    *,                │
│    foodtrucker:      │
│      foodtruckers(*),│
│    evenement:        │
│      evenements(*)   │
│  `)                  │
│  .in('evenement_id', │
│       mesEventIds)   │
└──────────────────────┘
```

---

## 🚀 DÉPLOIEMENT

### Variables d'environnement à configurer

**Development (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production (Vercel/autres)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://spotruck.com
```

### Checklist de déploiement

- [ ] Configurer les variables d'environnement en production
- [ ] Activer la confirmation email dans Supabase Auth
- [ ] Configurer le domaine autorisé dans Supabase → Auth → URL Configuration
- [ ] Vérifier les policies RLS
- [ ] Tester l'inscription/connexion en production
- [ ] Configurer Stripe (si paiements activés)

---

## 🔄 CYCLE DE VIE D'UN ÉVÉNEMENT

```
1. Organisateur crée événement
   ↓
   INSERT dans `evenements` avec statut = 'brouillon'

2. Organisateur publie
   ↓
   UPDATE `evenements` SET statut = 'publie'

3. Foodtruckers voient l'événement
   ↓
   SELECT `evenements` WHERE statut = 'publie'

4. Foodtrucker candidate
   ↓
   INSERT dans `candidatures` avec statut = 'en_attente'

5. Organisateur voit la candidature
   ↓
   SELECT `candidatures` WHERE evenement_id IN (mes events)

6. Organisateur accepte/refuse
   ↓
   UPDATE `candidatures` SET statut = 'acceptee'/'refusee'

7. Notification envoyée au foodtrucker
   ↓
   INSERT dans `notifications` pour le foodtrucker

8. Événement terminé
   ↓
   UPDATE `evenements` SET statut = 'termine'

9. Avis laissé (optionnel)
   ↓
   INSERT dans `avis` avec note et commentaire
```

---

## 🧩 EXTENSIONS FUTURES

### Supabase Storage
- Upload documents (KBIS, HACCP, etc.)
- Photos de trucks
- Photos d'événements

### Supabase Realtime
- Notifications en temps réel
- Chat entre organisateur et foodtrucker
- Mise à jour live des candidatures

### Supabase Edge Functions
- Envoi d'emails personnalisés
- Génération de PDF (contrats, factures)
- Webhooks Stripe

---

Cette architecture est **scalable**, **sécurisée** et **prête pour la production** ! 🚀

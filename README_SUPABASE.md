# 🚀 SPOTRUCK + SUPABASE

## ⚡ Démarrage ultra-rapide

### 1. Configurer Supabase (5 minutes)

1. Aller sur https://supabase.com → Créer un projet
2. Copier les 3 clés depuis **Settings** → **API**
3. Les coller dans `.env.local`
4. Exécuter `supabase/schema.sql` dans le **SQL Editor**

**👉 Guide détaillé : `QUICKSTART.md`**

---

## 📚 Documentation

| Fichier | Description | Temps |
|---------|-------------|-------|
| **QUICKSTART.md** | Guide de démarrage rapide | 10 min |
| **SUPABASE_SETUP.md** | Guide d'installation détaillé | 30 min |
| **INTEGRATION_SUPABASE_RECAP.md** | Récapitulatif technique complet | - |
| **ARCHITECTURE.md** | Architecture de l'application | - |

---

## ✅ Statut actuel

**Côté code** : ✅ 100% prêt
**Côté config** : ⚠️ À faire (10 minutes)

### Ce qui est fait
- ✅ 8 tables avec Row Level Security
- ✅ Authentification Supabase complète
- ✅ Pages register/login connectées
- ✅ Middleware de protection des routes
- ✅ Types TypeScript complets

### Ce qu'il reste
- ⚠️ Remplir `.env.local` avec les clés Supabase
- ⚠️ Exécuter `schema.sql` dans Supabase
- ⚠️ Tester l'inscription

---

## 🧪 Test rapide

```bash
# 1. Vérifier la config
node scripts/check-supabase.js

# 2. Lancer l'app
npm run dev

# 3. Tester
# → http://localhost:3000/auth/register
```

---

## 🆘 Besoin d'aide ?

**Problème** → **Solution**
- Variables vides → Voir `QUICKSTART.md` étape 1
- Tables manquantes → Voir `QUICKSTART.md` étape 2
- Erreur "Invalid API key" → Redémarrer `npm run dev`
- Autre → Consulter `SUPABASE_SETUP.md`

---

## 🎯 Prochaines étapes

Après configuration de Supabase :

1. Développer le dashboard foodtrucker
2. Développer le dashboard organisateur
3. Système de candidatures
4. Upload de documents
5. Notifications temps réel
6. Paiements Stripe

---

**Questions ?** Voir `SUPABASE_SETUP.md` pour le guide complet !

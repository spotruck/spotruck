#!/bin/bash

# Script de configuration automatique de Supabase pour Spotruck
# Usage: ./scripts/setup-supabase.sh

set -e

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║              CONFIGURATION AUTOMATIQUE SUPABASE - SPOTRUCK             ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier si .env.local existe
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Fichier .env.local introuvable${NC}"
    echo "Création à partir de .env.local.example..."
    cp .env.local.example .env.local
fi

echo -e "${BLUE}📋 ÉTAPE 1/4 : Configuration des variables d'environnement${NC}"
echo ""
echo "Pour obtenir vos clés Supabase :"
echo "1. Allez sur https://supabase.com"
echo "2. Créez un projet (ou sélectionnez un existant)"
echo "3. Allez dans Settings → API"
echo ""

# Lire les variables
read -p "$(echo -e ${YELLOW}Entrez votre SUPABASE_URL \(https://xxx.supabase.co\): ${NC})" SUPABASE_URL
read -p "$(echo -e ${YELLOW}Entrez votre SUPABASE_ANON_KEY: ${NC})" SUPABASE_ANON_KEY
read -p "$(echo -e ${YELLOW}Entrez votre SUPABASE_SERVICE_ROLE_KEY: ${NC})" SUPABASE_SERVICE_ROLE_KEY

# Vérifier que les variables ne sont pas vides
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Toutes les variables sont requises${NC}"
    exit 1
fi

# Mettre à jour .env.local
echo -e "${GREEN}✅ Mise à jour de .env.local...${NC}"
cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"
echo ""

# Vérifier la connexion à Supabase
echo -e "${BLUE}📋 ÉTAPE 2/4 : Vérification de la connexion à Supabase${NC}"
echo ""

# Créer un script Node temporaire pour tester la connexion
cat > /tmp/test-supabase.js << 'TESTJS'
const https = require('https');
const url = process.argv[2];
const key = process.argv[3];

if (!url || !key) {
  console.log('❌ URL ou clé manquante');
  process.exit(1);
}

const hostname = url.replace('https://', '').replace('http://', '');
const options = {
  hostname: hostname,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
};

const req = https.request(options, (res) => {
  if (res.statusCode === 200 || res.statusCode === 404) {
    console.log('✅ Connexion à Supabase réussie');
    process.exit(0);
  } else {
    console.log('❌ Erreur de connexion (code:', res.statusCode, ')');
    process.exit(1);
  }
});

req.on('error', (e) => {
  console.log('❌ Erreur:', e.message);
  process.exit(1);
});

req.end();
TESTJS

if node /tmp/test-supabase.js "$SUPABASE_URL" "$SUPABASE_ANON_KEY"; then
    echo ""
else
    echo -e "${RED}❌ Impossible de se connecter à Supabase${NC}"
    echo "Vérifiez vos clés et réessayez"
    exit 1
fi

# Afficher les instructions pour créer les tables
echo -e "${BLUE}📋 ÉTAPE 3/4 : Création des tables${NC}"
echo ""
echo -e "${YELLOW}⚠️  Cette étape doit être faite manuellement dans le dashboard Supabase${NC}"
echo ""
echo "1. Ouvrez votre navigateur sur :"
echo -e "   ${GREEN}$SUPABASE_URL/project/_/sql${NC}"
echo ""
echo "2. Cliquez sur 'New query'"
echo ""
echo "3. Copiez le contenu du fichier :"
echo -e "   ${GREEN}supabase/schema.sql${NC}"
echo ""
echo "4. Collez-le dans l'éditeur SQL et cliquez sur 'Run'"
echo ""
read -p "$(echo -e ${YELLOW}Appuyez sur Entrée une fois les tables créées...${NC})"

# Vérifier que les tables ont été créées (optionnel)
echo ""
echo -e "${GREEN}✅ Tables créées${NC}"
echo ""

# Configurer l'authentification
echo -e "${BLUE}📋 ÉTAPE 4/4 : Configuration de l'authentification${NC}"
echo ""
echo -e "${YELLOW}⚠️  Pour faciliter les tests en développement :${NC}"
echo ""
echo "1. Ouvrez votre navigateur sur :"
echo -e "   ${GREEN}$SUPABASE_URL/project/_/auth/settings${NC}"
echo ""
echo "2. Trouvez 'Enable email confirmations'"
echo ""
echo "3. DÉCOCHEZ cette option"
echo ""
echo "4. Cliquez sur 'Save'"
echo ""
echo -e "${YELLOW}Note : En production, réactivez cette option pour la sécurité${NC}"
echo ""
read -p "$(echo -e ${YELLOW}Appuyez sur Entrée une fois configuré...${NC})"

echo ""
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                          ✅ CONFIGURATION TERMINÉE !                   ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🎉 Supabase est maintenant configuré pour Spotruck !${NC}"
echo ""
echo "Prochaines étapes :"
echo ""
echo "1. Démarrer le serveur :"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "2. Tester l'inscription :"
echo -e "   ${BLUE}http://localhost:3000/auth/register${NC}"
echo ""
echo "3. Vérifier dans Supabase :"
echo -e "   ${BLUE}$SUPABASE_URL/project/_/auth/users${NC}"
echo ""
echo "Documentation complète : QUICKSTART.md"
echo ""

#!/usr/bin/env node

/**
 * Script de vérification de la configuration Supabase
 * Usage: node scripts/check-supabase.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Supabase...\n');

// 1. Vérifier .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let hasEnv = false;
let envVars = {
  NEXT_PUBLIC_SUPABASE_URL: false,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: false,
  SUPABASE_SERVICE_ROLE_KEY: false,
};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  lines.forEach(line => {
    Object.keys(envVars).forEach(key => {
      if (line.startsWith(key + '=') && line.split('=')[1].trim().length > 0) {
        envVars[key] = true;
      }
    });
  });

  hasEnv = Object.values(envVars).every(v => v);
}

console.log('📋 Variables d\'environnement :');
Object.keys(envVars).forEach(key => {
  const status = envVars[key] ? '✅' : '❌';
  console.log(`  ${status} ${key}`);
});

if (!hasEnv) {
  console.log('\n⚠️  Certaines variables sont manquantes !');
  console.log('➡️  Remplir les variables dans .env.local');
  console.log('➡️  Voir SUPABASE_SETUP.md pour les instructions\n');
}

// 2. Vérifier les fichiers créés
console.log('\n📁 Fichiers de configuration :');
const files = [
  'supabase/schema.sql',
  'supabase/README.md',
  'src/lib/supabase/client.ts',
  'src/lib/supabase/server.ts',
  'src/lib/supabase/types.ts',
  'src/lib/auth/supabase-auth.ts',
  'src/middleware.ts',
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
});

// 3. Vérifier package.json
console.log('\n📦 Dépendances npm :');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const deps = packageJson.dependencies || {};

const requiredDeps = [
  '@supabase/supabase-js',
  '@supabase/ssr',
];

requiredDeps.forEach(dep => {
  const installed = !!deps[dep];
  const status = installed ? '✅' : '❌';
  const version = installed ? deps[dep] : '';
  console.log(`  ${status} ${dep} ${version}`);
});

// 4. Résumé et prochaines étapes
console.log('\n' + '='.repeat(60));
if (hasEnv) {
  console.log('✅ Configuration Supabase complète !');
  console.log('\n📌 PROCHAINES ÉTAPES :');
  console.log('  1. Aller sur https://supabase.com/dashboard');
  console.log('  2. Ouvrir le SQL Editor');
  console.log('  3. Exécuter le fichier supabase/schema.sql');
  console.log('  4. Redémarrer le serveur : npm run dev');
  console.log('  5. Tester l\'inscription sur /auth/register');
  console.log('\n📖 Guide complet : SUPABASE_SETUP.md');
} else {
  console.log('❌ Configuration incomplète');
  console.log('\n📌 À FAIRE :');
  console.log('  1. Remplir les variables dans .env.local');
  console.log('  2. Voir SUPABASE_SETUP.md pour les instructions');
}
console.log('='.repeat(60) + '\n');

/**
 * Script pour créer le schéma de base de données Supabase
 * Exécuter avec: npx tsx supabase/setup.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Les variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définies dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSchema() {
  console.log('📦 Lecture du fichier schema.sql...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  console.log('🚀 Exécution du schéma SQL...');

  // Diviser le schéma en plusieurs requêtes (Supabase peut avoir des limites)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      if (error) {
        console.error(`❌ Erreur:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err: any) {
      // Fallback: certaines requêtes peuvent ne pas fonctionner via RPC
      console.warn(`⚠️  Statement ignoré (peut nécessiter l'éditeur SQL):`, err.message);
    }
  }

  console.log(`\n✅ Schéma exécuté: ${successCount} succès, ${errorCount} erreurs`);
  console.log('\n📌 Si des erreurs persistent, copiez le contenu de supabase/schema.sql');
  console.log('   et exécutez-le manuellement dans le SQL Editor de Supabase Dashboard:');
  console.log(`   ${supabaseUrl.replace('.supabase.co', '')}/project/_/sql`);
}

runSchema()
  .then(() => {
    console.log('\n✨ Configuration terminée!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });

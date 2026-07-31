import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables Supabase manquantes:', {
      url: supabaseUrl ? '✓' : '✗',
      key: supabaseAnonKey ? '✓' : '✗'
    });
    throw new Error('Les variables d\'environnement Supabase ne sont pas configurées');
  }

  // Ne pas fournir d'implémentation `cookies` custom : createBrowserClient gère
  // déjà document.cookie correctement (encodage, chunking, expiration maxAge=0
  // pour la rotation des refresh tokens). Une implémentation maison ici avait
  // introduit un bug (maxAge: 0 traité comme absent) qui cassait la persistance
  // de session et déconnectait l'utilisateur après un refresh de token.
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

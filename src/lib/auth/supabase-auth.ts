/**
 * Authentification Supabase pour Spotruck
 */

import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/supabase/types';

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  user: AuthUser;
}

export interface AuthError {
  error: string;
}

/**
 * Inscription d'un nouvel utilisateur
 */
export async function signUp(
  email: string,
  password: string,
  businessName: string,
  firstName: string | undefined,
  lastName: string | undefined,
  role: UserRole
): Promise<AuthResult | AuthError> {
  console.log('🔵 signUp appelé avec:', { email, businessName, role });

  const supabase = createClient();
  console.log('🔵 Client Supabase créé');

  try {
    // 1. Créer le compte auth
    console.log('🔵 Tentative de création du compte auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          business_name: businessName,
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      console.error('❌ Erreur auth:', authError);
      return { error: authError.message };
    }

    console.log('✅ Compte auth créé:', authData.user?.id);

    if (!authData.user) {
      return { error: 'Erreur lors de la création du compte.' };
    }

    // 2. Créer le profil
    console.log('🔵 Tentative de création du profil...');
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: email,
      role: role,
    });

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      return { error: `Erreur profil: ${profileError.message}` };
    }
    console.log('✅ Profil créé');

    // 3. Créer l'entrée spécifique au rôle
    if (role === 'foodtrucker') {
      console.log('🔵 Tentative de création foodtrucker...');
      const { error: ftError } = await supabase.from('foodtruckers').insert({
        id: authData.user.id,
        nom_truck: businessName,
        prenom_gerant: firstName,
        nom_gerant: lastName,
        plan: 'free',
      });

      if (ftError) {
        console.error('❌ Erreur création foodtrucker:', ftError);
        return { error: `Erreur foodtrucker: ${ftError.message}` };
      }
      console.log('✅ Foodtrucker créé');
    } else {
      console.log('🔵 Tentative de création organisateur...');
      const { error: orgError } = await supabase.from('organisateurs').insert({
        id: authData.user.id,
        nom_organisation: businessName,
        prenom_responsable: firstName,
        nom_responsable: lastName,
        plan: 'gratuit',
      });

      if (orgError) {
        console.error('❌ Erreur création organisateur:', orgError);
        return { error: `Erreur organisateur: ${orgError.message}` };
      }
      console.log('✅ Organisateur créé');
    }

    return {
      user: {
        id: authData.user.id,
        email: email,
        role: role,
      },
    };
  } catch (err: any) {
    console.error('Erreur signUp:', err);
    return { error: err.message || 'Erreur inattendue lors de l\'inscription.' };
  }
}

/**
 * Connexion d'un utilisateur
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult | AuthError> {
  const supabase = createClient();

  try {
    // 1. Authentifier l'utilisateur
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: 'Email ou mot de passe incorrect.' };
    }

    if (!authData.user) {
      return { error: 'Erreur lors de la connexion.' };
    }

    // 2. Récupérer le profil pour obtenir le rôle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erreur récupération profil:', profileError);
      return { error: 'Profil introuvable.' };
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        role: profile.role as UserRole,
      },
    };
  } catch (err: any) {
    console.error('Erreur signIn:', err);
    return { error: err.message || 'Erreur inattendue lors de la connexion.' };
  }
}

/**
 * Déconnexion
 */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * Récupérer l'utilisateur connecté
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Récupérer le profil pour obtenir le rôle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role as UserRole,
    };
  } catch (err) {
    console.error('Erreur getCurrentUser:', err);
    return null;
  }
}

/**
 * Obtenir le chemin du dashboard selon le rôle
 */
export function getDashboardPath(role: UserRole): string {
  return role === 'foodtrucker' ? '/dashboard/foodtrucker' : '/dashboard/organisateur';
}

/**
 * Vérifier si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

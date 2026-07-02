/**
 * API Route pour l'inscription
 * Le trigger Supabase gère automatiquement la création du profil et des données liées
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, businessName, firstName, lastName, role } = body;

    console.log('🔵 API signup appelée avec:', {
      email,
      businessName,
      firstName,
      lastName,
      role,
      hasPassword: !!password
    });

    // Validation
    if (!email || !password || !businessName || !role) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur (le trigger Supabase gère tout le reste)
    console.log('🔵 Création du compte auth...');
    const supabase = await createClient();

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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (authError) {
      console.error('❌ Erreur auth complète:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        name: authError.name,
        email: email
      });

      // Message spécifique pour email déjà utilisé
      if (authError.message.toLowerCase().includes('already') ||
          authError.message.toLowerCase().includes('exists') ||
          authError.message.toLowerCase().includes('registered')) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error('❌ Pas d\'utilisateur créé');
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    console.log('✅ Compte auth créé:', userId);
    console.log('✅ Trigger Supabase a créé le profil et les données');

    // Connexion automatique
    console.log('🔵 Connexion automatique...');
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      console.error('⚠️ Erreur connexion auto:', sessionError);
      // On ne renvoie pas d'erreur, l'utilisateur peut se connecter manuellement
    }

    console.log('✅ Inscription complète !');

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email,
        role: role,
      },
      session: sessionData?.session || null,
    });

  } catch (error: any) {
    console.error('❌ Erreur inattendue:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Types générés pour la base de données Supabase
 */

export type UserRole = 'foodtrucker' | 'organisateur';

export interface Profile {
  id: string;
  role: UserRole;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Foodtrucker {
  id: string;
  nom_truck: string;
  prenom_gerant?: string;
  nom_gerant?: string;
  description?: string;
  ville?: string;
  cuisines?: string[];
  instagram?: string;
  site_web?: string;
  telephone?: string;
  longueur?: number;
  largeur?: number;
  consommation_electrique?: number;
  type_prise?: string;
  amperage?: number;
  autonomie_sans_elec?: boolean;
  plan: 'free' | 'pro' | 'premium' | 'saison';
  plan_expire_at?: string;
  note_moyenne?: number;
  nombre_avis?: number;
  created_at: string;
  updated_at: string;
}

export interface Organisateur {
  id: string;
  nom_organisation: string;
  prenom_responsable?: string;
  nom_responsable?: string;
  type_organisation?: 'particulier' | 'association' | 'entreprise' | 'mairie' | 'agence';
  siret?: string;
  adresse?: string;
  plan: 'gratuit' | 'pro_event' | 'pro_semestriel' | 'pro_annuel';
  plan_expire_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Evenement {
  id: string;
  organisateur_id: string;
  titre: string;
  type: string;
  description?: string;
  date_debut: string;
  date_fin?: string;
  heure_debut?: string;
  heure_fin?: string;
  lieu: string;
  ville?: string;
  region?: string;
  visiteurs_attendus?: number;
  nombre_trucks?: number;
  modele_financier?: 'droit_de_place' | 'privatisation' | 'pourcentage_ca' | 'mixte';
  budget_organisateur?: number;
  budget_truck?: number;
  commission_rate?: number;
  droit_de_place?: number;
  pourcentage_ca?: number;
  electricite_disponible?: boolean;
  type_prise?: string;
  amperage?: number;
  surface_disponible?: number;
  acces_vehicule?: boolean;
  documents_requis?: string[];
  note_minimum?: number;
  exclusivite_cuisine?: boolean;
  instructions_candidature?: string;
  mode_candidature?: 'spotruck' | 'email' | 'lien_externe' | 'courrier';
  contact_candidature?: string;
  date_limite_candidature?: string;
  statut: 'brouillon' | 'publie' | 'complet' | 'termine' | 'annule';
  source?: string;
  url_source?: string;
  created_at: string;
  updated_at: string;
}

export interface Candidature {
  id: string;
  evenement_id: string;
  foodtrucker_id: string;
  message?: string;
  statut: 'en_attente' | 'acceptee' | 'refusee' | 'annulee';
  message_reponse?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  foodtrucker_id: string;
  type: 'kbis' | 'haccp' | 'rc_pro' | 'conformite_gaz' | 'conformite_electrique' | 'controle_hygiene';
  nom_fichier?: string;
  url?: string;
  date_expiration?: string;
  created_at: string;
  updated_at: string;
}

export interface Avis {
  id: string;
  candidature_id: string;
  auteur_id: string;
  cible_id: string;
  note_globale: number;
  commentaire?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  titre: string;
  message?: string;
  lu: boolean;
  lien?: string;
  created_at: string;
}

// Types pour les relations
export interface FoodtruckerWithProfile extends Foodtrucker {
  profile?: Profile;
}

export interface OrganisateurWithProfile extends Organisateur {
  profile?: Profile;
}

export interface EvenementWithOrganisateur extends Evenement {
  organisateur?: OrganisateurWithProfile;
}

export interface CandidatureWithRelations extends Candidature {
  evenement?: EvenementWithOrganisateur;
  foodtrucker?: FoodtruckerWithProfile;
}

-- ══════════════════════════════════════════════════════
-- SPOTRUCK DATABASE SCHEMA
-- ══════════════════════════════════════════════════════

-- Table profiles (commune aux deux rôles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('foodtrucker', 'organisateur')),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table foodtruckers
CREATE TABLE IF NOT EXISTS foodtruckers (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  nom_truck TEXT NOT NULL,
  prenom_gerant TEXT,
  nom_gerant TEXT,
  description TEXT,
  ville TEXT,
  cuisines TEXT[], -- tableau de types de cuisine
  instagram TEXT,
  site_web TEXT,
  telephone TEXT,
  longueur DECIMAL,
  largeur DECIMAL,
  consommation_electrique DECIMAL,
  type_prise TEXT,
  amperage INTEGER,
  autonomie_sans_elec BOOLEAN DEFAULT FALSE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium', 'saison')),
  plan_expire_at TIMESTAMP WITH TIME ZONE,
  note_moyenne DECIMAL DEFAULT 0,
  nombre_avis INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table organisateurs
CREATE TABLE IF NOT EXISTS organisateurs (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  nom_organisation TEXT NOT NULL,
  prenom_responsable TEXT,
  nom_responsable TEXT,
  type_organisation TEXT CHECK (type_organisation IN ('particulier', 'association', 'entreprise', 'mairie', 'agence')),
  siret TEXT,
  adresse TEXT,
  plan TEXT DEFAULT 'gratuit' CHECK (plan IN ('gratuit', 'pro_event', 'pro_semestriel', 'pro_annuel')),
  plan_expire_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table evenements
CREATE TABLE IF NOT EXISTS evenements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organisateur_id UUID REFERENCES organisateurs(id),
  titre TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE,
  heure_debut TIME,
  heure_fin TIME,
  lieu TEXT NOT NULL,
  ville TEXT,
  region TEXT,
  visiteurs_attendus INTEGER,
  nombre_trucks INTEGER DEFAULT 1,
  modele_financier TEXT CHECK (modele_financier IN ('droit_de_place', 'privatisation', 'pourcentage_ca', 'mixte')),
  budget_organisateur DECIMAL, -- prix saisi par l'organisateur
  budget_truck DECIMAL, -- prix vu par le truck (après commission)
  commission_rate DECIMAL DEFAULT 0.13,
  droit_de_place DECIMAL,
  pourcentage_ca DECIMAL,
  electricite_disponible BOOLEAN DEFAULT FALSE,
  type_prise TEXT,
  amperage INTEGER,
  surface_disponible DECIMAL,
  acces_vehicule BOOLEAN DEFAULT TRUE,
  documents_requis TEXT[],
  note_minimum DECIMAL DEFAULT 0,
  exclusivite_cuisine BOOLEAN DEFAULT FALSE,
  instructions_candidature TEXT,
  mode_candidature TEXT CHECK (mode_candidature IN ('spotruck', 'email', 'lien_externe', 'courrier')),
  contact_candidature TEXT,
  date_limite_candidature DATE,
  statut TEXT DEFAULT 'publie' CHECK (statut IN ('brouillon', 'publie', 'complet', 'termine', 'annule')),
  source TEXT DEFAULT 'spotruck',
  url_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table candidatures
CREATE TABLE IF NOT EXISTS candidatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evenement_id UUID REFERENCES evenements(id) ON DELETE CASCADE,
  foodtrucker_id UUID REFERENCES foodtruckers(id) ON DELETE CASCADE,
  message TEXT,
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'refusee', 'annulee')),
  message_reponse TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(evenement_id, foodtrucker_id)
);

-- Table documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  foodtrucker_id UUID REFERENCES foodtruckers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('kbis', 'haccp', 'rc_pro', 'conformite_gaz', 'conformite_electrique', 'controle_hygiene')),
  nom_fichier TEXT,
  url TEXT,
  date_expiration DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table avis
CREATE TABLE IF NOT EXISTS avis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidature_id UUID REFERENCES candidatures(id) ON DELETE CASCADE,
  auteur_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cible_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note_globale DECIMAL NOT NULL CHECK (note_globale >= 0 AND note_globale <= 5),
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT,
  lu BOOLEAN DEFAULT FALSE,
  lien TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE foodtruckers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════
-- POLICIES
-- ══════════════════════════════════════════════════════

-- Profiles: users can view and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Foodtruckers: can view and manage their own data
DROP POLICY IF EXISTS "Foodtruckers can view own data" ON foodtruckers;
CREATE POLICY "Foodtruckers can view own data" ON foodtruckers
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Foodtruckers can update own data" ON foodtruckers;
CREATE POLICY "Foodtruckers can update own data" ON foodtruckers
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Foodtruckers can insert own data" ON foodtruckers;
CREATE POLICY "Foodtruckers can insert own data" ON foodtruckers
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view foodtruckers profiles" ON foodtruckers;
CREATE POLICY "Public can view foodtruckers profiles" ON foodtruckers
  FOR SELECT USING (true);

-- Organisateurs: can view and manage their own data
DROP POLICY IF EXISTS "Organisateurs can view own data" ON organisateurs;
CREATE POLICY "Organisateurs can view own data" ON organisateurs
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Organisateurs can update own data" ON organisateurs;
CREATE POLICY "Organisateurs can update own data" ON organisateurs
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Organisateurs can insert own data" ON organisateurs;
CREATE POLICY "Organisateurs can insert own data" ON organisateurs
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Evenements: public events visible by all, organisateur manages their own
DROP POLICY IF EXISTS "Public events visible" ON evenements;
CREATE POLICY "Public events visible" ON evenements
  FOR SELECT USING (statut = 'publie');

DROP POLICY IF EXISTS "Organisateur manages own events" ON evenements;
CREATE POLICY "Organisateur manages own events" ON evenements
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM organisateurs WHERE id = organisateur_id
    )
  );

-- Candidatures: foodtrucker manages own, organisateur sees candidatures for their events
DROP POLICY IF EXISTS "Foodtrucker manages own candidatures" ON candidatures;
CREATE POLICY "Foodtrucker manages own candidatures" ON candidatures
  FOR ALL USING (auth.uid() = foodtrucker_id);

DROP POLICY IF EXISTS "Organisateur sees candidatures for own events" ON candidatures;
CREATE POLICY "Organisateur sees candidatures for own events" ON candidatures
  FOR SELECT USING (
    auth.uid() IN (
      SELECT organisateur_id FROM evenements WHERE id = evenement_id
    )
  );

DROP POLICY IF EXISTS "Organisateur updates candidatures for own events" ON candidatures;
CREATE POLICY "Organisateur updates candidatures for own events" ON candidatures
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT organisateur_id FROM evenements WHERE id = evenement_id
    )
  );

-- Documents: foodtrucker manages own documents
DROP POLICY IF EXISTS "Foodtrucker manages own documents" ON documents;
CREATE POLICY "Foodtrucker manages own documents" ON documents
  FOR ALL USING (auth.uid() = foodtrucker_id);

-- Avis: users can view all, but only create for candidatures they're involved in
DROP POLICY IF EXISTS "Public can view avis" ON avis;
CREATE POLICY "Public can view avis" ON avis
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create avis for own candidatures" ON avis;
CREATE POLICY "Users can create avis for own candidatures" ON avis
  FOR INSERT WITH CHECK (auth.uid() = auteur_id);

-- Notifications: users can view and update their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_foodtruckers_updated_at ON foodtruckers;
CREATE TRIGGER update_foodtruckers_updated_at BEFORE UPDATE ON foodtruckers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organisateurs_updated_at ON organisateurs;
CREATE TRIGGER update_organisateurs_updated_at BEFORE UPDATE ON organisateurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evenements_updated_at ON evenements;
CREATE TRIGGER update_evenements_updated_at BEFORE UPDATE ON evenements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidatures_updated_at ON candidatures;
CREATE TRIGGER update_candidatures_updated_at BEFORE UPDATE ON candidatures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ══════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_evenements_statut ON evenements(statut);
CREATE INDEX IF NOT EXISTS idx_evenements_date_debut ON evenements(date_debut);
CREATE INDEX IF NOT EXISTS idx_evenements_ville ON evenements(ville);
CREATE INDEX IF NOT EXISTS idx_evenements_organisateur_id ON evenements(organisateur_id);
CREATE INDEX IF NOT EXISTS idx_candidatures_evenement_id ON candidatures(evenement_id);
CREATE INDEX IF NOT EXISTS idx_candidatures_foodtrucker_id ON candidatures(foodtrucker_id);
CREATE INDEX IF NOT EXISTS idx_candidatures_statut ON candidatures(statut);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);

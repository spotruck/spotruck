-- ══════════════════════════════════════════════════════
-- AMÉLIORATIONS ERGONOMIQUES — pièces jointes candidatures
-- + photos foodtruckers (photo du truck, photos des plats)
-- Exécutez ce script dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Colonnes candidatures : pièces jointes envoyées
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE candidatures
  ADD COLUMN IF NOT EXISTS pieces_jointes JSONB DEFAULT '[]'::jsonb;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. Colonnes foodtruckers : photo du truck + photos des plats
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE foodtruckers
  ADD COLUMN IF NOT EXISTS photo_truck_url TEXT,
  ADD COLUMN IF NOT EXISTS photos_plats TEXT[] DEFAULT '{}';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. Bucket de stockage pour les pièces jointes / photos
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSERT INTO storage.buckets (id, name, public)
VALUES ('spotruck-uploads', 'spotruck-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Un foodtrucker peut uploader dans son propre dossier (préfixe = son user id)
DROP POLICY IF EXISTS "Foodtrucker uploads own files" ON storage.objects;
CREATE POLICY "Foodtrucker uploads own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'spotruck-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Foodtrucker manages own files" ON storage.objects;
CREATE POLICY "Foodtrucker manages own files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'spotruck-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture publique (nécessaire pour afficher les photos/pièces jointes via URL publique)
DROP POLICY IF EXISTS "Public can view spotruck uploads" ON storage.objects;
CREATE POLICY "Public can view spotruck uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'spotruck-uploads');

-- Migration: 019_create_profile_images_bucket
-- Description: Create profile-images storage bucket and configure Row Level Security (RLS) policies

-- 1. Create the profile-images bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "Allow public read access to profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own profile images" ON storage.objects;

-- 3. Create SELECT policy (Allow public read access to all profile images)
CREATE POLICY "Allow public read access to profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- 4. Create INSERT policy (Allow authenticated users to upload to their own folder)
CREATE POLICY "Allow users to upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Create UPDATE policy (Allow authenticated users to update files in their own folder)
CREATE POLICY "Allow users to update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Create DELETE policy (Allow authenticated users to delete files in their own folder)
CREATE POLICY "Allow users to delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

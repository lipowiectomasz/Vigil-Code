-- Migration: Create Storage Bucket and Policies
-- Description: Sets up storage bucket with RLS policies for file uploads

-- Create storage bucket (if not using Supabase Dashboard)
-- Note: Usually created via Dashboard, but can be done via SQL

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access to files
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = '{bucket_name}'
);

-- Policy: Authenticated users can upload files
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = '{bucket_name}'
    AND auth.uid()::text = (storage.foldername(name))[1]
    -- Files must be in folder named after user's UID: {uid}/filename.ext
);

-- Policy: Users can update their own files
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;

CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = '{bucket_name}'
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = '{bucket_name}'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own files
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = '{bucket_name}'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Common storage patterns:
-- 1. Public bucket (avatars, logos):
--    SELECT: bucket_id = 'public'
--    INSERT: auth.uid() IS NOT NULL
--
-- 2. User-specific folders:
--    ALL: auth.uid()::text = (storage.foldername(name))[1]
--
-- 3. Organization-based:
--    ALL: (storage.foldername(name))[1] IN (
--           SELECT org_id::text FROM user_orgs WHERE user_id = auth.uid()
--         )

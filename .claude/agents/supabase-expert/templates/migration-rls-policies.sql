-- Migration: Add RLS Policies for {table_name}
-- Description: Row Level Security policies for {table_name} table

-- Policy: SELECT (Read Access)
-- Who can view rows in this table
DROP POLICY IF EXISTS "{policy_name_select}" ON public.{table_name};

CREATE POLICY "{policy_name_select}"
ON public.{table_name}
FOR SELECT
TO authenticated
USING (
    -- USING clause: determines which rows are visible
    -- Example: auth.uid() = user_id (user can see their own rows)
    -- Example: true (everyone can see all rows)
    {condition}
);

-- Policy: INSERT (Create Access)
-- Who can create new rows
DROP POLICY IF EXISTS "{policy_name_insert}" ON public.{table_name};

CREATE POLICY "{policy_name_insert}"
ON public.{table_name}
FOR INSERT
TO authenticated
WITH CHECK (
    -- WITH CHECK clause: validates data being inserted
    -- Example: auth.uid() IS NOT NULL (user must be authenticated)
    -- Example: auth.uid() = user_id (user_id must match authenticated user)
    {condition}
);

-- Policy: UPDATE (Modify Access)
-- Who can update existing rows
DROP POLICY IF EXISTS "{policy_name_update}" ON public.{table_name};

CREATE POLICY "{policy_name_update}"
ON public.{table_name}
FOR UPDATE
TO authenticated
USING (
    -- USING: determines which rows can be updated
    -- Example: auth.uid() = user_id (user can only update their own rows)
    {condition_using}
)
WITH CHECK (
    -- WITH CHECK: validates the updated data
    -- Example: auth.uid() = user_id (user_id cannot be changed to someone else)
    {condition_check}
);

-- Policy: DELETE (Remove Access)
-- Who can delete rows
DROP POLICY IF EXISTS "{policy_name_delete}" ON public.{table_name};

CREATE POLICY "{policy_name_delete}"
ON public.{table_name}
FOR DELETE
TO authenticated
USING (
    -- USING: determines which rows can be deleted
    -- Example: auth.uid() = user_id (user can only delete their own rows)
    {condition}
);

-- Common RLS Patterns:
-- 1. Public read, authenticated write:
--    SELECT: USING (true)
--    INSERT: WITH CHECK (auth.uid() IS NOT NULL)
--
-- 2. User owns data:
--    ALL: USING (auth.uid() = user_id)
--         WITH CHECK (auth.uid() = user_id)
--
-- 3. Admin access:
--    ALL: USING (auth.jwt() ->> 'role' = 'admin')
--
-- 4. Organization-based:
--    ALL: USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()))

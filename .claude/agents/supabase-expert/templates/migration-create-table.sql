-- Migration: Create {TableName} Table
-- Description: Creates the {table_name} table with standard columns, indexes, triggers, and RLS

CREATE TABLE IF NOT EXISTS public.{table_name} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Add your columns here
    -- Example: name TEXT NOT NULL,
    -- Example: description TEXT,
    -- Example: user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_{table_name}_{column} ON public.{table_name}({column});
-- Example: CREATE INDEX IF NOT EXISTS idx_{table_name}_user_id ON public.{table_name}(user_id);

-- Create trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS on_{table_name}_updated ON public.{table_name};
CREATE TRIGGER on_{table_name}_updated
    BEFORE UPDATE ON public.{table_name}
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Grant permissions to all roles
GRANT ALL ON TABLE public.{table_name} TO postgres, anon, authenticated, service_role;

-- Enable Row Level Security
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- Note: Create RLS policies in a separate migration file
-- See: migration-rls-policies.sql template

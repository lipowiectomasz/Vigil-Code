-- Migration: Create {function_name} Function
-- Description: Creates a PostgreSQL function for {purpose}

CREATE OR REPLACE FUNCTION public.{function_name}()
RETURNS TRIGGER AS $$
BEGIN
    -- Function logic here
    -- Example for updated_at trigger:
    -- NEW.updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION public.{function_name}() TO postgres, anon, authenticated, service_role;

-- Example usage in trigger:
-- DROP TRIGGER IF EXISTS on_table_updated ON public.table_name;
-- CREATE TRIGGER on_table_updated
--     BEFORE UPDATE ON public.table_name
--     FOR EACH ROW EXECUTE FUNCTION {function_name}();

# Supabase Documentation Resources

## Official Documentation

### Core Documentation
- **Main Docs**: https://supabase.com/docs
- **Getting Started**: https://supabase.com/docs/guides/getting-started
- **CLI Reference**: https://supabase.com/docs/reference/cli/introduction

### Database & Migrations
- **Database Overview**: https://supabase.com/docs/guides/database/overview
- **Migrations**: https://supabase.com/docs/guides/cli/managing-environments
- **PostgreSQL**: https://supabase.com/docs/guides/database/postgres/configuration

### Edge Functions
- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Deno Runtime**: https://supabase.com/docs/guides/functions/quickstart
- **Invoking Functions**: https://supabase.com/docs/guides/functions/deploy

### Row Level Security (RLS)
- **RLS Overview**: https://supabase.com/docs/guides/auth/row-level-security
- **RLS Policies**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **Security Best Practices**: https://supabase.com/docs/guides/auth/managing-user-data

### Authentication
- **Auth Overview**: https://supabase.com/docs/guides/auth
- **Auth Helpers**: https://supabase.com/docs/guides/auth/auth-helpers
- **Server-Side Auth**: https://supabase.com/docs/guides/auth/server-side

### Storage
- **Storage**: https://supabase.com/docs/guides/storage
- **Storage Policies**: https://supabase.com/docs/guides/storage/security/access-control

## Critical API Information

### Migration Standards

**File Naming Convention:**
```
{YYYYMMDDHHMMSS}_{descriptive_name}.sql
```

**Example:**
```
20251204120000_create_products_table.sql
20251204121500_add_products_rls_policies.sql
20251204123000_create_handle_updated_at_function.sql
```

**Key Principles:**
1. **Idempotency**: Always use `IF NOT EXISTS`, `ON CONFLICT`
2. **One Table Per File**: Separate migrations for each table
3. **Ordering**: Functions/types before tables, dependencies first
4. **Permissions**: Always grant after creating objects

### Edge Functions Structure

**Location:** `supabase/volumes/functions/{function-name}/index.ts`

**Standard Template:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Your logic here

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### RLS Policy Patterns

**SELECT Policy (Read Access):**
```sql
CREATE POLICY "policy_name"
ON public.table_name
FOR SELECT
TO authenticated
USING (
    -- Condition that determines if row is visible
    auth.uid() = user_id
);
```

**INSERT Policy (Write Access):**
```sql
CREATE POLICY "policy_name"
ON public.table_name
FOR INSERT
TO authenticated
WITH CHECK (
    -- Condition that validates new data
    auth.uid() IS NOT NULL
);
```

**UPDATE Policy (Modify Access):**
```sql
CREATE POLICY "policy_name"
ON public.table_name
FOR UPDATE
TO authenticated
USING (
    -- Who can update (must own the row)
    auth.uid() = user_id
)
WITH CHECK (
    -- What they can update to (must still own it)
    auth.uid() = user_id
);
```

**DELETE Policy:**
```sql
CREATE POLICY "policy_name"
ON public.table_name
FOR DELETE
TO authenticated
USING (
    -- Who can delete (must own the row)
    auth.uid() = user_id
);
```

### Table Creation Template

```sql
-- Migration: Create {TableName} Table

CREATE TABLE IF NOT EXISTS public.{table_name} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- columns here
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_{table_name}_{column} ON public.{table_name}({column});

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS on_{table_name}_updated ON public.{table_name};
CREATE TRIGGER on_{table_name}_updated
    BEFORE UPDATE ON public.{table_name}
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Grant permissions
GRANT ALL ON TABLE public.{table_name} TO postgres, anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;
```

### Function/Trigger Template

```sql
-- Migration: Create {function_name} function

CREATE OR REPLACE FUNCTION public.{function_name}()
RETURNS TRIGGER AS $$
BEGIN
    -- function logic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.{function_name}() TO postgres, anon, authenticated, service_role;
```

## Common Patterns

### Handle Updated At Trigger

**Function (create once):**
```sql
-- Migration: 20251204110000_create_handle_updated_at_function.sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO postgres, anon, authenticated, service_role;
```

**Usage (per table):**
```sql
DROP TRIGGER IF EXISTS on_{table_name}_updated ON public.{table_name};
CREATE TRIGGER on_{table_name}_updated
    BEFORE UPDATE ON public.{table_name}
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### Foreign Key Relationships

```sql
-- Add foreign key
ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_user_id
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE CASCADE;

-- Create index for foreign key (performance)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
```

### Enum Types

```sql
-- Create enum type
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered');

-- Use in table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status order_status NOT NULL DEFAULT 'pending'
);
```

## Environment Variables

Edge Functions have access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key (use carefully!)
- `SUPABASE_ANON_KEY` - Public anonymous key

## Testing & Development

### Local Development

```bash
# Start local Supabase
supabase start

# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

### Testing Edge Functions

```bash
# Serve functions locally
supabase functions serve

# Invoke function
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
```

## Security Best Practices

1. **Always Enable RLS**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. **Use Service Role Sparingly**: Only in Edge Functions for admin operations
3. **Validate User Input**: Never trust client data
4. **Use HTTPS Only**: Never expose service role key in frontend
5. **Audit Policies Regularly**: Review RLS policies for security holes

## Performance Optimization

### Indexes

```sql
-- Index for exact matches
CREATE INDEX idx_users_email ON public.users(email);

-- Index for text search
CREATE INDEX idx_products_name_gin ON public.products USING GIN(to_tsvector('english', name));

-- Composite index
CREATE INDEX idx_orders_user_created ON public.orders(user_id, created_at DESC);
```

### Queries

```sql
-- Use EXPLAIN ANALYZE to check query performance
EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'electronics';

-- Use materialized views for complex queries
CREATE MATERIALIZED VIEW product_stats AS
SELECT category, COUNT(*) as count
FROM products
GROUP BY category;
```

## Common Issues & Solutions

### Issue: "relation does not exist"
**Solution**: Run migrations in correct order, check dependencies

### Issue: RLS blocking all access
**Solution**: Check USING clause, ensure policy matches user context

### Issue: Edge Function timeout
**Solution**: Optimize database queries, use indexes, consider caching

### Issue: Migration conflicts
**Solution**: Use idempotent SQL (`IF NOT EXISTS`, `DROP IF EXISTS`)

## GitHub & Community

- **GitHub**: https://github.com/supabase/supabase
- **Discussions**: https://github.com/supabase/supabase/discussions
- **Discord**: https://discord.supabase.com

---

**Last Updated**: 2025-01-04
**Maintained For**: Vigil Guard Project
**Supabase Compatibility**: Universal

# Supabase Expert Agent

## Overview

This agent is a specialized assistant for working with **Supabase** - database migrations, Edge Functions, Row Level Security (RLS), PostgreSQL, authentication, and storage. It follows OODA (Observe, Orient, Decide, Act) protocol for structured decision-making.

## Quick Start

### Using the Agent

The agent can be invoked via the Task tool in Claude Code:

```
Task(
  prompt: "You are supabase-expert. Create migration for products table with RLS.",
  subagent_type: "general-purpose"
)
```

Or through the Master Orchestrator:
```bash
/expert Create Supabase migration for user authentication
→ Orchestrator detects need for supabase-expert
→ Invokes expert with appropriate context
```

### What This Agent Knows

1. **Supabase Migrations**
   - Idempotent SQL migrations
   - Timestamp-based naming (YYYYMMDDHHMMSS)
   - One table per file pattern
   - Migration ordering and dependencies

2. **Edge Functions (Deno Runtime)**
   - TypeScript Edge Functions
   - Supabase client integration
   - CORS handling
   - Error handling patterns

3. **Row Level Security (RLS)**
   - USING clauses for SELECT/UPDATE/DELETE
   - WITH CHECK clauses for INSERT/UPDATE
   - Policy patterns and best practices
   - Security considerations

4. **PostgreSQL Advanced**
   - Functions and triggers
   - Indexes and performance optimization
   - Permissions and grants
   - Database best practices

## File Structure

```
.claude/agents/supabase-expert/
├── README.md                           # This file
├── AGENT.md                           # Complete agent knowledge base (543 lines)
├── config.json                        # Agent configuration
└── templates/
    ├── migration-create-table.sql     # Table creation template
    ├── migration-create-function.sql  # Database function template
    ├── migration-rls-policies.sql     # RLS policies template
    ├── edge-function.ts               # Edge Function template
    └── storage-bucket-policy.sql      # Storage bucket template
```

## Common Use Cases

### 1. Create Database Migration

**Task**: Create idempotent migration for new table

**Solution**: Follow migration standards from AGENT.md

```sql
-- supabase/migrations/20251204120000_create_products_table.sql
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

GRANT ALL ON TABLE public.products TO postgres, anon, authenticated, service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
```

**Template**: `templates/migration-create-table.sql`

---

### 2. Create Edge Function

**Task**: Build Edge Function for database operations

**Solution**: Deno TypeScript with Supabase client

```typescript
// supabase/volumes/functions/get-products/index.ts
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

    const { data, error } = await supabaseClient
      .from('products')
      .select('*')

    if (error) throw error

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

**Template**: `templates/edge-function.ts`

---

### 3. Add RLS Policies

**Task**: Secure table with Row Level Security

**Solution**: USING and WITH CHECK clauses

```sql
-- supabase/migrations/20251204130000_add_products_rls_policies.sql
DROP POLICY IF EXISTS "Users can view all products" ON public.products;

CREATE POLICY "Users can view all products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert own products" ON public.products;

CREATE POLICY "Users can insert own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
```

**Template**: `templates/migration-rls-policies.sql`

---

### 4. Create Database Function

**Task**: Add PostgreSQL function for business logic

**Solution**: Separate migration with proper grants

```sql
-- supabase/migrations/20251204110000_create_handle_updated_at_function.sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO postgres, anon, authenticated, service_role;
```

**Template**: `templates/migration-create-function.sql`

---

## Resources

### Documentation
- **Supabase Resources**: `.claude/docs/supabase-resources.md`
- **Agent Knowledge**: `AGENT.md` (543 lines)
- **Official Docs**: https://supabase.com/docs

### Project Standards
- Migration naming: `YYYYMMDDHHMMSS_{descriptive_name}.sql`
- Edge Functions location: `supabase/volumes/functions/`
- RLS policies: Separate migration files
- Idempotency: Always use `IF NOT EXISTS`, `ON CONFLICT`

## Decision Tree

When working on a task, follow this decision tree:

```
Task received
    ↓
Is it about database schema?
    ├─ YES → Create migration with idempotent SQL
    │         Template: migration-create-table.sql or migration-create-function.sql
    │
    └─ NO
        ↓
    Is it about API/database operations?
        ├─ YES → Create Edge Function with Supabase client
        │         Template: edge-function.ts
        │
        └─ NO
            ↓
        Is it about security/permissions?
            ├─ YES → Add RLS policies
            │         Template: migration-rls-policies.sql
            │
            └─ NO → Consult AGENT.md or ask user for clarification
```

## OODA Protocol

All actions follow the OODA loop (defined in AGENT.md):

1. **🔍 OBSERVE** - Read existing migrations, check patterns
2. **🧭 ORIENT** - Evaluate approach options, assess confidence
3. **🎯 DECIDE** - Choose action with reasoning, define success criteria
4. **▶️ ACT** - Execute with idempotency, update progress

## Critical Rules

### ❌ NEVER DO

1. Create migrations without timestamps in filename
2. Edit existing migration files (create new rollback migration instead)
3. Skip idempotency checks (`IF NOT EXISTS`, `ON CONFLICT`)
4. Forget to grant permissions after creating functions/tables
5. Create RLS policies without testing USING/WITH CHECK clauses

### ✅ ALWAYS DO

1. Use timestamp naming: `YYYYMMDDHHMMSS_{description}.sql`
2. One table per migration file
3. Separate files for functions, triggers, and RLS policies
4. Add indexes for foreign keys and frequently queried columns
5. Enable RLS for all tables with user data
6. Test Edge Functions with CORS preflight requests

## Examples from Projects

### Real Implementation: Product Management

**Migrations created:**
1. `20251128175829_create_products_table.sql` - Table schema
2. `20251128180000_create_handle_updated_at_function.sql` - Trigger function
3. `20251202135412_add_products_rls_policies.sql` - Security policies

**Edge Function:**
- `supabase/volumes/functions/get-products/index.ts` - Database operations

**Key techniques used:**
1. Idempotent migrations with `IF NOT EXISTS`
2. Timestamp-based ordering
3. Separate files for different concerns
4. CORS handling in Edge Functions
5. Service role key for admin operations

---

## Troubleshooting

### Issue: Migration fails with "already exists"

**Cause**: Missing `IF NOT EXISTS` clause

**Solution**: Always use idempotent SQL
```sql
-- ❌ WRONG
CREATE TABLE public.products (...);

-- ✅ CORRECT
CREATE TABLE IF NOT EXISTS public.products (...);
```

---

### Issue: Edge Function CORS errors

**Cause**: Missing OPTIONS handler or CORS headers

**Solution**: Add CORS preflight handling
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```

---

### Issue: RLS policy denies all access

**Cause**: Incorrect USING clause or missing WITH CHECK

**Solution**: Test policies with specific user context
```sql
-- For SELECT: USING clause determines visibility
USING (auth.uid() = user_id)

-- For INSERT/UPDATE: WITH CHECK validates new data
WITH CHECK (auth.uid() = user_id)
```

---

## Version History

- **1.0.0** (2025-01-04) - Initial agent creation
  - Complete Supabase knowledge base (543 lines)
  - OODA Protocol integration
  - Migration standards and templates
  - Edge Functions patterns
  - RLS security best practices

---

## Contributing

To improve this agent:

1. **Add new templates** in `templates/` directory
2. **Update AGENT.md** with new patterns or edge cases
3. **Add examples** from real project implementations
4. **Update resources** in `.claude/docs/supabase-resources.md`

---

**Maintained By**: Vigil Guard Team
**Last Updated**: 2025-01-04
**Agent Version**: 1.0.0
**Supabase Compatibility**: Universal (all versions)

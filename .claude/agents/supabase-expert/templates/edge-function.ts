// Supabase Edge Function: {function-name}
// Description: {description}
// Location: supabase/volumes/functions/{function-name}/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (admin access)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body (if POST/PUT/PATCH)
    const { data: requestData } = req.method !== 'GET'
      ? await req.json()
      : { data: null }

    // Example: Database operation
    const { data, error } = await supabaseClient
      .from('table_name')
      .select('*')
      // .insert(requestData)
      // .update(requestData).eq('id', id)
      // .delete().eq('id', id)

    if (error) throw error

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    )

  } catch (error) {
    // Return error response
    console.error('Function error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    )
  }
})

// Example usage from frontend:
/*
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' }
})
*/

// Local testing:
/*
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key":"value"}'
*/

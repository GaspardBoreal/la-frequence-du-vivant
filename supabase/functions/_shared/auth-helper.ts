// Shared authentication helper for edge functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates the authorization header and returns the authenticated user
 * @param req - The incoming request
 * @returns Object with user data or error response
 */
export async function validateAuth(req: Request): Promise<{
  user: any | null;
  isAdmin: boolean;
  supabase: any;
  errorResponse: Response | null;
}> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      isAdmin: false,
      supabase: null,
      errorResponse: new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // Validate the JWT token and get claims
  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  
  if (claimsError || !claimsData?.claims) {
    return {
      user: null,
      isAdmin: false,
      supabase: null,
      errorResponse: new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const userId = claimsData.claims.sub;

  // Check if user is admin using the RPC function
  const { data: isAdmin } = await supabase.rpc('check_is_admin_user', { check_user_id: userId });

  return {
    user: { id: userId, email: claimsData.claims.email },
    isAdmin: !!isAdmin,
    supabase,
    errorResponse: null
  };
}

/**
 * Creates a service role Supabase client for privileged operations
 */
export function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

/**
 * Returns an unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Returns a forbidden response
 */
export function forbiddenResponse(message = 'Forbidden - Admin access required') {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

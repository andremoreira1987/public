import { createClient } from "@supabase/supabase-js";

// Cliente com SERVICE ROLE — usar SOMENTE em API routes (servidor).
// Ignora RLS, então nunca pode ser importado em componentes de cliente.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient | null {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) return null;
  if (!adminClient) {
    adminClient = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

export type SupabaseAuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

/** Verifies a Supabase access token against the Supabase Auth server and returns the identity it belongs to. */
export async function getSupabaseUserFromToken(token: string): Promise<SupabaseAuthUser | null> {
  const client = getAdminClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;

  const metadataName = data.user.user_metadata?.name;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    name: typeof metadataName === "string" ? metadataName : null,
  };
}

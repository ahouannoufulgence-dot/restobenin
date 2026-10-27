import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase (navigateur).
 *
 * Configuration : variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
 * (voir `.env.example`). La clé « publishable » est faite pour être publique : la sécurité repose sur les règles
 * d'accès (RLS) de la base, pas sur le secret de cette clé. Ne mettez JAMAIS la clé `service_role` dans l'application.
 *
 * Tant que les variables ne sont pas renseignées, `supabaseConfigured` vaut false et l'application reste en
 * mode démonstration (données dans le navigateur).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigured = Boolean(url && key)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!url || !key) {
    throw new Error('Supabase n’est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.')
  }
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return client
}

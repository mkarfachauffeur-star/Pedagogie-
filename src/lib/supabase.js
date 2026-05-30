import { createClient } from '@supabase/supabase-js'

// Configuration via variables d'environnement (multi-environnement / Vercel).
// Repli sur les valeurs actuelles pour ne rien casser tant que le `.env`
// n'est pas renseigné.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://watdeahravfccjdoseaf.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

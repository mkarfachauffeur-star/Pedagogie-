import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://watdeahravfccjdoseaf.supabase.co'

const supabaseAnonKey =
  'sb_publishable_WrrXoHZQlwsb4L93a6Xykw_Qy-_8jX4'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
console.log('SUPABASE CONNECTÉ')

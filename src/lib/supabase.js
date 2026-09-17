import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function missingSupabaseError() {
  return new Error('Configuration Supabase manquante : définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.')
}

function missingSupabaseResult(data = null) {
  return { data, error: missingSupabaseError() }
}

function createMissingQueryBuilder() {
  const result = Promise.resolve(missingSupabaseResult())

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return result.then.bind(result)
        if (prop === 'catch') return result.catch.bind(result)
        if (prop === 'finally') return result.finally.bind(result)
        return () => createMissingQueryBuilder()
      },
    },
  )
}

function createMissingSupabaseClient() {
  if (import.meta.env.DEV) {
    console.warn('[Supabase] Configuration manquante : les pages publiques restent disponibles en local.')
  }

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => missingSupabaseResult({ user: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      }),
      resetPasswordForEmail: async () => missingSupabaseResult(),
      signInWithPassword: async () => missingSupabaseResult(),
      signOut: async () => ({ error: null }),
      updateUser: async () => missingSupabaseResult(),
    },
    channel: () => ({
      on() {
        return this
      },
      subscribe() {
        return this
      },
    }),
    functions: {
      invoke: async () => missingSupabaseResult(),
    },
    from: () => createMissingQueryBuilder(),
    removeChannel: async () => undefined,
    rpc: async () => missingSupabaseResult(),
    storage: {
      from: () => ({
        createSignedUrl: async () => missingSupabaseResult(),
        createSignedUrls: async () => missingSupabaseResult(),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => missingSupabaseResult(),
        upload: async () => missingSupabaseResult(),
      }),
    },
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createMissingSupabaseClient()

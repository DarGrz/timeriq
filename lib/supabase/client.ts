import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Return a mock client for build time
        console.warn('Supabase credentials not found. Using mock client.');
        return {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
                signInWithPassword: async () => ({ data: null, error: { message: 'Not configured' } }),
                signUp: async () => ({ data: null, error: { message: 'Not configured' } }),
                signOut: async () => ({ error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            },
            from: () => ({
                select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }) }),
                insert: async () => ({ data: null, error: null }),
                update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
                delete: () => ({ eq: async () => ({ error: null }) }),
            }),
        } as ReturnType<typeof createBrowserClient>;
    }

    return createBrowserClient(supabaseUrl, supabaseKey);
}

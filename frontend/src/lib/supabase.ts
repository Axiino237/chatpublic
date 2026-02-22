import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Edge Functions base URL — derived from Supabase URL unless overridden
export const FUNCTIONS_URL =
    import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
    `${supabaseUrl}/functions/v1`;

// Storage bucket name
export const STORAGE_BUCKET =
    import.meta.env.VITE_STORAGE_BUCKET || 'chat-media';

export default supabase;

import supabase from '../lib/supabase';

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    role: string;
    isGuest: boolean;
    mutedUntil?: string;
    coinBalance: number;
}

const mapProfile = (profile: any): AuthUser => ({
    id: profile.id,
    email: profile.email || '',
    username: profile.username || '',
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    avatarUrl: profile.avatar_url || '',
    role: profile.role || 'USER',
    isGuest: profile.is_guest || false,
    mutedUntil: profile.muted_until,
    coinBalance: profile.coin_balance || 0,
});

export const supabaseAuthService = {
    // ─── Register ──────────────────────────────────────────────
    async register(email: string, password: string, username: string, firstName: string, lastName: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username, first_name: firstName, last_name: lastName, is_guest: false }
            }
        });
        if (error) throw new Error(error.message);

        // Update profile with names
        if (data.user) {
            await supabase.from('profiles').update({
                username, first_name: firstName, last_name: lastName
            }).eq('id', data.user.id);
        }
        return data;
    },

    // ─── Login ─────────────────────────────────────────────────
    async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        return { session: data.session, user: mapProfile(profile) };
    },

    // ─── Guest Login ───────────────────────────────────────────
    async loginAsGuest(guestName: string) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw new Error(error.message);

        if (data.user) {
            await supabase.from('profiles').update({
                username: guestName,
                first_name: guestName,
                is_guest: true
            }).eq('id', data.user.id);
        }

        const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', data.user!.id).single();

        return { session: data.session, user: mapProfile(profile) };
    },

    // ─── Logout ────────────────────────────────────────────────
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    },

    // ─── Get Current User ──────────────────────────────────────
    async getCurrentUser(): Promise<AuthUser | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles').select('*').eq('id', user.id).single();

        return profile ? mapProfile(profile) : null;
    },

    // ─── Get Session Token ─────────────────────────────────────
    async getToken(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    },

    // ─── Update Profile ────────────────────────────────────────
    async updateProfile(updates: Partial<{ username: string; firstName: string; lastName: string; avatarUrl: string; bio: string }>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('profiles')
            .update({
                username: updates.username,
                first_name: updates.firstName,
                last_name: updates.lastName,
                avatar_url: updates.avatarUrl,
                bio: updates.bio,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select().single();

        if (error) throw new Error(error.message);
        return mapProfile(data);
    },

    // ─── OTP Login (passwordless) ──────────────────────────────
    async sendOtp(email: string) {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw new Error(error.message);
    },

    async verifyOtp(email: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
        if (error) throw new Error(error.message);
        return data;
    },

    // ─── Session Listener ──────────────────────────────────────
    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles').select('*').eq('id', session.user.id).single();
                callback(profile ? mapProfile(profile) : null);
            } else {
                callback(null);
            }
        });
    }
};

export default supabaseAuthService;

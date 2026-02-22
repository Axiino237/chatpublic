import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // Auth check
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token!)
        if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

        const { room_id, content, type = 'TEXT', receiver_id } = await req.json()
        if (!room_id || !content) return new Response(JSON.stringify({ error: 'room_id and content are required' }), { status: 400, headers: corsHeaders })

        // Check if user is muted
        const { data: profile } = await supabase.from('profiles').select('muted_until, username, first_name, avatar_url').eq('id', user.id).single()
        if (profile?.muted_until && new Date(profile.muted_until) > new Date()) {
            const until = new Date(profile.muted_until).toLocaleTimeString()
            return new Response(JSON.stringify({ error: `You are muted until ${until}` }), { status: 403, headers: corsHeaders })
        }

        // Check if user is blocked by room members (if whisper)
        if (type === 'WHISPER' && receiver_id) {
            const { data: block } = await supabase.from('blocks').select('*').eq('blocker_id', receiver_id).eq('blocked_id', user.id).single()
            if (block) return new Response(JSON.stringify({ error: 'You cannot whisper to this user' }), { status: 403, headers: corsHeaders })
        }

        // Insert message — Supabase Realtime auto-broadcasts to subscribers
        const { data: message, error } = await supabase.from('messages').insert({
            room_id, sender_id: user.id, content, type, receiver_id: receiver_id || null
        }).select().single()

        if (error) throw error

        return new Response(JSON.stringify(message), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})

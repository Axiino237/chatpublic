import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const url = new URL(req.url)
    const roomId = url.searchParams.get('room_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const before = url.searchParams.get('before') // cursor-based pagination

    if (!roomId) return new Response(JSON.stringify({ error: 'room_id required' }), { status: 400, headers: corsHeaders })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)

    let query = supabase
        .from('messages')
        .select(`*, profiles:sender_id (username, first_name, last_name, avatar_url, role)`)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (before) query = query.lt('created_at', before)

    const { data: messages, error } = await query
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })

    return new Response(JSON.stringify(messages?.reverse() || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
})

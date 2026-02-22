import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
        const token = req.headers.get('Authorization')?.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token!)
        if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

        if (req.method === 'POST') {
            const { blocked_id } = await req.json()
            const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id })
            if (error) throw error
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (req.method === 'DELETE') {
            const url = new URL(req.url)
            const blocked_id = url.searchParams.get('blocked_id')
            const { error } = await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', blocked_id)
            if (error) throw error
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // GET — list all blocks
        const { data, error } = await supabase.from('blocks').select('*, blocked:blocked_id(id, username, avatar_url)').eq('blocker_id', user.id)
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})

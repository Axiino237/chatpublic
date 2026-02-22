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

        // Get caller's role
        const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!['ADMIN', 'MODERATOR'].includes(caller?.role)) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
        }

        const { target_user_id, minutes = 30, reason = 'Violation of community rules' } = await req.json()
        if (!target_user_id) return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: corsHeaders })

        const mutedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString()
        const { error } = await supabase.from('profiles').update({ muted_until: mutedUntil }).eq('id', target_user_id)
        if (error) throw error

        // Notify muted user
        await supabase.from('notifications').insert({
            user_id: target_user_id, type: 'system',
            title: '🔇 You have been muted',
            body: `${reason}. Muted for ${minutes} minutes.`
        })

        return new Response(JSON.stringify({ success: true, muted_until: mutedUntil }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})

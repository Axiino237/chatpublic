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

        const { receiver_id, content } = await req.json()
        if (!receiver_id || !content) return new Response(JSON.stringify({ error: 'receiver_id and content required' }), { status: 400, headers: corsHeaders })

        // Check if receiver blocked sender
        const { data: block } = await supabase.from('blocks').select('*').eq('blocker_id', receiver_id).eq('blocked_id', user.id).single()
        if (block) return new Response(JSON.stringify({ error: 'Could not deliver message' }), { status: 403, headers: corsHeaders })

        const { data: message, error } = await supabase.from('private_messages').insert({
            sender_id: user.id, receiver_id, content, status: 'sent'
        }).select().single()

        if (error) throw error

        // Create notification for receiver
        await supabase.from('notifications').insert({
            user_id: receiver_id, type: 'message', title: 'New private message', body: content.slice(0, 100)
        })

        return new Response(JSON.stringify(message), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})

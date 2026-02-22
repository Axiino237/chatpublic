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

        const formData = await req.formData()
        const file = formData.get('file') as File
        if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers: corsHeaders })

        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${user.id}/${Date.now()}.${ext}`
        const fileBuffer = await file.arrayBuffer()

        const { data, error } = await supabase.storage
            .from('chat-media')
            .upload(path, fileBuffer, { contentType: file.type, upsert: false })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(data.path)
        return new Response(JSON.stringify({ url: publicUrl, path: data.path }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
    }
})

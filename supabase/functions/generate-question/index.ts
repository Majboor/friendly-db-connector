import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
const TOGETHER_MODEL = "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt_type } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch prompt from database
    const { data: promptData, error: promptError } = await supabaseClient
      .from('prompts')
      .select('content')
      .eq('type', prompt_type)
      .single()

    if (promptError) throw promptError

    const headers = {
      'Authorization': `Bearer ${Deno.env.get('TOGETHER_API_KEY')}`,
      'Content-Type': 'application/json',
      ...corsHeaders
    }

    const apiBody = {
      model: TOGETHER_MODEL,
      messages: [
        { role: "user", content: promptData.content }
      ]
    }

    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(apiBody)
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ 
        content: data.choices[0].message.content 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
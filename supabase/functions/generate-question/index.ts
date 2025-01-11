import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
const TOGETHER_MODEL = "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt_type } = await req.json()
    const togetherApiKey = Deno.env.get('TOGETHER_API_KEY')
    
    if (!togetherApiKey) {
      throw new Error('Together API key not found')
    }

    // First, fetch the prompt from the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found')
    }

    const promptResponse = await fetch(`${supabaseUrl}/rest/v1/prompts?type=eq.${prompt_type}&select=content`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (!promptResponse.ok) {
      throw new Error('Failed to fetch prompt')
    }

    const prompts = await promptResponse.json()
    if (!prompts.length) {
      throw new Error('No prompt found for the specified type')
    }

    const prompt = prompts[0].content

    // Call Together API with the prompt
    const togetherResponse = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: TOGETHER_MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })

    if (!togetherResponse.ok) {
      throw new Error('Failed to generate content')
    }

    const result = await togetherResponse.json()
    const aiResponse = result.choices[0].message.content

    // Format the response as a proper JSON object
    let formattedQuestion
    try {
      // Try to parse if it's already JSON
      formattedQuestion = JSON.parse(aiResponse)
    } catch {
      // If not JSON, create a basic question format
      formattedQuestion = {
        content: aiResponse.split('\n')[0], // First line as question
        choices: aiResponse
          .split('\n')
          .filter(line => line.trim().startsWith('A)') || 
                         line.trim().startsWith('B)') || 
                         line.trim().startsWith('C)') || 
                         line.trim().startsWith('D)'))
          .map(choice => choice.trim()),
        correctAnswer: aiResponse
          .split('\n')
          .find(line => line.toLowerCase().includes('correct') || 
                       line.toLowerCase().includes('answer'))
          ?.split(':')[1]?.trim() || 'A)'
      }
    }

    console.log('Formatted question:', formattedQuestion)

    return new Response(
      JSON.stringify({ content: JSON.stringify(formattedQuestion) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
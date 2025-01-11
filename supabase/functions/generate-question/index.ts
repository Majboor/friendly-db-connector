import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"
const TOGETHER_MODEL = "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt_type } = await req.json()
    const togetherApiKey = Deno.env.get('TOGETHER_API_KEY')
    
    if (!togetherApiKey) {
      throw new Error('Together API key not found')
    }

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

    console.log('Making API request with prompt:', prompt)

    const togetherResponse = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: TOGETHER_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!togetherResponse.ok) {
      throw new Error('Failed to generate content')
    }

    const result = await togetherResponse.json()
    const aiResponse = result.choices[0].message.content
    console.log('Raw AI response:', aiResponse)

    let formattedQuestion
    try {
      // First try to parse as JSON
      formattedQuestion = JSON.parse(aiResponse)
    } catch {
      // If not JSON, parse based on question type
      if (prompt_type.startsWith('math')) {
        formattedQuestion = parseMathQuestion(aiResponse)
      } else if (prompt_type === 'reading_passage') {
        formattedQuestion = parseReadingQuestion(aiResponse)
      } else if (prompt_type === 'writing_passage') {
        formattedQuestion = parseWritingQuestion(aiResponse)
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function parseMathQuestion(text: string) {
  const lines = text.split('\n').filter(line => line.trim())
  const questionLine = lines[0]
  const choices = lines
    .filter(line => /^[A-D]\)/.test(line.trim()))
    .map(line => line.trim())
  
  const correctAnswerLine = lines.find(line => 
    line.toLowerCase().includes('correct') || 
    line.toLowerCase().includes('answer')
  )
  const correctAnswer = correctAnswerLine
    ? correctAnswerLine.match(/[A-D]\)/)?.[0] || 'A)'
    : 'A)'

  return {
    content: questionLine,
    choices,
    correctAnswer
  }
}

function parseReadingQuestion(text: string) {
  const passageMatch = text.match(/Passage:([\s\S]*?)(?=Questions:|$)/i)
  const passage = passageMatch ? passageMatch[1].trim() : ''

  const questionsMatch = text.match(/Questions:([\s\S]*)/i)
  const questionsText = questionsMatch ? questionsMatch[1] : ''
  
  const questionBlocks = questionsText.split(/(?=\d+[\).])/g)
    .filter(block => block.trim())
    .map(block => {
      const lines = block.split('\n').filter(line => line.trim())
      const question = lines[0].replace(/^\d+[\).]/, '').trim()
      const choices = lines
        .filter(line => /^[A-D]\)/.test(line.trim()))
        .map(line => line.trim())
      
      const correctAnswerLine = lines.find(line => 
        line.toLowerCase().includes('correct') || 
        line.toLowerCase().includes('answer')
      )
      const correctAnswer = correctAnswerLine
        ? correctAnswerLine.match(/[A-D]\)/)?.[0] || 'A)'
        : 'A)'

      return { question, choices, correctAnswer }
    })

  return {
    passage,
    questions: questionBlocks
  }
}

function parseWritingQuestion(text: string) {
  const passageMatch = text.match(/Passage:([\s\S]*?)(?=Questions:|$)/i)
  const passage = passageMatch ? passageMatch[1].trim() : ''

  const questionsMatch = text.match(/Questions:([\s\S]*)/i)
  const questionsText = questionsMatch ? questionsMatch[1] : ''
  
  const questionBlocks = questionsText.split(/(?=\d+[\).])/g)
    .filter(block => block.trim())
    .map(block => {
      const lines = block.split('\n').filter(line => line.trim())
      const question = lines[0].replace(/^\d+[\).]/, '').trim()
      
      const sentenceMatch = block.match(/Sentence:([\s\S]*?)(?=Underlined:|Choices:|$)/i)
      const sentence = sentenceMatch ? sentenceMatch[1].trim() : undefined

      const underlinedMatch = block.match(/Underlined:([\s\S]*?)(?=Choices:|$)/i)
      const underlined = underlinedMatch ? underlinedMatch[1].trim() : undefined

      const choices = lines
        .filter(line => /^[A-D]\)/.test(line.trim()))
        .map(line => line.trim())
      
      const correctAnswerLine = lines.find(line => 
        line.toLowerCase().includes('correct') || 
        line.toLowerCase().includes('answer')
      )
      const correctAnswer = correctAnswerLine
        ? correctAnswerLine.match(/[A-D]\)/)?.[0] || 'A)'
        : 'A)'

      return { 
        question,
        sentence,
        underlined,
        choices,
        correctAnswer
      }
    })

  return {
    passage,
    questions: questionBlocks
  }
}
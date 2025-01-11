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
        max_tokens: 1500
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
      formattedQuestion = JSON.parse(aiResponse)
    } catch {
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
  // Extract question
  const questionMatch = text.match(/Question:\s*([^\n]+)/i)
  const question = questionMatch ? questionMatch[1].trim() : ''

  // Extract choices
  const choices: string[] = []
  const choiceMatches = text.matchAll(/[A-D]\)\s*([^\n]+)/g)
  for (const match of choiceMatches) {
    choices.push(`${match[0].trim()}`)
  }

  // Extract correct answer
  const correctAnswerMatch = text.match(/Correct Answer:\s*([A-D])/i)
  const correctAnswer = correctAnswerMatch ? `${correctAnswerMatch[1]})` : ''

  return {
    content: question,
    choices,
    correctAnswer
  }
}

function parseReadingQuestion(text: string) {
  // Extract passage
  const passageMatch = text.match(/READING PASSAGE:\s*\n\n([\s\S]*?)(?=\n\nREADING QUESTIONS:)/i)
  const passage = passageMatch ? passageMatch[1].trim() : ''

  // Extract questions
  const questions: Array<{
    question: string;
    choices: string[];
    correctAnswer: string;
  }> = []

  const questionBlocks = text.split(/Question \d+:/g).slice(1)
  
  questionBlocks.forEach(block => {
    const questionMatch = block.match(/([^\n]+)/)
    const question = questionMatch ? questionMatch[1].trim() : ''

    const choices: string[] = []
    const choiceMatches = block.matchAll(/[A-D]\)\s*([^\n]+)/g)
    for (const match of choiceMatches) {
      choices.push(`${match[0].trim()}`)
    }

    const correctAnswerMatch = block.match(/Correct Answer:\s*([A-D])/i)
    const correctAnswer = correctAnswerMatch ? `${correctAnswerMatch[1]})` : ''

    if (question && choices.length > 0) {
      questions.push({ question, choices, correctAnswer })
    }
  })

  return {
    passage,
    questions
  }
}

function parseWritingQuestion(text: string) {
  // Extract passage
  const passageMatch = text.match(/WRITING PASSAGE:\s*\n\n([\s\S]*?)(?=\n\nWRITING QUESTIONS:)/i)
  const passage = passageMatch ? passageMatch[1].trim() : ''

  // Extract questions
  const questions: Array<{
    question: string;
    sentence?: string;
    underlined?: string;
    choices: string[];
    correctAnswer: string;
  }> = []

  const questionBlocks = text.split(/Question \d+:/g).slice(1)
  
  questionBlocks.forEach(block => {
    const questionMatch = block.match(/([^\n]+)/)
    const question = questionMatch ? questionMatch[1].trim() : ''

    const sentenceMatch = block.match(/Sentence:\s*([^\n]+)/i)
    const sentence = sentenceMatch ? sentenceMatch[1].trim() : undefined

    const underlinedMatch = block.match(/Underlined:\s*([^\n]+)/i)
    const underlined = underlinedMatch ? underlinedMatch[1].trim() : undefined

    const choices: string[] = []
    const choiceMatches = block.matchAll(/[A-D]\)\s*([^\n]+)/g)
    for (const match of choiceMatches) {
      choices.push(`${match[0].trim()}`)
    }

    const correctAnswerMatch = block.match(/Correct Answer:\s*([A-D])/i)
    const correctAnswer = correctAnswerMatch ? `${correctAnswerMatch[1]})` : ''

    if (question && choices.length > 0) {
      questions.push({
        question,
        sentence,
        underlined,
        choices,
        correctAnswer
      })
    }
  })

  return {
    passage,
    questions
  }
}
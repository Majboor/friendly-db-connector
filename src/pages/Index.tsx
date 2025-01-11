import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Database } from "@/integrations/supabase/types"

type PromptType = Database["public"]["Enums"]["prompt_type"]

export default function Index() {
  const [isLoading, setIsLoading] = useState(false)
  const [question, setQuestion] = useState<{
    content: string
    choices?: string[]
    correctAnswer?: string
  } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const { toast } = useToast()

  const generateQuestion = async (type: PromptType) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        'https://ecmwlutgcezdgndosiac.supabase.co/functions/v1/generate-question',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ prompt_type: type })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to generate question')
      }

      const data = await response.json()
      
      // Parse the JSON string from the API response
      const parsedContent = JSON.parse(data.content)
      setQuestion(parsedContent)
      setSelectedAnswer(null)

    } catch (error) {
      console.error('Error generating question:', error)
      toast({
        title: "Error",
        description: "Failed to generate question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkAnswer = () => {
    if (!selectedAnswer || !question?.correctAnswer) return

    const isCorrect = selectedAnswer === question.correctAnswer
    toast({
      title: isCorrect ? "Correct!" : "Incorrect",
      description: isCorrect 
        ? "Great job! Try another question." 
        : `The correct answer was ${question.correctAnswer}`,
      variant: isCorrect ? "default" : "destructive",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">SAT Practice Questions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Button
          onClick={() => generateQuestion("math_with_calculator")}
          disabled={isLoading}
        >
          Math (Calculator)
        </Button>
        <Button
          onClick={() => generateQuestion("math_no_calculator")}
          disabled={isLoading}
        >
          Math (No Calculator)
        </Button>
        <Button
          onClick={() => generateQuestion("reading_passage")}
          disabled={isLoading}
        >
          Reading
        </Button>
      </div>

      {isLoading && (
        <div className="text-center">
          <p>Generating question...</p>
        </div>
      )}

      {question && !isLoading && (
        <Card className="p-6">
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">Question</h2>
            <p className="mb-6">{question.content}</p>

            {question.choices && (
              <div className="space-y-4">
                {question.choices.map((choice, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`choice-${index}`}
                      name="answer"
                      value={choice}
                      checked={selectedAnswer === choice}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`choice-${index}`}>{choice}</label>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={checkAnswer}
              disabled={!selectedAnswer}
              className="mt-6"
            >
              Check Answer
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
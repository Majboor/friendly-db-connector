import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/integrations/supabase/types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type PromptType = Database["public"]["Enums"]["prompt_type"]

type Question = {
  content?: string;
  choices?: string[];
  correctAnswer?: string;
  passage?: string;
  questions?: Array<{
    question: string;
    choices: string[];
    correctAnswer: string;
    sentence?: string;
    underlined?: string;
  }>;
}

const BASE_URL = "https://sat.techrealm.pk"

export default function Questions() {
  const [isLoading, setIsLoading] = useState(false)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showRawAnswer, setShowRawAnswer] = useState(false)
  const { toast } = useToast()

  // Helper function to clean up choices
  const cleanChoice = (choice: string): string => {
    return choice.toLowerCase() === 'choices' ? '' : choice.replace(/^[A-E]\)\s*/, '').trim()
  }

  // Helper function to get letter from index
  const getLetterFromIndex = (index: number): string => {
    return String.fromCharCode(65 + index) // A = 65 in ASCII
  }

  const generateQuestion = async (type: PromptType) => {
    console.log("Generating question of type:", type)
    setIsLoading(true)
    setShowRawAnswer(false)
    try {
      let endpoint = ""

      switch (type) {
        case "math_with_calculator":
          endpoint = `${BASE_URL}/api/maths-question?use_calculator=true`
          break
        case "math_no_calculator":
          endpoint = `${BASE_URL}/api/maths-question?use_calculator=false`
          break
        case "reading_passage":
          endpoint = `${BASE_URL}/api/reading-question`
          break
        case "writing_passage":
          endpoint = `${BASE_URL}/api/writing-question`
          break
        default:
          throw new Error("Invalid question type")
      }

      const apiResponse = await fetch(endpoint)
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`)
      }
      
      const data = await apiResponse.json()
      console.log("API Response:", data)

      // Format the response based on the question type
      if (type === "math_with_calculator" || type === "math_no_calculator") {
        // Filter out any "choices" option if it exists in the choices array
        const cleanedChoices = data.choices
          .filter((choice: string) => !choice.toLowerCase().includes('choices'))
          .map(cleanChoice)
        
        setQuestion({
          content: data.question,
          choices: cleanedChoices,
          correctAnswer: data.correct_answer
        })
      } else {
        // For reading and writing questions
        setQuestion({
          passage: data.passage,
          questions: data.questions.map((q: any) => ({
            question: q.question,
            choices: q.choices.map(cleanChoice),
            correctAnswer: q.correct_answer,
            sentence: q.sentence,
            underlined: q.underlined
          }))
        })
      }

      setSelectedAnswer(null)
      setCurrentQuestionIndex(0)

    } catch (error) {
      console.error('Error generating question:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentQuestion = () => {
    if (!question) return null
    if (question.questions && question.questions[currentQuestionIndex]) {
      return question.questions[currentQuestionIndex]
    }
    return {
      question: question.content || "",
      choices: question.choices?.filter(choice => choice.toLowerCase() !== 'choices') || [],
      correctAnswer: question.correctAnswer || "",
      sentence: undefined,
      underlined: undefined
    }
  }

  const checkAnswer = () => {
    if (!selectedAnswer || !question) {
      console.log("No answer selected or no question available")
      return
    }

    const currentQuestion = getCurrentQuestion()
    if (!currentQuestion) {
      console.log("No current question available")
      return
    }

    const correctAnswer = currentQuestion.correctAnswer
    if (!correctAnswer) {
      console.log("No correct answer available")
      return
    }

    // Log values for debugging
    console.log("Selected Answer:", selectedAnswer)
    console.log("Raw Correct Answer:", correctAnswer)
    
    // Compare the answers directly with the raw answer
    const isCorrect = selectedAnswer === correctAnswer

    // Show toast with the result
    toast({
      title: isCorrect ? "Correct!" : "Incorrect",
      description: isCorrect 
        ? `Well done! ${selectedAnswer} is the right answer.` 
        : `The correct answer was ${correctAnswer}. You selected ${selectedAnswer}.`,
      variant: isCorrect ? "default" : "destructive",
    })

    // Move to next question if available
    if (question.questions && currentQuestionIndex < question.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
    }
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
        <Button
          onClick={() => generateQuestion("writing_passage")}
          disabled={isLoading}
        >
          Writing
        </Button>
      </div>

      {isLoading && (
        <div className="text-center">
          <p>Generating question...</p>
        </div>
      )}

      {question && !isLoading && getCurrentQuestion() && (
        <Card className="p-6">
          <div className="prose max-w-none">
            {question.passage && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Passage</h2>
                <p className="mb-6">{question.passage}</p>
              </div>
            )}

            <h2 className="text-xl font-semibold mb-4">
              Question {question.questions ? `${currentQuestionIndex + 1}/${question.questions.length}` : ''}
            </h2>
            
            {getCurrentQuestion()?.sentence && (
              <div className="mb-4">
                <p className="font-medium">Sentence:</p>
                <p>{getCurrentQuestion()?.sentence}</p>
              </div>
            )}
            
            {getCurrentQuestion()?.underlined && (
              <div className="mb-4">
                <p className="font-medium">Underlined portion:</p>
                <p className="underline">{getCurrentQuestion()?.underlined}</p>
              </div>
            )}
            
            <p className="mb-6 whitespace-pre-line">{getCurrentQuestion()?.question?.replace(/\\n/g, '\n')}</p>

            <div className="space-y-4">
              <RadioGroup
                value={selectedAnswer || ""}
                onValueChange={setSelectedAnswer}
                className="space-y-3"
              >
                {getCurrentQuestion()?.choices?.map((choice, index) => {
                  const cleanedChoice = cleanChoice(choice)
                  if (!cleanedChoice) return null
                  const letter = getLetterFromIndex(index)
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={letter}
                        id={`choice-${index}`}
                      />
                      <Label htmlFor={`choice-${index}`}>
                        {letter}) {cleanedChoice}
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={checkAnswer}
                disabled={!selectedAnswer}
                variant="default"
              >
                Check Answer
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRawAnswer(!showRawAnswer)}
              >
                {showRawAnswer ? "Hide Answer" : "Show Answer"}
              </Button>
            </div>

            {showRawAnswer && getCurrentQuestion()?.correctAnswer && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="font-medium">Raw Answer: {getCurrentQuestion().correctAnswer}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
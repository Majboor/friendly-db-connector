import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/integrations/supabase/types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { WarpSpeedThree } from "@/components/WarpSpeedThree"
import ReactMarkdown from 'react-markdown'
import { supabase } from "@/integrations/supabase/client"

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

      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      // Store the response in Supabase
      const { error: storeError } = await supabase
        .from('question_responses')
        .insert({
          question_type: type,
          passage: data.passage || null,
          questions: data.questions || data,
          user_id: session?.user?.id || null // Explicitly set to null for anonymous users
        })

      if (storeError) {
        console.error('Error storing response:', storeError)
        toast({
          title: "Error",
          description: "Failed to store question response. Please try again.",
          variant: "destructive",
        })
      }

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
        const formattedQuestions = data.questions.map((q: any) => ({
          question: q.question,
          choices: q.choices.map(cleanChoice),
          correctAnswer: q.correct_answer,
          sentence: q.sentence,
          underlined: q.underlined
        }))

        setQuestion({
          passage: data.passage,
          questions: formattedQuestions
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
    setShowRawAnswer(!showRawAnswer)
  }

  const handleNextQuestion = () => {
    if (question?.questions && currentQuestionIndex < question.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowRawAnswer(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setSelectedAnswer(null)
      setShowRawAnswer(false)
    }
  }

  return (
    <>
      <WarpSpeedThree isVisible={showRawAnswer} />
      <div className="container mx-auto px-4 py-8 relative z-10 text-white">
        <h1 className="text-3xl font-bold text-center mb-8 font-mono">SAT Practice Questions</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => generateQuestion("math_with_calculator")}
            disabled={isLoading}
            className="bg-black/80 text-white hover:bg-black/60 backdrop-blur-sm border border-white/20"
          >
            Math (Calculator)
          </Button>
          <Button
            onClick={() => generateQuestion("math_no_calculator")}
            disabled={isLoading}
            className="bg-black/80 text-white hover:bg-black/60 backdrop-blur-sm border border-white/20"
          >
            Math (No Calculator)
          </Button>
          <Button
            onClick={() => generateQuestion("reading_passage")}
            disabled={isLoading}
            className="bg-black/80 text-white hover:bg-black/60 backdrop-blur-sm border border-white/20"
          >
            Reading
          </Button>
          <Button
            onClick={() => generateQuestion("writing_passage")}
            disabled={isLoading}
            className="bg-black/80 text-white hover:bg-black/60 backdrop-blur-sm border border-white/20"
          >
            Writing
          </Button>
        </div>

        {isLoading && (
          <div className="text-center">
            <p className="font-mono animate-pulse">Generating question...</p>
          </div>
        )}

        {question && !isLoading && getCurrentQuestion() && (
          <Card className="p-6 bg-black/80 text-white backdrop-blur-sm border border-white/20">
            <div className="prose max-w-none content-container">
              {question.passage && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-white font-mono">Passage</h2>
                  <ReactMarkdown 
                    className="mb-6 font-mono leading-relaxed prose-p:my-2 prose-strong:text-inherit prose-em:text-inherit whitespace-pre-wrap"
                    components={{
                      p: ({node, ...props}) => <p className="whitespace-pre-wrap" {...props} />
                    }}
                  >
                    {question.passage}
                  </ReactMarkdown>
                </div>
              )}

              <h2 className="text-xl font-semibold mb-4 text-white font-mono">
                Question {question.questions ? `${currentQuestionIndex + 1}/${question.questions.length}` : ''}
              </h2>
              
              {getCurrentQuestion()?.sentence && (
                <div className="mb-4">
                  <p className="font-mono font-medium">Sentence:</p>
                  <ReactMarkdown 
                    className="font-mono prose-p:my-2 prose-strong:text-inherit prose-em:text-inherit whitespace-pre-wrap"
                    components={{
                      p: ({node, ...props}) => <p className="whitespace-pre-wrap" {...props} />
                    }}
                  >
                    {getCurrentQuestion()?.sentence}
                  </ReactMarkdown>
                </div>
              )}
              
              {getCurrentQuestion()?.underlined && (
                <div className="mb-4">
                  <p className="font-mono font-medium">Underlined portion:</p>
                  <ReactMarkdown 
                    className="font-mono underline prose-p:my-2 prose-strong:text-inherit prose-em:text-inherit whitespace-pre-wrap"
                    components={{
                      p: ({node, ...props}) => <p className="whitespace-pre-wrap" {...props} />
                    }}
                  >
                    {getCurrentQuestion()?.underlined}
                  </ReactMarkdown>
                </div>
              )}
              
              <ReactMarkdown 
                className="mb-6 font-mono prose-p:my-2 prose-strong:text-inherit prose-em:text-inherit whitespace-pre-wrap"
                components={{
                  p: ({node, ...props}) => <p className="whitespace-pre-wrap" {...props} />
                }}
              >
                {getCurrentQuestion()?.question?.replace(/\\n/g, '\n')}
              </ReactMarkdown>

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
                          className="border-white"
                        />
                        <Label htmlFor={`choice-${index}`} className="text-white">
                          {letter}) <ReactMarkdown 
                            className="inline font-mono prose-p:my-0 prose-strong:text-inherit prose-em:text-inherit whitespace-pre-wrap"
                            components={{
                              p: ({node, ...props}) => <span className="whitespace-pre-wrap" {...props} />
                            }}
                          >
                            {cleanedChoice}
                          </ReactMarkdown>
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              <div className="flex gap-4 mt-6">
                {currentQuestionIndex > 0 && (
                  <Button
                    onClick={handlePreviousQuestion}
                    className="bg-black/80 text-white hover:bg-black/60 backdrop-blur-sm border border-white/20"
                  >
                    Previous
                  </Button>
                )}
                <Button
                  onClick={checkAnswer}
                  disabled={!selectedAnswer}
                  className="bg-black/80 text-white hover:bg-black/60 backdrop-blur-sm border border-white/20"
                >
                  {showRawAnswer ? "Hide Answer" : "Show Answer"}
                </Button>
                {question.questions && currentQuestionIndex < question.questions.length - 1 && (
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-black/80 text-white hover:bg-black/60 backdrop-blur-sm border border-white/20"
                  >
                    Next
                  </Button>
                )}
              </div>

              {showRawAnswer && getCurrentQuestion()?.correctAnswer && (
                <div className="mt-4 p-4 bg-black/80 rounded-md backdrop-blur-sm border border-white/20">
                  <p className="font-medium text-white">Raw Answer: {getCurrentQuestion().correctAnswer}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
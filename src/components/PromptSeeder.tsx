import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type PromptType = Database["public"]["Enums"]["prompt_type"];

const prompts: {
  type: PromptType;
  content: string;
  is_default: boolean;
}[] = [
  {
    type: "reading_passage",
    content: `Create a passage for an SAT-style Reading Section. The passage should be between 500 and 750 words and written in a formal tone. It should focus on one of the following topics:

Literature: An excerpt from a fictional story or novel that explores a character's internal conflict, relationships, or a significant moment of decision. Historical Document: A passage discussing a pivotal moment in history, such as a famous speech, social movement, or political debate. Ensure the passage highlights arguments or perspectives from the time. Social Science: A discussion of a current or historical topic in sociology, psychology, or economics, emphasizing data or theory. Natural Science: A passage explaining a scientific concept, discovery, or experiment, written in an accessible manner, with possible inclusion of hypothetical data.

Ensure the passage is dense with ideas or arguments that require inference and analysis. Include evidence or examples to support the main idea. The tone should reflect the complexity of the SAT Reading Section, with advanced vocabulary and layered meaning. Avoid casual language or overtly technical jargon.

INSTRUCTIONS FOR OUTPUT:

You must ONLY output valid JSON code, nothing else.
The JSON must follow this structure (or be similar), for example: { "passage": "Your generated passage here" }
Repeat: ONLY OUTPUT JSON.
Repeat: LIMIT your output to the passage text ONLY.
Repeat: OUTPUT MUST BE IN JSON CODE FORMAT.`,
    is_default: true
  },
  {
    type: "reading_questions",
    content: `Using the provided passage, create 10–11 SAT Reading Section-style multiple-choice questions. The questions should test a variety of skills and align with the typical question types on the SAT. Follow these guidelines:

Question Guidelines:

Main Idea and Purpose:
Include 1–2 questions asking about the passage's central theme or the author's purpose.
Example: "Which of the following best describes the main purpose of the passage?"
Details and Evidence:
Include 2–3 questions that ask about specific details, requiring the reader to refer back to the passage.
Example: "According to the passage, which of the following statements is true about [specific topic]?"
Evidence-Based Reasoning:
Include 1–2 paired questions:
The first asks about a claim or conclusion in the passage.
The second asks the reader to identify the specific lines or evidence that support their answer.
Example: "Which choice best supports the answer to the previous question?"
Inferences:
Include 1–2 questions that require drawing logical conclusions based on information in the passage.
Example: "The author most likely implies which of the following about [topic]?"
Vocabulary in Context:
Include 1 question asking about the meaning of a word or phrase in context.
Example: "In line 14, the word 'resilient' most nearly means: (A) flexible, (B) strong, (C) adaptable, (D) durable."
Author's Tone and Perspective:
Include 1 question assessing the tone or perspective of the author.
Example: "The tone of the passage can best be described as: (A) objective, (B) skeptical, (C) enthusiastic, (D) critical."
Interpreting Data (if applicable):
Include 1 question based on any graph or chart that accompanies the passage.
Question Format:

Write each question with 4 answer choices (A, B, C, D).
Ensure questions vary in difficulty, with some straightforward and others requiring deeper analysis.
Avoid trick questions or irrelevant details.

INSTRUCTIONS FOR OUTPUT:

You must ONLY output valid JSON code.
The JSON could follow a structure similar to: { "questions": [ { "question": "Which of the following best describes ... ?", "choices": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "B" } ] }
Repeat: ONLY OUTPUT JSON.
Repeat: LIMIT your output to the questions only.
Repeat: OUTPUT MUST BE IN JSON CODE FORMAT.`,
    is_default: true
  },
  {
    type: "writing_passage",
    content: `Create a passage for an SAT-style Writing and Language Section. The passage should be 400–450 words long and written in a formal, concise tone. The content should include clear opportunities for testing grammar, sentence structure, organization, and rhetorical skills. Follow these guidelines:

Content Requirements:

Topic Options:
Careers: A passage discussing a specific profession, career trend, or workplace challenge.
Humanities: A passage about an artistic movement, historical figure, or cultural phenomenon.
History/Social Studies: A passage analyzing a historical event, policy, or sociological issue.
Science: A passage explaining a scientific concept, discovery, or environmental topic in accessible language.
Structure:
The passage should have 4–5 paragraphs.
Include a clear introduction, body, and conclusion.
Include transitions between ideas.
Editing Opportunities:
Ensure there are multiple opportunities to test:
Grammar and Usage
Sentence Structure
Word Choice
Logical Flow and Transitions
Style and Tone
Data Integration (Optional):
Optionally include a simple chart, graph, or table with a brief reference to it in the passage for data interpretation questions.
Tone and Style:

The passage should simulate the tone of a professional article or report, without casual or overly technical language.

INSTRUCTIONS FOR OUTPUT:

You must ONLY output valid JSON.
The JSON must follow a structure like: { "passage": "Your generated passage here" }
Repeat: ONLY OUTPUT JSON.
Repeat: LIMIT your output to the passage text only.
Repeat: OUTPUT MUST BE IN JSON CODE FORMAT.`,
    is_default: true
  },
  {
    type: "writing_questions",
    content: `Using the provided passage, create 11 SAT Writing and Language Section-style multiple-choice questions. These questions should focus on improving the clarity, grammar, style, and organization of the text. Follow these guidelines:

Question Guidelines:

Grammar and Usage (3–4 Questions)
Sentence Structure and Punctuation (2–3 Questions)
Conciseness and Word Choice (2–3 Questions)
Rhetorical Skills: Organization and Transitions (2–3 Questions)
Style and Tone (1–2 Questions)
Data Interpretation (Optional, 1 Question)

INSTRUCTIONS FOR OUTPUT:

You must ONLY output valid JSON.
A structure example could be: { "questions": [ { "question": "Which of the following best corrects ... ?", "choices": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "D" } ] }
Repeat: ONLY OUTPUT JSON.
Repeat: LIMIT your output to the questions only.
Repeat: OUTPUT MUST BE IN JSON CODE FORMAT.`,
    is_default: true
  },
  {
    type: "math_with_calculator",
    content: `Create a single SAT Math Section-style question designed for the calculator-allowed subsection. Follow these guidelines:

Involve multi-step calculations or scenarios where using a calculator would simplify solving.
Focus on topics like problem-solving and data analysis, algebra, or advanced math.
Clearly state that the question is intended for the calculator-allowed subsection.
Provide 4 multiple-choice answer options (A, B, C, D) or a grid-in format.
Ensure the question has a realistic context (finance, science, everyday problem-solving).

INSTRUCTIONS FOR OUTPUT:

You must ONLY output valid JSON.
Example structure: { "question": "This question is intended for the calculator-allowed subsection. ...", "choices": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "C" }
Repeat: ONLY OUTPUT JSON.
Repeat: LIMIT your output to the question only.
Repeat: OUTPUT MUST BE IN JSON CODE FORMAT.`,
    is_default: true
  },
  {
    type: "math_no_calculator",
    content: `Create a single SAT Math Section-style question designed for the no-calculator subsection. Follow these guidelines:

The question should be solvable quickly without a calculator, focusing on logical reasoning or algebraic manipulation.
Focus on topics such as linear equations, simplifying expressions, or basic geometry.
Clearly state that the question is intended for the no-calculator subsection.
Provide 4 multiple-choice answer options (A, B, C, D) or a grid-in format.
Avoid requiring large numbers or lengthy calculations.

INSTRUCTIONS FOR OUTPUT:

You must ONLY output valid JSON.
Example structure: { "question": "This question is intended for the no-calculator subsection. ...", "choices": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "B" }
Repeat: ONLY OUTPUT JSON.
Repeat: LIMIT your output to the question only.
Repeat: OUTPUT MUST BE IN JSON CODE FORMAT.`,
    is_default: true
  }
];

export const PromptSeeder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const seedPrompts = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("prompts").insert(prompts);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Prompts have been added to the database",
      });
    } catch (error) {
      console.error("Error seeding prompts:", error);
      toast({
        title: "Error",
        description: "Failed to add prompts to the database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Button 
        onClick={seedPrompts} 
        disabled={isLoading}
        className="w-full max-w-sm"
      >
        {isLoading ? "Adding Prompts..." : "Add Prompts to Database"}
      </Button>
    </div>
  );
};
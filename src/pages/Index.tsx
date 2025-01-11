import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Index() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to SAT Practice</h1>
      <p className="text-lg mb-8 max-w-2xl mx-auto">
        Practice SAT questions with our AI-powered question generator. Get instant feedback and improve your skills.
      </p>
      <Link to="/questions">
        <Button size="lg">
          Start Practicing
        </Button>
      </Link>
    </div>
  )
}
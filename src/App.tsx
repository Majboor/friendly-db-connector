import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Index from "@/pages/Index"
import Questions from "@/pages/Questions"
import Admin from "@/pages/Admin"
import AdminAuth from "@/pages/AdminAuth"
import { WarpSpeedBackground } from "@/components/WarpSpeedBackground"
import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import "./App.css"

function App() {
  useEffect(() => {
    toast({
      title: "Welcome to SAT Preparation",
      description: "Start practicing and improve your SAT score today!",
      duration: 5000,
    })
  }, [])

  return (
    <Router>
      <WarpSpeedBackground />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/auth" element={<AdminAuth />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Index from "@/pages/Index"
import Questions from "@/pages/Questions"
import Admin from "@/pages/Admin"
import AdminAuth from "@/pages/AdminAuth"
import { WarpSpeedBackground } from "@/components/WarpSpeedBackground"
import "./App.css"

function App() {
  return (
    <Router>
      <WarpSpeedBackground />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/auth" element={<AdminAuth />} />
      </Routes>
    </Router>
  )
}

export default App
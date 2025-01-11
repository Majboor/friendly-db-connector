import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Admin from "@/pages/Admin"
import AdminAuth from "@/pages/AdminAuth"
import "./App.css"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div className="container mx-auto">Home Page</div>} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/auth" element={<AdminAuth />} />
      </Routes>
    </Router>
  )
}

export default App
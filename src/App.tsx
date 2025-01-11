import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Admin from "@/pages/Admin"
import "./App.css"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div className="container mx-auto">Home Page</div>} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  )
}

export default App
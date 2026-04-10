import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/global.css";
import Login from "./pages/Login";
import Register from "./pages/Register";  // 👈 ADD THIS IMPORT
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />  {/* 👈 ADD THIS ROUTE */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
    </Router>
  );
}

export default App;
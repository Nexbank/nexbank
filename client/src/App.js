import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/global.css";
import Login from "./pages/Login";
import Register from "./pages/Register";  // 👈 ADD THIS IMPORT
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page FIRST */}
        <Route path="/" element={<LandingPage />} />

        {/* Other pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />  {/* 👈 ADD THIS ROUTE */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
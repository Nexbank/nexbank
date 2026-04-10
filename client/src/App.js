import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/global.css";
import Login from "./pages/Login";
import Register from "./pages/Register";  
import Dashboard from "./pages/Dashboard";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
 
function App() {
  return (
<Router>
<Routes>
<Route path="/" element={<Login />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/sidebar" element={<Sidebar />} />
<Route path="/navbar" element={<Navbar />} />
<Route path="/register" element={<Register />} />
<Route path="/transactions" element={<Transactions />} />
<Route path="/settings" element={<Settings />} />
</Routes>
</Router>

  );
}

export default App;
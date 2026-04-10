import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
 
function App() {
  return (
<Router>
<Routes>
<Route path="/" element={<Login />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/sidebar" element={<Sidebar />} />
<Route path="/navbar" element={<Navbar />} />
</Routes>
</Router>
  );
}
 
export default App;
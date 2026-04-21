import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/global.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";

import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Cards from "./pages/Cards";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Transfer from "./pages/Transfer";
import PayBills from "./pages/PayBills";

import { AccountProvider } from "./context/AccountContext";

function App() {
  return (
    <AccountProvider>
      <Router>
        <Routes>

          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main app routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Banking actions */}
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/pay-bills" element={<PayBills />} />

        </Routes>
      </Router>
    </AccountProvider>
  );
}

export default App;
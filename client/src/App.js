import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./styles/global.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Transactions from "./pages/Transactions";
import Cards from "./pages/Cards";
import Accounts from "./pages/Accounts";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Transfer from "./pages/Transfer";
import PayBills from "./pages/PayBills";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Insights from "./pages/Insights";
import { AccountProvider } from "./context/AccountContext";
import {
  RedirectIfAuthenticated,
  RequireAuth,
  RequireSelectedAccount,
} from "./components/RouteGuards";

function App() {
  return (
    <AccountProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            <Route element={<RequireSelectedAccount />}>
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/cards" element={<Cards />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/pay-bills" element={<PayBills />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AccountProvider>
  );
}

export default App;

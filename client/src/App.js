import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useMemo, useState } from "react";
import "./styles/global.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Accounts from "./pages/Accounts";
import ExploreProducts from "./pages/ExploreProducts";
import Transactions from "./pages/Transactions";
import Cards from "./pages/Cards";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Transfer from "./pages/Transfer";
import PayBills from "./pages/PayBills";
import VerifyOtp from "./pages/VerifyOtp";

import { AccountProvider, useAccount } from "./context/AccountContext";

const actionItems = [
  { id: "deposit", label: "Make a Deposit", path: "/deposit", keywords: ["deposit", "add money", "cash in"] },
  { id: "withdraw", label: "Withdraw Money", path: "/withdraw", keywords: ["withdraw", "cash out", "money out"] },
  { id: "transfer", label: "Transfer Money", path: "/transfer", keywords: ["transfer", "send money", "pay someone"] },
  { id: "pay-bills", label: "Pay Bills", path: "/pay-bills", keywords: ["bills", "pay bills", "dstv", "electricity"] },
  { id: "accounts", label: "Manage Accounts", path: "/accounts", keywords: ["accounts", "account", "bank accounts"] },
  { id: "products", label: "Explore Products", path: "/products", keywords: ["products", "banking products", "offers"] },
  { id: "cards", label: "Manage Cards", path: "/cards", keywords: ["cards", "card", "virtual card"] },
  { id: "transactions", label: "View Transactions", path: "/transactions", keywords: ["transactions", "history", "payments"] },
  { id: "insights", label: "View Insights", path: "/insights", keywords: ["insights", "spending", "analytics"] },
  { id: "profile", label: "Profile", path: "/profile", keywords: ["profile", "personal details"] },
  { id: "settings", label: "Settings", path: "/settings", keywords: ["settings", "preferences", "security"] },
];

function AppRoutes() {
  const [search, setSearch] = useState("");
  const { allTransactions } = useAccount();

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return {
        query: "",
        actions: [],
        transactions: [],
      };
    }

    const matchesQuery = (value) => String(value || "").toLowerCase().includes(query);
    const normalizedQuery = query.replace(/[^a-z0-9]/g, "");

    const transactions = allTransactions
      .filter((transaction) => {
        const amount = Number(transaction.amount || 0);
        const amountVariants = [
          amount,
          amount.toFixed(2),
          `r${amount}`,
          `r${amount.toFixed(2)}`,
        ];

        return [
          transaction.description,
          transaction.reference,
          transaction.category,
          transaction.type,
          transaction.status,
          ...amountVariants,
        ].some((value) => matchesQuery(value) || String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "").includes(normalizedQuery));
      })
      .slice(0, 5);

    const actions = actionItems
      .filter((action) =>
        [action.label, ...action.keywords].some((value) => matchesQuery(value))
      )
      .slice(0, 5);

    return {
      query,
      actions,
      transactions,
    };
  }, [allTransactions, search]);

  return (
    <Routes>
      {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<Dashboard search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/accounts" element={<Accounts search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/products" element={<ExploreProducts search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/transactions" element={<Transactions search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/cards" element={<Cards search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/deposit" element={<Deposit search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/withdraw" element={<Withdraw search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/transfer" element={<Transfer search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/pay-bills" element={<PayBills search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/insights" element={<Insights search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/profile" element={<Profile search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/settings" element={<Settings search={search} setSearch={setSearch} searchResults={searchResults} />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
    </Routes>
  );
}

function App() {
  return (
    <AccountProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AccountProvider>
  );
}

export default App;

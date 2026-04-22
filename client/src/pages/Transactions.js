import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TransactionList from "../components/TransactionList";
import API from "../services/api";

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await API.get("/banking/transactions");
        setTransactions(response.data.transactions || []);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchTransactions();
  }, [navigate]);

  const filtered = transactions.filter((transaction) => {
    const searchValue = search.toLowerCase();

    return (
      (transaction.name || transaction.reference || "").toLowerCase().includes(searchValue) ||
      (transaction.category || "").toLowerCase().includes(searchValue) ||
      (transaction.type || "").toLowerCase().includes(searchValue) ||
      (transaction.status || "").toLowerCase().includes(searchValue)
    );
  });

  const userName =
    storedUser.firstname ||
    storedUser.displayName?.split(" ")[0] ||
    storedUser.email?.split("@")[0] ||
    "User";

  if (!selectedAccount) {
    return null;
  }

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Navbar userName={userName} searchPlaceholder="Search by reference, category, type..." />

        <div className="content">
          <h2>Transactions</h2>
          <div className="action-search-shell">
            <input
              className="action-form__input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter transactions"
            />
          </div>
          <TransactionList transactions={filtered} />
        </div>
      </div>
    </div>
  );
}

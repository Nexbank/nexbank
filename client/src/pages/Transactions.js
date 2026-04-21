import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TransactionList from "../components/TransactionList";
import { useAccount } from "../context/AccountContext";

const normalizeCardType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "virtual" || normalized === "virtual card") {
    return "virtual";
  }

  if (normalized === "physical" || normalized === "physical card") {
    return "physical";
  }

  return "";
};

const resolveTransactionCardType = (transaction) =>
  normalizeCardType(
    transaction.cardType ||
      transaction.metadata?.cardType ||
      transaction.card?.cardType ||
      transaction.card?.type
  );

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const { selectedAccount, selectedTransactions } = useAccount();

  const visibleTransactions = useMemo(
    () =>
      selectedTransactions.filter((transaction) => {
        const query = search.toLowerCase();
        const matchesSearch =
          (transaction.description || "").toLowerCase().includes(query) ||
          (transaction.reference || "").toLowerCase().includes(query) ||
          (transaction.type || "").toLowerCase().includes(query) ||
          (transaction.status || "").toLowerCase().includes(query);
        const transactionCardType = resolveTransactionCardType(transaction);
        const matchesCardFilter =
          cardFilter === "all" ? true : transactionCardType === cardFilter;

        return matchesSearch && matchesCardFilter;
      }),
    [cardFilter, search, selectedTransactions]
  );

  if (!selectedAccount) {
    return null;
  }

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Navbar search={search} setSearch={setSearch} />

        <div className="content">
          <h2>{selectedAccount.name} Transactions</h2>
          <p className="action-helper">
            Every transaction shown here belongs to your currently selected account.
          </p>

          <div className="d-flex gap-2 flex-wrap mb-3">
            {[
              { label: "All", value: "all" },
              { label: "Virtual Card", value: "virtual" },
              { label: "Physical Card", value: "physical" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`action-button ${
                  cardFilter === option.value
                    ? "action-button--primary"
                    : "action-button--ghost"
                }`}
                onClick={() => setCardFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <TransactionList transactions={visibleTransactions} />
        </div>
      </div>
    </div>
  );
}

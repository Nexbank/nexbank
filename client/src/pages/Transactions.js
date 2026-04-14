import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import TransactionList from "../components/TransactionList";

const txData = [
  { name: "John Doe", date: "Today", amount: -150, tag: "TRANSFER" },
  { name: "ATM Withdrawal", date: "Today", amount: -500, tag: "TRANSPORT" },
  { name: "Cash Deposit", date: "Today", amount: 1000, tag: "INCOME" },
];

export default function Transactions() {
  const [search, setSearch] = useState("");

  const filtered = txData.filter(
    (tx) =>
      tx.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Navbar search={search} setSearch={setSearch} />

        <div className="content">
          <h2>Transactions</h2>
          <TransactionList transactions={filtered} />
        </div>
      </div>
    </div>
  );
}

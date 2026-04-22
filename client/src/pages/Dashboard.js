import { useMemo, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiRepeat,
  FiTrendingUp,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TransactionList from "../components/TransactionList";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const actionItems = [
  { label: "Deposit", icon: FiPlus, accentClass: "dashboard-action-card--green", path: "/deposit" },
  {
    label: "Withdraw",
    icon: FiArrowUpRight,
    accentClass: "dashboard-action-card--blue",
    path: "/withdraw",
  },
  {
    label: "Transfer",
    icon: FiRepeat,
    accentClass: "dashboard-action-card--orange",
    path: "/transfer",
  },
  {
    label: "Pay Bills",
    icon: FiArrowDownRight,
    accentClass: "dashboard-action-card--purple",
    path: "/pay-bills",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const {
    accounts,
    selectedAccount,
    selectedCards,
    selectedTransactions,
    dashboardSummary,
    isLoading,
    selectAccount,
  } = useAccount();

  const summaryItems = useMemo(
    () => [
      {
        title: "Money In",
        value: formatCurrency(dashboardSummary.moneyIn),
        change: `${selectedTransactions.filter((transaction) => transaction.direction === "credit").length} items`,
        changeClass: "dashboard-stat-change--positive",
      },
      {
        title: "Money Out",
        value: formatCurrency(dashboardSummary.moneyOut),
        change: `${selectedTransactions.filter((transaction) => transaction.direction === "debit").length} items`,
        changeClass: "dashboard-stat-change--negative",
      },
      {
        title: "Cards",
        value: String(selectedCards.length),
        change: `${dashboardSummary.activeCardsCount} active`,
        changeClass: "dashboard-stat-change--info",
      },
    ],
    [dashboardSummary, selectedCards.length, selectedTransactions]
  );

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            {isLoading ? (
              <article className="dashboard-empty-state">
                <p className="dashboard-empty-title">Loading account summary...</p>
              </article>
            ) : !selectedAccount ? (
              <AccountRequiredState />
            ) : (
              <>
                <div className="row g-4 align-items-stretch dashboard-hero-row">
                  <div className="col-12 col-xl-8">
                    <section className="dashboard-balance-card">
                      <div className="dashboard-balance-top">
                        <p className="dashboard-eyebrow">Available Balance</p>
                        <button
                          type="button"
                          className="dashboard-icon-pill"
                          onClick={() => setShowBalance((current) => !current)}
                          aria-label={showBalance ? "Hide balance" : "Show balance"}
                        >
                          {showBalance ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>

                      <div className="dashboard-balance-value-wrap">
                        <span className="dashboard-currency">R</span>
                        <h1 className="dashboard-balance-amount">
                          {showBalance
                            ? Number(dashboardSummary.totalAvailableBalance || 0).toLocaleString("en-ZA", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "••••••"}
                        </h1>
                      </div>

                      <div className="dashboard-balance-footer">
                        <span className="dashboard-trend-pill">
                          <FiTrendingUp size={14} />
                          {selectedAccount.name}
                        </span>

                        <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
                          <select
                            className="dashboard-select"
                            value={selectedAccount._id}
                            onChange={(event) => selectAccount(event.target.value)}
                            aria-label="Select bank account"
                          >
                            {accounts.map((account) => (
                              <option key={account._id} value={account._id}>
                                {account.name} • {account.accountNumber}
                              </option>
                            ))}
                          </select>
                          <span className="dashboard-balance-hint">{selectedAccount.accountNumber}</span>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="col-12 col-xl-4">
                    <section className="dashboard-actions-grid">
                      {actionItems.map(({ label, icon: Icon, accentClass, path }) => (
                        <button
                          key={label}
                          type="button"
                          className="dashboard-action-card"
                          onClick={() => navigate(path)}
                        >
                          <span className={`dashboard-action-icon ${accentClass}`}>
                            <Icon size={22} />
                          </span>
                          <h2 className="dashboard-action-label">{label}</h2>
                        </button>
                      ))}
                    </section>
                  </div>
                </div>

                <section className="dashboard-section">
                  <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">Overview</h2>
                  </div>

                  <div className="row g-4">
                    {summaryItems.map(({ title, value, change, changeClass }) => (
                      <div key={title} className="col-12 col-md-6 col-xl-4">
                        <article className="dashboard-stat-card">
                          <p className="dashboard-stat-label">{title}</p>
                          <div className="dashboard-stat-row">
                            <strong className="dashboard-stat-value">{value}</strong>
                            <span className={`dashboard-stat-change ${changeClass}`}>{change}</span>
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="dashboard-section">
                  <article className="dashboard-panel">
                    <div className="dashboard-panel-header dashboard-panel-header--stack">
                      <div>
                        <h2 className="dashboard-panel-title">Recent Transactions</h2>
                        <p className="dashboard-panel-subtitle">
                          Latest activity for {selectedAccount.accountNumber}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <TransactionList transactions={dashboardSummary.recentTransactions} />
                    </div>
                  </article>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

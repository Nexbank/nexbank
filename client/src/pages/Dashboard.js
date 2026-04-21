import { useMemo, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiBriefcase,
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiHeart,
  FiPlus,
  FiRepeat,
  FiTrendingUp,
  FiUserCheck,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatBalanceValue, formatCurrency, formatDateTime } from "../utils/currency";

const actionItems = [
  { label: "Deposit", icon: FiPlus, accentClass: "dashboard-action-card--green", path: "/deposit" },
  { label: "Withdraw", icon: FiArrowUpRight, accentClass: "dashboard-action-card--blue", path: "/withdraw" },
  { label: "Transfer", icon: FiRepeat, accentClass: "dashboard-action-card--orange", path: "/transfer" },
  { label: "Pay Bills", icon: FiArrowDownRight, accentClass: "dashboard-action-card--purple", path: "/pay-bills" },
];

function Dashboard() {
  const {
    accounts,
    allCards: cards,
    allTransactions: transactions,
  } = useAccount();
  const [showBalance, setShowBalance] = useState(true);
  const navigate = useNavigate();

  const viewMode = "overview";
  const activeAccountId = null;
  const hasDashboardAccountContext = viewMode === "account" && activeAccountId !== null;
  void hasDashboardAccountContext;

  const dashboardData = useMemo(() => {
    const safeAccounts = Array.isArray(accounts) ? accounts : [];
    const safeCards = Array.isArray(cards) ? cards : [];
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const sortedTransactions = [...safeTransactions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const totalBalance = safeAccounts.reduce(
      (sum, account) => sum + Number(account.availableBalance || 0),
      0
    );

    return {
      totalBalance,
      accounts: safeAccounts,
      cards: safeCards,
      transactions: sortedTransactions,
    };
  }, [accounts, cards, transactions]);

  const {
    totalBalance,
    accounts: dashboardAccounts,
    cards: dashboardCards,
    transactions: dashboardTransactions,
  } = dashboardData;

  const recentTransactions = dashboardTransactions.slice(0, 5);

  const totalDebits = dashboardTransactions
    .filter((transaction) => transaction.direction === "debit")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const activeCardsCount = dashboardCards.filter(
    (card) => card.isActive && !card.isLocked
  ).length;

  const lockedCardsCount = dashboardCards.filter((card) => card.isLocked).length;

  const summaryItems = useMemo(() => {
    const totalCredits = dashboardTransactions
      .filter((transaction) => transaction.direction === "credit")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const totalDebitsValue = dashboardTransactions
      .filter((transaction) => transaction.direction === "debit")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const totalBills = dashboardTransactions
      .filter((transaction) => transaction.type === "bill")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return [
      {
        title: "Money In",
        value: formatCurrency(totalCredits),
        change: `${dashboardTransactions.filter((transaction) => transaction.direction === "credit").length} items`,
        changeClass: "dashboard-stat-change--positive",
      },
      {
        title: "Money Out",
        value: formatCurrency(totalDebitsValue),
        change: `${dashboardTransactions.filter((transaction) => transaction.direction === "debit").length} items`,
        changeClass: "dashboard-stat-change--negative",
      },
      {
        title: "Bills Paid",
        value: formatCurrency(totalBills),
        change: `${dashboardTransactions.filter((transaction) => transaction.type === "bill").length} bills`,
        changeClass: "dashboard-stat-change--info",
      },
      {
        title: "Cards",
        value: String(dashboardCards.length),
        change: `${activeCardsCount} active`,
        changeClass: "dashboard-stat-change--accent",
      },
    ];
  }, [activeCardsCount, dashboardCards.length, dashboardTransactions]);

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <div className="row g-4 align-items-stretch dashboard-hero-row">
              <div className="col-12 col-xl-8">
                <section className="dashboard-balance-card">
                  <div className="dashboard-balance-top">
                    <p className="dashboard-eyebrow">Total Available Balance</p>
                    <button
                      type="button"
                      className="dashboard-icon-pill"
                      aria-label={showBalance ? "Hide balance" : "Show balance"}
                      onClick={() => setShowBalance((current) => !current)}
                    >
                      {showBalance ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>

                  <div className="dashboard-balance-value-wrap">
                    <span className="dashboard-currency">R</span>
                    <h1 className="dashboard-balance-amount">
                      {showBalance ? formatBalanceValue(totalBalance) : "******"}
                    </h1>
                  </div>

                  <div className="dashboard-balance-footer">
                    <span className="dashboard-trend-pill">
                      <FiTrendingUp size={14} />
                      {dashboardAccounts.length} accounts
                    </span>
                    <span className="dashboard-balance-hint">Global overview</span>
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
                  <div key={title} className="col-12 col-md-6 col-xxl-3">
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
              <div className="row g-4">
                <div className="col-12 col-xl-8">
                  <article className="dashboard-panel dashboard-panel--chart">
                    <div className="dashboard-panel-header">
                      <div>
                        <h2 className="dashboard-panel-title">Spending</h2>
                        <p className="dashboard-panel-subtitle">
                          {formatCurrency(totalDebits)} has left all accounts
                        </p>
                      </div>

                      <select
                        className="dashboard-select"
                        defaultValue="All"
                        aria-label="Select overview period"
                      >
                        <option>All</option>
                        <option>Recent</option>
                        <option>Pending</option>
                      </select>
                    </div>

                    <div className="dashboard-chart">
                      <div className="dashboard-chart-tooltip">
                        <span className="dashboard-chart-tooltip-day">GLOBAL</span>
                        <strong className="dashboard-chart-tooltip-value">
                          {formatCurrency(totalBalance)}
                        </strong>
                      </div>

                      <div className="dashboard-chart-grid">
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>

                      <div className="dashboard-chart-marker-line" />
                      <div className="dashboard-chart-marker-dot" />
                      <div className="dashboard-chart-axis">
                        <span>Overview</span>
                        <span>Credit</span>
                        <span>Debit</span>
                        <span>Pending</span>
                        <span>Recent</span>
                        <span>Live</span>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="col-12 col-xl-4">
                  <article className="dashboard-panel dashboard-panel--pay">
                    <div className="dashboard-panel-header dashboard-panel-header--stack">
                      <h2 className="dashboard-panel-title">Cards Overview</h2>
                    </div>

                    <div className="dashboard-contact-list">
                      <div className="dashboard-contact-item">
                        <span className="dashboard-contact-avatar" aria-hidden="true">
                          <FiCreditCard size={18} />
                        </span>
                        <span className="dashboard-contact-name">{dashboardCards.length} total cards</span>
                      </div>
                      <div className="dashboard-contact-item">
                        <span className="dashboard-contact-avatar" aria-hidden="true">
                          <FiUserCheck size={18} />
                        </span>
                        <span className="dashboard-contact-name">{activeCardsCount} active cards</span>
                      </div>
                      <div className="dashboard-contact-item">
                        <span className="dashboard-contact-avatar" aria-hidden="true">
                          <FiHeart size={18} />
                        </span>
                        <span className="dashboard-contact-name">{lockedCardsCount} locked cards</span>
                      </div>
                      <div className="dashboard-contact-item">
                        <span className="dashboard-contact-avatar" aria-hidden="true">
                          <FiBriefcase size={18} />
                        </span>
                        <span className="dashboard-contact-name">{dashboardAccounts.length} linked accounts</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="dashboard-pay-button"
                      onClick={() => navigate("/cards")}
                    >
                      Manage Cards
                    </button>
                  </article>
                </div>
              </div>
            </section>

            <section className="dashboard-section dashboard-section--recent">
              <div className="dashboard-section-header">
                <h2 className="dashboard-panel-title">Recent Activity</h2>
                <button
                  type="button"
                  className="dashboard-link-button"
                  onClick={() => navigate("/transactions")}
                >
                  See All
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <article className="dashboard-empty-state">
                  <span className="dashboard-empty-icon" aria-hidden="true">
                    <FiZap size={38} />
                  </span>
                  <p className="dashboard-empty-title">No activity yet</p>
                  <p className="dashboard-empty-copy">
                    Your latest payments and transfers will show here.
                  </p>
                </article>
              ) : (
                <div className="action-detail-list">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction._id} className="action-detail-row">
                      <span>
                        {transaction.description || transaction.type} ·{" "}
                        {formatDateTime(transaction.createdAt)}
                      </span>
                      <strong>
                        {transaction.direction === "credit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

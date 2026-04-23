import { useEffect, useMemo, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiBriefcase,
  FiEye,
  FiEyeOff,
  FiHeart,
  FiPlus,
  FiRepeat,
  FiShoppingBag,
  FiTrendingUp,
  FiUser,
  FiUserCheck,
  FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TransactionList from "../components/TransactionList";
import API from "../services/api";
import { formatCurrency } from "../utils/banking";

const actionItems = [
  {
    label: "Deposit",
    icon: FiPlus,
    accentClass: "dashboard-action-card--green",
    path: "/deposit",
  },
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

const contacts = [
  { name: "Contact 1", icon: FiUser },
  { name: "Contact 2", icon: FiUserCheck },
  { name: "Contact 3", icon: FiShoppingBag },
  { name: "Contact 4", icon: FiBriefcase },
  { name: "Contact 5", icon: FiHeart },
];

const emptyOverview = {
  account: { balance: 0, accountNumber: "" },
  summary: {
    totalDeposits: 0,
    totalWithdrawals: 0,
    activityCount: 0,
    depositCount: 0,
    withdrawalCount: 0,
    savingsRate: 0,
  },
  insights: { totalSpent: 0 },
  recentTransactions: [],
};

function Dashboard() {
  const [overview, setOverview] = useState(emptyOverview);
  const [showBalance, setShowBalance] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }, []);

  const userName =
    storedUser.firstname ||
    storedUser.displayName?.split(" ")[0] ||
    storedUser.email?.split("@")[0] ||
    "User";

  const summaryItems = [
    {
      title: "Total Deposits",
      value: formatCurrency(overview.summary.totalDeposits),
      change: `${overview.summary.depositCount} posted`,
      changeClass: "dashboard-stat-change--positive",
    },
    {
      title: "Total Withdrawals",
      value: formatCurrency(overview.summary.totalWithdrawals),
      change: `${overview.summary.withdrawalCount} posted`,
      changeClass: "dashboard-stat-change--negative",
    },
    {
      title: "Activity Count",
      value: String(overview.summary.activityCount),
      change: "Live updates",
      changeClass: "dashboard-stat-change--info",
    },
    {
      title: "Savings Goal",
      value: `${overview.summary.savingsRate}%`,
      change: "Based on deposits",
      changeClass: "dashboard-stat-change--accent",
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await API.get("/banking/overview");
        setOverview(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
          return;
        }

        setOverview(emptyOverview);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar userName={userName} />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <div className="row g-4 align-items-stretch dashboard-hero-row">
              <div className="col-12 col-xl-8">
                <section className="dashboard-balance-card">
                  <div className="dashboard-balance-top">
                    <p className="dashboard-eyebrow">Available Balance</p>
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
                      {showBalance
                        ? overview.account.balance.toLocaleString("en-ZA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "••••••"}
                    </h1>
                  </div>

                  <div className="dashboard-balance-footer">
                    <span className="dashboard-trend-pill">
                      <FiTrendingUp size={14} />
                      {overview.account.accountNumber || "Main account"}
                    </span>
                    <span className="dashboard-balance-hint">
                      {isLoading ? "Loading account..." : "Updated from live account data"}
                    </span>
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
                <h2 className="dashboard-section-title">Account Summary</h2>
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
                        <h2 className="dashboard-panel-title">Spending Overview</h2>
                        <p className="dashboard-panel-subtitle">
                          You spent {formatCurrency(overview.insights.totalSpent)} this month
                        </p>
                      </div>

                      <select
                        className="dashboard-select"
                        defaultValue="Monthly"
                        aria-label="Select overview period"
                      >
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Yearly</option>
                      </select>
                    </div>

                    <div className="dashboard-chart">
                      <div className="dashboard-chart-tooltip">
                        <span className="dashboard-chart-tooltip-day">LIVE</span>
                        <strong className="dashboard-chart-tooltip-value">
                          {formatCurrency(overview.insights.totalSpent)}
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
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="col-12 col-xl-4">
                  <article className="dashboard-panel dashboard-panel--pay">
                    <div className="dashboard-panel-header dashboard-panel-header--stack">
                      <h2 className="dashboard-panel-title">Quick Pay</h2>
                    </div>

                    <div className="dashboard-contact-list">
                      {contacts.map(({ name, icon: Icon }) => (
                        <div key={name} className="dashboard-contact-item">
                          <span className="dashboard-contact-avatar" aria-hidden="true">
                            <Icon size={18} />
                          </span>
                          <span className="dashboard-contact-name">{name}</span>
                        </div>
                      ))}
                    </div>

                    <button type="button" className="dashboard-pay-button">
                      Send Money
                    </button>
                  </article>
                </div>
              </div>
            </section>

            <section className="dashboard-section dashboard-section--recent">
              <div className="dashboard-section-header">
                <h2 className="dashboard-panel-title">Recent Transactions</h2>
                <button
                  type="button"
                  className="dashboard-link-button"
                  onClick={() => navigate("/transactions")}
                >
                  View All
                </button>
              </div>

              {overview.recentTransactions.length === 0 ? (
                <article className="dashboard-empty-state">
                  <span className="dashboard-empty-icon" aria-hidden="true">
                    <FiZap size={38} />
                  </span>
                  <p className="dashboard-empty-title">No recent transactions yet</p>
                  <p className="dashboard-empty-copy">
                    Your latest activity will appear here once you start using the dashboard
                    tools.
                  </p>
                </article>
              ) : (
                <TransactionList transactions={overview.recentTransactions} />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

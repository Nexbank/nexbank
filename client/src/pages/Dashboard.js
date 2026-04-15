import { useEffect, useState } from "react";
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
import API from "../services/api";

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

const summaryItems = [
  {
    title: "Total Deposits",
    value: "R0",
    change: "+12%",
    changeClass: "dashboard-stat-change--positive",
  },
  {
    title: "Total Withdrawals",
    value: "R0",
    change: "-5%",
    changeClass: "dashboard-stat-change--negative",
  },
  {
    title: "Activity Count",
    value: "0",
    change: "+8%",
    changeClass: "dashboard-stat-change--info",
  },
  {
    title: "Savings Goal",
    value: "85%",
    change: "+2%",
    changeClass: "dashboard-stat-change--accent",
  },
];

const contacts = [
  { name: "Contact 1", icon: FiUser },
  { name: "Contact 2", icon: FiUserCheck },
  { name: "Contact 3", icon: FiShoppingBag },
  { name: "Contact 4", icon: FiBriefcase },
  { name: "Contact 5", icon: FiHeart },
];

function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/users/profile");
        setBalance(res.data.balance);
      } catch (error) {
        setBalance(0);
      }
    };

    fetchData();
  }, []);

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
                        ? balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "••••••"}
                    </h1>
                  </div>

                  <div className="dashboard-balance-footer">
                    <span className="dashboard-trend-pill">
                      <FiTrendingUp size={14} />
                      +2.4% this month
                    </span>
                    <span className="dashboard-balance-hint">Updated just now</span>
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
                        <p className="dashboard-panel-subtitle">You spent R0 this week</p>
                      </div>

                      <select
                        className="dashboard-select"
                        defaultValue="Weekly"
                        aria-label="Select overview period"
                      >
                        <option>Weekly</option>
                        <option>Monthly</option>
                        <option>Yearly</option>
                      </select>
                    </div>

                    <div className="dashboard-chart">
                      <div className="dashboard-chart-tooltip">
                        <span className="dashboard-chart-tooltip-day">FRI</span>
                        <strong className="dashboard-chart-tooltip-value">R0</strong>
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
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

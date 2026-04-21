import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  FiDollarSign,
  FiFileText,
  FiHome,
  FiRepeat,
  FiShoppingBag,
  FiSmartphone,
  FiTruck,
  FiZap,
} from "react-icons/fi";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const insightStyles = {
  utilities: { color: "#19c88a", icon: FiZap },
  municipal: { color: "#ff4747", icon: FiHome },
  mobile: { color: "#4b8cff", icon: FiSmartphone },
  groceries: { color: "#19c88a", icon: FiShoppingBag },
  "card-spend": { color: "#19c88a", icon: FiShoppingBag },
  transfers: { color: "#ff8a1e", icon: FiRepeat },
  "cash-send": { color: "#ff8a1e", icon: FiRepeat },
  "cash-withdrawals": { color: "#4b8cff", icon: FiTruck },
  "cash-code": { color: "#4b8cff", icon: FiDollarSign },
  bills: { color: "#ff4747", icon: FiFileText },
  other: { color: "#4b8cff", icon: FiZap },
};

function InsightsDonut({ items }) {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const gap = 8;
  let offset = 0;
  const totalSpent = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="insights-donut-wrap">
      <svg
        viewBox="0 0 220 220"
        className="insights-donut"
        role="img"
        aria-label="Spending donut chart"
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="28"
        />

        {items.map((item) => {
          const segmentLength = (item.amount / totalSpent) * circumference - gap;
          const dashArray = `${Math.max(segmentLength, 0)} ${circumference}`;
          const circleOffset = -offset;

          offset += (item.amount / totalSpent) * circumference;

          return (
            <circle
              key={item.id}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="28"
              strokeLinecap="butt"
              strokeDasharray={dashArray}
              strokeDashoffset={circleOffset}
              transform="rotate(-90 110 110)"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function Insights() {
  const { insightsSummary } = useAccount();
  const insightItems = insightsSummary.categories.map((category) => ({
    ...category,
    ...(insightStyles[category.id] || insightStyles.other),
  }));

  return (
    <div className="dashboard-page insights-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area insights-content-area">
          <section className="insights-panel">
            <div className="insights-heading-wrap">
              <h1 className="insights-title">Spending Insights</h1>
            </div>

            {insightItems.length === 0 ? (
              <article className="dashboard-empty-state">
                <p className="dashboard-empty-title">No spending insights yet</p>
                <p className="dashboard-empty-copy">
                  Insights will update automatically once debit transactions are recorded.
                </p>
              </article>
            ) : (
              <div className="insights-grid">
                <article className="insights-chart-card">
                  <InsightsDonut items={insightItems} />

                  <div className="insights-total">
                    <p className="insights-total-label">TOTAL SPENT</p>
                    <h2 className="insights-total-value">
                      {formatCurrency(insightsSummary.totalSpent)}
                    </h2>
                  </div>
                </article>

                <section className="insights-breakdown">
                  <p className="insights-breakdown-label">CATEGORY BREAKDOWN</p>

                  <div className="insights-breakdown-list">
                    {insightItems.map((item) => {
                      const Icon = item.icon;
                      const percentage = (item.amount / insightsSummary.totalSpent) * 100;

                      return (
                        <article className="insights-category-card" key={item.id}>
                          <div
                            className="insights-category-icon"
                            style={{ backgroundColor: item.color }}
                          >
                            <Icon size={18} />
                          </div>

                          <div className="insights-category-main">
                            <div className="insights-category-header">
                              <span className="insights-category-name">{item.label}</span>
                              <span className="insights-category-amount">
                                {formatCurrency(item.amount)}
                              </span>
                            </div>

                            <div className="insights-progress-track">
                              <span
                                className="insights-progress-fill"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

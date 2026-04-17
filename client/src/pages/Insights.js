import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  FiShoppingBag,
  FiCoffee,
  FiTruck,
  FiSmartphone,
  FiZap,
} from "react-icons/fi";

const monthlySpending = [
  {
    name: "Groceries",
    amount: 4500,
    color: "#19c88a",
    icon: FiShoppingBag,
  },
  {
    name: "Dining",
    amount: 1200,
    color: "#4b8cff",
    icon: FiCoffee,
  },
  {
    name: "Transport",
    amount: 800,
    color: "#ff8a1e",
    icon: FiTruck,
  },
  {
    name: "Entertainment",
    amount: 500,
    color: "#a855f7",
    icon: FiSmartphone,
  },
  {
    name: "Utilities",
    amount: 2000,
    color: "#ff4747",
    icon: FiZap,
  },
];

const totalSpent = monthlySpending.reduce((sum, item) => sum + item.amount, 0);

function formatCurrency(amount) {
  return `R${amount.toLocaleString("en-ZA")}`;
}

function InsightsDonut() {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const gap = 8;
  let offset = 0;

  return (
    <div className="insights-donut-wrap">
      <svg
        viewBox="0 0 220 220"
        className="insights-donut"
        role="img"
        aria-label="Monthly spending donut chart"
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="28"
        />

        {monthlySpending.map((item) => {
          const segmentLength =
            (item.amount / totalSpent) * circumference - gap;
          const dashArray = `${Math.max(segmentLength, 0)} ${circumference}`;
          const circleOffset = -offset;

          offset += (item.amount / totalSpent) * circumference;

          return (
            <circle
              key={item.name}
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
  return (
    <div className="dashboard-page insights-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar userName="Nozwelo" />

        <main className="dashboard-content-area insights-content-area">
          <section className="insights-panel">
            <div className="insights-heading-wrap">
              <h1 className="insights-title">Spending Insights</h1>
            </div>

            <div className="insights-grid">
              <article className="insights-chart-card">
                <InsightsDonut />

                <div className="insights-total">
                  <p className="insights-total-label">TOTAL SPENT</p>
                  <h2 className="insights-total-value">
                    {formatCurrency(totalSpent)}.00
                  </h2>
                </div>
              </article>

              <section className="insights-breakdown">
                <p className="insights-breakdown-label">CATEGORY BREAKDOWN</p>

                <div className="insights-breakdown-list">
                  {monthlySpending.map((item) => {
                    const Icon = item.icon;
                    const percentage = (item.amount / totalSpent) * 100;

                    return (
                      <article className="insights-category-card" key={item.name}>
                        <div
                          className="insights-category-icon"
                          style={{ backgroundColor: item.color }}
                        >
                          <Icon size={18} />
                        </div>

                        <div className="insights-category-main">
                          <div className="insights-category-header">
                            <span className="insights-category-name">
                              {item.name}
                            </span>
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
          </section>
        </main>
      </div>
    </div>
  );
}

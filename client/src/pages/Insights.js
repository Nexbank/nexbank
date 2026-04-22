import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { buildInsightsItems, formatCurrency } from "../utils/banking";

function InsightsDonut({ items, totalSpent }) {
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

        {items.map((item) => {
          const segmentLength = (item.amount / totalSpent) * circumference - gap;
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
  const [overview, setOverview] = useState({
    insights: { totalSpent: 0, breakdown: [] },
  });
  const [isLoading, setIsLoading] = useState(true);
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }, []);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setIsLoading(true);
        const response = await API.get("/banking/overview");
        setOverview(response.data);
      } catch (error) {
        setOverview({
          insights: { totalSpent: 0, breakdown: [] },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const monthlySpending = buildInsightsItems(overview.insights.breakdown);
  const totalSpent = overview.insights.totalSpent;
  const userName =
    storedUser.firstname ||
    storedUser.displayName?.split(" ")[0] ||
    storedUser.email?.split("@")[0] ||
    "User";

  return (
    <div className="dashboard-page insights-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar userName={userName} />

        <main className="dashboard-content-area insights-content-area">
          <section className="insights-panel">
            <div className="insights-heading-wrap">
              <h1 className="insights-title">Spending Insights</h1>
            </div>

            <div className="insights-grid">
              <article className="insights-chart-card">
                {totalSpent > 0 ? <InsightsDonut items={monthlySpending} totalSpent={totalSpent} /> : null}

                <div className="insights-total">
                  <p className="insights-total-label">TOTAL SPENT</p>
                  <h2 className="insights-total-value">{formatCurrency(totalSpent)}</h2>
                </div>
              </article>

              <section className="insights-breakdown">
                <p className="insights-breakdown-label">CATEGORY BREAKDOWN</p>

                <div className="insights-breakdown-list">
                  {isLoading ? (
                    <article className="insights-category-card">
                      <div className="insights-category-main">
                        <div className="insights-category-header">
                          <span className="insights-category-name">Loading insights...</span>
                        </div>
                      </div>
                    </article>
                  ) : monthlySpending.length === 0 ? (
                    <article className="insights-category-card">
                      <div className="insights-category-main">
                        <div className="insights-category-header">
                          <span className="insights-category-name">No spending captured yet</span>
                          <span className="insights-category-amount">{formatCurrency(0)}</span>
                        </div>
                      </div>
                    </article>
                  ) : (
                    monthlySpending.map((item) => {
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
                              <span className="insights-category-name">{item.name}</span>
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
                    })
                  )}
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

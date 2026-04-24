import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getCategoryMeta } from "../constants/transactionCategories";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/banking";

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
        aria-label="Selected account spending donut chart"
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
  const { accounts, selectedAccount, insightsSummary, isLoading, selectAccount } = useAccount();

  const monthlySpending = insightsSummary.categories.map((category) => ({
    name: category.label,
    amount: category.amount,
    ...getCategoryMeta(category.label),
  }));
  const totalSpent = insightsSummary.totalSpent;

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            {isLoading ? (
              <article className="dashboard-empty-state">
                <p className="dashboard-empty-title">Loading insights...</p>
              </article>
            ) : !selectedAccount ? (
              <AccountRequiredState />
            ) : (
              <section className="dashboard-section">
                <div className="insights-heading-wrap d-flex align-items-center justify-content-between gap-3 flex-wrap">
                  <div>
                    <p className="action-page__eyebrow mb-2">Insights</p>
                    <h1 className="insights-title">Spending Insights</h1>
                  </div>

                  <div className="d-flex align-items-center gap-3 flex-wrap">
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
                    <span className="dashboard-panel-subtitle">{selectedAccount.accountNumber}</span>
                  </div>
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
                      {monthlySpending.length === 0 ? (
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
                          const percentage = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;

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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

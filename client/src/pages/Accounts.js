import { FiCheckCircle, FiCreditCard, FiLock, FiTrendingUp } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

export default function Accounts() {
  const { accounts, isLoading, selectedAccountId, selectAccount } = useAccount();

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page action-page--banking">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--green">
                  <FiCreditCard size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Accounts</p>
                  <h1 className="action-page__title">Manage your accounts</h1>
                  <p className="action-page__copy">
                    Switch between account types, review balances, and choose which account
                    controls your cards and transactions.
                  </p>
                </div>
              </div>

              <div className="action-workspace">
                <div className="action-workspace__main">
                  <section className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__eyebrow">Account types</p>
                        <h2 className="action-panel__title">Select the account you want to use</h2>
                        <p className="action-panel__copy">
                          Pick one account below. Your cards and transactions will switch to
                          match it immediately.
                        </p>
                      </div>
                    </div>

                    {isLoading ? (
                      <article className="dashboard-empty-state">
                        <p className="dashboard-empty-title">Loading your accounts...</p>
                        <p className="dashboard-empty-copy">
                          Your selectable account list will appear here shortly.
                        </p>
                      </article>
                    ) : accounts.length === 0 ? (
                      <article className="dashboard-empty-state">
                        <p className="dashboard-empty-title">No accounts found</p>
                        <p className="dashboard-empty-copy">
                          We could not load any user accounts yet.
                        </p>
                      </article>
                    ) : (
                      <div className="action-option-grid">
                        {accounts.map((account) => {
                          const isActive = account._id === selectedAccountId;

                          return (
                            <button
                              key={account._id}
                              type="button"
                              className={`action-option-card action-option-card--account ${
                                isActive ? "action-option-card--active" : ""
                              }`}
                              onClick={() => selectAccount(account._id)}
                            >
                              {isActive ? <span className="active-badge">Active</span> : null}

                              <div className="action-option-card__top">
                                <h3>{account.name}</h3>
                                <span>{account.accountType}</span>
                              </div>

                              <p className="action-option-card__amount">
                                {formatCurrency(account.availableBalance)}
                              </p>

                              <small className="action-helper">
                                {account.accountType} · {account.accountNumber}
                              </small>

                              <div className="action-option-card__cta">
                                {isActive ? "This is your active account" : "Click to select"}
                              </div>

                              <span
                                className={`action-select-btn ${
                                  isActive ? "action-select-btn--active" : ""
                                }`}
                              >
                                {isActive ? "Active Account" : "Select Account"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                <aside className="action-summary">
                  {accounts.map((account) => {
                    const isActive = account._id === selectedAccountId;

                    return (
                      <section
                        key={account._id}
                        className={`action-panel ${isActive ? "action-panel--summary" : ""}`}
                      >
                        <div className="action-review-card action-review-card--green">
                          <div className="action-review-card__head">
                            <span className="action-summary__icon">
                              <FiTrendingUp size={18} />
                            </span>
                            <div>
                              <p className="action-summary__label">{account.accountType}</p>
                              <strong className="action-review-card__title">{account.name}</strong>
                            </div>
                          </div>
                          <div className="action-review-card__amount">
                            {formatCurrency(account.availableBalance)}
                          </div>
                          <div className="action-review-card__meta">
                            <span>Ledger balance</span>
                            <strong>{formatCurrency(account.ledgerBalance)}</strong>
                          </div>
                          {isActive ? (
                            <div className="action-review-card__meta">
                              <span>Status</span>
                              <strong>Currently active</strong>
                            </div>
                          ) : null}
                        </div>

                        <div className="action-checklist">
                          <div className="action-checklist__item">
                            <FiCheckCircle size={16} />
                            <span>
                              {isActive
                                ? "This account is currently active across the app."
                                : "Select this account to use it for payments and transfers."}
                            </span>
                          </div>
                          <div className="action-checklist__item">
                            <FiLock size={16} />
                            <span>
                              Daily bill limit: {formatCurrency(account.limits.bill)}.
                            </span>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </aside>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

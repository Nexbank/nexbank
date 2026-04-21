import { FiCheckCircle, FiCreditCard, FiLock, FiTrendingUp } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const redirectLabels = {
  "/cards": "cards",
  "/deposit": "deposits",
  "/withdraw": "withdrawals",
  "/transfer": "transfers",
  "/pay-bills": "bill payments",
  "/transactions": "transactions",
};

export default function Accounts() {
  const { accounts, isLoading, selectedAccountId, selectAccount } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.redirectTo || "";
  const redirectLabel = redirectLabels[redirectTo] || "the next step";

  const handleSelectAccount = (accountId) => {
    selectAccount(accountId);

    if (redirectTo) {
      navigate(redirectTo, { replace: true });
    }
  };

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
                  <h1 className="action-page__title">Your current account</h1>
                  <p className="action-page__copy">
                    {redirectTo
                      ? `Select the account you want to use before continuing to ${redirectLabel}.`
                      : "Registration provisions one current account automatically. Fund it to activate cards and outgoing payments."}
                  </p>
                </div>
              </div>

              <div className="action-workspace">
                <div className="action-workspace__main">
                  <section className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__eyebrow">Provisioned account</p>
                        <h2 className="action-panel__title">Review your current account</h2>
                        <p className="action-panel__copy">
                          Your approved current account is provisioned automatically after login and
                          becomes the source of funds for account-specific actions across the app.
                        </p>
                      </div>

                      {redirectTo ? (
                        <span className="action-state-badge action-state-badge--pending">
                          Continue to {redirectLabel}
                        </span>
                      ) : null}
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
                          We could not provision any accounts for this profile yet.
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
                              onClick={() => handleSelectAccount(account._id)}
                            >
                              {isActive ? <span className="active-badge">Selected</span> : null}

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
                                {isActive
                                  ? "This is your default active account"
                                  : "Click to make this the active account"}
                              </div>

                              <span
                                className={`action-select-btn ${
                                  isActive ? "action-select-btn--active" : ""
                                }`}
                              >
                                {isActive ? "Selected Account" : "Select Account"}
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
                          <div className="action-review-card__meta">
                            <span>Activation</span>
                            <strong>
                              {account.isActive
                                ? "Active"
                                : `Awaiting ${formatCurrency(account.minimumFundingAmount)} funding`}
                            </strong>
                          </div>
                          {isActive ? (
                            <div className="action-review-card__meta">
                              <span>Status</span>
                              <strong>
                                {account.isActive ? "Currently active" : "Selected but inactive"}
                              </strong>
                            </div>
                          ) : null}
                        </div>

                        <div className="action-checklist">
                          <div className="action-checklist__item">
                            <FiCheckCircle size={16} />
                            <span>
                              {account.isActive
                                ? "This account is active across cards, transfers, and payments."
                                : "Make a qualifying deposit first to activate the account and physical card."}
                            </span>
                          </div>
                          <div className="action-checklist__item">
                            <FiLock size={16} />
                            <span>Daily bill limit: {formatCurrency(account.limits.bill)}.</span>
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

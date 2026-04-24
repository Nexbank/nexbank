import { useState } from "react";
import { FiBriefcase, FiPlus } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const accountTypes = [
  "Main Account",
  "TruSave",
  "Flexi Account",
  "Transact Account",
  "Student Account",
  "Private Banking",
];

export default function Accounts() {
  const [accountType, setAccountType] = useState("Main Account");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { accounts, selectedAccount, isLoading, selectAccount, createAccount } = useAccount();

  const handleCreateAccount = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");
      await createAccount({ accountType });
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--green">
                  <FiBriefcase size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Accounts</p>
                  <h1 className="action-page__title">Bank Accounts</h1>
                  <p className="action-page__copy">
                    Use the same account-focused layout as Deposit to review balances, switch the active
                    bank account, and create another account.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <article className="action-panel">
                  <p className="action-helper">Loading accounts...</p>
                </article>
              ) : !selectedAccount ? (
                <AccountRequiredState />
              ) : (
                <div className="action-page__grid">
                  <article className="action-panel">
                    <p className="action-panel__label">Available balance</p>
                    <h2 className="action-panel__value">
                      {formatCurrency(selectedAccount.availableBalance)}
                    </h2>
                    <p className="action-panel__meta">
                      Account: {selectedAccount.accountNumber} • {selectedAccount.accountType}
                    </p>
                  </article>

                  <article className="action-panel action-panel--form">
                    <div className="action-panel__header">
                      <h2 className="action-panel__title">Account Details</h2>
                      <p className="action-panel__copy">
                        Switch the shared active account or create a new account from the same summary-backed view.
                      </p>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Selected account</span>
                        <select
                          className="action-form__input"
                          value={selectedAccount._id}
                          onChange={(event) => selectAccount(event.target.value)}
                        >
                          {accounts.map((account) => (
                            <option key={account._id} value={account._id}>
                              {account.name} • {account.accountNumber}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="action-option-grid">
                        {accounts.map((account) => (
                          <button
                            key={account._id}
                            type="button"
                            className={`action-option-card ${
                              selectedAccount._id === account._id ? "action-option-card--active" : ""
                            }`}
                            onClick={() => selectAccount(account._id)}
                          >
                            <div className="action-option-card__top">
                              <h3>{account.name}</h3>
                              <span>{account.accountType}</span>
                            </div>
                            <p className="action-option-card__amount">
                              {formatCurrency(account.availableBalance)}
                            </p>
                            <small className="action-helper">{account.accountNumber}</small>
                          </button>
                        ))}
                      </div>

                      <form className="action-form" onSubmit={handleCreateAccount}>
                        <label className="action-form__field">
                          <span>Account type</span>
                          <select
                            className="action-form__input"
                            value={accountType}
                            onChange={(event) => setAccountType(event.target.value)}
                          >
                            {accountTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </label>

                        {error ? <small className="action-helper action-helper--error">{error}</small> : null}

                        <button className="action-form__button" type="submit" disabled={isSubmitting}>
                          <FiPlus size={16} />
                          {isSubmitting ? "Creating account..." : "Create Account"}
                        </button>
                      </form>
                    </div>
                  </article>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { depositCategories } from "../constants/transactionCategories";
import { useAccount } from "../context/AccountContext";
import { showErrorAlert, showSuccessToast } from "../utils/alerts";
import { formatCurrency } from "../utils/banking";

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

export default function Deposit({ search, setSearch, searchResults }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    amount: "",
    category: depositCategories[0],
    reference: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const { accounts, selectedAccount, depositFunds, isLoading, selectAccount } = useAccount();

  // 🔹 UI Consistency
  // This shared account-panel layout keeps all money actions visually aligned even though each action submits different details.
  const shouldShowAccountState = !isLoading && !selectedAccount;
  const selectableAccounts = accounts.filter(Boolean);
  const amount = Number(form.amount || 0);
  const fee = 0;
  const totalCredit = amount;
  const accountDisplayBalance = Number(
    selectedAccount?.availableBalance ??
      selectedAccount?.balance ??
      selectedAccount?.ledgerBalance ??
      0
  );
  const accountDisplayName = selectedAccount?.name || "Selected account";
  const accountDisplayNumber = selectedAccount?.accountNumber || "Account unavailable";
  const accountDisplayType = humanizeValue(selectedAccount?.accountType || "current");
  const accountDisplayCategory = humanizeValue(selectedAccount?.category || "transactional");

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!amount || amount <= 0) {
      await showErrorAlert("Invalid amount", "Please enter a valid deposit amount.");
      return;
    }

    if (!selectedAccount?._id) {
      await showErrorAlert("No account selected", "Select an account before making a deposit.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 🔹 Ledger Update
      // Deposits only send intent; the backend creates the transaction and returns the updated account state.
      await depositFunds({
        accountId: selectedAccount._id,
        amount,
        category: form.category,
        reference: form.reference,
        bankName: "Direct Deposit",
        source: "external",
        accountHolder: storedUser.firstname || "Account Holder",
      });

      showSuccessToast("Deposit completed successfully.");
      navigate("/dashboard");
    } catch (error) {
      await showErrorAlert(
        "Deposit failed",
        error.response?.data?.error || error.message || "Deposit failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar search={search} setSearch={setSearch} searchResults={searchResults} />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page">
              <div className="action-page__hero">
                <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                  ←
                </button>
                <span className="action-page__icon action-page__icon--green">
                  <FiPlusCircle size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Transactions</p>
                  <h1 className="action-page__title">Deposit</h1>
                  <p className="action-page__copy">
                    Add money into your selected account and let the backend ledger update balances automatically.
                  </p>
                </div>
              </div>

              {shouldShowAccountState ? (
                <section className="dashboard-section">
                  <AccountRequiredState
                    title="No account available"
                    copy="Create or select an account before making a deposit."
                  />
                </section>
              ) : (
                <form className="action-workspace-grid" onSubmit={handleSubmit}>
                  <article className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Deposit into account</p>
                        <h2 className="action-panel__title">Source Account</h2>
                        <p className="action-panel__copy">
                          Choose the account that should receive the deposit.
                        </p>
                      </div>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Selected account</span>
                        <select
                          className="action-form__input"
                          value={selectedAccount?._id || ""}
                          onChange={(event) => selectAccount(event.target.value)}
                        >
                          {selectableAccounts.map((account) => (
                            <option key={account._id} value={account._id}>
                              {(account.name || "Account")} • {account.accountNumber} • {formatCurrency(account.availableBalance ?? account.balance ?? 0)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="action-account-card">
                        <p className="action-account-card__label">Available balance</p>
                        <h3 className="action-account-card__value">
                          {formatCurrency(accountDisplayBalance)}
                        </h3>
                        <p className="action-account-card__name">{accountDisplayName}</p>
                        <p className="action-account-card__meta">{accountDisplayNumber}</p>
                        <div className="accounts-feature-row">
                          <span className="accounts-badge accounts-badge--type">{accountDisplayType}</span>
                          <span className="accounts-badge accounts-badge--available">{accountDisplayCategory}</span>
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className="action-panel action-panel--form">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Transaction details</p>
                        <h2 className="action-panel__title">Deposit Details</h2>
                        <p className="action-panel__copy">
                          Enter only the deposit details relevant to this transaction.
                        </p>
                      </div>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Amount</span>
                        <input
                          className="action-form__input"
                          type="number"
                          min="0.01"
                          step="0.01"
                          name="amount"
                          value={form.amount}
                          onChange={handleChange}
                          placeholder="Enter deposit amount"
                        />
                      </label>

                      <label className="action-form__field">
                        <span>Category</span>
                        <select
                          className="action-form__input"
                          name="category"
                          value={form.category}
                          onChange={handleChange}
                        >
                          {depositCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="action-form__field">
                        <span>Reference</span>
                        <input
                          className="action-form__input"
                          type="text"
                          name="reference"
                          value={form.reference}
                          onChange={handleChange}
                          placeholder="e.g. Salary deposit"
                        />
                      </label>
                    </div>
                  </article>

                  <article className="action-panel action-panel--summary">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Summary</p>
                        <h2 className="action-panel__title">Deposit Preview</h2>
                        <p className="action-panel__copy">
                          Review the final credit before submitting to the backend.
                        </p>
                      </div>
                    </div>

                    <div className="action-summary-list">
                      <div className="action-summary-row">
                        <span>Amount</span>
                        <strong>{formatCurrency(amount)}</strong>
                      </div>
                      <div className="action-summary-row">
                        <span>Fee</span>
                        <strong>{formatCurrency(fee)}</strong>
                      </div>
                      <div className="action-summary-row action-summary-row--total">
                        <span>Total credit</span>
                        <strong>{formatCurrency(totalCredit)}</strong>
                      </div>
                    </div>

                    <button className="action-form__button" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Posting deposit..." : "Deposit Funds"}
                    </button>
                  </article>
                </form>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

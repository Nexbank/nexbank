import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { spendingCategories } from "../constants/transactionCategories";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { showErrorAlert, showSuccessToast } from "../utils/alerts";
import { formatCurrency } from "../utils/banking";

const WITHDRAWAL_FEE = 0;

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

export default function Withdraw({ search, setSearch, searchResults }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    category: spendingCategories[0],
    reference: "",
  });
  const { accounts, selectedAccount, withdrawFunds, isLoading, selectAccount } = useAccount();

  const shouldShowAccountState = !isLoading && !selectedAccount;
  const selectableAccounts = accounts.filter(Boolean);
  const selectedAccountRules = selectedAccount?.rules || null;
  // 🔹 Banking Logic
  // Withdrawal availability comes from account rules so restricted products are blocked consistently in UI and backend.
  const canWithdraw = selectedAccountRules?.allowsWithdrawals !== false;
  const amount = Number(form.amount || 0);
  const totalDebit = amount + WITHDRAWAL_FEE;
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
    const amount = Number(form.amount);
    const fee = Number(form.fee || 0);

    if (!amount || amount <= 0) {
      await showErrorAlert("Invalid amount", "Please enter a valid withdrawal amount.");
      return;
    }

    if (!selectedAccount?._id) {
      await showErrorAlert("No account selected", "Select an account before making a withdrawal.");
      return;
    }

    if (!Number.isFinite(fee) || fee < 0) {
      alert("Please enter a valid withdrawal fee.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 🔹 Ledger Update
      // The page never mutates balances locally; it submits a withdrawal command and waits for the backend summary refresh.
      await withdrawFunds({
        accountId: selectedAccount._id,
        amount,
        bankName: "Cash withdrawal",
        payoutChannel: "cash",
        beneficiaryName: "",
        accountNumber: "",
        accountType: "",
        note: form.reference || `${form.category} withdrawal`,
      });

      showSuccessToast("Withdrawal completed successfully.");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.error || "Withdrawal failed. Please try again.";
      await showErrorAlert("Withdrawal failed", message);
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
                <span className="action-page__icon action-page__icon--blue">
                  <FiArrowUpRight size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Transactions</p>
                  <h1 className="action-page__title">Withdraw</h1>
                  <p className="action-page__copy">
                    Move money out of your selected account using backend-validated withdrawal rules.
                  </p>
                </div>
              </div>

              {shouldShowAccountState ? (
                <section className="dashboard-section">
                  <AccountRequiredState
                    title="No account available"
                    copy="Create or select an account before making a withdrawal."
                  />
                </section>
              ) : (
                <form className="action-workspace-grid" onSubmit={handleSubmit}>
                  <article className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Withdraw from account</p>
                        <h2 className="action-panel__title">Source Account</h2>
                        <p className="action-panel__copy">
                          Choose the account that should fund this withdrawal.
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
                        <h2 className="action-panel__title">Withdrawal Details</h2>
                        <p className="action-panel__copy">
                          Enter only the transaction information needed for this withdrawal.
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
                          placeholder="Enter withdrawal amount"
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
                          {spendingCategories.map((category) => (
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
                          placeholder="e.g. ATM withdrawal"
                        />
                      </label>

                      <div className="action-readonly-row">
                        <span>Transaction fee</span>
                        {/* 🔹 UI Consistency
                            Withdrawal fees are system-owned, so the UI shows them read-only instead of exposing a user input. */}
                        <strong>{formatCurrency(WITHDRAWAL_FEE)}</strong>
                      </div>

                      {!canWithdraw ? (
                        <small className="action-helper action-helper--error">
                          Withdrawals are not available for this account type.
                        </small>
                      ) : null}
                    </div>
                  </article>

                  <article className="action-panel action-panel--summary">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Summary</p>
                        <h2 className="action-panel__title">Withdrawal Preview</h2>
                        <p className="action-panel__copy">
                          Review the final debit before sending this instruction to the backend.
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
                        <strong>{formatCurrency(WITHDRAWAL_FEE)}</strong>
                      </div>
                      <div className="action-summary-row action-summary-row--total">
                        <span>Total debit</span>
                        <strong>{formatCurrency(totalDebit)}</strong>
                      </div>
                    </div>

                    <button
                      className="action-form__button"
                      type="submit"
                      disabled={isSubmitting || !canWithdraw}
                    >
                      {isSubmitting ? "Posting withdrawal..." : "Confirm Withdrawal"}
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

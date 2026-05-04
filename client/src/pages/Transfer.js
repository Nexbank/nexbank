import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiRepeat } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { showErrorAlert, showSuccessToast } from "../utils/alerts";
import { formatCurrency } from "../utils/currency";

const transferOptions = [
  { id: "internal", label: "NexBank transfer", bankName: "NexBank" },
  { id: "external", label: "Other bank", bankName: "" },
  { id: "voucher", label: "Cash send", bankName: "NexBank" },
];

const generateCode = () => String(Math.floor(1000 + Math.random() * 9000));

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

export default function Transfer({ search, setSearch, searchResults }) {
  const navigate = useNavigate();
  const { accounts, selectedAccount, selectAccount, transferFunds, isLoading } = useAccount();
  const [form, setForm] = useState({
    route: "internal",
    amount: "",
    destination: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shouldShowAccountState = !isLoading && !selectedAccount;
  const selectableAccounts = accounts.filter(Boolean);
  const selectedAccountRules = selectedAccount?.rules || null;
  // 🔹 Banking Logic
  // Transfer permissions and daily limits are account-type rules, not UI-only assumptions.
  const canTransfer = selectedAccountRules?.allowsTransfers !== false;
  const selectedRoute = useMemo(
    () => transferOptions.find((option) => option.id === form.route) || transferOptions[0],
    [form.route]
  );
  const amount = Number(form.amount || 0);
  const fee = 0;
  const totalDebit = amount + fee;
  const otherAccounts = selectableAccounts.filter(
    (account) => account._id !== selectedAccount?._id
  );
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

  const destinationLabel =
    form.route === "internal"
      ? "Recipient NexBank account"
      : form.route === "external"
        ? "Recipient account number"
        : "Recipient cellphone number";

  const destinationPlaceholder =
    form.route === "internal"
      ? "Select recipient account"
      : form.route === "external"
        ? "Enter external bank account number"
        : "Enter cellphone number";

  const summaryLabel =
    form.route === "voucher"
      ? "Cash send total"
      : "Total debit";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!amount || amount <= 0) {
      await showErrorAlert("Invalid amount", "Please enter a valid transfer amount.");
      return;
    }

    if (!selectedAccount?._id) {
      await showErrorAlert("No account selected", "Select an account before creating a transfer.");
      return;
    }

    if (!form.destination.trim()) {
      await showErrorAlert(
        "Missing destination",
        form.route === "internal"
          ? "Please select the recipient NexBank account."
          : `Please enter ${destinationLabel.toLowerCase()}.`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // 🔹 Ledger Update
      // One transfer command covers internal, external, and voucher routes so the backend can choose the correct posting behavior.
      await transferFunds({
        accountId: selectedAccount._id,
        amount,
        route: form.route,
        bankName: selectedRoute.bankName || "Other bank",
        beneficiaryName: form.destination,
        accountNumber: form.route === "voucher" ? "" : form.destination,
        accountType: form.route === "internal" ? "NexBank" : "Cheque",
        cellphone: form.route === "voucher" ? form.destination : "",
        reference: form.destination || "Transfer",
        note: "",
        code: form.route === "voucher" ? generateCode() : "",
      });

      const successMessage =
        form.route === "internal"
          ? "Internal transfer completed successfully."
          : form.route === "external"
            ? "External transfer submitted successfully."
            : "Cash send created successfully.";

      showSuccessToast(successMessage);
      navigate("/dashboard");
    } catch (error) {
      await showErrorAlert(
        "Transfer failed",
        error.response?.data?.error || error.message || "Transfer failed. Please try again."
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
                <span className="action-page__icon action-page__icon--orange">
                  <FiRepeat size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Transfer</h1>
                  <p className="action-page__copy">
                    Send money from your selected account and let the backend decide transaction status and settlement.
                  </p>
                </div>
              </div>

              {shouldShowAccountState ? (
                <section className="dashboard-section">
                  <AccountRequiredState
                    title="No account available"
                    copy="Create or select an account before making a transfer."
                  />
                </section>
              ) : (
                <form className="action-workspace-grid" onSubmit={handleSubmit}>
                  <article className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Transfer from account</p>
                        <h2 className="action-panel__title">Source Account</h2>
                        <p className="action-panel__copy">
                          Choose the account that should fund this transfer.
                        </p>
                      </div>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Selected account</span>
                        <select
                          className="action-form__input"
                          value={selectedAccount?._id || ""}
                          onChange={(event) => {
                            // 🔹 UI Consistency
                            // Reset the destination when the source account changes so internal-transfer selections never go stale.
                            selectAccount(event.target.value);
                            setForm((current) => ({ ...current, destination: "" }));
                          }}
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
                        <h2 className="action-panel__title">Transfer Details</h2>
                        <p className="action-panel__copy">
                          Choose a transfer type and enter the destination information for that route.
                        </p>
                      </div>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Transfer type</span>
                        <select
                          className="action-form__input"
                          name="route"
                          value={form.route}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              route: event.target.value,
                              destination: "",
                            }))
                          }
                        >
                          {transferOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

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
                          placeholder="Enter transfer amount"
                        />
                      </label>

                      <label className="action-form__field">
                        <span>{destinationLabel}</span>
                        {form.route === "internal" ? (
                          <select
                            className="action-form__input"
                            name="destination"
                            value={form.destination}
                            onChange={handleChange}
                          >
                            <option value="">{destinationPlaceholder}</option>
                            {otherAccounts.map((account) => (
                              <option key={account._id} value={account.accountNumber}>
                                {(account.name || "Account")} • {account.accountNumber} • {formatCurrency(account.availableBalance ?? account.balance ?? 0)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="action-form__input"
                            type="text"
                            name="destination"
                            value={form.destination}
                            onChange={handleChange}
                            placeholder={destinationPlaceholder}
                          />
                        )}
                        {form.route === "internal" ? (
                          <small>
                            {otherAccounts.length > 0
                              ? "Please select the recipient NexBank account."
                              : "Create another active account to make an internal transfer."}
                          </small>
                        ) : null}
                      </label>

                      {!canTransfer ? (
                        <small className="action-helper action-helper--error">
                          Transfers are not available for this account type.
                        </small>
                      ) : null}
                    </div>
                  </article>

                  <article className="action-panel action-panel--summary">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Summary</p>
                        <h2 className="action-panel__title">Transfer Preview</h2>
                        <p className="action-panel__copy">
                          Review the total debit before sending this transfer instruction.
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
                        <span>{summaryLabel}</span>
                        <strong>{formatCurrency(totalDebit)}</strong>
                      </div>
                    </div>

                    <button
                      className="action-form__button"
                      type="submit"
                      disabled={isSubmitting || !canTransfer}
                    >
                      {isSubmitting ? "Submitting transfer..." : "Send Transfer"}
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

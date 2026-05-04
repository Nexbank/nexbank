import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { showErrorAlert, showSuccessToast } from "../utils/alerts";
import { formatCurrency } from "../utils/banking";

const TRANSACTION_FEE = 2;

const billCategories = [
  {
    value: "Electricity (Prepaid/Postpaid)",
    label: "Electricity (Prepaid/Postpaid)",
    fields: [
      { name: "meterNumber", label: "Meter Number", type: "text", placeholder: "Enter meter number", required: true },
    ],
  },
  {
    value: "Water & Municipality",
    label: "Water & Municipality",
    fields: [
      { name: "accountNumber", label: "Account Number", type: "text", placeholder: "Enter water account number", required: true },
    ],
  },
  {
    value: "Airtime & Data",
    label: "Airtime & Data",
    fields: [
      { name: "phoneNumber", label: "Phone Number", type: "tel", placeholder: "Enter phone number", required: true },
      { name: "networkProvider", label: "Network Provider", type: "select", required: true, options: ["MTN", "Vodacom", "Cell C", "Telkom", "Rain"] },
    ],
  },
  {
    value: "Lotto",
    label: "Lotto",
    fields: [
      { name: "lottoNumber", label: "Lotto Number", type: "text", placeholder: "Enter your lotto number", required: true },
    ],
  },
  {
    value: "DSTV",
    label: "DSTV",
    fields: [
      { name: "smartCardNumber", label: "Smart Card Number", type: "text", placeholder: "Enter DSTV smart card number", required: true },
      { name: "packageType", label: "Package Type", type: "select", required: true, options: ["EasyView", "Family", "Compact", "Compact Plus", "Premium", "Access"] },
    ],
  },
];

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

const getBillerNameFromCategory = (category) => {
  switch (category) {
    case "Electricity (Prepaid/Postpaid)":
      return "Eskom / Municipality";
    case "Water & Municipality":
      return "Municipality";
    case "Airtime & Data":
      return "Mobile Network Provider";
    case "Lotto":
      return "National Lottery";
    case "DSTV":
      return "MultiChoice DSTV";
    default:
      return "";
  }
};

export default function PayBills({ search, setSearch, searchResults }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    amount: "",
    category: billCategories[0].value,
    billerName: "",
    reference: "",
    dynamicFields: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accounts, selectedAccount, selectAccount, payBill, isLoading } = useAccount();

  const shouldShowAccountState = !isLoading && !selectedAccount;
  const selectableAccounts = accounts.filter(Boolean);
  const selectedAccountRules = selectedAccount?.rules || null;
  // 🔹 Banking Logic
  // Bill-payment availability is driven by account rules so savings-style products can stay read-only and predictable.
  const canPayBills = selectedAccountRules?.allowsBillPayments !== false;
  const currentCategory = billCategories.find((category) => category.value === form.category) || billCategories[0];
  const dynamicFields = currentCategory.fields || [];
  const amount = Number(form.amount || 0);
  // 🔹 Ledger Update
  // The summary shows amount plus fee, while the backend persists the fee separately for accurate bill history.
  const totalDebit = amount + TRANSACTION_FEE;
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
    const { name, value } = event.target;

    if (name === "category") {
      setForm((current) => ({
        ...current,
        category: value,
        dynamicFields: {},
        billerName: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    setForm((current) => ({
      ...current,
      dynamicFields: {
        ...current.dynamicFields,
        [fieldName]: value,
      },
    }));
  };

  const validateDynamicFields = async () => {
    for (const field of dynamicFields) {
      if (field.required && !form.dynamicFields[field.name]) {
        await showErrorAlert("Missing details", `Please enter ${field.label}.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!amount || amount <= 0) {
      await showErrorAlert("Invalid amount", "Please enter a valid bill amount.");
      return;
    }

    if (!selectedAccount?._id) {
      await showErrorAlert("No account selected", "Select an account before paying a bill.");
      return;
    }

    const finalBillerName = form.billerName.trim() || getBillerNameFromCategory(form.category);

    if (!finalBillerName) {
      await showErrorAlert("Missing details", "Please enter the biller name.");
      return;
    }

    if (!(await validateDynamicFields())) {
      return;
    }

    try {
      setIsSubmitting(true);

      // 🔹 Ledger Update
      // Bills submit structured category-specific fields, but the backend still owns the final debit and transaction record.
      await payBill({
        accountId: selectedAccount._id,
        amount,
        category: form.category,
        provider: finalBillerName,
        reference: form.reference,
        accountNumber: form.dynamicFields.accountNumber || form.dynamicFields.meterNumber || "",
        billName: form.category,
        dueDate: "",
        dynamicFields: form.dynamicFields,
      });

      showSuccessToast("Bill payment completed successfully. Fee: R2.");
      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Bill payment failed. Please try again.";

      await showErrorAlert("Bill payment failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDynamicField = (field) => {
    if (field.type === "select") {
      return (
        <select
          className="action-form__input"
          name={field.name}
          value={form.dynamicFields[field.name] || ""}
          onChange={(event) => handleDynamicFieldChange(field.name, event.target.value)}
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        className="action-form__input"
        type={field.type}
        name={field.name}
        value={form.dynamicFields[field.name] || ""}
        onChange={(event) => handleDynamicFieldChange(field.name, event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar
          search={search}
          setSearch={setSearch}
          searchResults={searchResults}
          searchPlaceholder="Search bill categories..."
        />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page">
              <div className="action-page__hero">
                <button type="button" className="back-btn" onClick={() => navigate(-1)}>
                  ←
                </button>
                <span className="action-page__icon action-page__icon--purple">
                  <FiFileText size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Pay Bills</h1>
                  <p className="action-page__copy">
                    Pay service providers from your selected account with a backend-owned fixed transaction fee.
                  </p>
                </div>
              </div>

              {shouldShowAccountState ? (
                <section className="dashboard-section">
                  <AccountRequiredState
                    title="No account available"
                    copy="Create or select an account before paying a bill."
                  />
                </section>
              ) : (
                <form className="action-workspace-grid" onSubmit={handleSubmit}>
                  <article className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Pay from account</p>
                        <h2 className="action-panel__title">Source Account</h2>
                        <p className="action-panel__copy">
                          Choose the account that should fund this bill payment.
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
                        <h2 className="action-panel__title">Bill Payment Details</h2>
                        <p className="action-panel__copy">
                          Select the bill category and complete only the fields required for that payment.
                        </p>
                      </div>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Bill category</span>
                        <select
                          className="action-form__input"
                          name="category"
                          value={form.category}
                          onChange={handleChange}
                        >
                          {billCategories.map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
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
                          placeholder="Enter bill amount"
                        />
                      </label>

                      <label className="action-form__field">
                        <span>Biller name</span>
                        <input
                          className="action-form__input"
                          type="text"
                          name="billerName"
                          value={form.billerName}
                          onChange={handleChange}
                          placeholder={getBillerNameFromCategory(form.category) || "Enter biller name"}
                        />
                      </label>

                      {dynamicFields.map((field) => (
                        <label key={field.name} className="action-form__field">
                          <span>{field.label}</span>
                          {renderDynamicField(field)}
                        </label>
                      ))}

                      <label className="action-form__field">
                        <span>Reference</span>
                        <input
                          className="action-form__input"
                          type="text"
                          name="reference"
                          value={form.reference}
                          onChange={handleChange}
                          placeholder="e.g. Monthly bill payment"
                        />
                      </label>

                      {!canPayBills ? (
                        <small className="action-helper action-helper--error">
                          Bill payments are not available for this account type.
                        </small>
                      ) : null}
                    </div>
                  </article>

                  <article className="action-panel action-panel--summary">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__label">Summary</p>
                        <h2 className="action-panel__title">Bill Payment Preview</h2>
                        <p className="action-panel__copy">
                          Review the final debit, including the fixed transaction fee, before submitting.
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
                        <strong>{formatCurrency(TRANSACTION_FEE)}</strong>
                      </div>
                      <div className="action-summary-row action-summary-row--total">
                        <span>Total debit</span>
                        <strong>{formatCurrency(totalDebit)}</strong>
                      </div>
                    </div>

                    <button
                      className="action-form__button"
                      type="submit"
                      disabled={isSubmitting || !canPayBills}
                    >
                      {isSubmitting ? "Posting bill payment..." : "Pay Bill"}
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

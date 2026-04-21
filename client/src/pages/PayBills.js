import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiHome,
  FiShield,
  FiWifi,
} from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const billOptions = [
  {
    id: "utilities",
    title: "Utilities",
    description: "Electricity, water, and prepaid services.",
    badge: "Household",
    caution: "Make sure the reference is correct.",
  },
  {
    id: "municipal",
    title: "Municipal rates",
    description: "Rates, taxes, and local government bills.",
    badge: "Municipal",
    caution: "Keep your reference in case there is a delay.",
  },
  {
    id: "mobile",
    title: "Mobile & internet",
    description: "Cellphone contracts, fibre, and data services.",
    badge: "Connectivity",
    caution: "The provider may be offline for a short time.",
  },
];

const providerOptions = {
  utilities: ["City Power", "Eskom", "Prepaid24", "Rand Water"],
  municipal: ["City of Johannesburg", "eThekwini", "City of Tshwane", "Cape Town"],
  mobile: ["MTN", "Vodacom", "Telkom", "Rain"],
};

const initialForm = {
  category: "utilities",
  provider: "City Power",
  accountNumber: "",
  billName: "",
  amount: "",
  dueDate: "",
  reference: "",
  saveBiller: true,
  validationStatus: "Not checked",
};

export default function PayBills() {
  const { accounts, balance, createTransaction, selectedAccountId, settleTransaction } =
    useAccount();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState("idle");
  const [receipt, setReceipt] = useState(null);
  const activeAccount = useMemo(
    () => accounts.find((account) => account._id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const amountValue = Number(formData.amount || 0);
  const formattedAmount = useMemo(() => formatCurrency(formData.amount), [formData.amount]);
  const selectedCategory = billOptions.find((option) => option.id === formData.category);
  const balanceAfterPayment = formatCurrency(balance - amountValue);

  const steps = [
    { id: 1, label: "Biller" },
    { id: 2, label: "Validate" },
    { id: 3, label: "Confirm" },
  ];

  const setField = (field) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleCategoryChange = (category) => {
    setFormData((current) => ({
      ...current,
      category,
      provider: providerOptions[category][0],
      validationStatus: "Not checked",
    }));
    setErrors({});
    setReceipt(null);
    setStatus("idle");
    setCurrentStep(1);
  };

  const validateStep = () => {
    const nextErrors = {};

    if (!formData.billName.trim()) {
      nextErrors.billName = "Enter the bill or account holder name.";
    }

    if (!formData.accountNumber.trim()) {
      nextErrors.accountNumber = "Enter the bill account or meter number.";
    }

    if (!Number(formData.amount) || Number(formData.amount) < 10) {
      nextErrors.amount = "Pay at least R10.00.";
    }

    if (amountValue > balance) {
      nextErrors.amount = "This exceeds your available balance.";
    }

    if (!activeAccount) {
      nextErrors.amount = "Load an active account before paying a bill.";
    }

    if (activeAccount && amountValue > activeAccount.limits.bill) {
      nextErrors.amount = "This exceeds your daily bill payment limit.";
    }

    if (!formData.reference.trim()) {
      nextErrors.reference = "Add the business-critical payment reference.";
    }

    if (!formData.dueDate) {
      nextErrors.dueDate = "Choose a due date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const runValidation = () => {
    if (!validateStep()) {
      setCurrentStep(2);
      return;
    }

    setFormData((current) => ({ ...current, validationStatus: "Validated" }));
    setCurrentStep(3);
  };

  const handleSubmit = () => {
    if (!validateStep()) {
      setCurrentStep(2);
      return;
    }

    setStatus("submitting");

    window.setTimeout(async () => {
      const paymentId = `bill-${Date.now()}`;

      try {
        await createTransaction({
          id: paymentId,
          type: "bill",
          direction: "debit",
          accountId: activeAccount._id,
          amount: amountValue,
          status: "pending",
          reference: formData.reference,
          description: `Bill payment to ${formData.provider}`,
          metadata: {
            dueDate: formData.dueDate,
            provider: formData.provider,
            category: formData.category,
            billName: formData.billName,
            accountNumber: formData.accountNumber,
          },
        });

        window.setTimeout(() => {
          settleTransaction(paymentId, "completed").catch(() => {});
        }, 4000);

        setReceipt({
          amount: formattedAmount,
          provider: formData.provider,
          reference: formData.reference,
          dueDate: formData.dueDate,
          status: "Submitted for settlement",
        });
        setStatus("success");
      } catch (error) {
        window.alert(error.response?.data?.error || error.message || "Failed to pay bill.");
        setStatus("idle");
      }
    }, 900);
  };

  const resetFlow = () => {
    setFormData(initialForm);
    setErrors({});
    setStatus("idle");
    setReceipt(null);
    setCurrentStep(1);
  };

  const CategoryIcon =
    formData.category === "municipal"
      ? FiHome
      : formData.category === "mobile"
        ? FiWifi
        : FiFileText;

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page action-page--banking">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--purple">
                  <FiFileText size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Pay Bills</h1>
                  <p className="action-page__copy">
                    Choose the bill type, enter the bill details, and check everything before
                    you pay.
                  </p>
                </div>
              </div>

              <div className="action-steps">
                {steps.map((step) => (
                  <span
                    key={step.id}
                    className={`action-step ${
                      currentStep === step.id ? "action-step--active" : ""
                    } ${currentStep > step.id ? "action-step--complete" : ""}`}
                  >
                    {step.id}. {step.label}
                  </span>
                ))}
              </div>

              <div className="action-workspace">
                {!activeAccount ? (
                  <AccountRequiredState
                    title="Select an account to pay bills"
                    copy="Bill payments are account-scoped. Choose an account before making a payment."
                  />
                ) : (
                  <>
                <div className="action-workspace__main">
                  <section className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__eyebrow">Choose type</p>
                        <h2 className="action-panel__title">What bill do you want to pay?</h2>
                        <p className="action-panel__copy">
                          Pick the bill type first.
                        </p>
                      </div>
                    </div>

                    <div className="action-option-grid">
                      {billOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`action-option-card ${
                            formData.category === option.id ? "action-option-card--active" : ""
                          }`}
                          onClick={() => handleCategoryChange(option.id)}
                        >
                          <div className="action-option-card__top">
                            <h3>{option.title}</h3>
                            <span>{option.badge}</span>
                          </div>
                          <p>{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__eyebrow">Biller details</p>
                        <h2 className="action-panel__title">Enter bill details</h2>
                        <p className="action-panel__copy">
                          Check the account details before you pay.
                        </p>
                      </div>
                      <span className="action-state-badge action-state-badge--pending">
                        {formData.validationStatus}
                      </span>
                    </div>

                    <div className="action-form">
                      <div className="action-amount-band action-amount-band--purple">
                        <span className="action-amount-band__currency">R</span>
                        <input
                          type="number"
                          min="10"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={setField("amount")}
                        />
                      </div>
                      {errors.amount ? (
                        <small className="action-helper action-helper--error">{errors.amount}</small>
                      ) : (
                        <small className="action-helper">
                          Daily limit: {formatCurrency(activeAccount.limits.bill)}.
                        </small>
                      )}

                      <div className="action-form__grid">
                        <label className="action-form__field">
                          <span>Service provider</span>
                          <select value={formData.provider} onChange={setField("provider")}>
                            {providerOptions[formData.category].map((provider) => (
                              <option key={provider} value={provider}>
                                {provider}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="action-form__field">
                          <span>Due date</span>
                          <input type="date" value={formData.dueDate} onChange={setField("dueDate")} />
                          {errors.dueDate ? <small>{errors.dueDate}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Bill account name</span>
                          <input
                            type="text"
                            placeholder="Customer or account holder name"
                            value={formData.billName}
                            onChange={setField("billName")}
                          />
                          {errors.billName ? <small>{errors.billName}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Account or meter number</span>
                          <input
                            type="text"
                            placeholder="Enter bill account number"
                            value={formData.accountNumber}
                            onChange={setField("accountNumber")}
                          />
                          {errors.accountNumber ? <small>{errors.accountNumber}</small> : null}
                        </label>

                        <label className="action-form__field action-form__field--full">
                          <span>Payment reference</span>
                          <input
                            type="text"
                            placeholder="Reference the biller expects"
                            value={formData.reference}
                            onChange={setField("reference")}
                          />
                          {errors.reference ? <small>{errors.reference}</small> : null}
                        </label>

                        <label className="action-toggle-row action-form__field--full">
                          <span>Save this biller</span>
                          <input
                            type="checkbox"
                            checked={formData.saveBiller}
                            onChange={setField("saveBiller")}
                          />
                        </label>
                      </div>

                      <div className="action-form__actions">
                        <button
                          type="button"
                          className="action-button action-button--ghost"
                          onClick={resetFlow}
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="action-button action-button--primary action-button--purple"
                          onClick={runValidation}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </section>

                  {currentStep >= 3 ? (
                    <section className="action-panel">
                      <div className="action-panel__header">
                        <div>
                          <p className="action-panel__eyebrow">Review</p>
                          <h2 className="action-panel__title">Check your payment</h2>
                          <p className="action-panel__copy">
                            Make sure the bill details and amount are correct.
                          </p>
                        </div>
                      </div>

                      <div className="action-detail-list">
                        <div className="action-detail-row">
                          <span>Provider</span>
                          <strong>{formData.provider}</strong>
                        </div>
                        <div className="action-detail-row">
                          <span>Amount</span>
                          <strong>{formattedAmount}</strong>
                        </div>
                        <div className="action-detail-row">
                          <span>Due date</span>
                          <strong>{formData.dueDate}</strong>
                        </div>
                        <div className="action-detail-row">
                          <span>Balance after payment</span>
                          <strong>{balanceAfterPayment}</strong>
                        </div>
                      </div>

                      <div className="action-instruction-list">
                        <div className="action-instruction-item">
                          <FiShield size={16} />
                          <span>Make sure the reference is correct.</span>
                        </div>
                        <div className="action-instruction-item">
                          <FiClock size={16} />
                          <span>The payment may take some time to show.</span>
                        </div>
                        <div className="action-instruction-item">
                          <FiAlertTriangle size={16} />
                          <span>{selectedCategory.caution}</span>
                        </div>
                      </div>

                      <div className="action-form__actions">
                        <button
                          type="button"
                          className="action-button action-button--ghost"
                          onClick={() => setCurrentStep(2)}
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          className="action-button action-button--primary action-button--purple"
                          onClick={handleSubmit}
                          disabled={status === "submitting"}
                        >
                          {status === "submitting" ? "Paying..." : "Pay bill"}
                        </button>
                      </div>
                    </section>
                  ) : null}
                </div>

                <aside className="action-summary">
                  <section className="action-panel action-panel--summary">
                    <div className="action-review-card action-review-card--purple">
                      <div className="action-review-card__head">
                        <span className="action-summary__icon">
                          <CategoryIcon size={18} />
                        </span>
                        <div>
                          <p className="action-summary__label">Selected bill</p>
                          <strong className="action-review-card__title">{formData.provider}</strong>
                        </div>
                      </div>
                      <div className="action-review-card__amount">
                        {formatCurrency(balance)}
                      </div>
                      <div className="action-review-card__meta">
                        <span>Paying from</span>
                        <strong>{activeAccount.name}</strong>
                      </div>
                    </div>

                    <div className="action-checklist">
                      <div className="action-checklist__item">
                        <FiClock size={16} />
                        <span>Your payment may take some time to show.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiCalendar size={16} />
                        <span>Due date helps you pay on time.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiCheckCircle size={16} />
                        <span>Save your biller for next time.</span>
                      </div>
                    </div>
                  </section>

                  {status === "success" && receipt ? (
                    <section className="action-panel action-panel--success">
                      <div className="action-success">
                        <span className="action-success__icon">
                          <FiCheckCircle size={22} />
                        </span>
                        <div>
                          <h2>Bill paid</h2>
                          <p>
                            {receipt.amount} for {receipt.provider} is now queued for settlement.
                          </p>
                        </div>
                      </div>

                      <dl className="action-receipt">
                        <div>
                          <dt>Status</dt>
                          <dd>{receipt.status}</dd>
                        </div>
                        <div>
                          <dt>Reference</dt>
                          <dd>{receipt.reference}</dd>
                        </div>
                        <div>
                          <dt>Due date</dt>
                          <dd>{receipt.dueDate}</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        className="action-button action-button--primary action-button--full action-button--purple"
                        onClick={resetFlow}
                      >
                        New bill payment
                      </button>
                    </section>
                  ) : null}
                </aside>
                  </>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

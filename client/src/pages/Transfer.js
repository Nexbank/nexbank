import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiRepeat,
  FiShield,
  FiSmartphone,
  FiUser,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const bankOptions = [
  "Absa",
  "Capitec",
  "Discovery Bank",
  "FNB",
  "Nedbank",
  "Standard Bank",
  "TymeBank",
];

const transferOptions = [
  {
    id: "internal",
    title: "Nexbank transfer",
    description: "Send money to another Nexbank account.",
    badge: "Internal",
    settlement: "This is usually instant.",
    caution: "Check the name before you send.",
  },
  {
    id: "external",
    title: "Other bank",
    description: "Send money to another bank account.",
    badge: "External",
    settlement: "This can stay pending for a while.",
    caution: "The transfer may take time to clear.",
  },
  {
    id: "voucher",
    title: "Cash send",
    description: "Send cash with a code and cellphone number.",
    badge: "Cash send",
    settlement: "The code is ready straight away.",
    caution: "Keep the code private.",
  },
];

const initialForm = {
  route: "internal",
  bankName: "Nexbank",
  beneficiaryName: "",
  accountNumber: "",
  accountType: "Cheque",
  cellphone: "",
  amount: "",
  reference: "",
  note: "",
  saveBeneficiary: true,
  code: "5842",
};

const generateCode = () => String(Math.floor(1000 + Math.random() * 9000));

export default function Transfer() {
  const { selectedAccount, transferFunds } = useAccount();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState("idle");
  const [receipt, setReceipt] = useState(null);

  const amountValue = Number(formData.amount || 0);
  const formattedAmount = useMemo(() => formatCurrency(formData.amount), [formData.amount]);
  const selectedRoute = transferOptions.find((option) => option.id === formData.route);

  const steps = [
    { id: 1, label: "Route" },
    { id: 2, label: "Beneficiary" },
    { id: 3, label: "Review" },
  ];

  const setField = (field) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateStep = () => {
    const nextErrors = {};

    if (!formData.beneficiaryName.trim()) {
      nextErrors.beneficiaryName = "Enter the beneficiary name.";
    }

    if (!amountValue) {
      nextErrors.amount = "Enter an amount to transfer.";
    }

    if (!formData.reference.trim()) {
      nextErrors.reference = "Add a reference for the recipient.";
    }

    if (formData.route !== "voucher" && !/^\d{6,12}$/.test(formData.accountNumber.trim())) {
      nextErrors.accountNumber = "Use 6 to 12 digits for the account number.";
    }

    if (
      formData.route === "voucher" &&
      !/^(?:\+27|0)\d{9}$/.test(formData.cellphone.replace(/\s/g, ""))
    ) {
      nextErrors.cellphone = "Use a valid South African cellphone number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRouteChange = (route) => {
    setFormData((current) => ({
      ...current,
      route,
      bankName: route === "internal" ? "Nexbank" : current.bankName,
      code: route === "voucher" ? generateCode() : current.code,
    }));
    setErrors({});
    setStatus("idle");
    setReceipt(null);
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      setCurrentStep(2);
      return;
    }

    setStatus("submitting");

    try {
      await transferFunds({
        amount: amountValue,
        route: formData.route,
        bankName: formData.bankName,
        beneficiaryName: formData.beneficiaryName,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        cellphone: formData.cellphone,
        reference: formData.reference,
        note: formData.note,
        code: formData.code,
      });

      setReceipt({
        amount: formattedAmount,
        destination:
          formData.route === "voucher"
            ? `${formData.beneficiaryName} cash voucher`
            : `${formData.beneficiaryName} at ${formData.bankName}`,
        reference: formData.reference,
        status:
          formData.route === "internal"
            ? "Completed"
            : formData.route === "external"
              ? "Pending settlement"
              : "Voucher created",
        code: formData.code,
      });
      setErrors({});
      setStatus("success");
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.message ||
        "Failed to send transfer.";

      setErrors((current) => ({
        ...current,
        amount: current.amount || message,
      }));
      setStatus("idle");
    }
  };

  const resetFlow = () => {
    setFormData({ ...initialForm, code: generateCode() });
    setErrors({});
    setStatus("idle");
    setReceipt(null);
    setCurrentStep(1);
  };

  if (!selectedAccount) {
    return null;
  }

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page action-page--banking">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--orange">
                  <FiRepeat size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Transfer</h1>
                  <p className="action-page__copy">
                    Choose who you want to pay from {selectedAccount.name}, enter the details, and
                    check everything before you send the money.
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
                <div className="action-workspace__main">
                  <section className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__eyebrow">Choose method</p>
                        <h2 className="action-panel__title">Where do you want to send money?</h2>
                        <p className="action-panel__copy">
                          Pick the type of transfer you want to make.
                        </p>
                      </div>
                    </div>

                    <div className="action-option-grid">
                      {transferOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`action-option-card ${
                            formData.route === option.id ? "action-option-card--active" : ""
                          }`}
                          onClick={() => handleRouteChange(option.id)}
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
                        <p className="action-panel__eyebrow">Beneficiary details</p>
                        <h2 className="action-panel__title">
                          {formData.route === "voucher"
                            ? "Set up the cash collection"
                            : "Validate the transfer recipient"}
                        </h2>
                        <p className="action-panel__copy">{selectedRoute.settlement}</p>
                      </div>
                      <span className="action-state-badge action-state-badge--pending">
                        {currentStep < 3 ? "Check details" : "Ready"}
                      </span>
                    </div>

                    <div className="action-form">
                      <div className="action-amount-band action-amount-band--orange">
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
                          Available: {formatCurrency(selectedAccount.availableBalance)}.
                        </small>
                      )}

                      <div className="action-avatar-card">
                        <span>{formData.beneficiaryName.trim().charAt(0) || "B"}</span>
                        <strong>{formData.beneficiaryName || "Beneficiary"}</strong>
                      </div>

                      <div className="action-form__grid">
                        <label className="action-form__field">
                          <span>Beneficiary name</span>
                          <input
                            type="text"
                            placeholder="Enter beneficiary name"
                            value={formData.beneficiaryName}
                            onChange={setField("beneficiaryName")}
                          />
                          {errors.beneficiaryName ? <small>{errors.beneficiaryName}</small> : null}
                        </label>

                        {formData.route === "voucher" ? (
                          <label className="action-form__field">
                            <span>Cellphone number</span>
                            <input
                              type="tel"
                              placeholder="072 000 0000"
                              value={formData.cellphone}
                              onChange={setField("cellphone")}
                            />
                            {errors.cellphone ? <small>{errors.cellphone}</small> : null}
                          </label>
                        ) : (
                          <label className="action-form__field">
                            <span>Bank name</span>
                            <select value={formData.bankName} onChange={setField("bankName")}>
                              {(formData.route === "internal" ? ["Nexbank"] : bankOptions).map(
                                (bank) => (
                                  <option key={bank} value={bank}>
                                    {bank}
                                  </option>
                                )
                              )}
                            </select>
                          </label>
                        )}

                        {formData.route === "voucher" ? (
                          <div className="action-reference-block">
                            <div>
                              <span className="action-reference-block__label">Voucher PIN</span>
                              <strong>{formData.code}</strong>
                            </div>
                            <button
                              type="button"
                              className="action-button action-button--outline"
                              onClick={() =>
                                setFormData((current) => ({ ...current, code: generateCode() }))
                              }
                            >
                              Regenerate
                            </button>
                          </div>
                        ) : (
                          <>
                            <label className="action-form__field">
                              <span>Account number</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Enter account number"
                                value={formData.accountNumber}
                                onChange={setField("accountNumber")}
                              />
                              {errors.accountNumber ? <small>{errors.accountNumber}</small> : null}
                            </label>

                            <label className="action-form__field">
                              <span>Account type</span>
                              <select value={formData.accountType} onChange={setField("accountType")}>
                                <option value="Cheque">Cheque</option>
                                <option value="Savings">Savings</option>
                                <option value="Transmission">Transmission</option>
                              </select>
                            </label>
                          </>
                        )}

                        <label className="action-form__field">
                          <span>Recipient reference</span>
                          <input
                            type="text"
                            placeholder="What the recipient sees"
                            value={formData.reference}
                            onChange={setField("reference")}
                          />
                          {errors.reference ? <small>{errors.reference}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Internal note</span>
                          <input
                            type="text"
                            placeholder="Optional tracking note"
                            value={formData.note}
                            onChange={setField("note")}
                          />
                        </label>

                        {formData.route !== "voucher" ? (
                          <label className="action-toggle-row action-form__field--full">
                            <span>Save this beneficiary</span>
                            <input
                              type="checkbox"
                              checked={formData.saveBeneficiary}
                              onChange={setField("saveBeneficiary")}
                            />
                          </label>
                        ) : null}
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
                          className="action-button action-button--primary action-button--orange"
                          onClick={() => {
                            if (validateStep()) {
                              setCurrentStep(3);
                            } else {
                              setCurrentStep(2);
                            }
                          }}
                        >
                          Review transfer
                        </button>
                      </div>
                    </div>
                  </section>

                  {currentStep >= 3 ? (
                    <section className="action-panel">
                      <div className="action-panel__header">
                        <div>
                          <p className="action-panel__eyebrow">Review</p>
                          <h2 className="action-panel__title">Check your transfer</h2>
                          <p className="action-panel__copy">
                            Make sure the details are right before you send.
                          </p>
                        </div>
                      </div>

                      <div className="action-detail-list">
                        <div className="action-detail-row">
                          <span>Transfer route</span>
                          <strong>{selectedRoute.title}</strong>
                        </div>
                        <div className="action-detail-row">
                          <span>Amount</span>
                          <strong>{formattedAmount}</strong>
                        </div>
                        <div className="action-detail-row">
                          <span>Total</span>
                          <strong>{formattedAmount}</strong>
                        </div>
                        <div className="action-detail-row">
                          <span>Available balance</span>
                          <strong>{formatCurrency(selectedAccount.availableBalance)}</strong>
                        </div>
                      </div>

                      <div className="action-instruction-list">
                        <div className="action-instruction-item">
                          <FiShield size={16} />
                          <span>You will confirm with your PIN or biometrics.</span>
                        </div>
                        <div className="action-instruction-item">
                          <FiClock size={16} />
                          <span>{selectedRoute.settlement}</span>
                        </div>
                        <div className="action-instruction-item">
                          <FiAlertTriangle size={16} />
                          <span>{selectedRoute.caution}</span>
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
                          className="action-button action-button--primary action-button--orange"
                          onClick={handleSubmit}
                          disabled={status === "submitting"}
                        >
                          {status === "submitting" ? "Sending..." : "Send money"}
                        </button>
                      </div>
                    </section>
                  ) : null}
                </div>

                <aside className="action-summary">
                  <section className="action-panel action-panel--summary">
                    <div className="action-review-card action-review-card--orange">
                      <div className="action-review-card__head">
                        <span className="action-summary__icon">
                          <FiUser size={18} />
                        </span>
                        <div>
                          <p className="action-summary__label">From</p>
                          <strong className="action-review-card__title">{selectedAccount.name}</strong>
                        </div>
                      </div>
                      <div className="action-review-card__amount">
                        {formatCurrency(selectedAccount.availableBalance)}
                      </div>
                      <div className="action-review-card__meta">
                        <span>Account type</span>
                        <strong>{selectedAccount.accountType}</strong>
                      </div>
                    </div>

                    <div className="action-checklist">
                      <div className="action-checklist__item">
                        <FiShield size={16} />
                        <span>This screen should stop double payments.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiClock size={16} />
                        <span>The status updates when the transfer is done.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiSmartphone size={16} />
                        <span>Cash send uses a short code.</span>
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
                          <h2>Transfer sent</h2>
                          <p>
                            {receipt.amount} for {receipt.destination} is now recorded.
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
                          <dt>Voucher PIN</dt>
                          <dd>{formData.route === "voucher" ? receipt.code : "N/A"}</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        className="action-button action-button--primary action-button--full action-button--orange"
                        onClick={resetFlow}
                      >
                        New transfer
                      </button>
                    </section>
                  ) : null}
                </aside>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

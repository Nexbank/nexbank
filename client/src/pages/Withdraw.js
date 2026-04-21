import { useMemo, useState } from "react";
import {
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const payoutBanks = [
  "Absa",
  "Capitec",
  "Discovery Bank",
  "FNB",
  "Nedbank",
  "Standard Bank",
  "TymeBank",
  "Nexbank",
];

const payoutChannels = [
  {
    id: "bank-transfer",
    title: "Existing bank account",
    description: "Withdraw to a bank account you already use outside NexBank.",
  },
  {
    id: "atm-code",
    title: "Cash code",
    description: "Generate a short-lived code for supported ATM collection.",
  },
];

const initialForm = {
  payoutChannel: "bank-transfer",
  bankName: "FNB",
  accountType: "Cheque",
  beneficiaryName: "",
  accountNumber: "",
  amount: "",
  note: "",
};

export default function Withdraw() {
  const { selectedAccount, withdrawFunds } = useAccount();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  const amountValue = Number(formData.amount || 0);
  const formattedAmount = useMemo(() => formatCurrency(formData.amount), [formData.amount]);

  const setField = (field) => (event) => {
    const value = event.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!formData.beneficiaryName.trim()) {
      nextErrors.beneficiaryName = "Enter the beneficiary name.";
    }

    if (!/^\d{6,12}$/.test(formData.accountNumber.trim())) {
      nextErrors.accountNumber = "Use 6 to 12 digits for the receiving account.";
    }

    if (!amountValue) {
      nextErrors.amount = "Enter an amount to withdraw.";
    }

    if (!formData.note.trim()) {
      nextErrors.note = "Add a note so this payout is easy to recognise.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStatus("submitting");
    setSubmitError("");

    try {
      await withdrawFunds({
        amount: amountValue,
        bankName: formData.bankName,
        payoutChannel: formData.payoutChannel,
        beneficiaryName: formData.beneficiaryName,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        note: formData.note,
      });

      setReceipt({
        amount: formattedAmount,
        bankName: formData.bankName,
        beneficiaryName: formData.beneficiaryName,
        eta:
          formData.payoutChannel === "atm-code"
            ? "ready in under 5 minutes"
            : "sent within 60 minutes",
      });
      setErrors({});
      setStatus("success");
    } catch (requestError) {
      const message =
        requestError.response?.data?.error || requestError.message || "Withdrawal failed.";

      setErrors((current) => ({
        ...current,
        amount: current.amount || message,
      }));
      setSubmitError(message);
      setStatus("idle");
    }
  };

  const resetFlow = () => {
    setFormData(initialForm);
    setErrors({});
    setReceipt(null);
    setSubmitError("");
    setStatus("idle");
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
            <section className="action-page">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--blue">
                  <FiArrowUpRight size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Transactions</p>
                  <h1 className="action-page__title">Withdraw</h1>
                  <p className="action-page__copy">
                    Send money out from {selectedAccount.name}, review the destination, and keep
                    the payout flow secure and easy to follow.
                  </p>
                </div>
              </div>

              <div className="action-workspace">
                <div className="action-workspace__main">
                  <section className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__eyebrow">Payout route</p>
                        <h2 className="action-panel__title">Choose where the money goes</h2>
                      </div>
                    </div>

                    <div className="action-option-grid">
                      {payoutChannels.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`action-option-card ${
                            formData.payoutChannel === option.id
                              ? "action-option-card--active"
                              : ""
                          }`}
                          onClick={() =>
                            setFormData((current) => ({
                              ...current,
                              payoutChannel: option.id,
                            }))
                          }
                        >
                          <div>
                            <div className="action-option-card__top">
                              <h3>{option.title}</h3>
                            </div>
                            <p>{option.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__eyebrow">Existing bank</p>
                        <h2 className="action-panel__title">Withdrawal destination</h2>
                      </div>
                    </div>

                    <form className="action-form" onSubmit={handleSubmit}>
                      <div className="action-form__grid">
                        <label className="action-form__field">
                          <span>Bank name</span>
                          <select value={formData.bankName} onChange={setField("bankName")}>
                            {payoutBanks.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="action-form__field">
                          <span>Account type</span>
                          <select value={formData.accountType} onChange={setField("accountType")}>
                            <option value="Cheque">Cheque</option>
                            <option value="Savings">Savings</option>
                            <option value="Transmission">Transmission</option>
                          </select>
                        </label>

                        <label className="action-form__field">
                          <span>Beneficiary name</span>
                          <input
                            type="text"
                            placeholder="Name on receiving account"
                            value={formData.beneficiaryName}
                            onChange={setField("beneficiaryName")}
                          />
                          {errors.beneficiaryName ? <small>{errors.beneficiaryName}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Account number</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 6214567890"
                            value={formData.accountNumber}
                            onChange={setField("accountNumber")}
                          />
                          {errors.accountNumber ? <small>{errors.accountNumber}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Withdrawal amount</span>
                          <input
                            type="number"
                            min="100"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={setField("amount")}
                          />
                          {errors.amount ? <small>{errors.amount}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Reference note</span>
                          <input
                            type="text"
                            placeholder="Why are you withdrawing?"
                            value={formData.note}
                            onChange={setField("note")}
                          />
                          {errors.note ? <small>{errors.note}</small> : null}
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
                          type="submit"
                          className="action-button action-button--primary action-button--blue"
                          disabled={status === "submitting"}
                        >
                          {status === "submitting" ? "Processing..." : "Confirm withdrawal"}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>

                <aside className="action-summary">
                  <section className="action-panel action-panel--summary">
                    <div className="action-summary__card action-summary__card--blue">
                      <span className="action-summary__icon">
                        <FiDollarSign size={20} />
                      </span>
                      <div>
                        <p className="action-summary__label">Withdrawal total</p>
                        <h3 className="action-summary__amount">{formattedAmount}</h3>
                      </div>
                    </div>

                    <div className="action-checklist">
                      <div className="action-checklist__item">
                        <FiShield size={16} />
                        <span>Withdrawals are recorded before the payout status updates.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiClock size={16} />
                        <span>Some payouts stay pending while the bank confirms the request.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiSmartphone size={16} />
                        <span>Cash code withdrawals are issued as short-lived collections.</span>
                      </div>
                    </div>
                    {submitError ? (
                      <small className="action-helper action-helper--error">{submitError}</small>
                    ) : null}
                  </section>

                  {status === "success" && receipt ? (
                    <section className="action-panel action-panel--success">
                      <div className="action-success">
                        <span className="action-success__icon">
                          <FiCheckCircle size={22} />
                        </span>
                        <div>
                          <h2>Withdrawal requested</h2>
                          <p>
                            {receipt.amount} for {receipt.beneficiaryName} via {receipt.bankName} is{" "}
                            {receipt.eta}.
                          </p>
                        </div>
                      </div>

                      <dl className="action-receipt">
                        <div>
                          <dt>Account</dt>
                          <dd>{selectedAccount.name}</dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd>Queued for settlement</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        className="action-button action-button--primary action-button--full"
                        onClick={resetFlow}
                      >
                        New withdrawal
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

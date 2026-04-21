import { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiLock,
  FiPlusCircle,
  FiRefreshCw,
} from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
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
  "Nexbank",
];

const fundingOptions = [
  {
    id: "linked-bank",
    title: "Existing bank account",
    description: "Move money from a bank account you already use.",
    badge: "Recommended",
  },
  {
    id: "debit-card",
    title: "Debit card",
    description: "Top up instantly with a personal card.",
    badge: "Instant",
  },
  {
    id: "manual-eft",
    title: "Manual EFT",
    description: "Use provided banking details and pay from your bank app.",
    badge: "1-2 hrs",
  },
];

const initialForm = {
  source: "linked-bank",
  bankName: "Standard Bank",
  accountHolder: "",
  accountNumber: "",
  depositAmount: "",
  reference: "",
  transferSpeed: "standard",
};

export default function Deposit() {
  const { accounts, createTransaction, error, selectedAccountId, settleTransaction } =
    useAccount();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [receipt, setReceipt] = useState(null);
  const activeAccount = useMemo(
    () => accounts.find((account) => account._id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const amountValue = Number(formData.depositAmount || 0);
  const formattedAmount = useMemo(
    () => formatCurrency(formData.depositAmount),
    [formData.depositAmount]
  );

  const setField = (field) => (event) => {
    const value = event.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!activeAccount) {
      nextErrors.depositAmount = "Load an active account before creating a deposit.";
    }

    if (!formData.accountHolder.trim()) {
      nextErrors.accountHolder = "Enter the account holder name.";
    }

    if (!/^\d{6,12}$/.test(formData.accountNumber.trim())) {
      nextErrors.accountNumber = "Use 6 to 12 digits for the bank account number.";
    }

    if (!amountValue || amountValue < 50) {
      nextErrors.depositAmount = "Deposit at least R50.00.";
    }

    if (activeAccount && amountValue > activeAccount.limits.deposit) {
      nextErrors.depositAmount = "This exceeds your daily deposit limit.";
    }

    if (!formData.reference.trim()) {
      nextErrors.reference = "Add a payment reference so the transfer is easy to match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStatus("submitting");

    try {
      const transaction = await createTransaction({
        type: "deposit",
        direction: "credit",
        accountId: activeAccount._id,
        amount: amountValue,
        status: "pending",
        reference: formData.reference,
        description: `Deposit from ${formData.bankName}`,
        metadata: {
          source: formData.source,
          accountHolder: formData.accountHolder,
          accountNumber: formData.accountNumber,
          transferSpeed: formData.transferSpeed,
        },
      });

      window.setTimeout(() => {
        settleTransaction(transaction._id, "completed").catch(() => {});
      }, formData.transferSpeed === "priority" ? 3000 : 5000);

      const payoutWindow =
        formData.transferSpeed === "priority" ? "within 10 minutes" : "within 2 hours";

      setReceipt({
        bankName: formData.bankName,
        depositAmount: formattedAmount,
        reference: formData.reference,
        payoutWindow,
      });
      setStatus("success");
    } catch (requestError) {
      window.alert(requestError.response?.data?.error || requestError.message || "Deposit failed.");
      setStatus("idle");
    }
  };

  const resetFlow = () => {
    setStatus("idle");
    setReceipt(null);
    setErrors({});
    setFormData(initialForm);
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
                  <FiPlusCircle size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Transactions</p>
                  <h1 className="action-page__title">Deposit</h1>
                  <p className="action-page__copy">
                    Connect an existing bank account, choose how fast you want the
                    transfer processed, and move money into NexBank with a guided flow.
                  </p>
                </div>
              </div>

                <div className="action-workspace">
                  {!activeAccount ? (
                    <AccountRequiredState
                      title="Select an account to make a deposit"
                      copy="Deposits are account-scoped. Choose an account before creating a deposit."
                    />
                  ) : (
                    <>
                <div className="action-workspace__main">
                  <section className="action-panel">
                    <div className="action-panel__header">
                      <div>
                        <p className="action-panel__eyebrow">Funding method</p>
                        <h2 className="action-panel__title">Choose how you want to deposit</h2>
                      </div>
                    </div>

                    <div className="action-option-grid">
                      {fundingOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`action-option-card ${
                            formData.source === option.id ? "action-option-card--active" : ""
                          }`}
                          onClick={() =>
                            setFormData((current) => ({ ...current, source: option.id }))
                          }
                        >
                          <div>
                            <div className="action-option-card__top">
                              <h3>{option.title}</h3>
                              <span>{option.badge}</span>
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
                        <h2 className="action-panel__title">Bank deposit details</h2>
                      </div>
                    </div>

                    <form className="action-form" onSubmit={handleSubmit}>
                      <div className="action-form__grid">
                        <label className="action-form__field">
                          <span>Bank name</span>
                          <select value={formData.bankName} onChange={setField("bankName")}>
                            {bankOptions.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="action-form__field">
                          <span>Transfer speed</span>
                          <select
                            value={formData.transferSpeed}
                            onChange={setField("transferSpeed")}
                          >
                            <option value="standard">Standard transfer (1-3 days)</option>
                            <option value="priority">Immediate payment</option>
                          </select>
                        </label>

                        <label className="action-form__field">
                          <span>Account holder</span>
                          <input
                            type="text"
                            placeholder="Name on the bank account"
                            value={formData.accountHolder}
                            onChange={setField("accountHolder")}
                          />
                          {errors.accountHolder ? <small>{errors.accountHolder}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Account number</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 1023456789"
                            value={formData.accountNumber}
                            onChange={setField("accountNumber")}
                          />
                          {errors.accountNumber ? <small>{errors.accountNumber}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Amount</span>
                          <input
                            type="number"
                            min="50"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.depositAmount}
                            onChange={setField("depositAmount")}
                          />
                          {errors.depositAmount ? <small>{errors.depositAmount}</small> : null}
                        </label>

                        <label className="action-form__field">
                          <span>Reference</span>
                          <input
                            type="text"
                            placeholder="Salary top-up, savings, rent"
                            value={formData.reference}
                            onChange={setField("reference")}
                          />
                          {errors.reference ? <small>{errors.reference}</small> : null}
                        </label>
                      </div>

                      <div className="action-form__actions">
                        <button type="button" className="action-button action-button--ghost">
                          Save bank account
                        </button>
                        <button
                          type="submit"
                          className="action-button action-button--primary"
                          disabled={status === "submitting"}
                        >
                          {status === "submitting" ? "Processing..." : "Start deposit"}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>

                <aside className="action-summary">
                  <section className="action-panel action-panel--summary">
                    <div className="action-summary__card action-summary__card--green">
                      <span className="action-summary__icon">
                        <FiCreditCard size={20} />
                      </span>
                      <div>
                        <p className="action-summary__label">Deposit total</p>
                        <h3 className="action-summary__amount">{formattedAmount}</h3>
                      </div>
                    </div>

                    <div className="action-checklist">
                      <div className="action-checklist__item">
                        <FiLock size={16} />
                        <span>Deposits are recorded on the backend ledger before settlement.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiClock size={16} />
                        <span>Standard deposits usually clear within 2 hours.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiRefreshCw size={16} />
                        <span>Once confirmed, the amount will appear in recent activity.</span>
                      </div>
                    </div>
                    {error ? <small className="action-helper action-helper--error">{error}</small> : null}
                  </section>

                  {status === "success" && receipt ? (
                    <section className="action-panel action-panel--success">
                      <div className="action-success">
                        <span className="action-success__icon">
                          <FiCheckCircle size={22} />
                        </span>
                        <div>
                          <h2>Deposit request created</h2>
                          <p>
                            {receipt.depositAmount} is coming from {receipt.bankName} and should
                            arrive {receipt.payoutWindow}.
                          </p>
                        </div>
                      </div>

                      <dl className="action-receipt">
                        <div>
                          <dt>Reference</dt>
                          <dd>{receipt.reference}</dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd>Awaiting bank confirmation</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        className="action-button action-button--primary action-button--full"
                        onClick={resetFlow}
                      >
                        Create another deposit
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

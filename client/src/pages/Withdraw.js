import { useMemo, useState } from "react";
import {
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiShield,
  FiSmartphone,
  FiZap,
} from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
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
  const { accounts, createTransaction, error, selectedAccountId, settleTransaction } =
    useAccount();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);
  const [status, setStatus] = useState("idle");
  const activeAccount = useMemo(
    () => accounts.find((account) => account._id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const amountValue = Number(formData.amount || 0);
  const formattedAmount = useMemo(() => formatCurrency(formData.amount), [formData.amount]);

  const setField = (field) => (event) => {
    const value = event.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!activeAccount) {
      nextErrors.amount = "Load an active account before withdrawing.";
    }

    if (!formData.beneficiaryName.trim()) {
      nextErrors.beneficiaryName = "Enter the beneficiary name.";
    }

    if (!/^\d{6,12}$/.test(formData.accountNumber.trim())) {
      nextErrors.accountNumber = "Use 6 to 12 digits for the receiving account.";
    }

    if (!amountValue || amountValue < 100) {
      nextErrors.amount = "Withdraw at least R100.00.";
    }

    if (activeAccount && amountValue > activeAccount.availableBalance) {
      nextErrors.amount = "This exceeds your available balance.";
    }

    if (!formData.note.trim()) {
      nextErrors.note = "Add a note so this payout is easy to recognise.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStatus("submitting");

    try {
      const transaction = await createTransaction({
        type: "withdrawal",
        direction: "debit",
        accountId: activeAccount._id,
        amount: amountValue,
        status: "pending",
        reference: formData.note,
        description: `Withdrawal to ${formData.bankName}`,
        metadata: {
          payoutChannel: formData.payoutChannel,
          bankName: formData.bankName,
          beneficiaryName: formData.beneficiaryName,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
        },
      });

      window.setTimeout(() => {
        settleTransaction(transaction._id, "completed").catch(() => {});
      }, formData.payoutChannel === "atm-code" ? 2500 : 4000);

      setReceipt({
        amount: formattedAmount,
        bankName: formData.bankName,
        beneficiaryName: formData.beneficiaryName,
        eta:
          formData.payoutChannel === "atm-code"
            ? "ready in under 5 minutes"
            : "sent within 60 minutes",
      });
      setStatus("success");
    } catch (requestError) {
      window.alert(
        requestError.response?.data?.error || requestError.message || "Withdrawal failed."
      );
      setStatus("idle");
    }
  };

  const resetFlow = () => {
    setFormData(initialForm);
    setErrors({});
    setReceipt(null);
    setStatus("idle");
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
                <span className="action-page__icon action-page__icon--blue">
                  <FiArrowUpRight size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Transactions</p>
                  <h1 className="action-page__title">Withdraw</h1>
                  <p className="action-page__copy">
                    Send money out to an existing bank account, review the destination, and
                    keep the payout flow secure and easy to follow.
                  </p>
                </div>
              </div>

                <div className="action-workspace">
                  {!activeAccount ? (
                    <AccountRequiredState
                      title="Select an account to withdraw funds"
                      copy="Withdrawals are account-scoped. Choose an account before starting a payout."
                    />
                  ) : (
                    <>
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
                          <span>Payment note</span>
                          <input
                            type="text"
                            placeholder="Emergency cash, rent, supplier"
                            value={formData.note}
                            onChange={setField("note")}
                          />
                          {errors.note ? <small>{errors.note}</small> : null}
                        </label>
                      </div>

                      <div className="action-form__actions">
                        <button type="button" className="action-button action-button--ghost">
                          Save beneficiary
                        </button>
                        <button
                          type="submit"
                          className="action-button action-button--primary action-button--blue"
                          disabled={status === "submitting"}
                        >
                          {status === "submitting" ? "Sending..." : "Confirm withdrawal"}
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
                        <span>Beneficiary details are checked before the payout is released.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiClock size={16} />
                        <span>Bank transfer withdrawals are typically processed within 60 minutes.</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiSmartphone size={16} />
                        <span>You can later swap this for an OTP or popup approval flow.</span>
                      </div>
                    </div>
                    {error ? <small className="action-helper action-helper--error">{error}</small> : null}
                  </section>

                  {status === "success" && receipt ? (
                    <section className="action-panel action-panel--success">
                      <div className="action-success">
                        <span className="action-success__icon action-success__icon--blue">
                          <FiCheckCircle size={22} />
                        </span>
                        <div>
                          <h2>Withdrawal queued</h2>
                          <p>
                            {receipt.amount} for {receipt.beneficiaryName} at {receipt.bankName} is{" "}
                            {receipt.eta}.
                          </p>
                        </div>
                      </div>

                      <dl className="action-receipt">
                        <div>
                          <dt>Channel</dt>
                          <dd>
                            {formData.payoutChannel === "atm-code"
                              ? "Cash code payout"
                              : "Existing bank account"}
                          </dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd>Pending release</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        className="action-button action-button--primary action-button--full action-button--blue"
                        onClick={resetFlow}
                      >
                        Start another withdrawal
                      </button>
                    </section>
                  ) : null}

                  <section className="action-panel action-panel--tip">
                    <div className="action-tip">
                      <span className="action-tip__icon">
                        <FiZap size={18} />
                      </span>
                      <p>
                        If you want a popup later, this flow is already structured so the final
                        submit step can become a modal confirmation without redesigning the page.
                      </p>
                    </div>
                  </section>
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

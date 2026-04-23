import { useMemo, useState } from "react";
import { FiFileText } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const billOptions = [
  { id: "utilities", label: "Utilities", providers: ["City Power", "Eskom", "Prepaid24", "Rand Water"] },
  { id: "municipal", label: "Municipal rates", providers: ["City of Johannesburg", "eThekwini", "City of Tshwane", "Cape Town"] },
  { id: "mobile", label: "Mobile & internet", providers: ["MTN", "Vodacom", "Telkom", "Rain"] },
];

const initialForm = {
  category: "utilities",
  provider: "City Power",
  accountNumber: "",
  billName: "",
  amount: "",
  dueDate: "",
  reference: "",
};

export default function PayBills() {
  const { selectedAccount, payBill, isLoading } = useAccount();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const selectedCategory = useMemo(
    () => billOptions.find((option) => option.id === form.category) || billOptions[0],
    [form.category]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === "category") {
        const nextCategory = billOptions.find((option) => option.id === value) || billOptions[0];
        return {
          ...current,
          category: value,
          provider: nextCategory.providers[0],
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });

    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage("");

      await payBill({
        accountId: selectedAccount?._id,
        amount: Number(form.amount),
        category: form.category,
        provider: form.provider,
        accountNumber: form.accountNumber,
        billName: form.billName,
        dueDate: form.dueDate,
        reference: form.reference,
      });

      setMessage(`Bill payment submitted successfully to ${form.provider}.`);
      setForm((current) => ({
        ...current,
        accountNumber: "",
        billName: "",
        amount: "",
        dueDate: "",
        reference: "",
      }));
    } catch (error) {
      setMessage(error.response?.data?.error || error.message || "Failed to pay bill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <Sidebar />

        <div className="dashboard-main-panel">
          <Navbar />

          <main className="dashboard-content-area">
            <div className="container-fluid px-0 dashboard-shell">
              <article className="action-panel">
                <p className="action-helper">Loading account details...</p>
              </article>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="dashboard-page">
        <Sidebar />

        <div className="dashboard-main-panel">
          <Navbar />

          <main className="dashboard-content-area">
            <div className="container-fluid px-0 dashboard-shell">
              <AccountRequiredState copy="Choose an account before paying a bill." />
            </div>
          </main>
        </div>
      </div>
    );
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
                <span className="action-page__icon action-page__icon--purple">
                  <FiFileText size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Pay Bills</h1>
                  <p className="action-page__copy">
                    Pay bills from your selected account and keep the transaction history in
                    one place.
                  </p>
                </div>
              </div>

              <div className="action-page__grid">
                <article className="action-panel">
                  <p className="action-panel__label">Available balance</p>
                  <h2 className="action-panel__value">
                    {formatCurrency(selectedAccount.availableBalance)}
                  </h2>
                  <p className="action-panel__meta">
                    Account: {selectedAccount.accountNumber}
                  </p>
                </article>

                <article className="action-panel action-panel--form">
                  <div className="action-panel__header">
                    <h2 className="action-panel__title">Bill Details</h2>
                    <p className="action-panel__copy">
                      Add the bill details and post the payment directly to your account history.
                    </p>
                  </div>

                  <form className="action-form" onSubmit={handleSubmit}>
                    <label className="action-form__field">
                      <span>Bill type</span>
                      <select
                        className="action-form__input"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                      >
                        {billOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="action-form__field">
                      <span>Service provider</span>
                      <select
                        className="action-form__input"
                        name="provider"
                        value={form.provider}
                        onChange={handleChange}
                      >
                        {selectedCategory.providers.map((provider) => (
                          <option key={provider} value={provider}>
                            {provider}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="action-form__field">
                      <span>Bill account name</span>
                      <input
                        className="action-form__input"
                        type="text"
                        name="billName"
                        value={form.billName}
                        onChange={handleChange}
                        placeholder="Customer or account holder name"
                      />
                    </label>

                    <label className="action-form__field">
                      <span>Account or meter number</span>
                      <input
                        className="action-form__input"
                        type="text"
                        name="accountNumber"
                        value={form.accountNumber}
                        onChange={handleChange}
                        placeholder="Enter bill account number"
                      />
                    </label>

                    <label className="action-form__field">
                      <span>Amount</span>
                      <input
                        className="action-form__input"
                        type="number"
                        min="10"
                        step="0.01"
                        name="amount"
                        value={form.amount}
                        onChange={handleChange}
                        placeholder="Enter amount"
                      />
                    </label>

                    <label className="action-form__field">
                      <span>Due date</span>
                      <input
                        className="action-form__input"
                        type="date"
                        name="dueDate"
                        value={form.dueDate}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="action-form__field">
                      <span>Payment reference</span>
                      <input
                        className="action-form__input"
                        type="text"
                        name="reference"
                        value={form.reference}
                        onChange={handleChange}
                        placeholder="Reference the biller expects"
                      />
                    </label>

                    <small className="action-helper">
                      Daily limit: {formatCurrency(selectedAccount.limits.bill)}.
                    </small>

                    {message ? (
                      <p className={`action-helper ${message.includes("successfully") ? "" : "action-helper--error"}`}>
                        {message}
                      </p>
                    ) : null}

                    <button className="action-form__button" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Paying bill..." : "Pay Bill"}
                    </button>
                  </form>
                </article>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

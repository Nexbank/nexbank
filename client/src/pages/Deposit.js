import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { depositCategories } from "../constants/transactionCategories";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/banking";

export default function Deposit() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    amount: "",
    category: depositCategories[0],
    reference: "",
    status: "Completed",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const { selectedAccount, depositFunds, isLoading } = useAccount();

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedAccount) {
      alert("Please select an account before making a deposit.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    try {
      setIsSubmitting(true);

      await depositFunds({
        accountId: selectedAccount._id,
        amount: Number(form.amount),
        category: form.category,
        reference: form.reference,
        status: form.status,
        bankName: "Direct Deposit",
        source: "external",
        accountHolder: storedUser.firstname || "Account Holder",
      });

      alert("Deposit completed successfully.");
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.error || error.message || "Deposit failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedAccount && !isLoading) {
    return (
      <div className="dashboard-page">
        <Sidebar />

        <div className="dashboard-main-panel">
          <Navbar />

          <main className="dashboard-content-area">
            <div className="container-fluid px-0 dashboard-shell">
              <AccountRequiredState copy="Choose an account before making a deposit." />
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
                <span className="action-page__icon action-page__icon--green">
                  <FiPlusCircle size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Transactions</p>
                  <h1 className="action-page__title">Deposit</h1>
                  <p className="action-page__copy">
                    Add money into {selectedAccount?.accountNumber || "your account"} and let the backend ledger update the dashboard automatically.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <article className="action-panel">
                  <p className="action-helper">Loading account details...</p>
                </article>
              ) : (
                <div className="action-page__grid">
                  <article className="action-panel">
                    <p className="action-panel__label">Available balance</p>
                    <h2 className="action-panel__value">{formatCurrency(selectedAccount?.availableBalance || 0)}</h2>
                    <p className="action-panel__meta">
                      Account: {selectedAccount?.accountNumber || "No account selected"}
                    </p>
                  </article>

                  <article className="action-panel action-panel--form">
                    <div className="action-panel__header">
                      <h2 className="action-panel__title">Deposit Details</h2>
                      <p className="action-panel__copy">
                        Capture the deposit information and post it directly to the selected account.
                      </p>
                    </div>

                    <form className="action-form" onSubmit={handleSubmit}>
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
                          placeholder="Enter amount"
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

                      <label className="action-form__field">
                        <span>Status</span>
                        <select
                          className="action-form__input"
                          name="status"
                          value={form.status}
                          onChange={handleChange}
                        >
                          <option value="Completed">Completed</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </label>

                      <button className="action-form__button" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Posting deposit..." : "Deposit Funds"}
                      </button>
                    </form>
                  </article>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

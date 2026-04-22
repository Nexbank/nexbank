import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowUpRight, FiX } from "react-icons/fi";
import { spendingCategories } from "../constants/transactionCategories";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { formatCurrency } from "../utils/banking";

export default function Withdraw() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({ account: { balance: 0, accountNumber: "" } });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    fee: "0",
    category: spendingCategories[0],
    reference: "",
    status: "Completed",
  });
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }, []);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await API.get("/banking/overview");
        setOverview(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchOverview();
  }, [navigate]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid withdrawal amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      await API.post("/banking/withdraw", {
        amount: Number(form.amount),
        fee: Number(form.fee || 0),
        category: form.category,
        reference: form.reference,
        status: form.status,
      });

      setIsModalOpen(false);
      alert("Withdrawal completed successfully.");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.error || "Withdrawal failed. Please try again.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userName =
    storedUser.firstname ||
    storedUser.displayName?.split(" ")[0] ||
    storedUser.email?.split("@")[0] ||
    "User";

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar userName={userName} />

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
                    Manage withdrawals and move cash out of your account securely.
                  </p>
                </div>
              </div>

              <div className="action-page__grid">
                <article className="action-panel">
                  <p className="action-panel__label">Available balance</p>
                  <h2 className="action-panel__value">{formatCurrency(overview.account.balance)}</h2>
                  <p className="action-panel__meta">
                    Account: {overview.account.accountNumber || "Main account"}
                  </p>
                </article>

                <article className="action-panel action-panel--form">
                  <div className="action-panel__header">
                    <h2 className="action-panel__title">Open Withdrawal Modal</h2>
                    <p className="action-panel__copy">
                      Capture the withdrawal details from the transaction model before posting.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="action-form__button"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Enter Withdrawal Details
                  </button>
                </article>
              </div>
            </section>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="action-modal-backdrop" role="presentation">
          <div
            className="action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-modal-title"
          >
            <div className="action-modal__header">
              <div>
                <p className="action-panel__label">Transaction model</p>
                <h2 className="action-modal__title" id="withdraw-modal-title">
                  Withdraw Funds
                </h2>
              </div>
              <button
                type="button"
                className="action-modal__close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close withdrawal modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <form className="action-form" onSubmit={handleSubmit}>
              <label className="action-form__field">
                <span>Type</span>
                <input className="action-form__input" type="text" value="withdrawal" readOnly />
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
                  placeholder="Enter withdrawal amount"
                />
              </label>

              <label className="action-form__field">
                <span>Fee</span>
                <input
                  className="action-form__input"
                  type="number"
                  min="0"
                  step="0.01"
                  name="fee"
                  value={form.fee}
                  onChange={handleChange}
                  placeholder="0.00"
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
                  placeholder="e.g. Electricity payment"
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

              <div className="action-modal__summary">
                Total debit: {formatCurrency(Number(form.amount || 0) + Number(form.fee || 0))}
              </div>

              <button className="action-form__button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting withdrawal..." : "Confirm Withdrawal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

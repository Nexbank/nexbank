import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlusCircle } from "react-icons/fi";
import { depositCategories } from "../constants/transactionCategories";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { formatCurrency } from "../utils/banking";

export default function Deposit() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({ account: { balance: 0, accountNumber: "" } });
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
    alert("Please enter a valid deposit amount.");
    return;
  }

  try {
    setIsSubmitting(true);

    const response = await API.post("/banking/deposit", {
      amount: Number(form.amount),
      category: form.category,
      reference: form.reference,
      status: form.status,
    });

    alert(response.data?.message || "Deposit completed successfully.");
    navigate("/dashboard");

  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Deposit failed. Please try again.";

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
                <span className="action-page__icon action-page__icon--green">
                  <FiPlusCircle size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Transactions</p>
                  <h1 className="action-page__title">Deposit</h1>
                  <p className="action-page__copy">
                    Connect an existing bank account, choose how fast you want the transfer
                    processed, and move money into {selectedAccount.name}. Your first qualifying
                    deposit activates the account and its system-issued physical card.
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
                    <h2 className="action-panel__title">Deposit Details</h2>
                    <p className="action-panel__copy">
                      Add funds and post the transaction directly to your account history.
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
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

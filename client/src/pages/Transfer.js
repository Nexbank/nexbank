import { useState } from "react";
import { FiRepeat } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useNotification } from "../components/Notification";

const mockRecipients = [
  "Savings Account",
  "Rent Beneficiary",
  "Family Support",
  "Emergency Wallet",
];

export default function Transfer() {
  const { showNotification } = useNotification();
  const [form, setForm] = useState({
    recipient: mockRecipients[0],
    amount: "",
    reference: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.recipient || !amount || amount <= 0) {
      showNotification("error", "Enter a recipient and a valid transfer amount.", {
        title: "Transfer Failed",
      });
      return;
    }

    if (amount > 25000) {
      showNotification("warning", "Large transfers are flagged for additional review.", {
        title: "Security Review Required",
      });
      return;
    }

    setIsSubmitting(true);

    showNotification("info", `Processing your transfer to ${form.recipient}.`, {
      title: "Transfer Pending",
      duration: 2400,
    });

    window.setTimeout(() => {
      setIsSubmitting(false);

      if (amount > 10000) {
        showNotification("warning", "Transfer queued for approval. Final confirmation will follow.", {
          title: "Transfer Under Review",
          duration: 6500,
        });
        return;
      }

      showNotification(
        "success",
        `R${amount.toFixed(2)} sent to ${form.recipient}${form.reference ? ` with reference "${form.reference}".` : "."}`,
        { title: "Transfer Successful" }
      );

      setForm({
        recipient: mockRecipients[0],
        amount: "",
        reference: "",
      });
    }, 1300);
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
                <span className="action-page__icon action-page__icon--orange">
                  <FiRepeat size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Transfer</h1>
                  <p className="action-page__copy">
                    Send money between accounts and keep your transfers organized.
                  </p>
                </div>
              </div>

              <div className="action-card">
                <form className="action-form" onSubmit={handleSubmit}>
                  <div className="action-form__grid">
                    <label className="action-form__field">
                      <span>Recipient</span>
                      <select
                        name="recipient"
                        value={form.recipient}
                        onChange={handleChange}
                        className="action-form__control"
                      >
                        {mockRecipients.map((recipient) => (
                          <option key={recipient} value={recipient}>
                            {recipient}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="action-form__field">
                      <span>Amount</span>
                      <input
                        className="action-form__control"
                        name="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  <label className="action-form__field">
                    <span>Reference</span>
                    <input
                      className="action-form__control"
                      name="reference"
                      type="text"
                      placeholder="Salary top-up, rent, family support..."
                      value={form.reference}
                      onChange={handleChange}
                    />
                  </label>

                  <div className="action-card__actions">
                    <button type="submit" className="action-card__button" disabled={isSubmitting}>
                      {isSubmitting ? "Processing..." : "Transfer Funds"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

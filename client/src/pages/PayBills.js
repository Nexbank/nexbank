import { useState } from "react";
import { FiFileText } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useNotification } from "../components/Notification";

const mockBills = [
  { id: "electricity", name: "City Power", amount: 1250.0 },
  { id: "water", name: "Johannesburg Water", amount: 460.25 },
  { id: "internet", name: "Fibre Connect", amount: 899.0 },
];

export default function PayBills() {
  const { showNotification } = useNotification();
  const [selectedBillId, setSelectedBillId] = useState(mockBills[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBill = mockBills.find((bill) => bill.id === selectedBillId) || mockBills[0];

  const handlePayBill = () => {
    setIsSubmitting(true);

    showNotification("info", `Submitting payment for ${selectedBill.name}.`, {
      title: "Payment Processing",
      duration: 2200,
    });

    window.setTimeout(() => {
      setIsSubmitting(false);
      showNotification(
        "success",
        `Payment of R${selectedBill.amount.toFixed(2)} to ${selectedBill.name} was completed.`,
        { title: "Payment Successful" }
      );
    }, 1200);
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
                <span className="action-page__icon action-page__icon--purple">
                  <FiFileText size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Pay Bills</h1>
                  <p className="action-page__copy">
                    Handle bill payments in one place and stay on top of due amounts.
                  </p>
                </div>
              </div>

              <div className="action-card">
                <div className="action-card__section">
                  <p className="action-card__label">Choose a biller</p>
                  <div className="action-choice-grid">
                    {mockBills.map((bill) => (
                      <button
                        key={bill.id}
                        type="button"
                        className={`action-choice-card${
                          bill.id === selectedBillId ? " action-choice-card--active" : ""
                        }`}
                        onClick={() => setSelectedBillId(bill.id)}
                      >
                        <strong>{bill.name}</strong>
                        <span>R{bill.amount.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="action-card__summary">
                  <div>
                    <p className="action-card__label">Selected payment</p>
                    <h2>{selectedBill.name}</h2>
                    <p className="action-card__copy">Secure same-day settlement on saved billers.</p>
                  </div>
                  <strong className="action-card__amount">R{selectedBill.amount.toFixed(2)}</strong>
                </div>

                <div className="action-card__actions">
                  <button
                    type="button"
                    className="action-card__button"
                    disabled={isSubmitting}
                    onClick={handlePayBill}
                  >
                    {isSubmitting ? "Processing..." : "Pay Now"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

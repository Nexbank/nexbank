import { FiFileText } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function PayBills() {
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
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

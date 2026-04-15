import { FiArrowUpRight } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Withdraw() {
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
                    Manage withdrawals and move cash out of your account securely.
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

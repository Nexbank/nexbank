import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/users/profile");
        setBalance(res.data.balance);
      } catch (error) {
        setBalance(0);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <section className="dashboard-balance-card">
            <p className="dashboard-eyebrow">Available Balance</p>
            <h1 className="dashboard-balance-amount">R{balance.toLocaleString()}</h1>
            <p className="dashboard-balance-hint">
              Your sidebar and header are now rendering together inside the dashboard
              layout.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

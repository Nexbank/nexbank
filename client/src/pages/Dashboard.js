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
    <div style={styles.page}>
      <Sidebar style={styles.sidebar} />

      <div style={styles.mainPanel}>
        <Navbar />

        <main style={styles.contentArea}>
          <section style={styles.balanceCard}>
            <p style={styles.eyebrow}>Available Balance</p>
            <h1 style={styles.balanceAmount}>R{balance.toLocaleString()}</h1>
            <p style={styles.balanceHint}>
              Your sidebar and header are now rendering together inside the dashboard
              layout.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#090909",
    color: "#f5f7fa",
  },
  sidebar: {
    width: "252px",
    flexShrink: 0,
  },
  mainPanel: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    background:
      "radial-gradient(circle at top left, rgba(24, 195, 126, 0.08), transparent 28%), #090909",
  },
  contentArea: {
    flex: 1,
    padding: "32px",
    boxSizing: "border-box",
  },
  balanceCard: {
    maxWidth: "420px",
    background: "linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02))",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.22)",
  },
  eyebrow: {
    margin: 0,
    color: "#8f9198",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  balanceAmount: {
    margin: "12px 0 10px",
    fontSize: "40px",
    lineHeight: 1.1,
  },
  balanceHint: {
    margin: 0,
    color: "#b6bac2",
    fontSize: "15px",
    lineHeight: 1.6,
  },
};

export default Dashboard;

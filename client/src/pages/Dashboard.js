import { useEffect, useState } from "react";
import API from "../services/api";

function Dashboard() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const res = await API.get("/users/profile");
      setBalance(res.data.balance);
    };
    fetchData();
  }, []);

  return <h1>Balances: R{balance}</h1>;
}

export default Dashboard;

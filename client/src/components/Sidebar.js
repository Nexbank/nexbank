import { useState } from "react";

const navItems = [
  "Dashboard",
  "Transactions",
  "Cards",
  "Insights",
  "Profile",
  "Settings",
];

export default function Sidebar() {
  const [active, setActive] = useState("Transactions");

  return (
    <aside className="sidebar">
      <div className="logo">
        Nex<span className="green">Bank</span>
      </div>

      <nav>
        {navItems.map((item) => (
          <div
            key={item}
            className={`nav-item ${active === item ? "active" : ""}`}
            onClick={() => setActive(item)}
          >
            {item}
          </div>
        ))}
      </nav>

      <div className="nav-bottom">
        <div className="nav-item logout">Logout</div>
      </div>
    </aside>
  );
}

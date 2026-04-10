import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Transactions", path: "/transactions" },
  { name: "Cards", path: "/cards" },
  { name: "Insights", path: "/insights" },
  { name: "Profile", path: "/profile" },
  { name: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="logo">
        Nex<span className="green">Bank</span>
      </div>

      <nav>
        {navItems.map((item) => (
          <div
            key={item.name}
            className={`nav-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.name}
          </div>
        ))}
      </nav>

      <div className="nav-bottom">
        <div className="nav-item logout">Logout</div>
      </div>
    </aside>
  );
}

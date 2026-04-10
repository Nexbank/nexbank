import { useNavigate, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiRepeat,
  FiCreditCard,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: FiGrid },
  { name: "Transactions", path: "/transactions", icon: FiRepeat },
  { name: "Cards", path: "/cards", icon: FiCreditCard },
  { name: "Insights", path: "/insights", icon: FiBarChart2 },
  { name: "Profile", path: "/profile", icon: FiUser },
  { name: "Settings", path: "/settings", icon: FiSettings },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar" aria-label="Primary sidebar">
      {/* Logo */}
      <div className="sidebar__logo-wrap">
        <img
          src="/NexBank-logo.png"
          alt="NexBank logo"
          className="sidebar__logo-image"
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list">
          {navItems.map(({ name, path, icon: Icon }) => {
            const isActive = location.pathname === path;

            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => navigate(path)}
                  className={`sidebar__nav-button${
                    isActive ? " sidebar__nav-button--active" : ""
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="sidebar__nav-icon">
                    <Icon size={20} />
                  </span>

                  <span>{name}</span>

                  {isActive && (
                    <span
                      className="sidebar__active-dot"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="sidebar__logout-wrap">
        <button type="button" className="sidebar__logout-button">
          <span className="sidebar__nav-icon">
            <FiLogOut size={20} />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
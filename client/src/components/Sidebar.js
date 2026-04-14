import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiMenu,
  FiRepeat,
  FiCreditCard,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiLogOut,
  FiX,
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button
        type="button"
        className="sidebar__mobile-toggle"
        aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen((current) => !current)}
      >
        {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {isMobileOpen && (
        <button
          type="button"
          className="sidebar__overlay"
          aria-label="Close sidebar overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar${isMobileOpen ? " sidebar--mobile-open" : ""}`}
        aria-label="Primary sidebar"
      >
        <div className="sidebar__header">
          <div className="sidebar__logo-wrap">
            <img
              src="/NexBank-logo.png"
              alt="NexBank logo"
              className="sidebar__logo-image"
            />
          </div>

          <button
            type="button"
            className="sidebar__close-button"
            aria-label="Close sidebar"
            onClick={() => setIsMobileOpen(false)}
          >
            <FiX size={18} />
          </button>
        </div>

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

                    <span className="sidebar__nav-label">{name}</span>

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

        <div className="sidebar__logout-wrap">
          <button type="button" className="sidebar__logout-button">
            <span className="sidebar__nav-icon">
              <FiLogOut size={20} />
            </span>
            <span className="sidebar__logout-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

import { useState } from "react";
import {
  FiBarChart2,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiRepeat,
  FiSettings,
  FiUser,
} from "react-icons/fi";

const primaryItems = [
  { id: "dashboard", label: "Dashboard", icon: FiGrid },
  { id: "transactions", label: "Transactions", icon: FiRepeat },
  { id: "cards", label: "Cards", icon: FiCreditCard },
  { id: "insights", label: "Insights", icon: FiBarChart2 },
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "settings", label: "Settings", icon: FiSettings },
];

function Sidebar({ activeItem = "dashboard", onItemSelect, style }) {
  const [selectedItem, setSelectedItem] = useState(activeItem);

  const handleSelect = (itemId) => {
    setSelectedItem(itemId);

    if (onItemSelect) {
      onItemSelect(itemId);
    }
  };

  return (
    <aside className="sidebar" style={style} aria-label="Primary sidebar">
      <div>
        <div className="sidebar__logo-wrap">
          <img
            src="/NexBank-logo.png"
            alt="NexBank logo"
            className="sidebar__logo-image"
          />
        </div>

        <nav className="sidebar__nav" aria-label="Sidebar navigation">
          <ul className="sidebar__nav-list">
            {primaryItems.map(({ id, label, icon: Icon }) => {
              const isActive = selectedItem === id;

              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(id)}
                    className={`sidebar__nav-button${isActive ? " sidebar__nav-button--active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="sidebar__nav-icon">
                      <Icon size={20} />
                    </span>
                    <span>{label}</span>
                    {isActive ? <span className="sidebar__active-dot" aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

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

export default Sidebar;

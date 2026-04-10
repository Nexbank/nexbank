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

const BRAND_GREEN = "#18c37e";
const SIDEBAR_BG = "#050505";
const MUTED_TEXT = "#8f9198";
const BORDER_COLOR = "rgba(255, 255, 255, 0.08)";
const ACTIVE_BG = "rgba(24, 195, 126, 0.12)";
const LOGOUT_COLOR = "#ef6b73";

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
    <aside style={{ ...styles.sidebar, ...style }} aria-label="Primary sidebar">
      <div>
        <div style={styles.logoWrap}>
          <img
            src="/NexBank-logo.png"
            alt="NexBank logo"
            style={styles.logoImage}
          />
        </div>

        <nav aria-label="Sidebar navigation">
          <ul style={styles.navList}>
            {primaryItems.map(({ id, label, icon: Icon }) => {
              const isActive = selectedItem === id;

              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(id)}
                    style={{
                      ...styles.navButton,
                      ...(isActive ? styles.navButtonActive : {}),
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span style={styles.navIcon}>
                      <Icon size={20} />
                    </span>
                    <span>{label}</span>
                    {isActive ? <span style={styles.activeDot} aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div style={styles.logoutWrap}>
        <button type="button" style={styles.logoutButton}>
          <span style={styles.navIcon}>
            <FiLogOut size={20} />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "100%",
    maxWidth: "252px",
    minHeight: "100vh",
    background: SIDEBAR_BG,
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "28px 16px 24px",
    boxSizing: "border-box",
  },
  logoWrap: {
    padding: "0 8px 22px",
    borderBottom: `1px solid ${BORDER_COLOR}`,
    marginBottom: "14px",
  },
  logoImage: {
    width: "150px",
    height: "80px",
    objectFit: "contain",
    display: "block",
  },
  navList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: MUTED_TEXT,
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: 600,
    lineHeight: 1.2,
    textAlign: "left",
    transition: "background-color 0.2s ease, color 0.2s ease, transform 0.2s ease",
  },
  navButtonActive: {
    background: ACTIVE_BG,
    color: BRAND_GREEN,
    transform: "translateX(2px)",
  },
  navIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  activeDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: BRAND_GREEN,
    marginLeft: "auto",
    boxShadow: `0 0 0 4px rgba(24, 195, 126, 0.12)`,
  },
  logoutWrap: {
    borderTop: `1px solid ${BORDER_COLOR}`,
    paddingTop: "18px",
    marginTop: "20px",
  },
  logoutButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: LOGOUT_COLOR,
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: 600,
    textAlign: "left",
  },
};

export default Sidebar;

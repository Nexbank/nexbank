import { FiBell, FiSearch } from "react-icons/fi";

const BRAND_GREEN = "#18c37e";
const NAV_BG = "#050505";
const BORDER_COLOR = "rgba(255, 255, 255, 0.08)";
const SEARCH_BG = "#111111";
const SEARCH_TEXT = "#7f848c";
const SUBTLE_TEXT = "#8f9198";

function Navbar({
  userName = "Phathisa",
  membershipLabel = "Premium Member",
  searchPlaceholder = "Search transactions, features...",
  style,
}) {
  return (
    <header style={{ ...styles.header, ...style }} aria-label="Top navigation bar">
      <div style={styles.brandWrap}>
        <span style={styles.brandPrimary}>Nex</span>
        <span style={styles.brandAccent}>Bank</span>
      </div>

      <label style={styles.searchWrap} aria-label="Search">
        <FiSearch size={18} style={styles.searchIcon} />
        <input
          type="search"
          placeholder={searchPlaceholder}
          style={styles.searchInput}
        />
      </label>

      <div style={styles.profileWrap}>
        <div style={styles.userMeta}>
          <div style={styles.userNameRow}>
            <span style={styles.userGreeting}>Hi, {userName}</span>
            <span style={styles.wave}>*</span>
          </div>
          <span style={styles.memberLabel}>{membershipLabel}</span>
        </div>

        <button type="button" style={styles.iconButton} aria-label="Notifications">
          <FiBell size={20} />
          <span style={styles.notificationDot} aria-hidden="true" />
        </button>

        <div style={styles.avatar} aria-label={`${userName} profile avatar`} />
      </div>
    </header>
  );
}

const styles = {
  header: {
    minHeight: "72px",
    width: "100%",
    background: NAV_BG,
    borderBottom: `1px solid ${BORDER_COLOR}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    padding: "14px 24px",
    boxSizing: "border-box",
  },
  brandWrap: {
    display: "flex",
    alignItems: "baseline",
    gap: "1px",
    fontSize: "24px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    flexShrink: 0,
  },
  brandPrimary: {
    color: "#f6f7f8",
  },
  brandAccent: {
    color: BRAND_GREEN,
  },
  searchWrap: {
    flex: "1 1 420px",
    maxWidth: "450px",
    minWidth: "180px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 14px",
    background: SEARCH_BG,
    border: `1px solid rgba(255, 255, 255, 0.06)`,
    borderRadius: "999px",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
  },
  searchIcon: {
    color: SEARCH_TEXT,
    flexShrink: 0,
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#f6f7f8",
    fontSize: "14px",
  },
  profileWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "16px",
    flexShrink: 0,
  },
  userMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    lineHeight: 1.2,
  },
  userNameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  userGreeting: {
    color: "#f5f7fa",
    fontSize: "14px",
    fontWeight: 700,
  },
  wave: {
    fontSize: "14px",
  },
  memberLabel: {
    color: SUBTLE_TEXT,
    fontSize: "12px",
    fontWeight: 500,
    marginTop: "2px",
  },
  iconButton: {
    width: "34px",
    height: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    color: "#d3d6db",
    cursor: "pointer",
    position: "relative",
    padding: 0,
  },
  notificationDot: {
    position: "absolute",
    top: "6px",
    right: "4px",
    width: "8px",
    height: "8px",
    borderRadius: "999px",
    background: BRAND_GREEN,
    border: `2px solid ${NAV_BG}`,
    boxSizing: "border-box",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #28d38d 0%, #0f9f69 100%)",
    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06)",
  },
};

export default Navbar;

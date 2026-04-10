import { FiBell, FiSearch } from "react-icons/fi";

function Navbar({
  userName = "Phathisa",
  membershipLabel = "Premium Member",
  searchPlaceholder = "Search transactions, features...",
  style,
}) {
  return (
    <header className="navbar" style={style} aria-label="Top navigation bar">
      

      <label className="navbar__search" aria-label="Search">
        <FiSearch size={18} className="navbar__search-icon" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="navbar__search-input"
        />
      </label>

      <div className="navbar__profile">
        <div className="navbar__user-meta">
          <div className="navbar__user-row">
            <span className="navbar__user-greeting">Hi, {userName}</span>
            <span className="navbar__wave">*</span>
          </div>
          <span className="navbar__member-label">{membershipLabel}</span>
        </div>

        <button type="button" className="navbar__icon-button" aria-label="Notifications">
          <FiBell size={20} />
          <span className="navbar__notification-dot" aria-hidden="true" />
        </button>

        <div className="navbar__avatar" aria-label={`${userName} profile avatar`} />
      </div>
    </header>
  );
}

export default Navbar;

import { useState } from "react";
import { FiBell, FiSearch } from "react-icons/fi";

const defaultNotifications = [
  {
    id: 1,
    title: "Salary received",
    message: "Your monthly salary has been deposited.",
    time: "2m ago",
  },
  {
    id: 2,
    title: "Card payment",
    message: "Your card was used for a purchase of R245.00.",
    time: "1h ago",
  },
  {
    id: 3,
    title: "Security alert",
    message: "A new login was detected on your account.",
    time: "Today",
  },
];

function Navbar({
  userName = "user",
  membershipLabel = "Premium Member",
  searchPlaceholder = "Search transactions, features...",
  style,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

        <div className="navbar__notification-wrap">
          <button
            type="button"
            className="navbar__icon-button"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
            onClick={() => setIsNotificationsOpen((current) => !current)}
          >
            <FiBell size={20} />
            <span className="navbar__notification-dot" aria-hidden="true" />
          </button>

          {isNotificationsOpen && (
            <div className="navbar__notification-panel" role="dialog" aria-label="Notifications">
              <div className="navbar__notification-header">
                <span className="navbar__notification-title">Notifications</span>
                <button
                  type="button"
                  className="navbar__notification-close"
                  onClick={() => setIsNotificationsOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="navbar__notification-list">
                {defaultNotifications.map((notification) => (
                  <article key={notification.id} className="navbar__notification-item">
                    <div className="navbar__notification-item-head">
                      <span className="navbar__notification-item-title">
                        {notification.title}
                      </span>
                      <span className="navbar__notification-time">
                        {notification.time}
                      </span>
                    </div>
                    <p className="navbar__notification-message">
                      {notification.message}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="navbar__avatar" aria-label={`${userName} profile avatar`} />
      </div>
    </header>
  );
}

export default Navbar;

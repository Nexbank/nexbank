import { useMemo, useState } from "react";
import { FiBell, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

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
  userName,
  membershipLabel = "Premium Member",
  searchPlaceholder = "Search transactions, features...",
  search = "",
  setSearch,
  searchResults,
  style,
}) {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const storedUser = (() => {
    try {
      return JSON.parse(window.localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const resolvedUserName =
    userName ||
    storedUser?.displayName ||
    [storedUser?.firstname, storedUser?.surname].filter(Boolean).join(" ") ||
    "user";
  const searchValue = search.trim();
  const hasQuery = searchValue.length > 0;
  const transactions = useMemo(
    () => searchResults?.transactions || [],
    [searchResults?.transactions]
  );
  const actions = searchResults?.actions || [];
  const hasResults = transactions.length > 0 || actions.length > 0;
  const formattedTransactions = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,
        displayDate: transaction.createdAt
          ? new Date(transaction.createdAt).toLocaleDateString("en-ZA", {
              day: "2-digit",
              month: "short",
            })
          : "",
      })),
    [transactions]
  );

  const handleResultSelect = (path) => {
    setSearch?.("");
    navigate(path);
  };

  return (
    <header className="navbar" style={style} aria-label="Top navigation bar">
      <div className="navbar__search-wrap">
        <label className="navbar__search" aria-label="Search">
          <FiSearch size={18} className="navbar__search-icon" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="navbar__search-input"
            value={search}
            onChange={(event) => setSearch?.(event.target.value)}
          />
        </label>

        {hasQuery ? (
          <div className="navbar__search-panel" role="dialog" aria-label="Search results">
            {formattedTransactions.length > 0 ? (
              <div className="navbar__search-section">
                <p className="navbar__search-heading">Transactions</p>
                <div className="navbar__search-list">
                  {formattedTransactions.map((transaction) => (
                    <button
                      key={transaction._id || transaction.id}
                      type="button"
                      className="navbar__search-item"
                      onClick={() => handleResultSelect("/transactions")}
                    >
                      <span className="navbar__search-title">
                        {transaction.description || transaction.reference || transaction.type}
                      </span>
                      <span className="navbar__search-meta">
                        {formatCurrency(transaction.amount)}
                        {transaction.displayDate ? ` • ${transaction.displayDate}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {actions.length > 0 ? (
              <div className="navbar__search-section">
                <p className="navbar__search-heading">Actions</p>
                <div className="navbar__search-list">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="navbar__search-item"
                      onClick={() => handleResultSelect(action.path)}
                    >
                      <span className="navbar__search-title">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {!hasResults ? (
              <div className="navbar__search-empty">No results found</div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="navbar__profile">
        <div className="navbar__user-meta">
          <div className="navbar__user-row">
            <span className="navbar__user-greeting">Hi, {resolvedUserName}</span>
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

        <div className="navbar__avatar" aria-label={`${resolvedUserName} profile avatar`} />
      </div>
    </header>
  );
}

export default Navbar;

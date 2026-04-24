import { formatCurrency } from "../utils/currency";

export default function AccountScopePanel({
  accounts = [],
  selectedAccount = null,
  onSelectAccount,
  title = "Selected account",
  subtitle = "All figures on this page follow the selected bank account.",
  stats = [],
}) {
  return (
    <section className="account-scope-panel">
      <div className="account-scope-panel__header">
        <div>
          <p className="action-page__eyebrow">Account Scope</p>
          <h2 className="account-scope-panel__title">{title}</h2>
          <p className="account-scope-panel__copy">{subtitle}</p>
        </div>

        <label className="account-scope-panel__field">
          <span>Bank account</span>
          <select
            className="action-form__input"
            value={selectedAccount?._id || ""}
            onChange={(event) => onSelectAccount?.(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account._id} value={account._id}>
                {account.name} • {account.accountNumber}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedAccount ? (
        <>
          <div className="account-scope-panel__summary">
            <article className="account-scope-chip">
              <span className="account-scope-chip__label">Account type</span>
              <strong>{selectedAccount.accountType}</strong>
            </article>
            <article className="account-scope-chip">
              <span className="account-scope-chip__label">Account number</span>
              <strong>{selectedAccount.accountNumber}</strong>
            </article>
            <article className="account-scope-chip">
              <span className="account-scope-chip__label">Available balance</span>
              <strong>{formatCurrency(selectedAccount.availableBalance)}</strong>
            </article>
          </div>

          {stats.length > 0 ? (
            <div className="account-scope-panel__stats">
              {stats.map((stat) => (
                <article key={stat.label} className="account-scope-stat">
                  <span className="account-scope-stat__label">{stat.label}</span>
                  <strong className="account-scope-stat__value">{stat.value}</strong>
                  {stat.meta ? <small className="account-scope-stat__meta">{stat.meta}</small> : null}
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

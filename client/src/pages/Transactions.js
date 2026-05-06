import { useMemo, useState } from "react";
import { FiRepeat } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AccountRequiredState from "../components/AccountRequiredState";
import { useAccount } from "../context/AccountContext";
import { formatCurrency, formatDateTime } from "../utils/currency";

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

export default function Transactions({ search, setSearch, searchResults }) {
  const { allAccounts, allTransactions, selectAccount, isLoading } = useAccount();
  const [accountFilter, setAccountFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const selectableAccounts = useMemo(() => allAccounts.filter(Boolean), [allAccounts]);
  const accountLookup = useMemo(
    () =>
      selectableAccounts.reduce((lookup, account) => {
        lookup[account._id] = account;
        return lookup;
      }, {}),
    [selectableAccounts]
  );

  const selectedFilterAccount = useMemo(
    () =>
      accountFilter === "all"
        ? null
        : selectableAccounts.find((account) => account._id === accountFilter) || null,
    [accountFilter, selectableAccounts]
  );

  const filteredTransactions = useMemo(() => {
    const searchValue = (search || "").trim().toLowerCase();
    const scopedTransactions =
      accountFilter === "all"
        ? allTransactions
        : allTransactions.filter((transaction) => transaction.accountId === accountFilter);
    const typedTransactions =
      typeFilter === "all"
        ? scopedTransactions
        : scopedTransactions.filter((transaction) => transaction.type === typeFilter);

    if (!searchValue) {
      return typedTransactions;
    }

    return typedTransactions.filter((transaction) => {
      const transactionAccount = accountLookup[transaction.accountId];

      return [
        transaction.description,
        transaction.reference,
        transaction.category,
        transaction.type,
        transaction.status,
        transactionAccount?.name,
        transactionAccount?.accountNumber,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
    });
  }, [accountFilter, accountLookup, allTransactions, search, typeFilter]);

  const shouldShowAccountState = !isLoading && selectableAccounts.length === 0;
  const accountDisplayBalance =
    accountFilter === "all"
      ? allAccounts.reduce(
          (sum, account) =>
            sum +
            Number(
              account?.availableBalance ??
                account?.balance ??
                account?.ledgerBalance ??
                0
            ),
          0
        )
      : Number(
          selectedFilterAccount?.availableBalance ??
            selectedFilterAccount?.balance ??
            selectedFilterAccount?.ledgerBalance ??
            0
        );
  const accountDisplayNumber =
    accountFilter === "all"
      ? "All accounts"
      : selectedFilterAccount?.accountNumber || "Account unavailable";
  const accountDisplayName =
    accountFilter === "all"
      ? "All accounts"
      : selectedFilterAccount?.name || selectedFilterAccount?.accountType || "Selected account";
  const subtitle =
    accountFilter === "all"
      ? "Review activity across all your accounts."
      : "Review activity for selected account.";
  const transactionRows = useMemo(
    () =>
      filteredTransactions.map((transaction) => {
        const account = accountLookup[transaction.accountId] || null;
        const amount = Number(transaction.amount || 0);
        const fee = Number(transaction.fee || 0);
        const direction = transaction.direction === "credit" ? "credit" : "debit";
        const impactAmount =
          typeof transaction.impactAmount === "number"
            ? Number(transaction.impactAmount)
            : direction === "credit"
              ? amount
              : -(amount + fee);
        // 🔹 Ledger Update
        // Debit rows include amount plus fee so bill payments and account fees match the actual backend balance impact.

        return {
          ...transaction,
          direction,
          impactAmount,
          accountLabel:
            account?.name || account?.accountNumber || transaction.reference || "Account unavailable",
          accountMeta:
            account?.accountNumber || humanizeValue(transaction.category || transaction.type || "Transaction"),
          typeLabel: humanizeValue(transaction.type),
          statusLabel: humanizeValue(transaction.status),
        };
      }),
    [accountLookup, filteredTransactions]
  );

  const handleAccountFilterChange = (nextValue) => {
    setAccountFilter(nextValue);
    if (nextValue !== "all") {
      selectAccount(nextValue);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar search={search} setSearch={setSearch} searchResults={searchResults} searchPlaceholder="Filter transactions..." />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            {shouldShowAccountState ? (
              <section className="dashboard-section">
                <AccountRequiredState
                  title="No account available"
                  copy="Create or select an account to review your transaction history."
                />
              </section>
            ) : (
              <section className="action-page">
                <div className="action-page__hero">
                  <span className="action-page__icon action-page__icon--orange">
                    <FiRepeat size={28} />
                  </span>
                  <div>
                    <p className="action-page__eyebrow">Transactions</p>
                    <h1 className="action-page__title">Transaction History</h1>
                    <p className="action-page__copy">{subtitle}</p>
                  </div>
                </div>

                <div className="action-page__grid">
                    <article className="action-panel">
                      <p className="action-panel__label">Available balance</p>
                      <h2 className="action-panel__value">{formatCurrency(accountDisplayBalance)}</h2>
                      <p className="action-panel__meta">
                        {accountDisplayName} • {accountDisplayNumber}
                      </p>
                    </article>

                    <article className="action-panel action-panel--form">
                      <div className="action-panel__header">
                        <h2 className="action-panel__title">Transaction Details</h2>
                        <p className="action-panel__copy">
                          Filter by account or review your combined account activity here.
                        </p>
                      </div>

                      <div className="action-form">
                        <label className="action-form__field">
                          <span>Account filter</span>
                          <select
                            className="action-form__input"
                            value={accountFilter}
                            onChange={(event) => handleAccountFilterChange(event.target.value)}
                          >
                            <option value="all">All accounts</option>
                            {selectableAccounts.map((account) => (
                              <option key={account._id} value={account._id}>
                                {(account.name || account.accountType || "Account")} • {account.accountNumber}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="action-form__field">
                          <span>Transaction type</span>
                          <select
                            className="action-form__input"
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                          >
                            <option value="all">All</option>
                            <option value="deposit">Deposit</option>
                            <option value="withdrawal">Withdrawal</option>
                            <option value="transfer">Transfer</option>
                            <option value="bill">Bill</option>
                            <option value="fee">Fee</option>
                          </select>
                        </label>

                        {transactionRows.length === 0 ? (
                          <p className="empty">No transactions found.</p>
                        ) : (
                          <div className="tx-history-list">
                            {transactionRows.map((transaction) => (
                              <div key={transaction._id || transaction.id} className="tx-history-card">
                                <div className="tx-history-main">
                                  <div className="tx-history-copy">
                                    <div className="tx-history-name">
                                      {transaction.description || transaction.typeLabel}
                                    </div>
                                    <div className="tx-history-account">
                                      {transaction.accountLabel}
                                      {transaction.accountMeta ? ` • ${transaction.accountMeta}` : ""}
                                    </div>
                                  </div>
                                  <div className="tx-history-date">
                                    {formatDateTime(transaction.createdAt)}
                                  </div>
                                </div>

                                <div className="tx-history-footer">
                                  <div className="tx-history-tags">
                                    <span className="accounts-badge accounts-badge--type">
                                      {transaction.typeLabel}
                                    </span>
                                    <span className="accounts-badge accounts-badge--available">
                                      {transaction.statusLabel}
                                    </span>
                                  </div>
                                  <div
                                    className={`tx-history-amount ${
                                      transaction.direction === "credit"
                                        ? "tx-history-amount--positive"
                                        : "tx-history-amount--negative"
                                    }`}
                                  >
                                    {transaction.impactAmount >= 0 ? "+ " : "- "}
                                    {formatCurrency(Math.abs(transaction.impactAmount))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { FiRepeat } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import TransactionList from "../components/TransactionList";
import { useAccount } from "../context/AccountContext";
import API from "../services/api";
import { formatCurrency } from "../utils/currency";

const normalizeTransaction = (transaction = {}) => {
  const amount = Number(transaction.amount || 0);
  const fee = Number(transaction.fee || 0);
  const direction = transaction.direction || "debit";

  return {
    ...transaction,
    _id: transaction._id || transaction.id,
    id: transaction.id || transaction._id,
    amount,
    fee,
    direction,
    impactAmount:
      typeof transaction.impactAmount === "number"
        ? Number(transaction.impactAmount)
        : direction === "credit"
          ? amount
          : -(amount + fee),
  };
};

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const { accounts, selectedAccount, isLoading, selectAccount } = useAccount();

  useEffect(() => {
    if (!selectedAccount?._id) {
      setTransactions([]);
      setPageError("");
      return;
    }

    let isMounted = true;

    const loadTransactions = async () => {
      try {
        setIsPageLoading(true);
        setPageError("");
        const response = await API.get("/banking/transactions", {
          params: { accountId: selectedAccount._id },
        });

        if (isMounted) {
          setTransactions((response.data.transactions || []).map(normalizeTransaction));
        }
      } catch (error) {
        if (isMounted) {
          setPageError(error.response?.data?.error || error.message || "Failed to load transactions.");
          setTransactions([]);
        }
      } finally {
        if (isMounted) {
          setIsPageLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      isMounted = false;
    };
  }, [selectedAccount?._id]);

  const filteredTransactions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return transactions;
    }

    return transactions.filter((transaction) =>
      [
        transaction.description,
        transaction.reference,
        transaction.category,
        transaction.type,
        transaction.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue))
    );
  }, [search, transactions]);

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar search={search} setSearch={setSearch} searchPlaceholder="Filter transactions..." />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--orange">
                  <FiRepeat size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Transactions</p>
                  <h1 className="action-page__title">Transaction History</h1>
                  <p className="action-page__copy">
                    This page keeps the same Deposit layout while showing the selected account's
                    transactions only.
                  </p>
                </div>
              </div>

              {isLoading || isPageLoading ? (
                <article className="action-panel">
                  <p className="action-helper">Loading transactions...</p>
                </article>
              ) : !selectedAccount ? (
                <AccountRequiredState />
              ) : (
                <div className="action-page__grid">
                  <article className="action-panel">
                    <p className="action-panel__label">Available balance</p>
                    <h2 className="action-panel__value">{formatCurrency(selectedAccount.availableBalance)}</h2>
                    <p className="action-panel__meta">
                      Account: {selectedAccount.accountNumber}
                    </p>
                  </article>

                  <article className="action-panel action-panel--form">
                    <div className="action-panel__header">
                      <h2 className="action-panel__title">Transaction Details</h2>
                      <p className="action-panel__copy">
                        Switch the active account and review the matching transaction feed here.
                      </p>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Selected account</span>
                        <select
                          className="action-form__input"
                          value={selectedAccount._id}
                          onChange={(event) => selectAccount(event.target.value)}
                        >
                          {accounts.map((account) => (
                            <option key={account._id} value={account._id}>
                              {account.name} • {account.accountNumber}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="action-form__field">
                        <span>Search</span>
                        <input
                          className="action-form__input"
                          type="search"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Filter transactions"
                        />
                      </label>

                      {pageError ? <p className="action-helper action-helper--error">{pageError}</p> : null}

                      <TransactionList transactions={filteredTransactions} />
                    </div>
                  </article>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

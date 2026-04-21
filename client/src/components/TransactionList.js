import { formatCurrency, formatDateTime } from "../utils/currency";

export default function TransactionList({ transactions }) {
  if (transactions.length === 0) {
    return <p className="empty">No transactions found.</p>;
  }

  return (
    <div className="tx-list">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="tx-card">
          <div className="tx-icon">R</div>

          <div className="tx-info">
            <div className="tx-name">{transaction.description || transaction.type}</div>
            <div className="tx-date">{formatDateTime(transaction.createdAt)}</div>
          </div>

          <div className="tx-amount">
            <div
              className={
                transaction.direction === "credit" ? "text-success" : "text-danger"
              }
            >
              {transaction.direction === "credit" ? "+ " : "- "}
              {formatCurrency(transaction.amount)}
            </div>

            <div className="tx-tag">
              {transaction.type} · {transaction.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

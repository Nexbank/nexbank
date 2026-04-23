import { formatCurrency, formatDateTime } from "../utils/currency";

const getImpactAmount = (transaction = {}) => {
  if (typeof transaction.impactAmount === "number") {
    return Number(transaction.impactAmount);
  }

  const amount = Number(transaction.amount || 0);
  const fee = Number(transaction.fee || 0);

  return transaction.direction === "credit" ? amount : -(amount + fee);
};

export default function TransactionList({ transactions = [] }) {
  if (transactions.length === 0) {
    return <p className="empty">No transactions found.</p>;
  }

  return (
    <div className="tx-list">
      {transactions.map((transaction) => {
        const impactAmount = getImpactAmount(transaction);
        const isCredit = impactAmount > 0;

        return (
          <div key={transaction._id || transaction.id} className="tx-card">
            <div className="tx-icon">R</div>

            <div className="tx-info">
              <div className="tx-name">{transaction.description || transaction.type}</div>
              <div className="tx-date">{formatDateTime(transaction.createdAt)}</div>
            </div>

            <div className="tx-amount">
              <div className={isCredit ? "text-success" : "text-danger"}>
                {isCredit ? "+ " : "- "}
                {formatCurrency(Math.abs(impactAmount))}
              </div>

              <div className="tx-tag">
                {transaction.type} · {transaction.status}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

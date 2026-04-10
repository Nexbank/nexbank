export default function TransactionList({ transactions }) {
  if (transactions.length === 0) {
    return <p className="empty">No transactions found.</p>;
  }

  return (
    <div className="tx-list">
      {transactions.map((tx, i) => (
        <div key={i} className="tx-card">
          <div className="tx-icon">💳</div>

          <div className="tx-info">
            <div className="tx-name">{tx.name}</div>
            <div className="tx-date">{tx.date}</div>
          </div>

          <div className="tx-amount">
            <div className={tx.amount > 0 ? "text-success" : "text-danger"}>
                {tx.amount > 0 ? "+ " : "- "}R{Math.abs(tx.amount)}
            </div>

            <div className="tx-tag">{tx.tag}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

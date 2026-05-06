import { getCategoryMeta, spendingCategories } from "../constants/transactionCategories";

export function formatCurrency(amount) {
  return `R${Number(amount || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatTransactionDate(dateValue) {
  if (!dateValue) {
    return "Just now";
  }

  return new Date(dateValue).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTransactionImpactAmount(transaction) {
  if (typeof transaction?.impactAmount === "number") {
    return transaction.impactAmount;
  }

  const amount = Number(transaction?.amount || 0);
  const fee = Number(transaction?.fee || 0);

  return transaction?.type === "deposit" ? amount : -(amount + fee);
}

export function buildInsightsItems(breakdown = []) {
  const amountByCategory = new Map(
    breakdown.map((item) => [item.category, Number(item.amount || 0)])
  );

  return spendingCategories
    .map((category) => ({
      name: category,
      amount: amountByCategory.get(category) || 0,
      ...getCategoryMeta(category),
    }))
    .filter((item) => item.amount > 0);
}

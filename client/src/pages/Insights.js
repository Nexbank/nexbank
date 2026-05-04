import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getCategoryMeta } from "../constants/transactionCategories";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const SPENDING_TYPES = new Set(["withdrawal", "transfer", "bill", "fee"]);
const COMPLETED_STATUS = "completed";
const AUTO_CATEGORY_COUNT = 10;

const SUBCATEGORY_RULES = {
  Groceries: [
    { label: "Supermarkets", keywords: ["woolworths", "checkers", "pick n pay", "shoprite", "spar"] },
    { label: "Fresh Food", keywords: ["market", "produce", "fruit", "veg"] },
  ],
  Dining: [
    { label: "Restaurants", keywords: ["restaurant", "cafe", "grill", "kitchen", "diner"] },
    { label: "Fast Food", keywords: ["kfc", "mcd", "burger", "pizza", "nando"] },
  ],
  Transport: [
    { label: "Ride Services", keywords: ["uber", "bolt", "ride"] },
    { label: "Fuel & Transit", keywords: ["fuel", "shell", "engen", "gautrain", "taxi", "bus"] },
  ],
  Entertainment: [
    { label: "Streaming", keywords: ["netflix", "spotify", "showmax", "youtube"] },
    { label: "Leisure", keywords: ["cinema", "movie", "ticket", "games", "play"] },
  ],
  Utilities: [
    { label: "Electricity", keywords: ["electric", "power", "prepaid"] },
    { label: "Connectivity", keywords: ["water", "wifi", "fibre", "internet", "airtime", "data"] },
  ],
};

const categoryClasses = {
  groceries: "category-groceries",
  utilities: "category-utilities",
  entertainment: "category-entertainment",
  transport: "category-transport",
  dining: "category-dining",
  medical: "category-medical",
  airtime: "category-airtime",
  subscription: "category-subscription",
  clothing: "category-clothing",
  gambling: "category-gambling",
  bills: "category-bills",
  transfers: "category-transfers",
  accountfees: "category-account-fees",
};

const DONUT_COLORS = [
  "#10b981",
  "#38bdf8",
  "#f59e0b",
  "#c084fc",
  "#fb7185",
  "#2dd4bf",
  "#60a5fa",
  "#f472b6",
  "#a3e635",
  "#facc15",
];

const CATEGORY_COLORS = {
  groceries: "#10b981",
  utilities: "#fb7185",
  entertainment: "#c084fc",
  transport: "#38bdf8",
  dining: "#f59e0b",
  medical: "#2dd4bf",
  airtime: "#14b8a6",
  subscription: "#8b5cf6",
  clothing: "#f472b6",
  gambling: "#facc15",
  bills: "#fb7185",
  transfers: "#38bdf8",
  accountfees: "#c084fc",
};

function normalizeCategoryKey(value = "") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (normalized.includes("grocery")) return "groceries";
  if (normalized.includes("utility")) return "utilities";
  if (normalized.includes("entertain")) return "entertainment";
  if (normalized.includes("transport")) return "transport";
  if (normalized.includes("dining") || normalized.includes("restaurant")) return "dining";
  if (normalized.includes("medical") || normalized.includes("health")) return "medical";
  if (normalized.includes("airtime") || normalized.includes("data")) return "airtime";
  if (normalized.includes("subscription")) return "subscription";
  if (normalized.includes("clothing") || normalized.includes("accessories")) return "clothing";
  if (normalized.includes("gambling") || normalized.includes("lotto")) return "gambling";
  if (normalized.includes("bill")) return "bills";
  if (normalized.includes("transfer")) return "transfers";
  if (normalized.includes("account fee") || normalized.includes("fee")) return "accountfees";

  return normalized.split(" ")[0] || "other";
}

function getCategoryClass(category, index = 0) {
  const key = normalizeCategoryKey(category);
  return categoryClasses[key] || `category-auto-${index % AUTO_CATEGORY_COUNT}`;
}

function getCategoryColor(category, index = 0) {
  const key = normalizeCategoryKey(category);
  return CATEGORY_COLORS[key] || DONUT_COLORS[index % DONUT_COLORS.length];
}

function getProgressWidthClass(percentage) {
  const width = Math.max(0, Math.min(100, Math.round(Number(percentage || 0) / 5) * 5));
  return `progress-width-${width}`;
}

function deriveStoreName(transaction = {}) {
  return (
    transaction.billerName ||
    transaction.dynamicFields?.billName ||
    transaction.dynamicFields?.accountNumber ||
    transaction.metadata?.provider ||
    transaction.metadata?.billerName ||
    transaction.metadata?.beneficiaryName ||
    transaction.metadata?.bankName ||
    transaction.metadata?.source ||
    transaction.reference ||
    transaction.description ||
    "NexBank transaction"
  );
}

function deriveCategory(transaction = {}) {
  if (transaction.type === "fee") {
    return "Account Fees";
  }

  if (transaction.type === "bill") {
    return "Bills";
  }

  if (transaction.type === "withdrawal") {
    return transaction.category || transaction.metadata?.category || "Transport";
  }

  if (transaction.type === "transfer") {
    return "Transfers";
  }

  return transaction.category || transaction.metadata?.category || "Other";
}

function deriveSubcategory(transaction = {}, category = "") {
  const searchable = [
    deriveStoreName(transaction),
    transaction.description,
    transaction.reference,
    transaction.category,
    transaction.metadata?.provider,
    transaction.metadata?.bankName,
    transaction.metadata?.beneficiaryName,
    transaction.metadata?.note,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const rules = SUBCATEGORY_RULES[category] || [];
  const match = rules.find((rule) =>
    rule.keywords.some((keyword) => searchable.includes(keyword))
  );

  if (match) {
    return match.label;
  }

  if (category === "Bills") {
    if (searchable.includes("electric")) return "Electricity";
    if (searchable.includes("water")) return "Water";
    if (searchable.includes("airtime") || searchable.includes("data")) return "Airtime/Data";
    return "General";
  }

  if (category === "Transfers") {
    if (transaction.metadata?.route === "voucher") return "Cash Send";
    if (transaction.metadata?.route === "internal") return "Internal Transfer";
    if (transaction.metadata?.route === "external") return "External Transfer";
    return "General";
  }

  if (category === "Account Fees") {
    if (transaction.metadata?.feeType === "monthly_account_fee") return "Monthly Account Fee";
    return "General";
  }

  return "General";
}

function getSpendingImpact(transaction = {}) {
  if (typeof transaction.impactAmount === "number") {
    return Math.abs(transaction.impactAmount);
  }

  return Math.abs(Number(transaction.amount || 0)) + Math.abs(Number(transaction.fee || 0));
}

function normalizeTransaction(transaction = {}, index = 0, accountsById = new Map()) {
  const category = deriveCategory(transaction);
  const amount = getSpendingImpact(transaction);
  const account = accountsById.get(String(transaction.accountId)) || null;

  return {
    ...transaction,
    id: transaction._id || transaction.id || `insight-transaction-${index}`,
    category,
    subcategory: deriveSubcategory(transaction, category),
    storeName: deriveStoreName(transaction),
    amount,
    fee: Number(transaction.fee || 0),
    accountName: account?.name || "Account",
    accountNumber: account?.accountNumber || "",
    dateLabel: transaction.createdAt
      ? new Date(transaction.createdAt).toLocaleString("en-ZA", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Recent",
    typeLabel: String(transaction.type || "transaction").replace(/[-_]/g, " "),
    statusLabel: String(transaction.status || "").replace(/[-_]/g, " "),
  };
}

function buildDrillDownItems(transactions = []) {
  const grouped = transactions.reduce((map, transaction) => {
    const key = transaction.subcategory || "Other";
    const existing = map.get(key) || {
      name: key,
      amount: 0,
      count: 0,
      transactions: [],
    };

    existing.amount += transaction.amount;
    existing.count += 1;
    existing.transactions.push(transaction);
    map.set(key, existing);
    return map;
  }, new Map());

  return [...grouped.values()].sort((left, right) => right.amount - left.amount);
}

function InsightsDonut({ items, totalSpent }) {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const gap = 8;

  let offset = 0;

  return (
    <div className="insights-donut-wrap">
      <svg
        viewBox="0 0 220 220"
        className="insights-donut"
        role="img"
        aria-label="Spending donut chart"
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="28"
        />

        {items.map((item) => {
          const segment = totalSpent > 0 ? (item.amount / totalSpent) * circumference : 0;
          const dash = `${Math.max(segment - gap, 0)} ${circumference}`;
          const circleOffset = -offset;
          offset += segment;

          return (
            <circle
              key={item.name}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="28"
              strokeDasharray={dash}
              strokeDashoffset={circleOffset}
              transform="rotate(-90 110 110)"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function Insights({ search, setSearch, searchResults }) {
  const {
    accounts,
    allAccounts,
    allTransactions,
    selectedAccount,
    selectAccount,
  } = useAccount();
  const [activeCategoryName, setActiveCategoryName] = useState("");
  const [activeSubcategoryName, setActiveSubcategoryName] = useState("");
  const [activeTransactionId, setActiveTransactionId] = useState("");

  const accountList = allAccounts?.length ? allAccounts : accounts;
  const accountsById = useMemo(
    () => new Map(accountList.map((account) => [String(account._id || account.id), account])),
    [accountList]
  );

  const completedTransactions = useMemo(
    () =>
      allTransactions.filter(
        (transaction) => String(transaction.status || "").toLowerCase() === COMPLETED_STATUS
      ),
    [allTransactions]
  );

  const spendingTransactions = useMemo(
    () =>
      completedTransactions
        .filter((transaction) => {
          const impactAmount =
            typeof transaction.impactAmount === "number" ? transaction.impactAmount : null;
          const direction = String(transaction.direction || "").toLowerCase();
          return (
            SPENDING_TYPES.has(transaction.type) &&
            (direction === "debit" || impactAmount < 0)
          );
        })
        .map((transaction, index) => normalizeTransaction(transaction, index, accountsById))
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [accountsById, completedTransactions]
  );

  const spendingCategories = useMemo(() => {
    const grouped = spendingTransactions.reduce((map, transaction) => {
      const existing = map.get(transaction.category) || {
        name: transaction.category,
        amount: 0,
        count: 0,
        transactions: [],
      };

      existing.amount += transaction.amount;
      existing.count += 1;
      existing.transactions.push(transaction);
      map.set(transaction.category, existing);
      return map;
    }, new Map());

    return [...grouped.values()]
      .sort((left, right) => right.amount - left.amount)
      .map((category, index) => ({
        ...category,
        className: getCategoryClass(category.name, index),
        color: getCategoryColor(category.name, index),
        icon: getCategoryMeta(category.name).icon,
        subcategories: buildDrillDownItems(category.transactions),
      }));
  }, [spendingTransactions]);

  const filteredSpending = useMemo(() => {
    const searchValue = (search || "").trim().toLowerCase();

    if (!searchValue) {
      return spendingCategories;
    }

    return spendingCategories.filter(
      (item) =>
        item.name.toLowerCase().includes(searchValue) ||
        item.subcategories.some((subcategory) =>
          subcategory.name.toLowerCase().includes(searchValue)
        ) ||
        item.transactions.some((transaction) =>
          [transaction.storeName, transaction.reference, transaction.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(searchValue))
        )
    );
  }, [search, spendingCategories]);

  const totalSpent = spendingCategories.reduce((sum, category) => sum + category.amount, 0);
  const selectedCategory =
    spendingCategories.find((category) => category.name === activeCategoryName) || null;
  const selectedSubcategory =
    selectedCategory?.subcategories.find((subcategory) => subcategory.name === activeSubcategoryName) || null;
  const selectedTransaction =
    selectedSubcategory?.transactions.find((transaction) => transaction.id === activeTransactionId) || null;
  const drillLevel = selectedTransaction
    ? "receipt"
    : selectedSubcategory
      ? "transactions"
      : selectedCategory
        ? "subcategories"
        : "categories";

  const handleCategorySelect = (categoryName) => {
    setActiveCategoryName(categoryName);
    setActiveSubcategoryName("");
    setActiveTransactionId("");
  };

  const handleSubcategorySelect = (subcategoryName) => {
    setActiveSubcategoryName(subcategoryName);
    setActiveTransactionId("");
  };

  const hasSpending = spendingCategories.length > 0;

  const handleBack = () => {
    if (selectedTransaction) {
      setActiveTransactionId("");
      return;
    }

    if (selectedSubcategory) {
      setActiveSubcategoryName("");
      return;
    }

    if (selectedCategory) {
      setActiveCategoryName("");
    }
  };

  const renderBreakdownContent = () => {
    if (!hasSpending) {
      return (
        <article className="insights-empty-message-card">
          <h2>No spending insights yet</h2>
          <p>Start transacting to see your spending patterns.</p>
        </article>
      );
    }

    if (drillLevel === "receipt") {
      return (
        <>
          <div className="insights-drilldown-head">
            <button type="button" className="back-btn" onClick={handleBack}>
              Back
            </button>
            <p className="insights-breakdown-label">RECEIPT</p>
          </div>
          <article className="insights-receipt">
            <div className="insights-receipt-head">
              <p className="insights-receipt-kicker">TRANSACTION DETAILS</p>
              <h2 className="insights-receipt-title">{selectedTransaction.storeName}</h2>
              <p className="insights-receipt-amount">{formatCurrency(selectedTransaction.amount)}</p>
            </div>
            <div>
              <p className="insights-receipt-label">DATE</p>
              <p className="insights-receipt-value">{selectedTransaction.dateLabel}</p>
            </div>
            <div>
              <p className="insights-receipt-label">CATEGORY</p>
              <p className="insights-receipt-value">
                {selectedTransaction.category} / {selectedTransaction.subcategory}
              </p>
            </div>
            <div>
              <p className="insights-receipt-label">REFERENCE</p>
              <p className="insights-receipt-value">
                {selectedTransaction.reference || selectedTransaction.description || "No reference"}
              </p>
            </div>
            <div>
              <p className="insights-receipt-label">TRANSACTION ID</p>
              <p className="insights-receipt-value">{selectedTransaction._id || selectedTransaction.id}</p>
            </div>
          </article>
        </>
      );
    }

    if (drillLevel === "transactions") {
      return (
        <>
          <div className="insights-drilldown-head">
            <button type="button" className="back-btn" onClick={handleBack}>
              Back
            </button>
            <div>
              <p className="insights-breakdown-label">TRANSACTIONS</p>
              <h2 className="insights-drilldown-title">{selectedSubcategory.name}</h2>
            </div>
          </div>
          <div className="insights-drilldown-list">
            {selectedSubcategory.transactions.map((transaction) => (
              <button
                type="button"
                className="insights-drilldown-button"
                key={transaction.id}
                onClick={() => setActiveTransactionId(transaction.id)}
              >
                <div className="insights-drilldown-row">
                  <span className="insights-drilldown-name">{transaction.storeName}</span>
                  <span className="insights-drilldown-amount">{formatCurrency(transaction.amount)}</span>
                </div>
                <p className="insights-drilldown-meta">
                  {transaction.dateLabel} - {transaction.typeLabel} / {transaction.statusLabel}
                </p>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (drillLevel === "subcategories") {
      return (
        <>
          <div className="insights-drilldown-head">
            <button type="button" className="back-btn" onClick={handleBack}>
              Back
            </button>
            <div>
              <p className="insights-breakdown-label">SUBCATEGORIES</p>
              <h2 className="insights-drilldown-title">{selectedCategory.name}</h2>
            </div>
          </div>
          <div className="insights-drilldown-list">
            {selectedCategory.subcategories.map((subcategory) => (
              <button
                type="button"
                className="insights-drilldown-button"
                key={subcategory.name}
                onClick={() => handleSubcategorySelect(subcategory.name)}
              >
                <div className="insights-drilldown-row">
                  <span className="insights-drilldown-name">{subcategory.name}</span>
                  <span className="insights-drilldown-amount">{formatCurrency(subcategory.amount)}</span>
                </div>
                <p className="insights-drilldown-meta">
                  {subcategory.count} transaction{subcategory.count === 1 ? "" : "s"}
                </p>
              </button>
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <p className="insights-breakdown-label">CATEGORY BREAKDOWN</p>
        <div className="insights-breakdown-list">
          {filteredSpending.map((item) => {
            const Icon = item.icon;
            const percentage = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;

            return (
              <button
                type="button"
                className={`insights-category-card ${item.className}`}
                key={item.name}
                onClick={() => handleCategorySelect(item.name)}
              >
                <div className="insights-category-icon">
                  <Icon size={18} />
                </div>

                <div className="insights-category-main">
                  <div className="insights-category-header">
                    <span className="insights-category-name">{item.name}</span>
                    <span className="insights-category-amount">{formatCurrency(item.amount)}</span>
                  </div>

                  <div className="insights-progress-track">
                    <span className={`insights-progress-fill ${getProgressWidthClass(percentage)}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-main-panel">
        <Navbar search={search} setSearch={setSearch} searchResults={searchResults} searchPlaceholder="Search spending categories..." />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="dashboard-section">
              <div className="insights-heading-wrap d-flex align-items-center justify-content-between gap-3 flex-wrap">
                <div>
                  <p className="action-page__eyebrow mb-2">Insights</p>
                  <h1 className="insights-title">Spending Insights</h1>
                </div>

                {selectedAccount ? (
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <select
                      className="dashboard-select"
                      value={selectedAccount._id}
                      onChange={(event) => selectAccount(event.target.value)}
                      aria-label="Select bank account"
                    >
                      {accounts.map((account) => (
                        <option key={account._id} value={account._id}>
                          {account.name} - {account.accountNumber}
                        </option>
                      ))}
                    </select>
                    <span className="dashboard-panel-subtitle">{selectedAccount.accountNumber}</span>
                  </div>
                ) : null}
              </div>

              <div className="insights-grid">
                <article className="insights-chart-card">
                  {hasSpending ? (
                    <>
                      <InsightsDonut items={filteredSpending} totalSpent={totalSpent} />

                      <div className="insights-total">
                        <p className="insights-total-label">TOTAL SPENT</p>
                        <h2 className="insights-total-value">{formatCurrency(totalSpent)}</h2>
                      </div>
                    </>
                  ) : (
                    <div className="insights-total">
                      <p className="insights-total-label">NO SPENDING INSIGHTS YET</p>
                      <h2 className="insights-total-value">No spending insights yet</h2>
                      <p className="insights-empty-message">
                        Start transacting to see your spending patterns.
                      </p>
                    </div>
                  )}
                </article>

                <section className="insights-breakdown">
                  {renderBreakdownContent()}
                </section>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

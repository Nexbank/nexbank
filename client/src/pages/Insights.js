import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { buildInsightsItems, formatCurrency, formatTransactionDate } from "../utils/banking";
import { FiArrowLeft } from "react-icons/fi";

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
};

/* ---------------- DONUT CHART ---------------- */
function InsightsDonut({ items, totalSpent }) {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const gap = 8;

  let offset = 0;

  return (
    <div className="insights-donut-wrap">
      <svg viewBox="0 0 220 220" className="insights-donut">
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="28"
        />

        {items.map((item) => {
          const segment = (item.amount / totalSpent) * circumference;
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

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeCategoryKey(category) {
  const normalized = normalizeText(category).toLowerCase();

  if (normalized.includes("airtime")) return "airtime";
  if (normalized.includes("subscription")) return "subscription";
  if (normalized.includes("clothing")) return "clothing";
  if (normalized.includes("gambling") || normalized.includes("lotto")) return "gambling";

  return normalized
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCategoryClass(category) {
  const key = normalizeCategoryKey(category);

  if (categoryClasses[key]) {
    return categoryClasses[key];
  }

  const bucket = Array.from(key || "other").reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  ) % 10;

  return `category-auto-${bucket}`;
}

function getProgressWidthClass(percentage) {
  const roundedPercentage = Math.min(100, Math.max(0, Math.round(percentage / 5) * 5));
  return `progress-width-${roundedPercentage}`;
}

function toTitleCase(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function deriveStoreName(transaction) {
  const reference = normalizeText(transaction?.reference);
  const name = normalizeText(transaction?.name);
  const category = normalizeText(transaction?.category);
  const preferred = reference || name;

  if (!preferred) {
    return category || "Unknown";
  }

  const generatedLabels = [
    `${category} withdrawal`,
    `${category} deposit`,
    "withdrawal",
    "deposit",
  ]
    .map((label) => label.toLowerCase());

  if (generatedLabels.includes(preferred.toLowerCase())) {
    return category || "Unknown";
  }

  const cleaned = preferred
    .replace(/\b(withdrawal|deposit|payment|transfer)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned ? toTitleCase(cleaned) : category || "Unknown";
}

function deriveSubcategory(transaction) {
  const category = normalizeText(transaction?.category);
  const explicitSubcategory = normalizeText(transaction?.subcategory);

  if (explicitSubcategory) {
    return explicitSubcategory;
  }

  const source = `${normalizeText(transaction?.reference)} ${normalizeText(
    transaction?.name
  )} ${deriveStoreName(transaction)}`.toLowerCase();

  const rules = SUBCATEGORY_RULES[category] || [];
  const matchedRule = rules.find((rule) =>
    rule.keywords.some((keyword) => source.includes(keyword))
  );

  return matchedRule?.label || "General";
}

function normalizeTransaction(transaction, fallbackCategory) {
  const amount = Number(transaction?.amount || 0);
  const category = normalizeText(transaction?.category) || fallbackCategory || "Unknown";
  const store = deriveStoreName(transaction);
  const reference =
    normalizeText(transaction?.reference) ||
    normalizeText(transaction?.name) ||
    "Unknown";
  const id =
    normalizeText(transaction?._id) ||
    normalizeText(transaction?.id) ||
    normalizeText(transaction?.transactionId) ||
    "Unknown";
  const date =
    transaction?.date ||
    transaction?.createdAt ||
    transaction?.transactionDate ||
    null;

  return {
    id,
    store,
    amount,
    date,
    category,
    subcategory: deriveSubcategory({ ...transaction, category }),
    description:
      normalizeText(transaction?.description) ||
      normalizeText(transaction?.name) ||
      reference ||
      "Unknown",
    reference,
    transactionId: id,
    raw: transaction,
  };
}

function buildDrillDownItems(breakdown, recentTransactions) {
  const normalizedTransactions = (recentTransactions || [])
    .filter((transaction) => {
      const type = normalizeText(transaction?.type).toLowerCase();
      return type === "withdrawal" || Number(transaction?.impactAmount || 0) < 0;
    })
    .map((transaction) => normalizeTransaction(transaction));

  const categoryTransactionMap = normalizedTransactions.reduce((map, transaction) => {
    const current = map.get(transaction.category) || [];
    current.push(transaction);
    map.set(transaction.category, current);
    return map;
  }, new Map());

  return buildInsightsItems(breakdown).map((item) => {
    const categoryTransactions = categoryTransactionMap.get(item.name) || [];
    const subcategoryMap = categoryTransactions.reduce((map, transaction) => {
      const key = transaction.subcategory || "General";
      const current = map.get(key) || [];
      current.push(transaction);
      map.set(key, current);
      return map;
    }, new Map());

    const subcategories =
      subcategoryMap.size > 0
        ? Array.from(subcategoryMap.entries()).map(([name, transactions]) => ({
            name,
            amount: transactions.reduce(
              (sum, transaction) => sum + Number(transaction.amount || 0),
              0
            ),
            transactions,
          }))
        : [
            {
              name: "General",
              amount: item.amount,
              transactions: [],
            },
          ];

    return {
      ...item,
      subcategories,
      transactions: categoryTransactions,
    };
  });
}

function renderEmptyMessage(message) {
  return <p className="insights-empty-message">{message}</p>;
}

/* ---------------- MAIN PAGE ---------------- */
export default function Insights() {
  const [overview, setOverview] = useState({
    insights: { totalSpent: 0, breakdown: [] },
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [level, setLevel] = useState(1);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userName =
    user.firstname ||
    user.displayName?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "User";

  /* FETCH DATA */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await API.get("/banking/overview");
        setOverview({
          insights: res.data?.insights || { totalSpent: 0, breakdown: [] },
          recentTransactions: res.data?.recentTransactions || [],
        });
      } catch (err) {
        setOverview({
          insights: { totalSpent: 0, breakdown: [] },
          recentTransactions: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* BUILD DATA */
  const monthlySpending = useMemo(
    () =>
      buildDrillDownItems(
        overview.insights?.breakdown || [],
        overview.recentTransactions || []
      ),
    [overview]
  );
  const totalSpent =
    Number(overview.insights?.totalSpent || 0) ||
    monthlySpending.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  /* HANDLERS */
  const handleCategorySelect = (item) => {
    setSelectedCategory(item);
    setSelectedSubcategory(null);
    setSelectedTransaction(null);
    setLevel(2);
  };

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setSelectedTransaction(null);
    setLevel(3);
  };

  const handleTransactionSelect = (transaction) => {
    setSelectedTransaction(transaction);
    setLevel(4);
  };

  const back = () => {
    if (level === 4) {
      setSelectedTransaction(null);
      setLevel(3);
      return;
    }

    if (level === 3) {
      setSelectedSubcategory(null);
      setSelectedTransaction(null);
      setLevel(2);
      return;
    }

    if (level === 2) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedTransaction(null);
      setLevel(1);
    }
  };

  const currentTransactions = selectedSubcategory?.transactions || [];

  return (
    <div className="dashboard-page insights-page">
      <Sidebar />
      <div className="dashboard-main-panel">
        <Navbar userName={userName} />

        <main className="dashboard-content-area insights-content-area">
          <section className="insights-panel">
            <div className="insights-grid-headings">
              <div className="insights-heading-wrap">
                <h1 className="insights-title">Spending Insights</h1>
              </div>
              <p className="insights-breakdown-label">CATEGORY BREAKDOWN</p>
            </div>

            <div className="insights-grid">
              <article className="insights-chart-card">
                {totalSpent > 0 ? (
                  <InsightsDonut items={monthlySpending} totalSpent={totalSpent} />
                ) : null}

                <div className="insights-total">
                  <p className="insights-total-label">TOTAL SPENT</p>
                  <h2 className="insights-total-value">{formatCurrency(totalSpent)}</h2>
                </div>

                <div className="insights-drilldown-section">
                  <div className="insights-drilldown-head">
                    <div>
                      <p className="insights-drilldown-kicker">INSIGHT DRILL-DOWN</p>
                      <h3 className="insights-drilldown-title">
                        {level === 1 && "Select a category"}
                        {level === 2 && `${selectedCategory?.name || "Category"} subcategories`}
                        {level === 3 &&
                          `${selectedSubcategory?.name || "Subcategory"} transactions`}
                        {level === 4 && "Transaction receipt"}
                      </h3>
                    </div>

                    {level > 1 && (
                      <button type="button" onClick={back} className="back-btn">
                        <FiArrowLeft /> Back
                      </button>
                    )}
                  </div>

                  {level === 1 &&
                    renderEmptyMessage(
                      "Select any category from the breakdown to explore subcategories, recent store-level transactions, and a full receipt view."
                    )}

                  {level === 2 && selectedCategory && (
                    <div className="insights-drilldown-list">
                      {selectedCategory.subcategories.map((subcategory) => (
                        <button
                          key={`${selectedCategory.name}-${subcategory.name}`}
                          type="button"
                          onClick={() => handleSubcategorySelect(subcategory)}
                          className="insights-drilldown-button"
                        >
                          <div className="insights-drilldown-row">
                            <span className="insights-drilldown-name">{subcategory.name}</span>
                            <span className="insights-drilldown-amount">
                              {formatCurrency(subcategory.amount)}
                            </span>
                          </div>
                          <p className="insights-drilldown-meta">
                            {subcategory.transactions.length > 0
                              ? `${subcategory.transactions.length} recent transaction${
                                  subcategory.transactions.length === 1 ? "" : "s"
                                }`
                              : "No recent transactions available from overview data"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {level === 3 &&
                    (currentTransactions.length > 0 ? (
                      <div className="insights-drilldown-list">
                        {currentTransactions.map((transaction) => (
                          <button
                            key={transaction.id}
                            type="button"
                            onClick={() => handleTransactionSelect(transaction)}
                            className="insights-drilldown-button"
                          >
                            <div className="insights-drilldown-row">
                              <span className="insights-drilldown-name">{transaction.store}</span>
                              <span className="insights-drilldown-amount">
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                            <p className="insights-drilldown-meta">{transaction.description}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      renderEmptyMessage(
                        "No recent transactions were returned for this subcategory. Category totals still reflect the backend breakdown."
                      )
                    ))}

                  {level === 4 && selectedTransaction && (
                    <div className="insights-receipt">
                      <div className="insights-receipt-head">
                        <p className="insights-receipt-kicker">TRANSACTION RECEIPT</p>
                        <h3 className="insights-receipt-title">{selectedTransaction.store}</h3>
                        <p className="insights-receipt-amount">
                          {formatCurrency(selectedTransaction.amount)}
                        </p>
                      </div>

                      {[
                        ["Date", formatTransactionDate(selectedTransaction.date)],
                        ["Category", selectedTransaction.category || "Unknown"],
                        ["Subcategory", selectedTransaction.subcategory || "General"],
                        ["Description", selectedTransaction.description || "Unknown"],
                        ["Reference", selectedTransaction.reference || "Unknown"],
                        [
                          "Transaction ID",
                          selectedTransaction.transactionId || "Unknown",
                        ],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="insights-receipt-label">{label}</p>
                          <p className="insights-receipt-value">{value || "Unknown"}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>

              <section className="insights-breakdown">
                <div className="insights-breakdown-list">
                  {loading ? (
                    <article className="insights-category-card">
                      <div className="insights-category-main">
                        <div className="insights-category-header">
                          <span className="insights-category-name">
                            Loading insights...
                          </span>
                        </div>
                      </div>
                    </article>
                  ) : monthlySpending.length === 0 ? (
                    <article className="insights-category-card">
                      <div className="insights-category-main">
                        <div className="insights-category-header">
                          <span className="insights-category-name">
                            No spending captured yet
                          </span>
                          <span className="insights-category-amount">
                            {formatCurrency(0)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ) : (
                    monthlySpending.map((item) => {
                      const Icon = item.icon;
                      const percentage =
                        totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
                      const isActive = selectedCategory?.name === item.name;
                      const categoryClass = getCategoryClass(item.name);
                      const activeClass = isActive ? "is-active" : "";
                      const progressWidthClass = getProgressWidthClass(percentage);

                      return (
                        <button
                          key={item.name}
                          type="button"
                          className={`insights-category-card ${categoryClass} ${activeClass}`}
                          onClick={() => handleCategorySelect(item)}
                        >
                          <div className="insights-category-icon">
                            <Icon size={18} />
                          </div>

                          <div className="insights-category-main">
                            <div className="insights-category-header">
                              <span className="insights-category-name">{item.name}</span>
                              <span className="insights-category-amount">
                                {formatCurrency(item.amount)}
                              </span>
                            </div>

                            <div className="insights-progress-track">
                              <span
                                className={`insights-progress-fill ${progressWidthClass}`}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

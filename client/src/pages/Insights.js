import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  FiActivity,
  FiArrowLeft,
  FiCoffee,
  FiFilm,
  FiGift,
  FiHeart,
  FiPhone,
  FiShoppingBag,
  FiTruck,
  FiTv,
  FiZap,
} from "react-icons/fi";

const tx = (
  item,
  store,
  amount,
  transactionDate,
  postingDate,
  description,
  longDescription,
) => ({
  item,
  store,
  details: {
    transactionType: "Card Purchase",
    amount,
    fromAccount: "Main Account",
    transactionDate,
    postingDate,
    description,
    longDescription,
  },
});

const insightHierarchy = {
  Food: {
    color: "#19c88a",
    icon: FiShoppingBag,
    subcategories: {
      Groceries: {
        color: "#19c88a",
        icon: FiShoppingBag,
        transactions: [
          tx("Woolworths Essentials", "Woolworths", 1280, "2026-04-16T14:10:00", "2026-04-17", "Woolworths Sandton (Card 5024)", "WOOLWORTHS SANDTON ZA"),
          tx("Pick n Pay Family Shop", "Pick n Pay", 940, "2026-04-11T10:45:00", "2026-04-12", "Pick n Pay Rosebank (Card 5024)", "PICK N PAY ROSEBANK ZA"),
          tx("Checkers Fresh Produce", "Checkers", 760, "2026-04-06T18:25:00", "2026-04-07", "Checkers Menlyn (Card 5024)", "CHECKERS MENLYN ZA"),
        ],
      },
      Takeaways: {
        color: "#31c4b6",
        icon: FiCoffee,
        transactions: [
          tx("KFC Lunch", "KFC", 185, "2026-04-18T13:08:00", "2026-04-19", "KFC Brooklyn Mall (Card 5024)", "KFC BROOKLYN MALL ZA"),
          tx("McDonald's Drive Thru", "McDonald's", 142, "2026-04-09T19:41:00", "2026-04-10", "McDonald's Hatfield (Card 5024)", "MCDONALDS HATFIELD ZA"),
        ],
      },
      Dining: {
        color: "#4b8cff",
        icon: FiCoffee,
        transactions: [
          tx("Birthday Dinner", "Life Grand Cafe", 540, "2026-04-13T20:10:00", "2026-04-14", "Life Grand Cafe Waterfall (Card 5024)", "LIFE GRAND CAFE WATERFALL ZA"),
          tx("Weekend Brunch", "Tashas", 320, "2026-04-05T11:55:00", "2026-04-06", "Tashas Rosebank (Card 5024)", "TASHAS ROSEBANK ZA"),
        ],
      },
    },
  },
  Transport: {
    color: "#ff8a1e",
    icon: FiTruck,
    subcategories: {
      "Private Transport": {
        color: "#ff8a1e",
        icon: FiTruck,
        transactions: [
          tx("Uber Ride", "Uber", 100, "2026-04-17T12:20:00", "2026-04-19", "Mogasetrans Pretoria (Card 5024)", "MOGASETRANS PRETORIA ZA"),
          tx("Late Night Trip", "Uber", 135, "2026-04-08T22:12:00", "2026-04-09", "Uber Johannesburg (Card 5024)", "UBER JOHANNESBURG ZA"),
        ],
      },
      "Public Transport": {
        color: "#f4a62a",
        icon: FiTruck,
        transactions: [
          tx("Gautrain Commute", "Gautrain", 220, "2026-04-15T07:10:00", "2026-04-15", "Gautrain Sandton (Card 5024)", "GAUTRAIN SANDTON ZA"),
          tx("Bus Connector", "Gautrain Bus", 60, "2026-04-15T07:50:00", "2026-04-15", "Gautrain Bus Pretoria (Card 5024)", "GAUTRAIN BUS PRETORIA ZA"),
        ],
      },
    },
  },
  Entertainment: {
    color: "#a855f7",
    icon: FiFilm,
    transactions: [
      tx("Cinema Night", "Ster-Kinekor", 260, "2026-04-12T18:35:00", "2026-04-13", "Ster-Kinekor Eastgate (Card 5024)", "STERKINEKOR EASTGATE ZA"),
      tx("Weekend Drinks", "Tiger's Milk", 410, "2026-04-19T21:10:00", "2026-04-20", "Tiger's Milk Rosebank (Card 5024)", "TIGERS MILK ROSEBANK ZA"),
    ],
  },
  Utilities: {
    color: "#ff4747",
    icon: FiZap,
    transactions: [
      tx("Electricity Top Up", "City Power", 950, "2026-04-10T09:14:00", "2026-04-10", "City Power Electricity (Card 5024)", "CITY POWER ELECTRICITY ZA"),
      tx("Water Account", "Johannesburg Water", 580, "2026-04-10T09:18:00", "2026-04-10", "Johannesburg Water Services (Card 5024)", "JOHANNESBURG WATER SERVICES ZA"),
    ],
  },
  Medical: {
    color: "#ef5d7a",
    icon: FiHeart,
    transactions: [
      tx("Pharmacy Refill", "Clicks Pharmacy", 240, "2026-04-14T17:06:00", "2026-04-15", "Clicks Pharmacy Sandton (Card 5024)", "CLICKS PHARMACY SANDTON ZA"),
      tx("Clinic Visit", "Netcare", 680, "2026-04-03T09:35:00", "2026-04-03", "Netcare Clinic Pretoria (Card 5024)", "NETCARE CLINIC PRETORIA ZA"),
    ],
  },
  "Airtime & Bundles": {
    color: "#00b4d8",
    icon: FiPhone,
    transactions: [
      tx("Monthly Data Bundle", "Vodacom", 299, "2026-04-02T08:45:00", "2026-04-02", "Vodacom Data Bundle (Card 5024)", "VODACOM DATA BUNDLE ZA"),
      tx("Prepaid Airtime", "MTN", 120, "2026-04-18T18:02:00", "2026-04-18", "MTN Airtime Purchase (Card 5024)", "MTN AIRTIME PURCHASE ZA"),
    ],
  },
  "Subscription Fees": {
    color: "#8b5cf6",
    icon: FiTv,
    transactions: [
      tx("Streaming Subscription", "Netflix", 159, "2026-04-01T06:00:00", "2026-04-01", "Netflix Subscription (Card 5024)", "NETFLIX.COM ZA"),
      tx("Music Subscription", "Spotify", 69, "2026-04-04T06:15:00", "2026-04-04", "Spotify Premium (Card 5024)", "SPOTIFY PREM ZA"),
      tx("Wallet Subscription", "Apple Pay", 129, "2026-04-07T11:32:00", "2026-04-07", "Apple Pay Subscription (Card 5024)", "APPLE.COM BILL ZA"),
    ],
  },
  "Clothing & Accessories": {
    color: "#f97316",
    icon: FiGift,
    transactions: [
      tx("Workwear Purchase", "Zara", 850, "2026-04-06T16:05:00", "2026-04-07", "Zara Sandton City (Card 5024)", "ZARA SANDTON CITY ZA"),
      tx("Jewellery Gift", "Sterns", 620, "2026-04-16T12:40:00", "2026-04-17", "Sterns Jewellery (Card 5024)", "STERNS JEWELLERY ZA"),
    ],
  },
  "Lotto & Gambling": {
    color: "#eab308",
    icon: FiActivity,
    transactions: [
      tx("Sports Bet", "Hollywoodbets", 200, "2026-04-18T21:22:00", "2026-04-19", "Hollywoodbets Wallet Top Up (Card 5024)", "HOLLYWOODBETS WALLET ZA"),
      tx("Weekly Lotto", "Lotto", 80, "2026-04-13T17:28:00", "2026-04-13", "National Lottery Entry (Card 5024)", "NATIONAL LOTTERY ZA"),
    ],
  },
};

const amountOf = (transactions) =>
  transactions.reduce((sum, transaction) => sum + transaction.details.amount, 0);

function formatCurrency(amount) {
  return `R${amount.toLocaleString("en-ZA")}`;
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InsightsDonut({ data, totalSpent }) {
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
        aria-label="Monthly spending donut chart"
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="28"
        />

        {data.map((item) => {
          const segmentLength =
            (item.amount / totalSpent) * circumference - gap;
          const dashArray = `${Math.max(segmentLength, 0)} ${circumference}`;
          const circleOffset = -offset;

          offset += (item.amount / totalSpent) * circumference;

          return (
            <circle
              key={item.name}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="28"
              strokeLinecap="butt"
              strokeDasharray={dashArray}
              strokeDashoffset={circleOffset}
              transform="rotate(-90 110 110)"
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function Insights() {
  const monthlySpending = useMemo(
    () =>
      Object.entries(insightHierarchy).map(([name, category]) => {
        if (category.subcategories) {
          const subcategories = Object.entries(category.subcategories).map(
            ([subName, subcategory]) => ({
              name: subName,
              color: subcategory.color,
              icon: subcategory.icon,
              transactions: subcategory.transactions,
              amount: amountOf(subcategory.transactions),
            }),
          );

          return {
            name,
            color: category.color,
            icon: category.icon,
            subcategories,
            amount: subcategories.reduce((sum, item) => sum + item.amount, 0),
          };
        }

        return {
          name,
          color: category.color,
          icon: category.icon,
          transactions: category.transactions,
          amount: amountOf(category.transactions),
        };
      }),
    [],
  );

  const totalSpent = monthlySpending.reduce((sum, item) => sum + item.amount, 0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [drillDownLevel, setDrillDownLevel] = useState(1);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setSelectedTransaction(null);
    setDrillDownLevel(category.subcategories ? 2 : 3);
  };

  const handleSubcategoryClick = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setSelectedTransaction(null);
    setDrillDownLevel(3);
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setDrillDownLevel(4);
  };

  const handleBack = () => {
    if (drillDownLevel === 5) return setDrillDownLevel(4);
    if (drillDownLevel === 4) {
      setSelectedTransaction(null);
      return setDrillDownLevel(3);
    }
    if (drillDownLevel === 3 && selectedCategory?.subcategories) {
      setSelectedSubcategory(null);
      return setDrillDownLevel(2);
    }
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedTransaction(null);
    setDrillDownLevel(1);
  };

  const currentTransactions =
    selectedSubcategory?.transactions || selectedCategory?.transactions || [];

  return (
    <div className="dashboard-page insights-page">
      <Sidebar />
      <div className="dashboard-main-panel">
        <Navbar userName="Nozwelo" />
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
                <InsightsDonut data={monthlySpending} totalSpent={totalSpent} />

                <div className="insights-total">
                  <p className="insights-total-label">TOTAL SPENT</p>
                  <h2 className="insights-total-value">
                    {formatCurrency(totalSpent)}.00
                  </h2>
                </div>

                <div
                  style={{
                    width: "100%",
                    marginTop: 22,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          color: "#8f9198",
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.12em",
                        }}
                      >
                        INSIGHT DRILL-DOWN
                      </p>
                      <h3
                        style={{
                          margin: "6px 0 0",
                          color: "#f5f7fa",
                          fontSize: 18,
                          fontWeight: 700,
                        }}
                      >
                        {drillDownLevel === 1 && "Select a category"}
                        {drillDownLevel === 2 &&
                          `${selectedCategory?.name} subcategories`}
                        {drillDownLevel === 3 &&
                          `${selectedSubcategory?.name || selectedCategory?.name} transactions`}
                        {drillDownLevel === 4 && "Store name"}
                        {drillDownLevel === 5 && "Transaction details"}
                      </h3>
                    </div>

                    {drillDownLevel > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#19c88a",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <FiArrowLeft size={14} />
                        Back
                      </button>
                    )}
                  </div>

                  {drillDownLevel === 1 && (
                    <p
                      style={{
                        margin: 0,
                        color: "#b6bac2",
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      Click any category on the right to explore monthly purchases,
                      then drill down into the store and full transaction details.
                    </p>
                  )}

                  {drillDownLevel === 2 && selectedCategory?.subcategories && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {selectedCategory.subcategories.map((subcategory) => (
                        <button
                          key={`${selectedCategory.name}-${subcategory.name}`}
                          type="button"
                          onClick={() => handleSubcategoryClick(subcategory)}
                          style={{
                            width: "100%",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            background: "#171717",
                            borderRadius: 16,
                            padding: "14px 16px",
                            color: "#f5f7fa",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 700 }}>
                              {subcategory.name}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>
                              {formatCurrency(subcategory.amount)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {drillDownLevel === 3 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {currentTransactions.map((transaction) => (
                        <button
                          key={`${transaction.item}-${transaction.store}`}
                          type="button"
                          onClick={() => handleTransactionClick(transaction)}
                          style={{
                            width: "100%",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            background: "#171717",
                            borderRadius: 16,
                            padding: "14px 16px",
                            color: "#f5f7fa",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 700 }}>
                              {transaction.item}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>
                              {formatCurrency(transaction.details.amount)}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: "6px 0 0",
                              color: "#8f9198",
                              fontSize: 12,
                            }}
                          >
                            {transaction.store}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {drillDownLevel === 4 && selectedTransaction && (
                    <button
                      type="button"
                      onClick={() => setDrillDownLevel(5)}
                      style={{
                        width: "100%",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        background: "#171717",
                        borderRadius: 16,
                        padding: "16px 18px",
                        color: "#f5f7fa",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: "#8f9198",
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.12em",
                        }}
                      >
                        STORE NAME
                      </p>
                      <h4
                        style={{
                          margin: "8px 0 6px",
                          fontSize: 20,
                          fontWeight: 800,
                        }}
                      >
                        {selectedTransaction.store}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          color: "#b6bac2",
                          fontSize: 13,
                        }}
                      >
                        Click again to reveal the full transaction details.
                      </p>
                    </button>
                  )}

                  {drillDownLevel === 5 && selectedTransaction && (
                    <div
                      style={{
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        background: "#171717",
                        borderRadius: 16,
                        padding: "16px 18px",
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      {[
                        ["Transaction Type", selectedTransaction.details.transactionType],
                        ["Amount", formatCurrency(selectedTransaction.details.amount)],
                        ["From Account", selectedTransaction.details.fromAccount],
                        ["Transaction Date", formatDateTime(selectedTransaction.details.transactionDate)],
                        ["Posting Date", formatDate(selectedTransaction.details.postingDate)],
                        ["Description", selectedTransaction.details.description],
                        ["Long Description", selectedTransaction.details.longDescription],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p
                            style={{
                              margin: 0,
                              color: "#8f9198",
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: "0.1em",
                            }}
                          >
                            {label}
                          </p>
                          <p
                            style={{
                              margin: "6px 0 0",
                              color: "#f5f7fa",
                              fontSize: 14,
                              lineHeight: 1.5,
                            }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>

              <section className="insights-breakdown">
                <div className="insights-breakdown-list">
                  {monthlySpending.map((item) => {
                    const Icon = item.icon;
                    const percentage = (item.amount / totalSpent) * 100;

                    return (
                      <button
                        type="button"
                        className="insights-category-card"
                        key={item.name}
                        onClick={() => handleCategoryClick(item)}
                        style={{
                          width: "100%",
                          cursor: "pointer",
                          textAlign: "left",
                          borderColor:
                            selectedCategory?.name === item.name
                              ? `${item.color}55`
                              : "rgba(255, 255, 255, 0.05)",
                          boxShadow:
                            selectedCategory?.name === item.name
                              ? `0 0 0 1px ${item.color}33`
                              : "none",
                        }}
                      >
                        <div
                          className="insights-category-icon"
                          style={{ backgroundColor: item.color }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="insights-category-main">
                          <div className="insights-category-header">
                            <span className="insights-category-name">
                              {item.name}
                            </span>
                            <span className="insights-category-amount">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          <div className="insights-progress-track">
                            <span
                              className="insights-progress-fill"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

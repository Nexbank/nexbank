import { useMemo, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiRepeat,
  FiTrendingUp,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AccountRequiredState from "../components/AccountRequiredState";
import Sidebar from "../components/Sidebar";
import TransactionList from "../components/TransactionList";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const ACCOUNT_PRODUCTS = [
  {
    name: "Main Account",
    accountType: "current",
    description: "Daily banking, cards, payments",
    monthlyFee: 50,
  },
  {
    name: "TruSave",
    accountType: "savings",
    description: "Save money, flexible withdrawals",
    monthlyFee: 0,
  },
  {
    name: "Student Account",
    accountType: "student",
    description: "Low-fee banking for students",
    monthlyFee: 0,
  },
  {
    name: "Fixed Deposit",
    accountType: "fixed_deposit",
    description: "Earn interest, locked funds",
    monthlyFee: 0,
  },
  {
    name: "Tax-Free Savings",
    accountType: "tax_free_savings",
    description: "Long-term tax-free saving",
    monthlyFee: 0,
  },
  {
    name: "Private Banking",
    accountType: "private_banking",
    description: "Premium banking with priority support",
    monthlyFee: 150,
  },
];

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

const actionItems = [
  {
    label: "Deposit",
    icon: FiPlus,
    accentClass: "dashboard-action-card--green",
    path: "/deposit",
    isAvailable: () => true,
    helpText: "Add money into this account.",
  },
  {
    label: "Withdraw",
    icon: FiArrowUpRight,
    accentClass: "dashboard-action-card--blue",
    path: "/withdraw",
    isAvailable: (account) => account?.rules?.allowsWithdrawals !== false,
    helpText: "Move money out of this account.",
  },
  {
    label: "Transfer",
    icon: FiRepeat,
    accentClass: "dashboard-action-card--orange",
    path: "/transfer",
    isAvailable: (account) => account?.rules?.allowsTransfers !== false,
    helpText: "Send money to another account.",
  },
  {
    label: "Pay Bills",
    icon: FiArrowDownRight,
    accentClass: "dashboard-action-card--purple",
    path: "/pay-bills",
    isAvailable: (account) => account?.rules?.allowsBillPayments !== false,
    helpText: "Pay providers directly from this account.",
  },
];

export default function Dashboard({ search, setSearch, searchResults }) {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const {
    accounts,
    selectedAccount,
    selectedCards,
    selectedTransactions,
    dashboardSummary,
    isLoading,
    needsAccountOnboarding,
    selectAccount,
  } = useAccount();

  const summaryItems = useMemo(
    () => [
      {
        title: "Money In",
        value: formatCurrency(dashboardSummary.moneyIn),
        change: `${selectedTransactions.filter((transaction) => transaction.direction === "credit").length} items`,
        changeClass: "dashboard-stat-change--positive",
      },
      {
        title: "Money Out",
        value: formatCurrency(dashboardSummary.moneyOut),
        change: `${selectedTransactions.filter((transaction) => transaction.direction === "debit").length} items`,
        changeClass: "dashboard-stat-change--negative",
      },
      {
        title: "Cards",
        value: String(selectedCards.length),
        change: `${dashboardSummary.activeCardsCount} active`,
        changeClass: "dashboard-stat-change--info",
      },
    ],
    [dashboardSummary, selectedCards.length, selectedTransactions]
  );

  const filteredRecentTransactions = useMemo(() => {
    const searchValue = (search || "").trim().toLowerCase();

    if (!searchValue) {
      return dashboardSummary.recentTransactions;
    }

    return dashboardSummary.recentTransactions.filter((transaction) =>
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
  }, [dashboardSummary.recentTransactions, search]);

  const shouldShowAccountState = needsAccountOnboarding;
  const accountDisplayName = selectedAccount?.name || selectedAccount?.accountType || "Selected account";
  const accountDisplayNumber = selectedAccount?.accountNumber || "Account unavailable";
  const accountDisplayType = [selectedAccount?.accountType, selectedAccount?.category]
    .filter(Boolean)
    .map((value) => humanizeValue(value))
    .join(" • ");
  const selectableAccounts = accounts.filter(Boolean);
  const selectedAccountBalance = Number(
    selectedAccount?.availableBalance ??
      selectedAccount?.balance ??
      selectedAccount?.ledgerBalance ??
      0
  );
  const ownedAccountTypes = useMemo(
    () => new Set(selectableAccounts.map((account) => account?.accountType).filter(Boolean)),
    [selectableAccounts]
  );
  const exploreProducts = useMemo(
    () =>
      ACCOUNT_PRODUCTS.filter((product) => !ownedAccountTypes.has(product.accountType)).slice(0, 3),
    [ownedAccountTypes]
  );
  const capabilityItems = useMemo(
    () => {
      const selectedAccountRules = selectedAccount?.rules || {};

      return [
        {
          label: "Cards",
          value: selectedAccountRules.allowsCards ? "Available" : "Unavailable",
          isAvailable: selectedAccountRules.allowsCards !== false,
        },
        {
          label: "Bills",
          value: selectedAccountRules.allowsBillPayments ? "Available" : "Unavailable",
          isAvailable: selectedAccountRules.allowsBillPayments !== false,
        },
        {
          label: "Transfers",
          value: selectedAccountRules.allowsTransfers ? "Available" : "Unavailable",
          isAvailable: selectedAccountRules.allowsTransfers !== false,
        },
        {
          label: "Transfers",
          value: selectedAccountRules.allowsTransfers !== false ? "Available" : "Unavailable",
          isAvailable: true,
        },
      ];
    },
    [selectedAccount?.rules]
  );

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar search={search} setSearch={setSearch} searchResults={searchResults} searchPlaceholder="Search transactions, cards, accounts..." />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            {isLoading ? (
              <section className="dashboard-section">
                <article className="dashboard-panel">
                  <div className="dashboard-panel-header dashboard-panel-header--stack">
                    <div>
                      <h2 className="dashboard-panel-title">Loading dashboard</h2>
                      <p className="dashboard-panel-subtitle">
                        Fetching your latest account summary.
                      </p>
                    </div>
                  </div>
                </article>
              </section>
            ) : shouldShowAccountState ? (
              <section className="dashboard-section">
                <AccountRequiredState
                  title="No account available"
                  copy="Create or select an account to view your dashboard summary."
                />
              </section>
            ) : (
              <>
                <div className="row g-4 align-items-stretch dashboard-hero-row">
                  <div className="col-12 col-xl-8">
                    <section className="dashboard-balance-card">
                      <div className="dashboard-balance-top">
                        <p className="dashboard-eyebrow">Available Balance</p>
                        <button
                          type="button"
                          className="dashboard-icon-pill"
                          onClick={() => setShowBalance((current) => !current)}
                          aria-label={showBalance ? "Hide balance" : "Show balance"}
                        >
                          {showBalance ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      </div>

                      <div className="dashboard-balance-value-wrap">
                        <span className="dashboard-currency">R</span>
                        <h1 className="dashboard-balance-amount">
                          {showBalance
                            ? selectedAccountBalance.toLocaleString("en-ZA", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "••••••"}
                        </h1>
                      </div>

                      <div className="dashboard-balance-footer">
                        <div className="dashboard-balance-account">
                          <span className="dashboard-trend-pill">
                            <FiTrendingUp size={14} />
                            {accountDisplayName}
                          </span>
                          <div className="dashboard-balance-account-meta">
                            <span className="dashboard-balance-number">{accountDisplayNumber}</span>
                            {accountDisplayType ? (
                              <span className="dashboard-balance-hint">{accountDisplayType}</span>
                            ) : null}
                          </div>
                        </div>

                        <label className="dashboard-account-select-wrap">
                          <span className="dashboard-account-select-label">Choose account</span>
                          <select
                            className="dashboard-select"
                            value={selectedAccount?._id || ""}
                            onChange={(event) => selectAccount(event.target.value)}
                            aria-label="Select bank account"
                          >
                            {selectableAccounts.map((account) => (
                              <option key={account._id} value={account._id}>
                                {(account.name || account.accountType || "Account")} • {account.accountNumber}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="dashboard-capability-row">
                        {capabilityItems.map((item) => (
                          <div key={item.label} className="dashboard-capability-pill">
                            <span className="dashboard-capability-label">{item.label}</span>
                            <strong
                              className={`dashboard-capability-value ${
                                item.isAvailable
                                  ? "dashboard-capability-value--available"
                                  : "dashboard-capability-value--unavailable"
                              }`}
                            >
                              {item.value}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="col-12 col-xl-4">
                    <section className="dashboard-actions-grid">
                      {actionItems.map(({ label, icon: Icon, accentClass, path, isAvailable, helpText }) => {
                        const available = isAvailable(selectedAccount);

                        return (
                          <button
                            key={label}
                            type="button"
                            className="dashboard-action-card"
                            onClick={() => navigate(path)}
                            disabled={!available}
                            title={!available ? `${label} is not available for this account type.` : ""}
                          >
                            <span className={`dashboard-action-icon ${accentClass}`}>
                              <Icon size={22} />
                            </span>
                            <h2 className="dashboard-action-label">{label}</h2>
                            <p className="dashboard-action-copy">
                              {available ? helpText : `${label} unavailable for this account.`}
                            </p>
                          </button>
                        );
                      })}
                    </section>
                  </div>
                </div>

                <section className="dashboard-section">
                  <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">Overview for choosen account</h2>
                  </div>

                  <div className="row g-4">
                    {summaryItems.map(({ title, value, change, changeClass }) => (
                      <div key={title} className="col-12 col-md-6 col-xl-4">
                        <article className="dashboard-stat-card">
                          <p className="dashboard-stat-label">{title}</p>
                          <div className="dashboard-stat-row">
                            <strong className="dashboard-stat-value">{value}</strong>
                            <span className={`dashboard-stat-change ${changeClass}`}>{change}</span>
                          </div>
                        </article>
                      </div>
                    ))}
                  </div>
                </section>

                {exploreProducts.length > 0 ? (
                  <section className="dashboard-section">
                    <article className="dashboard-panel">
                      <div className="dashboard-panel-header">
                        <div>
                          <h2 className="dashboard-panel-title">Explore More Accounts</h2>
                          <p className="dashboard-panel-subtitle">
                            Add another product to match how you bank, save, or invest.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="dashboard-link-button"
                          onClick={() => navigate("/accounts")}
                        >
                          View all accounts
                        </button>
                      </div>

                      <div className="dashboard-product-grid">
                        {exploreProducts.map((product) => (
                          <article key={product.accountType} className="dashboard-product-card">
                            <div className="dashboard-product-card__top">
                              <div>
                                <h3>{product.name}</h3>
                                <p>{product.description}</p>
                              </div>
                              <span className="dashboard-product-badge">
                                {formatCurrency(product.monthlyFee)}/mo
                              </span>
                            </div>

                            <button
                              type="button"
                              className="dashboard-product-button"
                              onClick={() => navigate("/accounts")}
                            >
                              Create/Open
                            </button>
                          </article>
                        ))}
                      </div>
                    </article>
                  </section>
                ) : null}

                <section className="dashboard-section">
                  <article className="dashboard-panel">
                    <div className="dashboard-panel-header dashboard-panel-header--stack">
                      <div>
                        <h2 className="dashboard-panel-title">Recent Transactions</h2>
                        <p className="dashboard-panel-subtitle">
                          Latest activity for {accountDisplayNumber}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                  <TransactionList transactions={filteredRecentTransactions} />
                    </div>
                  </article>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

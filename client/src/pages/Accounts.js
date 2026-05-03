import { useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiPlus } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { PRODUCT_CATALOG } from "../constants/productCatalog";
import { useAccount } from "../context/AccountContext";
import {
  showConfirmationAlert,
  showErrorAlert,
  showSuccessToast,
} from "../utils/alerts";
import { formatCurrency } from "../utils/currency";

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

const ACCOUNT_TYPE_DESCRIPTIONS = Object.freeze({
  current: "Daily spending, cards, transfers, and bill payments.",
  savings: "Keeping money separate from daily spending.",
  student: "Low-cost banking for students.",
  fixed_deposit: "Locking money away for disciplined saving.",
  tax_free_savings: "Long-term saving with tax-free growth.",
  private_banking: "Premium everyday banking with higher limits.",
});

export default function Accounts({ search, setSearch, searchResults }) {
  const [isClosingAccount, setIsClosingAccount] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    accounts,
    allAccounts,
    allCards,
    allTransactions,
    selectedAccount,
    selectAccount,
    closeAccount,
    isLoading,
  } = useAccount();
  const searchValue = (search || "").trim().toLowerCase();
  const filteredAccounts = useMemo(
    () =>
      searchValue
        ? allAccounts.filter((account) => {
            const name = account?.name?.toLowerCase() || "";
            const accountNumber = account?.accountNumber?.toLowerCase() || "";
            const accountTypeValue = account?.accountType?.toLowerCase() || "";

            return (
              name.includes(searchValue) ||
              accountNumber.includes(searchValue) ||
              accountTypeValue.includes(searchValue)
            );
          })
        : allAccounts,
    [allAccounts, searchValue]
  );
  const activeAccounts = useMemo(
    () => filteredAccounts.filter((account) => account.status !== "closed" && account.isActive !== false),
    [filteredAccounts]
  );
  const visibleClosedAccounts = useMemo(
    () => filteredAccounts.filter((account) => account.status === "closed" || account.isActive === false),
    [filteredAccounts]
  );
  const ownedAccountTypes = useMemo(
    () => new Set(accounts.map((account) => account?.accountType).filter(Boolean)),
    [accounts]
  );
  const recommendedProducts = useMemo(
    () =>
      PRODUCT_CATALOG.filter(
        (product) =>
          product.productKind === "account" &&
          product.status === "available_now" &&
          !ownedAccountTypes.has(product.accountType || "")
      ).slice(0, 3),
    [ownedAccountTypes]
  );
  // 🔹 UI Consistency
  // Keep product discovery compact here so owned-account management stays primary and cross-sell stays secondary.

  useEffect(() => {
    const highlightedAccountType = location.state?.accountType;
    if (!highlightedAccountType) {
      return;
    }

    const matchingAccount = accounts.find((account) => account.accountType === highlightedAccountType);
    if (matchingAccount) {
      selectAccount(matchingAccount._id);
    }
  }, [accounts, location.state, selectAccount]);

  const handleCloseAccountRequest = async (account) => {
    const activeCards = allCards.filter(
      (card) => card.accountId === account._id && (card.status === "active" || card.isActive === true)
    );
    const pendingTransactions = allTransactions.filter(
      (transaction) => transaction.accountId === account._id && transaction.status === "pending"
    );
    const balance = Number(account?.availableBalance || 0);
    const hasBalance = balance !== 0;
    const hasPendingTransactions = pendingTransactions.length > 0;
    const hasActiveCards = activeCards.length > 0;

    const confirmation = await showConfirmationAlert({
      title: `Close ${account.name}?`,
      html: `
        <div style="text-align:left;">
          <p style="margin:0 0 14px;">This account can only be closed if the balance is R0.00 and there are no pending transactions.</p>
          <div style="display:grid;gap:10px;margin-bottom:14px;">
            <div><strong>Balance must be R0.00:</strong> ${hasBalance ? "Not met" : "Met"}</div>
            <div><strong>No pending transactions:</strong> ${hasPendingTransactions ? "Not met" : "Met"}</div>
            <div><strong>No active cards:</strong> ${hasActiveCards ? "Will be handled automatically" : "Met"}</div>
          </div>
          ${
            hasActiveCards
              ? `<p style="margin:0 0 10px;">This account has active cards. They will be blocked automatically.</p>
                 <div style="display:grid;gap:8px;">${activeCards
                   .map(
                     (card) =>
                       `<div><strong>${card.cardName || card.cardType}</strong><br/><span>${card.cardType} • ${
                         card.cardNumber || `**** **** **** ${card.last4Digits}`
                       }</span></div>`
                   )
                   .join("")}</div>`
              : ""
          }
        </div>
      `,
      confirmButtonText: "Close account",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setIsClosingAccount(true);
      // 🔹 Banking Logic
      // Closing is server-owned because the backend validates balance/pending state and freezes linked cards in one flow.
      await closeAccount(account._id);
      showSuccessToast("Account closed successfully.");
    } catch (requestError) {
      await showErrorAlert(
        "Account close failed",
        requestError.response?.data?.error || requestError.message || "Failed to close account."
      );
    } finally {
      setIsClosingAccount(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar search={search} setSearch={setSearch} searchResults={searchResults} searchPlaceholder="Search accounts..." />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--green">
                  <FiBriefcase size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Accounts</p>
                  <h1 className="action-page__title">Bank Accounts</h1>
                  <p className="action-page__copy">
                    Review the accounts you already own and explore new NexBank products from one place.
                  </p>
                </div>
              </div>

              <div className="accounts-layout">
                <section className="action-panel accounts-section">
                  <div className="action-panel__header">
                    <div>
                      <p className="action-panel__label">My Accounts</p>
                      <h2 className="action-panel__title">Your NexBank products</h2>
                      <p className="action-panel__copy">
                        Choose an owned account to make it your active account across the app.
                      </p>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="accounts-empty-state">
                      <p className="action-panel__label">Loading accounts</p>
                      <h2 className="action-panel__value">Please wait...</h2>
                      <p className="action-panel__meta">Fetching your latest balances and account details.</p>
                    </div>
                  ) : activeAccounts.length > 0 || visibleClosedAccounts.length > 0 ? (
                    <div className="accounts-owned-grid">
                      {activeAccounts.map((account) => {
                        const rules = account?.rules || {};
                        const isSelected = selectedAccount?._id === account._id;
                        const badgeLabel = [account?.accountType, account?.category]
                          .filter(Boolean)
                          .map((value) => humanizeValue(value))
                          .join(" • ");
                        const bestForDescription =
                          ACCOUNT_TYPE_DESCRIPTIONS[account?.accountType] ||
                          "Everyday banking with backend-defined rules and limits.";
                        // 🔹 Future-ready
                        // Capability labels are driven by backend rules so new account types inherit the same explanatory UI.
                        const capabilityItems = [
                          { label: "Deposits", available: true },
                          { label: "Transfers", available: rules.allowsTransfers !== false },
                          { label: "Withdrawals", available: rules.allowsWithdrawals !== false },
                          { label: "Cards", available: rules.allowsCards !== false },
                          { label: "Bill payments", available: rules.allowsBillPayments !== false },
                        ];

                        return (
                          <article
                            key={account._id}
                            className={`accounts-owned-card ${isSelected ? "accounts-owned-card--active" : ""}`}
                          >
                            <div className="accounts-owned-card__top">
                              <div>
                                <h3>{account.name}</h3>
                                <p>{account.accountNumber}</p>
                              </div>
                              {badgeLabel ? (
                                <span className="accounts-badge accounts-badge--type">{badgeLabel}</span>
                              ) : null}
                            </div>

                            <div className="accounts-owned-card__balance">
                              <span className="accounts-owned-card__label">Available balance</span>
                              <strong>{formatCurrency(account.availableBalance)}</strong>
                            </div>

                            <div className="accounts-owned-card__summary">
                              <div className="accounts-owned-card__summary-item">
                                <span>Monthly fee</span>
                                <strong>
                                  {Number(rules.monthlyFee || 0) > 0
                                    ? `${formatCurrency(Number(rules.monthlyFee || 0))} (automatically charged)`
                                    : formatCurrency(0)}
                                </strong>
                              </div>
                              <div className="accounts-owned-card__summary-item">
                                <span>Daily transfer limit</span>
                                <strong>
                                  {Number(rules.dailyTransferLimit || 0) > 0
                                    ? formatCurrency(Number(rules.dailyTransferLimit || 0))
                                    : "Not available"}
                                </strong>
                              </div>
                            </div>

                            <div className="accounts-owned-card__bestfor">
                              <span>Best for</span>
                              <p>{bestForDescription}</p>
                            </div>

                            <div className="accounts-owned-card__capabilities">
                              {capabilityItems.map((item) => (
                                <div key={item.label} className="accounts-owned-card__capability">
                                  <span>{item.label}</span>
                                  <strong className={item.available ? "is-available" : "is-unavailable"}>
                                    {item.available ? "Available" : "Unavailable"}
                                  </strong>
                                </div>
                              ))}
                            </div>

                            <div className="accounts-owned-card__actions">
                              <button
                                type="button"
                                className={`action-button ${isSelected ? "action-button--primary" : "action-button--ghost"}`}
                                onClick={() => selectAccount(account._id)}
                              >
                                {isSelected ? "Selected Account" : "Use Account"}
                              </button>
                              <button
                                type="button"
                                className="action-button action-button--danger"
                                onClick={() => handleCloseAccountRequest(account)}
                                disabled={isClosingAccount}
                              >
                                Close Account
                              </button>
                            </div>
                          </article>
                        );
                      })}

                      {visibleClosedAccounts.map((account) => {
                        const badgeLabel = [account?.accountType, account?.category]
                          .filter(Boolean)
                          .map((value) => humanizeValue(value))
                          .join(" • ");

                        return (
                          <article key={account._id} className="accounts-owned-card accounts-owned-card--closed">
                            <div className="accounts-owned-card__top">
                              <div>
                                <h3>{account.name}</h3>
                                <p>{account.accountNumber}</p>
                              </div>
                              <div className="accounts-feature-row">
                                {badgeLabel ? (
                                  <span className="accounts-badge accounts-badge--type">{badgeLabel}</span>
                                ) : null}
                                <span className="accounts-badge accounts-badge--unavailable">Closed</span>
                              </div>
                            </div>

                            <div className="accounts-owned-card__balance">
                              <span className="accounts-owned-card__label">Closed balance</span>
                              <strong>{formatCurrency(account.availableBalance)}</strong>
                            </div>

                            <p className="action-panel__meta">
                              Closed accounts stay visible for historical activity and reporting.
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="accounts-empty-state">
                      <p className="action-panel__label">No accounts yet</p>
                      <h2 className="action-panel__value">Create your first account</h2>
                      <p className="action-panel__meta">Pick one of the products below to get started.</p>
                    </div>
                  )}
                </section>

                <section className="action-panel accounts-section action-panel--form">
                  <div className="action-panel__header">
                    <div>
                      <p className="action-panel__label">Recommended for You</p>
                      <h2 className="action-panel__title">Explore more products</h2>
                      <p className="action-panel__copy">
                        Discover the next products that fit your banking setup without leaving your account view.
                      </p>
                    </div>
                  </div>

                  {recommendedProducts.length > 0 ? (
                    <div className="action-form">
                      <div className="accounts-preview-grid">
                        {recommendedProducts.map((product) => (
                          <article key={product.id} className="accounts-preview-card">
                            <div className="accounts-preview-card__top">
                              <div>
                                <h3>{product.name}</h3>
                                <p>{product.description}</p>
                              </div>
                              <span className="accounts-badge accounts-badge--fee">
                                {formatCurrency(product.monthlyFee)}/mo
                              </span>
                            </div>

                            <div className="accounts-feature-row">
                              {product.benefits.slice(0, 3).map((benefit) => (
                                <span key={benefit} className="accounts-badge accounts-badge--available">
                                  {benefit}
                                </span>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="action-form__button"
                        onClick={() => navigate("/products")}
                      >
                        <FiPlus size={16} />
                        View all products
                      </button>
                    </div>
                  ) : (
                    <div className="accounts-empty-state">
                      <p className="action-panel__label">All recommended products owned</p>
                      <h2 className="action-panel__value">You already have the main account products</h2>
                      <p className="action-panel__meta">Visit Products to explore future NexBank offers like credit, loans, and insurance.</p>
                      <button
                        type="button"
                        className="action-form__button"
                        onClick={() => navigate("/products")}
                      >
                        <FiPlus size={16} />
                        View all products
                      </button>
                    </div>
                  )}
                </section>
              </div>
            </section>
          </div>
        </main>
      </div>

    </div>
  );
}

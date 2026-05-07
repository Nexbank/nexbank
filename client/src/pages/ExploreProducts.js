import { useMemo, useState } from "react";
import { FiCompass, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { PRODUCT_CATALOG, PRODUCT_FILTERS } from "../constants/productCatalog";
import { useAccount } from "../context/AccountContext";
import { showErrorAlert, showSuccessToast } from "../utils/alerts";
import { formatCurrency } from "../utils/currency";

const STATUS_LABELS = Object.freeze({
  available_now: "Available now",
  already_owned: "Already owned",
  apply_later: "Apply later",
  coming_soon: "Coming soon",
});

const productPriority = (product) => {
  if (product.productKind === "account") {
    return 0;
  }

  if (product.productKind === "credit") {
    return 1;
  }

  if (product.productKind === "loan") {
    return 2;
  }

  return 3;
};

export default function ExploreProducts({ search, setSearch, searchResults }) {
  const navigate = useNavigate();
  const { accounts, selectedAccount, createAccount, isLoading, isCreatingAccount } = useAccount();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isSubmittingProductId, setIsSubmittingProductId] = useState("");
  const [error, setError] = useState("");

  const ownedAccountTypes = useMemo(
    () => new Set(accounts.map((account) => account?.accountType).filter(Boolean)),
    [accounts]
  );

  const visibleProducts = useMemo(() => {
    const searchValue = (search || "").trim().toLowerCase();

    return PRODUCT_CATALOG.filter((product) => {
      const matchesFilter =
        selectedFilter === "all" || product.filterCategory === selectedFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      return [
        product.name,
        product.category,
        product.description,
        ...(product.benefits || []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
    }).sort((left, right) => productPriority(left) - productPriority(right));
  }, [search, selectedFilter]);

  const selectedProduct =
    PRODUCT_CATALOG.find((product) => product.id === selectedProductId) || null;

  const resolveProductState = (product) => {
    const isOwned =
      product.productKind === "account" &&
      Boolean(product.accountType) &&
      ownedAccountTypes.has(product.accountType);
    // 🔹 UI Consistency
    // Ownership is derived from live account data so the Products page cannot drift away from actual backend state.
    const status = isOwned ? "already_owned" : product.status;

    return {
      isOwned,
      status,
    };
  };

  const resolveProductAction = (product) => {
    const { isOwned, status } = resolveProductState(product);
    // 🔹 Banking Logic
    // CTA order is explicit: owned products route to Accounts, real account products open accounts, future products stay informational.

    if (isOwned) {
      const isSelected = selectedAccount?.accountType === product.accountType;
      return {
        label: isSelected ? "Selected Account" : "Already opened",
        action: "already_owned",
        disabled: true,
        status,
      };
    }

    if (product.productKind === "account" && status === "available_now") {
      return { label: "Create Account", action: "open_account", disabled: false, status };
    }

    if (status === "coming_soon") {
      return { label: "Coming Soon", action: "coming_soon", disabled: true, status };
    }

    return { label: "View Details", action: "view_details", disabled: false, status };
  };

  const handleProductAction = async (product) => {
    const cta = resolveProductAction(product);

    if (cta.action === "open_account") {
      if (isSubmittingProductId || isCreatingAccount) {
        return;
      }

      try {
        setIsSubmittingProductId(product.id);
        setError("");
        // 🔹 Ledger Update
        // Product opening reuses the real account-creation flow instead of creating placeholder UI products.
        const result = await createAccount({ accountType: product.accountType });

        if (result.created) {
          showSuccessToast("Account created successfully.");
        }
        navigate("/accounts", { state: { accountType: product.accountType } });
      } catch (requestError) {
        const message =
          requestError.response?.data?.error ||
          requestError.message ||
          "Failed to open account.";
        setError(message);
        await showErrorAlert("Account creation failed", message);
      } finally {
        setIsSubmittingProductId("");
      }
      return;
    }

    if (cta.action === "view_details") {
      setSelectedProductId(product.id);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar
          search={search}
          setSearch={setSearch}
          searchResults={searchResults}
          searchPlaceholder="Search products..."
        />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page products-page">
              <div className="action-page__hero products-hero">
                <span className="action-page__icon action-page__icon--orange">
                  <FiCompass size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Products</p>
                  <h1 className="action-page__title">Explore Products</h1>
                  <p className="action-page__copy">
                    Open accounts, compare banking options, and discover future NexBank services.
                  </p>
                </div>
                <button
                  type="button"
                  className="action-button action-button--ghost products-hero__cta"
                  onClick={() => navigate("/accounts")}
                >
                  View My Accounts
                </button>
              </div>

              <div className="products-filter-row">
                {PRODUCT_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`products-filter-chip ${
                      selectedFilter === filter.id ? "products-filter-chip--active" : ""
                    }`}
                    onClick={() => setSelectedFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {error ? <small className="action-helper action-helper--error">{error}</small> : null}

              {isLoading ? (
                <section className="action-panel products-empty-state">
                  <p className="action-panel__label">Loading products</p>
                  <h2 className="action-panel__value">Please wait...</h2>
                  <p className="action-panel__meta">
                    Checking which products you already own and what is available next.
                  </p>
                </section>
              ) : (
                <div className="products-grid">
                  {visibleProducts.map((product) => {
                    const { status } = resolveProductState(product);
                    const cta = resolveProductAction(product);
                    const isSubmitting = isSubmittingProductId === product.id;

                    return (
                      <article key={product.id} className="products-card">
                        <div className="products-card__top">
                          <span
                            className={`accounts-badge ${
                              status === "available_now"
                                ? "accounts-badge--available"
                                : status === "already_owned"
                                  ? "accounts-badge--type"
                                  : "accounts-badge--unavailable"
                            }`}
                          >
                            {STATUS_LABELS[status]}
                          </span>
                        </div>

                        <div className="products-card__body">
                          <h2>{product.name}</h2>
                          <p>{product.description}</p>
                        </div>

                        <div className="products-card__fee">
                          <span>Monthly fee</span>
                          <strong>{formatCurrency(product.monthlyFee)}</strong>
                        </div>

                        <button
                          type="button"
                          className={`action-button ${
                            cta.disabled ? "action-button--ghost" : "action-button--primary"
                          } ${isSubmitting ? "action-button--loading" : ""} action-button--full`}
                          onClick={() => handleProductAction(product)}
                          disabled={cta.disabled || isSubmitting || isCreatingAccount}
                        >
                          {isSubmitting ? "Opening product..." : cta.label}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {selectedProduct ? (
        <div className="action-modal-backdrop" role="presentation">
          <div
            className="action-modal products-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-details-title"
          >
            <div className="action-modal__header">
              <div>
                <p className="action-panel__label">Product Details</p>
                <h2 className="action-modal__title" id="product-details-title">
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                type="button"
                className="action-modal__close"
                onClick={() => setSelectedProductId("")}
                aria-label="Close product details"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="action-form">
              <div className="products-detail-meta">
                <span className="accounts-badge accounts-badge--type">{selectedProduct.category}</span>
                <span className="accounts-badge accounts-badge--unavailable">
                  {STATUS_LABELS[resolveProductState(selectedProduct).status]}
                </span>
              </div>

              <p className="action-panel__copy">{selectedProduct.description}</p>

              <div className="action-detail-list">
                <div className="action-detail-row">
                  <span>Monthly fee</span>
                  <strong>{formatCurrency(selectedProduct.monthlyFee)}</strong>
                </div>
                <div className="action-detail-row">
                  <span>Eligibility / status</span>
                  <strong>{STATUS_LABELS[resolveProductState(selectedProduct).status]}</strong>
                </div>
              </div>

              <div className="products-detail-benefits">
                <p className="action-panel__label">Key Benefits</p>
                <div className="products-card__benefits">
                  {selectedProduct.benefits.map((benefit) => (
                    <span key={benefit} className="accounts-badge accounts-badge--available">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>

              <div className="products-detail-note">
                <p className="action-panel__label">Note</p>
                <p className="action-panel__copy">
                  {selectedProduct.productKind === "account"
                    ? "Account products can be opened now from their main product cards."
                    : "Credit, loan, and insurance products are informational for now and do not create accounts yet."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

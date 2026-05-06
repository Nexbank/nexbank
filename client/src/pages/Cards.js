import { useMemo, useState } from "react";
import { FiCreditCard, FiEye, FiLock, FiPlus, FiRefreshCcw, FiWifi } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import API from "../services/api";
import {
  showConfirmationAlert,
  showErrorAlert,
  showSuccessToast,
} from "../utils/alerts";
import { formatCurrency } from "../utils/currency";

const ACTIVE_CARD_STATUS = "active";
const FROZEN_CARD_STATUS = "frozen";
const CARD_CAPABILITIES = Object.freeze({
  physical: ["ATM", "Tap to Pay", "Online"],
  virtual: ["Online", "Subscriptions", "Safer checkout"],
});

const formatExpiry = (value) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString("en-ZA", {
    month: "2-digit",
    year: "2-digit",
  });
};

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

const resolveCardholderName = (user) => {
  const displayName = user?.displayName || user?.name || "";
  const firstName = user?.firstName || user?.firstname || user?.givenName || "";
  const lastName = user?.lastName || user?.surname || user?.familyName || "";
  const resolvedName = displayName || [firstName, lastName].filter(Boolean).join(" ");

  return resolvedName.trim().toUpperCase() || "NEXBANK CUSTOMER";
};

function PinVerificationModal({ isOpen, pin, onChange, onClose, onSubmit, isSubmitting }) {
  if (!isOpen) return null;

  return (
    <div className="cards-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cards-modal modal-dialog modal-dialog-centered"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="cards-modal-content modal-content" onSubmit={onSubmit}>
          <div className="cards-modal-header">
            <div>
              <h2 className="cards-modal-title">Verify PIN</h2>
              <p className="cards-modal-copy">Enter your PIN to reveal card details.</p>
            </div>
            <button type="button" className="cards-modal-close" onClick={onClose}>×</button>
          </div>

          <label className="cards-form-label" htmlFor="card-details-pin">PIN</label>
          <input
            id="card-details-pin"
            className="cards-form-control"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(event) => onChange(event.target.value)}
          />

          <div className="cards-form-actions">
            <button type="button" className="cards-form-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="cards-form-submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Cards({ search, setSearch, searchResults }) {
  const navigate = useNavigate();
  const {
    accounts,
    selectedAccount,
    selectedCards,
    user,
    createCard,
    getCardDetails,
    freezeCard,
    replaceCard,
    updateCard,
    selectAccount,
    isLoading,
  } = useAccount();
  const [selectedCardId, setSelectedCardId] = useState("");
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [cardBackViews, setCardBackViews] = useState({});

  const visibleCards = useMemo(() => {
    const searchValue = (search || "").trim().toLowerCase();
    const filteredCards = searchValue
      ? selectedCards.filter((card) =>
          card.cardType?.toLowerCase().includes(searchValue) ||
          card.type?.toLowerCase().includes(searchValue) ||
          card.cardNumber?.toLowerCase().includes(searchValue) ||
          card.status?.toLowerCase().includes(searchValue)
        )
      : selectedCards;

    return [...filteredCards]
      // 🔹 Banking Logic
      // Replaced cards remain in backend history, but the management view should focus on cards the customer can still act on.
      .filter((card) => card.status !== "replaced")
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }, [search, selectedCards]);
  const selectableAccounts = accounts.filter(Boolean);
  const selectedAccountRules = selectedAccount?.rules || null;
  // 🔹 Safety / Validation
  // Card creation is hidden for unsupported account types so the UI does not contradict backend rule enforcement.
  const canCreateCards = selectedAccountRules?.allowsCards !== false;
  const switchableCardAccount = useMemo(
    () =>
      selectableAccounts.find(
        (account) =>
          account._id !== selectedAccount?._id && account?.rules?.allowsCards !== false
      ) || null,
    [selectableAccounts, selectedAccount]
  );
  const accountsById = useMemo(
    () =>
      selectableAccounts.reduce((lookup, account) => {
        lookup[account._id] = account;
        return lookup;
      }, {}),
    [selectableAccounts]
  );
  const cardTiles = useMemo(
    () =>
      visibleCards.map((card) => {
        const linkedAccount = accountsById[card.accountId] || selectedAccount;
        const cardholderName = resolveCardholderName(user);

        return {
          ...card,
          linkedAccountLabel: `${linkedAccount?.name || linkedAccount?.accountType || "Account"} • ${
            linkedAccount?.accountNumber || "Unavailable"
          }`,
          linkedAccountName: linkedAccount?.name || linkedAccount?.accountType || "Account",
          linkedAccountNumber: linkedAccount?.accountNumber || "Unavailable",
          statusLabel:
            card.status === ACTIVE_CARD_STATUS
              ? "Active"
              : card.status === FROZEN_CARD_STATUS
                ? "Blocked"
                : humanizeValue(card.status),
          maskedNumber: card.cardNumber || `**** **** **** ${card.last4Digits}`,
          previewVariant: String(card.cardType || card.type).toLowerCase().includes("virtual")
            ? "virtual"
            : "physical",
          capabilityBadges:
            CARD_CAPABILITIES[
              String(card.cardType || card.type).toLowerCase().includes("virtual")
                ? "virtual"
                : "physical"
            ],
          cardholderName,
        };
      }),
    [accountsById, selectedAccount, user, visibleCards]
  );

  const selectedCard =
    cardTiles.find((card) => card._id === selectedCardId || card.id === selectedCardId) ||
    cardTiles[0] ||
    null;
  const toggleCardBackView = (cardId) => {
    setCardBackViews((current) => ({
      ...current,
      [cardId]: !current[cardId],
    }));
  };
  const visibleCardNumber =
    details?.cardNumber ||
    details?.pan ||
    details?.fullCardNumber ||
    details?.maskedPan ||
    selectedCard?.maskedNumber ||
    "•••• •••• •••• ••••";
  // 🔹 Future-ready
  // The UI can reveal more if the backend ever returns it, but masked values remain the safe default today.

  const hasVirtualCard = visibleCards.some((card) =>
    String(card.cardType || card.type).toLowerCase().includes("virtual")
  );
  const shouldShowAccountState = !isLoading && !selectedAccount;
  const accountDisplayBalance = Number(
    selectedAccount?.availableBalance ??
      selectedAccount?.balance ??
      selectedAccount?.ledgerBalance ??
      0
  );
  const accountDisplayName = selectedAccount?.name || selectedAccount?.accountType || "Selected account";
  const accountDisplayNumber = selectedAccount?.accountNumber || "Account unavailable";
  const accountDisplayType = [selectedAccount?.accountType, selectedAccount?.category]
    .filter(Boolean)
    .map((value) => humanizeValue(value))
    .join(" • ");

  const handleCreateVirtualCard = async () => {
    try {
      setIsSubmitting(true);
      setError("");
      const card = await createCard({ cardType: "Virtual Card", accountId: selectedAccount._id });
      setSelectedCardId(card?._id || "");
      setDetails(null);
      showSuccessToast("Card created successfully.");
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.message ||
        "Failed to create virtual card.";
      setError(message);
      await showErrorAlert("Card creation failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async () => {
    if (!selectedCard) {
      return;
    }

    if (user?.mustChangePin) {
      await showErrorAlert(
        "PIN change required",
        "Please change your temporary PIN before viewing card details."
      );
      navigate("/settings");
      return;
    }

    if (user?.hasPin === false) {
      await showErrorAlert("PIN required", "Please set a PIN in Settings before viewing card details.");
      navigate("/settings");
      return;
    }

    setPin("");
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    if (!isSubmitting) {
      setIsPinModalOpen(false);
      setPin("");
    }
  };

  const handleVerifyPin = async (event) => {
    event.preventDefault();

    if (!selectedCard) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      // 🔹 Banking Logic
      // Sensitive card details are fetched on demand instead of being included in the regular summary payload.
      await API.post("/auth/verify-pin", { pin });
      setDetails(await getCardDetails(selectedCard._id));
      setIsPinModalOpen(false);
      setPin("");
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.message ||
        "Failed to verify PIN.";
      setError(message);

      if (message === "No PIN set") {
        await showErrorAlert("PIN required", "Please set a PIN in Settings before viewing card details.");
        navigate("/settings");
      } else if (message === "Incorrect PIN") {
        await showErrorAlert("Incorrect PIN", "Incorrect PIN.");
      } else {
        await showErrorAlert("Unable to reveal card details", message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedCard) {
      return;
    }

    const isBlocked = selectedCard.status === FROZEN_CARD_STATUS;
    if (!isBlocked) {
      const confirmation = await showConfirmationAlert({
        title: "Block this card?",
        text: "The card will be blocked immediately and cannot be used until you unblock it.",
        confirmButtonText: "Block card",
      });

      if (!confirmation.isConfirmed) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (isBlocked) {
        // 🔹 Banking Logic
        // Unblock uses the generic update route, while block follows the dedicated freeze lifecycle path.
        await updateCard(selectedCard._id, { status: ACTIVE_CARD_STATUS });
        showSuccessToast("Card unblocked successfully.");
      } else {
        await freezeCard(selectedCard._id);
        showSuccessToast("Card blocked successfully.");
      }

      setDetails(null);
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.message ||
        "Failed to update card status.";
      setError(message);
      await showErrorAlert("Card update failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplace = async () => {
    if (!selectedCard) {
      return;
    }

    const confirmation = await showConfirmationAlert({
      title: "Replace this card?",
      text: "The current card will be deactivated and a new card will be issued for this account.",
      confirmButtonText: "Replace card",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      // 🔹 Banking Logic
      // Replacement preserves audit history by retiring the old card and issuing a linked successor record.
      const replacement = await replaceCard(selectedCard._id);
      setSelectedCardId(replacement?.newCard?._id || "");
      setDetails(null);
      showSuccessToast("Card replaced successfully.");
    } catch (requestError) {
      const message =
        requestError.response?.data?.error ||
        requestError.message ||
        "Failed to replace card.";
      setError(message);
      await showErrorAlert("Card replacement failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar search={search} setSearch={setSearch} searchResults={searchResults} searchPlaceholder="Search cards..." />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--blue">
                  <FiCreditCard size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Cards</p>
                  <h1 className="action-page__title">Manage Cards</h1>
                  <p className="action-page__copy">
                    The same selected account drives the cards shown here, and card actions apply to the
                    card number only.
                  </p>
                </div>
              </div>

              {shouldShowAccountState ? (
                <section className="dashboard-section">
                  <AccountRequiredState
                    title="No account available"
                    copy="Create or select an account before managing cards."
                  />
                </section>
              ) : (
              <div className="action-page__grid">
                  <article className="action-panel">
                    <p className="action-panel__label">Card account</p>
                    <h2 className="action-panel__value">{formatCurrency(accountDisplayBalance)}</h2>
                    <p className="action-panel__meta">
                      {accountDisplayName} • {accountDisplayNumber}
                    </p>
                    {accountDisplayType ? (
                      <div className="accounts-feature-row mt-3">
                        <span className="accounts-badge accounts-badge--type">{accountDisplayType}</span>
                      </div>
                    ) : null}
                  </article>

                  <article className="action-panel action-panel--form">
                    <div className="action-panel__header">
                      <h2 className="action-panel__title">Card Management</h2>
                      <p className="action-panel__copy">
                        Switch accounts, create a virtual card, and manage card controls from one place.
                      </p>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Selected account</span>
                        <select
                          className="action-form__input"
                          value={selectedAccount?._id || ""}
                          onChange={(event) => {
                            selectAccount(event.target.value);
                            setSelectedCardId("");
                            setDetails(null);
                            setError("");
                          }}
                        >
                          {selectableAccounts.map((account) => (
                            <option key={account._id} value={account._id}>
                              {(account.name || account.accountType || "Account")} • {account.accountNumber}
                            </option>
                          ))}
                        </select>
                      </label>

                      {error ? <small className="action-helper action-helper--error">{error}</small> : null}
                      {!canCreateCards ? (
                        <div className="accounts-empty-state">
                          <p className="action-panel__label">Cards unavailable</p>
                          <h2 className="action-panel__value">Cards are not available for this account</h2>
                          <p className="action-panel__meta">
                            Savings accounts are designed for storing money. To use cards, switch to a Current Account.
                          </p>
                          <div className="action-form__actions">
                            {switchableCardAccount ? (
                              <button
                                type="button"
                                className="action-button action-button--ghost"
                                onClick={() => {
                                  selectAccount(switchableCardAccount._id);
                                  setSelectedCardId("");
                                  setDetails(null);
                                  setError("");
                                }}
                              >
                                Switch Account
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="action-button action-button--primary"
                              onClick={() => navigate("/products")}
                            >
                              Open a Current Account
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={`action-form__button cards-create-card-button ${
                              hasVirtualCard ? "cards-create-card-button--owned" : ""
                            }`}
                            onClick={handleCreateVirtualCard}
                            disabled={isSubmitting || hasVirtualCard}
                          >
                            <FiPlus size={16} />
                            {hasVirtualCard ? "Virtual card active" : "Create virtual card"}
                          </button>

                          <div className="cards-management-grid">
                            {cardTiles.length === 0 ? (
                              <p className="action-helper">No cards found for this account.</p>
                            ) : (
                              cardTiles.map((card) => {
                                const isSelectedCard = selectedCard?._id === card._id;
                                const isBackView = Boolean(cardBackViews[card._id]);

                                return (
                                <article
                                  key={card._id}
                                  className={`cards-management-tile ${
                                    isSelectedCard ? "action-option-card--active" : ""
                                  }`}
                                >
                                  <button
                                    type="button"
                                    className="cards-management-tile__select"
                                    onClick={() => {
                                      setSelectedCardId(card._id);
                                      setDetails(null);
                                      setError("");
                                    }}
                                  >
                                  <div
                                    className={`cards-management-preview cards-management-preview--${card.previewVariant} ${
                                      isBackView ? "cards-management-preview--back" : "cards-management-preview--front"
                                    }`}
                                  >
                                    {!isBackView ? (
                                    <>
                                    <div className="cards-management-preview__top">
                                      <div className="cards-management-preview__brand">
                                        <span className="cards-management-preview__logo">NEXBANK</span>
                                        <span className="cards-management-preview__type">
                                          {card.cardType}
                                        </span>
                                      </div>
                                      <span
                                        className={`accounts-badge ${
                                          card.status === ACTIVE_CARD_STATUS
                                            ? "accounts-badge--available"
                                            : "accounts-badge--unavailable"
                                        }`}
                                      >
                                        {card.statusLabel}
                                      </span>
                                    </div>

                                    <div className="cards-management-preview__hardware">
                                      <div className="cards-management-preview__chip" aria-hidden="true">
                                        <span />
                                        <span />
                                        <span />
                                      </div>
                                      <span className="cards-management-preview__contactless" aria-hidden="true">
                                        <FiWifi size={18} />
                                      </span>
                                    </div>

                                    <div className="cards-management-preview__number">
                                      {card.maskedNumber}
                                    </div>

                                    <div className="cards-management-preview__footer">
                                      <div>
                                        <span>Cardholder</span>
                                        <strong>{card.cardholderName}</strong>
                                      </div>
                                      <div>
                                        <span>Expiry</span>
                                        <strong>{formatExpiry(card.expiryDate)}</strong>
                                      </div>
                                    </div>
                                    </>
                                    ) : (
                                      <div className="cards-management-preview__back">
                                        <div className="cards-management-preview__back-top">
                                          <span>NEXBANK</span>
                                          <strong>{card.statusLabel}</strong>
                                        </div>
                                        <div className="cards-management-preview__magstripe" aria-hidden="true" />
                                        <div className="cards-management-preview__signature-row">
                                          <div className="cards-management-preview__signature">
                                            Authorized signature
                                          </div>
                                          <div className="cards-management-preview__cvv">
                                            <span>CVV</span>
                                            <strong>{details && isSelectedCard ? details.cvv || "•••" : "•••"}</strong>
                                          </div>
                                        </div>
                                        <div className="cards-management-preview__back-meta">
                                          <span>Ending {card.last4Digits ? `•••• ${card.last4Digits}` : "••••"}</span>
                                          <span>Support +27 800 123 456</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="cards-management-tile__meta">
                                    <div className="cards-management-tile__meta-row">
                                      <span>Linked account</span>
                                      <strong>{card.linkedAccountLabel}</strong>
                                    </div>
                                    <div className="accounts-feature-row cards-management-capabilities">
                                      {card.capabilityBadges.map((capability) => (
                                        <span key={capability} className="accounts-badge accounts-badge--available">
                                          {capability}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  </button>

                                  {isSelectedCard ? (
                                    <button
                                      type="button"
                                      className="cards-management-flip-button"
                                      onClick={() => toggleCardBackView(card._id)}
                                    >
                                      {isBackView ? "View front" : "View back"}
                                    </button>
                                  ) : null}
                                </article>
                                );
                              })
                            )}
                          </div>
                          {selectedCard ? (
                            <>
                              <div className="action-detail-list">
                                <div className="action-detail-row">
                                  <span>Status</span>
                                  <strong>{selectedCard.statusLabel}</strong>
                                </div>
                                <div className="action-detail-row">
                                  <span>Card number</span>
                                  <strong>{visibleCardNumber}</strong>
                                </div>
                                <div className="action-detail-row">
                                  <span>Expiry</span>
                                  <strong>{formatExpiry(selectedCard.expiryDate)}</strong>
                                </div>
                                <div className="action-detail-row">
                                  <span>CVV</span>
                                  <strong>{details?.cvv || "•••"}</strong>
                                </div>
                              </div>

                              <div className="action-form__actions">
                                <button
                                  type="button"
                                  className="action-button action-button--ghost"
                                  onClick={handleViewDetails}
                                  disabled={isSubmitting}
                                >
                                  <FiEye size={16} />
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  className="action-button action-button--ghost"
                                  onClick={handleToggleBlock}
                                  disabled={isSubmitting}
                                >
                                  <FiLock size={16} />
                                  {selectedCard.status === FROZEN_CARD_STATUS ? "Unblock" : "Block"}
                                </button>
                                <button
                                  type="button"
                                  className="action-button action-button--primary"
                                  onClick={handleReplace}
                                  disabled={isSubmitting || selectedCard.status !== ACTIVE_CARD_STATUS}
                                >
                                  <FiRefreshCcw size={16} />
                                  Replace
                                </button>
                              </div>
                            </>
                          ) : null}
                        </>
                      )}
                    </div>
                  </article>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      <PinVerificationModal
        isOpen={isPinModalOpen}
        pin={pin}
        onChange={(value) => setPin(value.replace(/\D/g, "").slice(0, 6))}
        onClose={closePinModal}
        onSubmit={handleVerifyPin}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

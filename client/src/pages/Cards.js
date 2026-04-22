import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiClock,
  FiCreditCard,
  FiEye,
  FiGlobe,
  FiLock,
  FiRefreshCcw,
  FiShield,
  FiZap,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";

const ACTIVE_CARD_STATUS = "active";
const FROZEN_CARD_STATUS = "frozen";
const REPLACED_CARD_STATUS = "replaced";

const normalizeCardType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "virtual" || normalized === "virtual card") {
    return "virtual";
  }

  if (normalized === "physical" || normalized === "physical card") {
    return "physical";
  }

  return "";
};

const formatExpiry = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  return date.toLocaleDateString("en-ZA", {
    month: "2-digit",
    year: "2-digit",
  });
};

const resolveCardStateLabel = (card, account) => {
  if (card.status === REPLACED_CARD_STATUS) {
    return "Replaced";
  }

  if (card.status === FROZEN_CARD_STATUS) {
    return "Frozen";
  }

  if (!account?.isActive) {
    return "Blocked by Account";
  }

  return card.status === ACTIVE_CARD_STATUS ? "Active" : "Inactive";
};

const settingsConfig = [
  {
    title: "Contactless Payments",
    icon: FiZap,
    field: "contactlessEnabled",
  },
  {
    title: "Online Transactions",
    icon: FiShield,
    field: "onlinePaymentsEnabled",
  },
  {
    title: "ATM Withdrawals",
    icon: FiCreditCard,
    field: "atmWithdrawalsEnabled",
  },
];

function CardTile({ accountName, card, account, isSelected, onSelect }) {
  const normalizedType = normalizeCardType(card.cardType || card.type);
  const variant =
    normalizedType === "physical" ? "cards-card--physical" : "cards-card--virtual";
  const isBlocked =
    card.status === FROZEN_CARD_STATUS ||
    card.status === REPLACED_CARD_STATUS ||
    !account?.isActive;

  return (
    <div className="col-12 col-lg-6">
      <button
        type="button"
        className="w-100 border-0 bg-transparent p-0 text-start"
        onClick={() => onSelect(card._id)}
      >
        <article
          className={`cards-card ${variant} ${isSelected ? "action-option-card--active" : ""}`}
        >
          <div className="cards-card-top">
            <div>
              <p className="cards-card-label">{card.cardType || card.type}</p>
              <small className="action-helper">{card.cardName}</small>
            </div>

            <span
              className={`cards-card-icon ${
                isBlocked ? "cards-card-icon--locked" : "cards-card-icon--active"
              }`}
              aria-hidden="true"
            >
              <FiShield size={16} />
            </span>
          </div>

          <div className="cards-card-middle">
            <p className="cards-card-number">.... {card.last4Digits}</p>
          </div>

          <div className="cards-card-bottom">
            <div className="cards-card-meta">
              <span className="cards-card-expiry">EXP: {formatExpiry(card.expiryDate)}</span>
            </div>

            <span className="cards-card-status">{resolveCardStateLabel(card, account)}</span>
          </div>

          <div className="cards-card-footer">
            <span className="cards-chip" aria-hidden="true" />
            <span className="cards-brand">{accountName}</span>
          </div>
        </article>
      </button>
    </div>
  );
}

export default function Cards() {
  const {
    selectedAccount,
    selectedCards,
    getCardDetails,
    freezeCard,
    replaceCard,
    isLoading,
  } = useAccount();
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");

  const visibleCards = useMemo(
    () =>
      [...selectedCards].sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
      ),
    [selectedCards]
  );

  const selectedCard =
    visibleCards.find((card) => card._id === selectedCardId) || visibleCards[0] || null;

  const cardSettings = useMemo(() => {
    if (!selectedCard) {
      return [];
    }

    return settingsConfig.map((setting) => ({
      ...setting,
      enabled: Boolean(selectedCard[setting.field]),
    }));
  }, [selectedCard]);

  const handleViewDetails = async () => {
    if (!selectedCard) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const nextDetails = await getCardDetails(selectedCard._id);
      setDetails(nextDetails);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error || requestError.message || "Failed to load card details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreeze = async () => {
    if (!selectedCard) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await freezeCard(selectedCard._id);
      setDetails(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Failed to freeze card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplace = async () => {
    if (!selectedCard) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const replacement = await replaceCard(selectedCard._id);
      setSelectedCardId(replacement?.newCard?._id || "");
      setDetails(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Failed to replace card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedAccount) {
    return null;
  }

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell cards-shell">
            <section className="cards-section">
              <div className="cards-header">
                <div>
                  <h1 className="cards-title">Cards</h1>
                  <p className="action-helper">
                    Cards are stateful access tokens linked to {selectedAccount.name}. The account
                    remains the financial source of truth.
                  </p>
                </div>

                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <span className="action-state-badge action-state-badge--pending">
                    {selectedAccount.isActive ? "Account operational" : "Account inactive"}
                  </span>
                </div>
              </div>

              {isLoading ? (
                <article className="dashboard-empty-state">
                  <p className="dashboard-empty-title">Loading cards...</p>
                </article>
              ) : visibleCards.length === 0 ? (
                <article className="dashboard-empty-state">
                  <p className="dashboard-empty-title">No cards available</p>
                  <p className="dashboard-empty-copy">
                    A system-issued physical card should exist for this account.
                  </p>
                </article>
              ) : (
                <div className="row g-4">
                  {visibleCards.map((card) => (
                    <CardTile
                      key={card._id}
                      accountName={selectedAccount.name}
                      card={card}
                      account={selectedAccount}
                      isSelected={selectedCard?._id === card._id}
                      onSelect={(cardId) => {
                        setSelectedCardId(cardId);
                        setDetails(null);
                        setError("");
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="cards-section">
              <article className="cards-security-panel">
                <div className="cards-panel-header">
                  <h2 className="cards-panel-title">
                    {selectedCard ? `${selectedCard.cardType} lifecycle` : "Card lifecycle"}
                  </h2>
                </div>

                {selectedCard ? (
                  <>
                    <div className="cards-security-list">
                      {cardSettings.map(({ title, icon: Icon, enabled }) => (
                        <div key={title} className="cards-security-item">
                          <span className="cards-security-left">
                            <span className="cards-security-icon" aria-hidden="true">
                              <Icon size={16} />
                            </span>
                            <span className="cards-security-label">{title}</span>
                          </span>

                          <span
                            className={`cards-toggle${enabled ? " cards-toggle--on" : ""}`}
                            aria-hidden="true"
                          >
                            <span className="cards-toggle-thumb" />
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="cards-security-note">
                      <FiGlobe size={15} />
                      {selectedAccount.isActive
                        ? "Account status and card status are enforced separately. A frozen or replaced card cannot authorize new transactions."
                        : "This account is inactive, so card usage is blocked even if the card itself is still active."}
                    </div>

                    <div className="action-checklist mt-3">
                      <div className="action-checklist__item">
                        <FiCreditCard size={16} />
                        <span>Linked account: {selectedAccount.accountNumber}</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiLock size={16} />
                        <span>Status: {resolveCardStateLabel(selectedCard, selectedAccount)}</span>
                      </div>
                      <div className="action-checklist__item">
                        <FiClock size={16} />
                        <span>
                          Replacement rotates card identity and keeps historical transactions on the
                          old card record.
                        </span>
                      </div>
                    </div>

                    {error ? (
                      <div className="mt-3">
                        <small className="action-helper action-helper--error">{error}</small>
                      </div>
                    ) : null}

                    <div className="action-form__actions mt-3">
                      <button
                        type="button"
                        className="action-button action-button--ghost"
                        onClick={handleViewDetails}
                        disabled={isSubmitting}
                      >
                        <FiEye size={16} />
                        {details ? "Refresh Details" : "View Details"}
                      </button>
                      <button
                        type="button"
                        className="action-button action-button--ghost"
                        onClick={handleFreeze}
                        disabled={
                          isSubmitting ||
                          selectedCard.status === FROZEN_CARD_STATUS ||
                          selectedCard.status === REPLACED_CARD_STATUS
                        }
                      >
                        <FiLock size={16} />
                        Freeze Card
                      </button>
                      <button
                        type="button"
                        className="action-button action-button--primary"
                        onClick={handleReplace}
                        disabled={isSubmitting || selectedCard.status === REPLACED_CARD_STATUS}
                      >
                        <FiRefreshCcw size={16} />
                        Replace Card
                      </button>
                    </div>

                    {details ? (
                      <section className="action-panel action-panel--summary mt-4">
                        <div className="action-review-card action-review-card--green">
                          <div className="action-review-card__head">
                            <span className="action-summary__icon">
                              <FiEye size={18} />
                            </span>
                            <div>
                              <p className="action-summary__label">On-demand card details</p>
                              <strong className="action-review-card__title">{details.cardName}</strong>
                            </div>
                          </div>
                          <div className="action-review-card__meta">
                            <span>Card type</span>
                            <strong>{details.cardType}</strong>
                          </div>
                          <div className="action-review-card__meta">
                            <span>Masked PAN</span>
                            <strong>{details.maskedPan}</strong>
                          </div>
                          <div className="action-review-card__meta">
                            <span>CVV</span>
                            <strong>{details.cvv}</strong>
                          </div>
                          <div className="action-review-card__meta">
                            <span>Expiry</span>
                            <strong>{formatExpiry(details.expiryDate)}</strong>
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </>
                ) : (
                  <article className="dashboard-empty-state">
                    <span className="dashboard-empty-icon" aria-hidden="true">
                      <FiAlertTriangle size={38} />
                    </span>
                    <p className="dashboard-empty-title">Select a card</p>
                    <p className="dashboard-empty-copy">
                      Choose a card to inspect its status and lifecycle actions.
                    </p>
                  </article>
                )}
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

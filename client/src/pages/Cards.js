import { useMemo, useState } from "react";
import {
  FiCreditCard,
  FiGlobe,
  FiLock,
  FiPlus,
  FiShield,
  FiX,
  FiZap,
} from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";

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

const defaultSettings = [
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

const cardTypeOptions = ["Virtual Card", "Physical Card"];

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

function CardTile({ accountName, card, isSelected, onSelect }) {
  const normalizedType = normalizeCardType(card.cardType || card.type);
  const variant =
    normalizedType === "physical" ? "cards-card--physical" : "cards-card--virtual";
  const iconClass =
    card.isLocked || !card.isActive ? "cards-card-icon--locked" : "cards-card-icon--active";
  const statusLabel = card.isLocked ? "Locked" : card.isActive ? "Active" : "Inactive";

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
            </div>

            <span className={`cards-card-icon ${iconClass}`} aria-hidden="true">
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

            <span className="cards-card-status">{statusLabel}</span>
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
  const { accounts, cards, createCard, selectedAccountId, isLoading } = useAccount();
  const [selectedCardId, setSelectedCardId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    cardType: "Virtual Card",
  });

  const activeAccount = useMemo(
    () => accounts.find((account) => account._id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const { virtualCard, physicalCard, visibleCards } = useMemo(() => {
    const sortedCards = [...cards].sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
    );

    return {
      virtualCard: sortedCards.find(
        (card) => normalizeCardType(card.cardType || card.type) === "virtual"
      ) || null,
      physicalCard: sortedCards.find(
        (card) => normalizeCardType(card.cardType || card.type) === "physical"
      ) || null,
      visibleCards: sortedCards,
    };
  }, [cards]);

  const canCreateVirtual = !virtualCard;
  const canCreatePhysical = !physicalCard;
  const selectedCard =
    [virtualCard, physicalCard].find((card) => card?._id === selectedCardId) ||
    virtualCard ||
    physicalCard ||
    null;

  const cardSettings = useMemo(() => {
    if (!selectedCard) {
      return [];
    }

    return defaultSettings.map((setting) => ({
      ...setting,
      enabled: Boolean(selectedCard[setting.field]),
    }));
  }, [selectedCard]);

  const openCreateModal = () => {
    setFormData({
      cardType: canCreateVirtual ? "Virtual Card" : "Physical Card",
    });
    setError("");
    setIsCreateOpen(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateCard = async (event) => {
    event.preventDefault();

    if (!activeAccount) {
      setError("Choose an account first.");
      return;
    }

    if (
      (formData.cardType === "Virtual Card" && !canCreateVirtual) ||
      (formData.cardType === "Physical Card" && !canCreatePhysical)
    ) {
      setError("This account already has that card type.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const createdCard = await createCard({
        accountId: activeAccount._id,
        cardType: formData.cardType,
      });
      setSelectedCardId(createdCard._id);
      setIsCreateOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to create card.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    {activeAccount
                      ? `Showing cards linked to ${activeAccount.name}.`
                      : "Choose an account before managing cards."}
                  </p>
                </div>

                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <span className="action-state-badge action-state-badge--pending">
                    {activeAccount
                      ? `Active account: ${activeAccount.accountType}`
                      : "No active account"}
                  </span>
                  <button
                    type="button"
                    className="cards-add-button"
                    onClick={openCreateModal}
                    disabled={!activeAccount || (!canCreateVirtual && !canCreatePhysical)}
                  >
                    <FiPlus size={18} />
                    {canCreateVirtual || canCreatePhysical ? "Add Card" : "Card Limit Reached"}
                  </button>
                </div>
              </div>

              {!activeAccount ? (
                <AccountRequiredState
                  title="Select an account to manage cards"
                  copy="Cards are account-scoped. Choose an account before viewing or creating cards."
                />
              ) : isLoading ? (
                <article className="dashboard-empty-state">
                  <p className="dashboard-empty-title">Loading cards...</p>
                </article>
              ) : !virtualCard && !physicalCard ? (
                <article className="dashboard-empty-state">
                  <p className="dashboard-empty-title">No cards for this account</p>
                  <p className="dashboard-empty-copy">
                    Create a card for this account or switch accounts first.
                  </p>
                  <button
                    type="button"
                    className="cards-add-button mt-3"
                    onClick={openCreateModal}
                  >
                    <FiPlus size={18} />
                    Create First Card
                  </button>
                </article>
              ) : (
                <div className="row g-4">
                  {virtualCard ? (
                    <CardTile
                      accountName={activeAccount.name}
                      card={virtualCard}
                      isSelected={selectedCard?._id === virtualCard._id}
                      onSelect={setSelectedCardId}
                    />
                  ) : null}
                  {physicalCard ? (
                    <CardTile
                      accountName={activeAccount.name}
                      card={physicalCard}
                      isSelected={selectedCard?._id === physicalCard._id}
                      onSelect={setSelectedCardId}
                    />
                  ) : null}
                </div>
              )}
            </section>

            <section className="cards-section">
              <article className="cards-security-panel">
                <div className="cards-panel-header">
                  <h2 className="cards-panel-title">
                    {selectedCard ? `${selectedCard.cardType} controls` : "Card Security"}
                  </h2>
                </div>

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
                  {selectedCard && activeAccount
                    ? `This card is linked to ${activeAccount.name}. Locked cards remain visible but unusable.`
                    : "Select an account card to inspect its controls."}
                </div>

                {selectedCard && activeAccount ? (
                  <div className="action-checklist mt-3">
                    <div className="action-checklist__item">
                      <FiCreditCard size={16} />
                      <span>Linked account: {activeAccount.accountNumber}</span>
                    </div>
                    <div className="action-checklist__item">
                      <FiLock size={16} />
                      <span>
                        Status:{" "}
                        {selectedCard.isLocked
                          ? "Locked"
                          : selectedCard.isActive
                            ? "Active"
                            : "Inactive"}
                      </span>
                    </div>
                    <div className="action-checklist__item">
                      <FiZap size={16} />
                      <span>
                        {visibleCards.filter(
                          (card) =>
                            normalizeCardType(card.cardType || card.type) ===
                            normalizeCardType(selectedCard.cardType || selectedCard.type)
                        ).length > 1
                          ? "Older duplicate cards of this type are hidden from the UI."
                          : "This account is showing the latest card for this type."}
                      </span>
                    </div>
                  </div>
                ) : null}
              </article>
            </section>
          </div>
        </main>
      </div>

      {isCreateOpen ? (
        <div
          className="cards-modal-backdrop"
          role="presentation"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="cards-modal modal-dialog modal-dialog-centered"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-card-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cards-modal-content modal-content">
              <div className="cards-modal-header">
                <div>
                  <h2 id="create-card-title" className="cards-modal-title">
                    Create a new card
                  </h2>
                  <p className="cards-modal-copy">
                    The new card will be linked to the active account. Switch accounts first if
                    you want to create a card elsewhere.
                  </p>
                </div>

                <button
                  type="button"
                  className="cards-modal-close"
                  aria-label="Close card creation form"
                  onClick={() => setIsCreateOpen(false)}
                >
                  <FiX size={18} />
                </button>
              </div>

              <form className="cards-form row g-3" onSubmit={handleCreateCard}>
                <div className="col-12">
                  <label className="cards-form-label" htmlFor="card-type">
                    Card type
                  </label>
                  <select
                    id="card-type"
                    name="cardType"
                    className="form-select cards-form-control"
                    value={formData.cardType}
                    onChange={handleInputChange}
                  >
                    {cardTypeOptions.map((option) => {
                      const isDisabled =
                        (option === "Virtual Card" && !canCreateVirtual) ||
                        (option === "Physical Card" && !canCreatePhysical);

                      return (
                        <option key={option} value={option} disabled={isDisabled}>
                          {isDisabled ? `${option} (Already exists)` : option}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {error ? (
                  <div className="col-12">
                    <small className="action-helper action-helper--error">{error}</small>
                  </div>
                ) : null}

                <div className="col-12 cards-form-actions">
                  <button
                    type="button"
                    className="cards-form-cancel"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cards-form-submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Card"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

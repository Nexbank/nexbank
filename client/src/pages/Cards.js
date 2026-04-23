import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCreditCard, FiEye, FiLock, FiPlus, FiRefreshCcw } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import API from "../services/api";
import { formatCurrency } from "../utils/currency";

const ACTIVE_CARD_STATUS = "active";
const FROZEN_CARD_STATUS = "frozen";

const formatExpiry = (value) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString("en-ZA", {
    month: "2-digit",
    year: "2-digit",
  });
};

const normalizeCard = (card = {}) => ({
  ...card,
  _id: card._id || card.id,
  id: card.id || card._id,
  status: String(card.status || "active").toLowerCase(),
});

export default function Cards() {
  const { accounts, selectedAccount, isLoading, selectAccount, refreshOverview } = useAccount();
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const loadCards = useCallback(async (accountId) => {
    try {
      setIsPageLoading(true);
      setError("");
      const response = await API.get("/banking/cards", {
        params: { accountId },
      });

      setCards((response.data.cards || []).map(normalizeCard));
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Failed to load cards.");
      setCards([]);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedAccount?._id) {
      setCards([]);
      setSelectedCardId("");
      setDetails(null);
      setError("");
      return;
    }

    loadCards(selectedAccount._id);
  }, [loadCards, selectedAccount?._id]);

  const visibleCards = useMemo(
    () =>
      [...cards]
        .filter((card) => card.status !== "replaced")
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [cards]
  );

  const selectedCard =
    visibleCards.find((card) => card._id === selectedCardId || card.id === selectedCardId) ||
    visibleCards[0] ||
    null;

  const hasVirtualCard = visibleCards.some((card) =>
    String(card.cardType || card.type).toLowerCase().includes("virtual")
  );

  const syncCardsAndOverview = async () => {
    if (!selectedAccount?._id) {
      return;
    }

    await Promise.all([
      loadCards(selectedAccount._id),
      refreshOverview(selectedAccount._id).catch(() => {}),
    ]);
  };

  const handleCreateVirtualCard = async () => {
    if (!selectedAccount) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const response = await API.post("/banking/cards", {
        cardType: "Virtual Card",
        accountId: selectedAccount._id,
      });

      await syncCardsAndOverview();
      setSelectedCardId(response.data.card?._id || "");
      setDetails(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Failed to create virtual card.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async () => {
    if (!selectedCard) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const response = await API.get(`/banking/cards/${selectedCard._id}/details`);
      setDetails(response.data.details);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Failed to load card details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedCard) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (selectedCard.status === FROZEN_CARD_STATUS) {
        await API.patch(`/banking/cards/${selectedCard._id}`, { status: ACTIVE_CARD_STATUS });
      } else {
        await API.post(`/banking/cards/${selectedCard._id}/freeze`);
      }

      await syncCardsAndOverview();
      setDetails(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Failed to update card status.");
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
      const response = await API.post(`/banking/cards/${selectedCard._id}/replace`);
      await syncCardsAndOverview();
      setSelectedCardId(response.data.replacement?.newCard?._id || "");
      setDetails(null);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message || "Failed to replace card.");
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

              {isLoading || isPageLoading ? (
                <article className="action-panel">
                  <p className="action-helper">Loading cards...</p>
                </article>
              ) : !selectedAccount ? (
                <AccountRequiredState />
              ) : (
                <div className="action-page__grid">
                  <article className="action-panel">
                    <p className="action-panel__label">Available balance</p>
                    <h2 className="action-panel__value">{formatCurrency(selectedAccount.availableBalance)}</h2>
                    <p className="action-panel__meta">
                      Account: {selectedAccount.accountNumber}
                    </p>
                  </article>

                  <article className="action-panel action-panel--form">
                    <div className="action-panel__header">
                      <h2 className="action-panel__title">Card Details</h2>
                      <p className="action-panel__copy">
                        Switch accounts, create a virtual card, and manage the selected card from one place.
                      </p>
                    </div>

                    <div className="action-form">
                      <label className="action-form__field">
                        <span>Selected account</span>
                        <select
                          className="action-form__input"
                          value={selectedAccount._id}
                          onChange={(event) => {
                            selectAccount(event.target.value);
                            setSelectedCardId("");
                            setDetails(null);
                            setError("");
                          }}
                        >
                          {accounts.map((account) => (
                            <option key={account._id} value={account._id}>
                              {account.name} • {account.accountNumber}
                            </option>
                          ))}
                        </select>
                      </label>

                      {error ? <small className="action-helper action-helper--error">{error}</small> : null}

                      <button
                        type="button"
                        className="action-form__button"
                        onClick={handleCreateVirtualCard}
                        disabled={isSubmitting || hasVirtualCard}
                      >
                        <FiPlus size={16} />
                        {hasVirtualCard ? "Virtual Card Already Exists" : "Create Virtual Card"}
                      </button>

                      <div className="action-option-grid">
                        {visibleCards.length === 0 ? (
                          <p className="action-helper">No cards found for this account.</p>
                        ) : (
                          visibleCards.map((card) => (
                            <button
                              key={card._id}
                              type="button"
                              className={`action-option-card ${
                                selectedCard?._id === card._id ? "action-option-card--active" : ""
                              }`}
                              onClick={() => {
                                setSelectedCardId(card._id);
                                setDetails(null);
                                setError("");
                              }}
                            >
                              <div className="action-option-card__top">
                                <h3>{card.cardType}</h3>
                                <span>{card.status === ACTIVE_CARD_STATUS ? "Active" : "Blocked"}</span>
                              </div>
                              <p>{card.cardNumber}</p>
                              <small className="action-helper">Expiry {formatExpiry(card.expiryDate)}</small>
                            </button>
                          ))
                        )}
                      </div>

                      {selectedCard ? (
                        <>
                          <div className="action-detail-list">
                            <div className="action-detail-row">
                              <span>Status</span>
                              <strong>{selectedCard.status === ACTIVE_CARD_STATUS ? "Active" : "Blocked"}</strong>
                            </div>
                            <div className="action-detail-row">
                              <span>Card number</span>
                              <strong>{selectedCard.cardNumber}</strong>
                            </div>
                            <div className="action-detail-row">
                              <span>Expiry</span>
                              <strong>{formatExpiry(selectedCard.expiryDate)}</strong>
                            </div>
                            {details ? (
                              <>
                                <div className="action-detail-row">
                                  <span>Masked number</span>
                                  <strong>{details.maskedPan}</strong>
                                </div>
                                <div className="action-detail-row">
                                  <span>CVV</span>
                                  <strong>{details.cvv}</strong>
                                </div>
                              </>
                            ) : null}
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
                    </div>
                  </article>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

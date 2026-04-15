import { useState } from "react";
import {
  FiPlus,
  FiShield,
  FiZap,
  FiGlobe,
  FiMinusSquare,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const initialCards = [
  {
    type: "Virtual Card",
    lastDigits: "4582",
    expiry: "08/27",
    status: "Active",
    variant: "cards-card--virtual",
    iconClass: "cards-card-icon--active",
  },
  {
    type: "Physical Card",
    lastDigits: "1290",
    expiry: "12/25",
    status: "Locked",
    variant: "cards-card--physical",
    iconClass: "cards-card-icon--locked",
  },
];

const securitySettings = [
  {
    title: "Contactless Payments",
    icon: FiZap,
    enabled: true,
  },
  {
    title: "Online Transactions",
    icon: FiShield,
    enabled: true,
  },
  {
    title: "ATM Withdrawals",
    icon: FiMinusSquare,
    enabled: false,
  },
];

export default function Cards() {
  const [cards, setCards] = useState(initialCards);
  const [settings, setSettings] = useState(securitySettings);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    type: "Virtual Card",
    lastDigits: "",
    expiry: "",
    status: "Active",
  });

  const toggleSetting = (title) => {
    setSettings((current) =>
      current.map((item) =>
        item.title === title ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewCard((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddCard = (event) => {
    event.preventDefault();

    const cleanDigits = newCard.lastDigits.replace(/\D/g, "").slice(-4);
    const cleanExpiry = newCard.expiry.trim();

    if (cleanDigits.length !== 4 || !/^\d{2}\/\d{2}$/.test(cleanExpiry)) {
      return;
    }

    const isVirtual = newCard.type === "Virtual Card";

    setCards((current) => [
      {
        type: newCard.type,
        lastDigits: cleanDigits,
        expiry: cleanExpiry,
        status: newCard.status,
        variant: isVirtual ? "cards-card--virtual" : "cards-card--physical",
        iconClass: newCard.status === "Locked"
          ? "cards-card-icon--locked"
          : "cards-card-icon--active",
      },
      ...current,
    ]);

    setNewCard({
      type: "Virtual Card",
      lastDigits: "",
      expiry: "",
      status: "Active",
    });
    setIsAddCardOpen(false);
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
                <h1 className="cards-title">My Cards</h1>

                <button
                  type="button"
                  className="cards-add-button"
                  onClick={() => setIsAddCardOpen(true)}
                >
                  <FiPlus size={18} />
                  Add New Card
                </button>
              </div>

              <div className="row g-4">
                {cards.map(({ type, lastDigits, expiry, status, variant, iconClass }) => (
                  <div key={type} className="col-12 col-lg-6">
                    <article className={`cards-card ${variant}`}>
                      <div className="cards-card-top">
                        <div>
                          <p className="cards-card-label">{type}</p>
                        </div>

                        <span className={`cards-card-icon ${iconClass}`} aria-hidden="true">
                          <FiShield size={16} />
                        </span>
                      </div>

                      <div className="cards-card-middle">
                        <p className="cards-card-number">•••• {lastDigits}</p>
                      </div>

                      <div className="cards-card-bottom">
                        <div className="cards-card-meta">
                          <span className="cards-card-expiry">EXP: {expiry}</span>
                        </div>

                        <span className="cards-card-status">{status}</span>
                      </div>

                      <div className="cards-card-footer">
                        <span className="cards-chip" aria-hidden="true" />
                        <span className="cards-brand">NexBank</span>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </section>

            <section className="cards-section">
              <article className="cards-security-panel">
                <div className="cards-panel-header">
                  <h2 className="cards-panel-title">Card Security</h2>
                </div>

                <div className="cards-security-list">
                  {settings.map(({ title, icon: Icon, enabled }) => (
                    <button
                      key={title}
                      type="button"
                      className="cards-security-item"
                      onClick={() => toggleSetting(title)}
                    >
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
                    </button>
                  ))}
                </div>

                <div className="cards-security-note">
                  <FiGlobe size={15} />
                  Manage how your cards work across online, contactless, and ATM usage.
                </div>
              </article>
            </section>
          </div>
        </main>
      </div>

      {isAddCardOpen && (
        <div className="cards-modal-backdrop" role="presentation" onClick={() => setIsAddCardOpen(false)}>
          <div
            className="cards-modal modal-dialog modal-dialog-centered"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-card-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cards-modal-content modal-content">
              <div className="cards-modal-header">
                <div>
                  <h2 id="add-card-title" className="cards-modal-title">
                    Add New Card
                  </h2>
                  <p className="cards-modal-copy">
                    Create a new card layout entry for this interface.
                  </p>
                </div>

                <button
                  type="button"
                  className="cards-modal-close"
                  aria-label="Close add card form"
                  onClick={() => setIsAddCardOpen(false)}
                >
                  ×
                </button>
              </div>

              <form className="cards-form row g-3" onSubmit={handleAddCard}>
                <div className="col-12 col-md-6">
                  <label className="cards-form-label" htmlFor="card-type">
                    Card Type
                  </label>
                  <select
                    id="card-type"
                    name="type"
                    className="form-select cards-form-control"
                    value={newCard.type}
                    onChange={handleInputChange}
                  >
                    <option>Virtual Card</option>
                    <option>Physical Card</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="cards-form-label" htmlFor="card-status">
                    Status
                  </label>
                  <select
                    id="card-status"
                    name="status"
                    className="form-select cards-form-control"
                    value={newCard.status}
                    onChange={handleInputChange}
                  >
                    <option>Active</option>
                    <option>Locked</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="cards-form-label" htmlFor="card-digits">
                    Last 4 Digits
                  </label>
                  <input
                    id="card-digits"
                    name="lastDigits"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4582"
                    className="form-control cards-form-control"
                    value={newCard.lastDigits}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="cards-form-label" htmlFor="card-expiry">
                    Expiry
                  </label>
                  <input
                    id="card-expiry"
                    name="expiry"
                    type="text"
                    placeholder="08/27"
                    className="form-control cards-form-control"
                    value={newCard.expiry}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-12 cards-form-actions">
                  <button
                    type="button"
                    className="cards-form-cancel"
                    onClick={() => setIsAddCardOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="cards-form-submit">
                    Add Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { FiRepeat } from "react-icons/fi";
import AccountRequiredState from "../components/AccountRequiredState";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAccount } from "../context/AccountContext";
import { formatCurrency } from "../utils/currency";

const transferOptions = [
  { id: "internal", label: "Nexbank transfer", bankName: "Nexbank" },
  { id: "external", label: "Other bank", bankName: "" },
  { id: "voucher", label: "Cash send", bankName: "Nexbank" },
];

const generateCode = () => String(Math.floor(1000 + Math.random() * 9000));

export default function Transfer() {
  const { accounts, selectedAccount, transferFunds, isLoading } = useAccount();
  const [form, setForm] = useState({
    route: "internal",
    amount: "",
    destination: "",
    recipientAccountId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const selectedRoute = useMemo(
    () => transferOptions.find((option) => option.id === form.route) || transferOptions[0],
    [form.route]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === "route") {
        return {
          ...current,
          route: value,
          destination: "",
          recipientAccountId: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedAccount) {
      setMessage("Choose an account before sending a transfer.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setMessage("Enter a valid transfer amount.");
      return;
    }

    if (form.route === "internal" && !form.recipientAccountId) {
      setMessage("Choose the destination account.");
      return;
    }

    if (form.route !== "internal" && !form.destination.trim()) {
      setMessage(
        form.route === "voucher"
          ? "Enter the destination cellphone number."
          : "Enter the destination details."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      await transferFunds({
        accountId: selectedAccount._id,
        amount: Number(form.amount),
        route: form.route,
        recipientAccountId: form.route === "internal" ? form.recipientAccountId : "",
        bankName: selectedRoute.bankName || "Other bank",
        beneficiaryName:
          form.route === "internal"
            ? accounts.find((account) => account._id === form.recipientAccountId)?.name || ""
            : form.destination,
        accountNumber:
          form.route === "internal"
            ? accounts.find((account) => account._id === form.recipientAccountId)?.accountNumber || ""
            : form.route === "voucher"
              ? ""
              : form.destination,
        accountType: "Cheque",
        cellphone: form.route === "voucher" ? form.destination : "",
        reference: form.destination || "Transfer",
        note: "",
        code: form.route === "voucher" ? generateCode() : "",
      });

      setMessage("Transfer submitted successfully.");
      setForm((current) => ({
        ...current,
        amount: "",
        destination: "",
        recipientAccountId: "",
      }));
    } catch (error) {
      setMessage(
        error.response?.data?.error || error.message || "Transfer failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <Sidebar />

        <div className="dashboard-main-panel">
          <Navbar />

          <main className="dashboard-content-area">
            <div className="container-fluid px-0 dashboard-shell">
              <article className="action-panel">
                <p className="action-helper">Loading account details...</p>
              </article>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="dashboard-page">
        <Sidebar />

        <div className="dashboard-main-panel">
          <Navbar />

          <main className="dashboard-content-area">
            <div className="container-fluid px-0 dashboard-shell">
              <AccountRequiredState copy="Choose an account before sending a transfer." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--orange">
                  <FiRepeat size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Transfer</h1>
                  <p className="action-page__copy">
                    Enter the transfer amount and destination. The backend confirms the rest.
                  </p>
                </div>
              </div>

              <div className="action-page__grid">
                <article className="action-panel">
                  <p className="action-panel__label">Available balance</p>
                  <h2 className="action-panel__value">
                    {formatCurrency(selectedAccount.availableBalance)}
                  </h2>
                  <p className="action-panel__meta">
                    Account: {selectedAccount.accountNumber}
                  </p>
                </article>

                <article className="action-panel action-panel--form">
                  <div className="action-panel__header">
                    <h2 className="action-panel__title">Transfer Details</h2>
                  
                  </div>

                  <form className="action-form" onSubmit={handleSubmit}>
                    <label className="action-form__field">
                      <span>Transfer type</span>
                      <select
                        className="action-form__input"
                        name="route"
                        value={form.route}
                        onChange={handleChange}
                      >
                        {transferOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="action-form__field">
                      <span>Amount</span>
                      <input
                        className="action-form__input"
                        type="number"
                        min="0.01"
                        step="0.01"
                        name="amount"
                        value={form.amount}
                        onChange={handleChange}
                        placeholder="Enter amount"
                      />
                    </label>

                    {form.route === "internal" ? (
                      <label className="action-form__field">
                        <span>Destination account</span>
                        <select
                          className="action-form__input"
                          name="recipientAccountId"
                          value={form.recipientAccountId}
                          onChange={handleChange}
                        >
                          <option value="">Choose destination account</option>
                          {accounts
                            .filter((account) => account._id !== selectedAccount._id)
                            .map((account) => (
                              <option key={account._id} value={account._id}>
                                {account.name} • {account.accountNumber}
                              </option>
                            ))}
                        </select>
                      </label>
                    ) : (
                      <label className="action-form__field">
                        <span>{form.route === "voucher" ? "Destination number" : "Destination"}</span>
                        <input
                          className="action-form__input"
                          type="text"
                          name="destination"
                          value={form.destination}
                          onChange={handleChange}
                          placeholder={
                            form.route === "voucher"
                              ? "Enter cellphone number"
                              : "Enter account number or recipient"
                          }
                        />
                      </label>
                    )}

                    {message ? <p className="action-helper">{message}</p> : null}

                    <button className="action-form__button" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting transfer..." : "Send Transfer"}
                    </button>
                  </form>
                </article>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

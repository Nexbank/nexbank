import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API from "../services/api";
import { formatCurrency } from "../utils/banking";

// Bill payment categories with their specific fields
const billCategories = [
  { 
    value: "Electricity (Prepaid/Postpaid)", 
    label: "Electricity (Prepaid/Postpaid)",
    fields: [
      { name: "meterNumber", label: "Meter Number", type: "text", placeholder: "Enter meter number", required: true }
    ]
  },
  { 
    value: "Water & Municipality", 
    label: "Water & Municipality",
    fields: [
      { name: "accountNumber", label: "Account Number", type: "text", placeholder: "Enter water account number", required: true }
    ]
  },
  { 
    value: "Airtime & Data", 
    label: "Airtime & Data",
    fields: [
      { name: "phoneNumber", label: "Phone Number", type: "tel", placeholder: "Enter phone number (e.g. 0712345678)", required: true },
      { name: "networkProvider", label: "Network Provider", type: "select", placeholder: "Select network provider", required: true, 
        options: ["MTN", "Vodacom", "Cell C", "Telkom", "Rain"] }
    ]
  },
  { 
    value: "Lotto", 
    label: "Lotto",
    fields: [
      { name: "lottoNumber", label: "Lotto Number", type: "text", placeholder: "Enter your lotto number", required: true }
    ]
  },
  { 
    value: "DSTV", 
    label: "DSTV",
    fields: [
      { name: "smartCardNumber", label: "Smart Card Number", type: "text", placeholder: "Enter DSTV smart card number", required: true },
      { name: "packageType", label: "Package Type", type: "select", placeholder: "Select package", required: true,
        options: ["EasyView", "Family", "Compact", "Compact Plus", "Premium", "Access"] }
    ]
  }
];

// Transaction fee
const TRANSACTION_FEE = 2;

export default function PayBills() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({ account: { balance: 0, accountNumber: "" } });
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [form, setForm] = useState({
    amount: "",
    category: billCategories[0].value,
    billerName: "",
    reference: "",
    status: "Completed",
    dynamicFields: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch (error) {
      return {};
    }
  }, []);

  // Get current category configuration
  const currentCategory = billCategories.find(cat => cat.value === form.category) || billCategories[0];
  
  // Get dynamic fields for current category
  const dynamicFields = currentCategory.fields || [];

  useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch accounts first
      try {
        const accountsResponse = await API.get("/banking/accounts");
        if (accountsResponse.data.accounts && accountsResponse.data.accounts.length > 0) {
          setAccounts(accountsResponse.data.accounts);
          setSelectedAccountId(accountsResponse.data.accounts[0]._id);
        }
      } catch (err) {
        console.log("Accounts endpoint not available yet");
      }
      
      // Fetch overview
      const overviewResponse = await API.get("/banking/overview");
      setOverview(overviewResponse.data);
      
      // If no accounts from accounts endpoint, use the one from overview
      if (accounts.length === 0 && overviewResponse.data.account) {
        setAccounts([overviewResponse.data.account]);
        setSelectedAccountId(overviewResponse.data.account._id);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  fetchData();
}, [navigate, accounts.length]); // Add accounts.length here

  const handleChange = (event) => {
    const { name, value } = event.target;
    
    if (name === "category") {
      // Reset dynamic fields when category changes
      setForm((current) => ({
        ...current,
        category: value,
        dynamicFields: {},
        billerName: ""
      }));
    } else {
      setForm((current) => ({
        ...current,
        [name]: value,
      }));
    }
  };

  const handleDynamicFieldChange = (fieldName, value) => {
    setForm((current) => ({
      ...current,
      dynamicFields: {
        ...current.dynamicFields,
        [fieldName]: value
      }
    }));
  };

  const validateDynamicFields = () => {
    for (const field of dynamicFields) {
      if (field.required && !form.dynamicFields[field.name]) {
        alert(`Please enter ${field.label}`);
        return false;
      }
    }
    return true;
  };

  // Auto-populate biller name based on category
  const getBillerNameFromCategory = (category) => {
    switch(category) {
      case "Electricity (Prepaid/Postpaid)":
        return "Eskom / Municipality";
      case "Water & Municipality":
        return "Municipality";
      case "Airtime & Data":
        return "Mobile Network Provider";
      case "Lotto":
        return "National Lottery";
      case "DSTV":
        return "MultiChoice DSTV";
      default:
        return "";
    }
  };

  // Get selected account balance
  const getSelectedAccountBalance = () => {
    const selectedAccount = accounts.find(acc => acc._id === selectedAccountId);
    return selectedAccount ? selectedAccount.balance : overview.account.balance;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid bill amount.");
      return;
    }

    const finalBillerName = form.billerName.trim() || getBillerNameFromCategory(form.category);

    if (!finalBillerName) {
      alert("Please enter the biller name.");
      return;
    }

    if (!validateDynamicFields()) {
      return;
    }

    const amount = Number(form.amount);
    const totalWithFee = amount + TRANSACTION_FEE;
    const currentBalance = getSelectedAccountBalance();

    if (totalWithFee > currentBalance) {
      alert(`Insufficient balance. You need ${formatCurrency(totalWithFee)} (${formatCurrency(amount)} + R2 fee) but have ${formatCurrency(currentBalance)}`);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await API.post("/banking/pay-bill", {
        amount: Number(form.amount),
        category: form.category,
        billerName: finalBillerName,
        reference: form.reference,
        status: form.status,
        fee: TRANSACTION_FEE,
        accountId: selectedAccountId,
        dynamicFields: form.dynamicFields
      });

      alert(response.data?.message || `Bill payment completed successfully. Fee: R2`);
      navigate("/dashboard");

    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Bill payment failed. Please try again.";

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userName =
    storedUser.firstname ||
    storedUser.displayName?.split(" ")[0] ||
    storedUser.email?.split("@")[0] ||
    "User";

  const currentBalance = getSelectedAccountBalance();
  const totalAmount = form.amount ? Number(form.amount) + TRANSACTION_FEE : TRANSACTION_FEE;

  // Render dynamic field based on type (input or select)
  const renderDynamicField = (field) => {
    if (field.type === "select") {
      return (
        <select
          className="action-form__input"
          name={field.name}
          value={form.dynamicFields[field.name] || ""}
          onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    
    return (
      <input
        className="action-form__input"
        type={field.type}
        name={field.name}
        value={form.dynamicFields[field.name] || ""}
        onChange={(e) => handleDynamicFieldChange(field.name, e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <div className="dashboard-main-panel">
        <Navbar userName={userName} />

        <main className="dashboard-content-area">
          <div className="container-fluid px-0 dashboard-shell">
            <section className="action-page">
              <div className="action-page__hero">
                <span className="action-page__icon action-page__icon--purple">
                  <FiFileText size={28} />
                </span>
                <div>
                  <p className="action-page__eyebrow">Payments</p>
                  <h1 className="action-page__title">Pay Bills</h1>
                  <p className="action-page__copy">
                    Handle bill payments in one place and stay on top of due amounts.
                    A fixed fee of R2 applies per transaction.
                  </p>
                </div>
              </div>

              <div className="action-page__grid">
                <article className="action-panel">
                  <p className="action-panel__label">Available balance</p>
                  <h2 className="action-panel__value">{formatCurrency(currentBalance)}</h2>
                  
                  {/* Account selection dropdown */}
                  <label className="action-panel__account-select">
                    <span>Pay from account:</span>
                    <select
                      className="action-panel__select"
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                      {accounts.map((account) => (
                        <option key={account._id} value={account._id}>
                          {account.accountNumber} - {formatCurrency(account.balance)}
                        </option>
                      ))}
                    </select>
                  </label>
                  
                  <div className="action-panel__fee-info">
                    <div className="action-panel__fee-row">
                      <span>Transaction Fee:</span>
                      <strong>R{TRANSACTION_FEE}.00</strong>
                    </div>
                    {form.amount && Number(form.amount) > 0 && (
                      <div className="action-panel__fee-row action-panel__fee-row--total">
                        <span>Total to pay:</span>
                        <strong>{formatCurrency(totalAmount)}</strong>
                      </div>
                    )}
                  </div>
                </article>

                <article className="action-panel action-panel--form">
                  <div className="action-panel__header">
                    <h2 className="action-panel__title">Bill Payment Details</h2>
                    <p className="action-panel__copy">
                      Pay your bills directly from your account. Select a category and enter the required information.
                    </p>
                  </div>

                  <form className="action-form" onSubmit={handleSubmit}>
                    <label className="action-form__field">
                      <span>Bill Category *</span>
                      <select
                        className="action-form__input"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                      >
                        {billCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="action-form__field">
                      <span>Biller Name (optional)</span>
                      <input
                        className="action-form__input"
                        type="text"
                        name="billerName"
                        value={form.billerName}
                        onChange={handleChange}
                        placeholder={`e.g. ${getBillerNameFromCategory(form.category)}`}
                      />
                      <small className="action-form__hint">
                        Leave empty to use default: {getBillerNameFromCategory(form.category)}
                      </small>
                    </label>

                    {/* Dynamic Fields based on category */}
                    {dynamicFields.map((field) => (
                      <label key={field.name} className="action-form__field">
                        <span>{field.label} {field.required && "*"}</span>
                        {renderDynamicField(field)}
                      </label>
                    ))}

                    <label className="action-form__field">
                      <span>Amount *</span>
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

                    <label className="action-form__field">
                      <span>Reference (optional)</span>
                      <input
                        className="action-form__input"
                        type="text"
                        name="reference"
                        value={form.reference}
                        onChange={handleChange}
                        placeholder="e.g. Payment reference"
                      />
                    </label>

                    <label className="action-form__field">
                      <span>Status</span>
                      <select
                        className="action-form__input"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                      >
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </label>

                    <div className="action-form__fee-summary">
                      <div className="action-form__fee-summary-row">
                        <span>Bill Amount:</span>
                        <span>{form.amount ? formatCurrency(Number(form.amount)) : "R0.00"}</span>
                      </div>
                      <div className="action-form__fee-summary-row">
                        <span>Transaction Fee:</span>
                        <span>R{TRANSACTION_FEE}.00</span>
                      </div>
                      <div className="action-form__fee-summary-row action-form__fee-summary-row--total">
                        {/* <span>Total:</span>
                        <span>{formatCurrency(totalAmount)}</span> */}
                      </div>
                    </div>

                    <button className="action-form__button" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Processing payment..." : `Pay Bill (Fee: R${TRANSACTION_FEE})`}
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
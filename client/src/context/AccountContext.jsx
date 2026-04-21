import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../services/api";

const SELECTED_ACCOUNT_KEY = "nexbank-selected-account-id";

const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(
    () => window.localStorage.getItem(SELECTED_ACCOUNT_KEY) || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const applySummary = useCallback((summary) => {
    const nextAccounts = Array.isArray(summary?.accounts) ? summary.accounts : [];
    const nextCards = Array.isArray(summary?.cards) ? summary.cards : [];
    const nextTransactions = Array.isArray(summary?.transactions) ? summary.transactions : [];

    setAccounts(nextAccounts);
    setCards(nextCards);
    setTransactions(nextTransactions);
    setError("");

    setSelectedAccountId((current) => {
      const persisted = current || window.localStorage.getItem(SELECTED_ACCOUNT_KEY) || null;
      const hasPersisted = nextAccounts.some((account) => account._id === persisted);
      const nextSelectedId = hasPersisted ? persisted : null;

      if (nextSelectedId) {
        window.localStorage.setItem(SELECTED_ACCOUNT_KEY, nextSelectedId);
      } else {
        window.localStorage.removeItem(SELECTED_ACCOUNT_KEY);
      }

      return nextSelectedId;
    });
  }, []);

  const resetState = useCallback((message = "") => {
    setAccounts([]);
    setCards([]);
    setTransactions([]);
    setError(message);
  }, []);

  const refreshSummary = useCallback(async () => {
    const token = window.localStorage.getItem("token");

    if (!token) {
      resetState("");
      return;
    }

    setIsLoading(true);
    try {
      const response = await API.get("/banking/summary");
      applySummary(response.data);
    } catch (requestError) {
      resetState(
        requestError.response?.data?.error ||
          requestError.message ||
          "Failed to load account summary."
      );
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [applySummary, resetState]);

  useEffect(() => {
    refreshSummary().catch(() => {});
  }, [refreshSummary]);

  useEffect(() => {
    const handleAuthChanged = () => {
      refreshSummary().catch(() => {});
    };

    window.addEventListener("nexbank-auth-changed", handleAuthChanged);
    return () => window.removeEventListener("nexbank-auth-changed", handleAuthChanged);
  }, [refreshSummary]);

  const selectedAccount =
    selectedAccountId
      ? accounts.find((account) => account._id === selectedAccountId) || null
      : null;
  const hasActiveAccount = Boolean(selectedAccountId && selectedAccount);

  const selectedTransactions = useMemo(
    () =>
      selectedAccount
        ? transactions.filter((transaction) => transaction.accountId === selectedAccount._id)
        : [],
    [selectedAccount, transactions]
  );

  const selectedCards = useMemo(
    () =>
      selectedAccount
        ? cards.filter((card) => card.accountId === selectedAccount._id)
        : [],
    [cards, selectedAccount]
  );

  const ensureActiveAccount = useCallback(() => {
    if (!selectedAccountId || !selectedAccount) {
      throw new Error("Select or load an account before creating banking actions.");
    }
  }, [selectedAccount, selectedAccountId]);

  const value = useMemo(
    () => ({
      accounts,
      cards: selectedCards,
      allCards: cards,
      transactions: selectedTransactions,
      allTransactions: transactions,
      selectedAccount,
      selectedAccountId,
      hasActiveAccount,
      balance: selectedAccount?.availableBalance || 0,
      ledgerBalance: selectedAccount?.ledgerBalance || 0,
      availableBalance: selectedAccount?.availableBalance || 0,
      isLoading,
      error,
      refreshSummary,
      selectAccount: (accountId) => {
        setSelectedAccountId(accountId);
        if (accountId) {
          window.localStorage.setItem(SELECTED_ACCOUNT_KEY, accountId);
        } else {
          window.localStorage.removeItem(SELECTED_ACCOUNT_KEY);
        }
      },
      createTransaction: async (payload) => {
        ensureActiveAccount();
        const response = await API.post("/banking/transactions", payload);
        applySummary(response.data);
        return response.data.transaction;
      },
      createCard: async (payload) => {
        ensureActiveAccount();
        const response = await API.post("/banking/cards", payload);
        applySummary(response.data);
        return response.data.card;
      },
      updateCard: async (cardId, payload) => {
        const response = await API.patch(`/banking/cards/${cardId}`, payload);
        applySummary(response.data);
        return response.data.card;
      },
      settleTransaction: async (id, status = "completed") => {
        const response = await API.patch(`/banking/transactions/${id}/status`, { status });
        applySummary(response.data);
        return response.data.transaction;
      },
    }),
    [
      accounts,
      applySummary,
      cards,
      error,
      hasActiveAccount,
      isLoading,
      refreshSummary,
      selectedAccountId,
      selectedAccount,
      selectedCards,
      selectedTransactions,
      transactions,
      ensureActiveAccount,
    ]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used inside an AccountProvider");
  }

  return context;
}

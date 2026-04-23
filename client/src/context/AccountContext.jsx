import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../services/api";

const AccountContext = createContext(null);
const SELECTED_ACCOUNT_KEY_PREFIX = "nexbank-selected-account-id";

const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getStoredUser = () => safeJsonParse(window.localStorage.getItem("user"), {});
const getUserStorageId = (user = getStoredUser()) => user?._id || user?.email || "guest";
const getSelectedAccountStorageKey = (userId = getUserStorageId()) =>
  `${SELECTED_ACCOUNT_KEY_PREFIX}:${userId}`;

const readSelectedAccountId = (userId = getUserStorageId()) =>
  window.localStorage.getItem(getSelectedAccountStorageKey(userId)) || null;

const writeSelectedAccountId = (userId = getUserStorageId(), accountId = null) => {
  const key = getSelectedAccountStorageKey(userId);

  if (accountId) {
    window.localStorage.setItem(key, accountId);
    return;
  }

  window.localStorage.removeItem(key);
};

const normalizeAccount = (account = {}) => ({
  ...account,
  _id: account._id || account.id,
  id: account.id || account._id,
  availableBalance: roundCurrency(account.availableBalance ?? account.balance ?? 0),
  ledgerBalance: roundCurrency(account.ledgerBalance ?? account.availableBalance ?? account.balance ?? 0),
  limits: account.limits || {},
  status: String(account.status || "active").toLowerCase(),
});

const normalizeCard = (card = {}) => ({
  ...card,
  _id: card._id || card.id,
  id: card.id || card._id,
  accountId: card.accountId || "",
  status: String(card.status || "active").toLowerCase(),
});

const normalizeTransaction = (transaction = {}) => {
  const amount = roundCurrency(transaction.amount);
  const fee = roundCurrency(transaction.fee);
  const direction = transaction.direction || "debit";
  const impactAmount =
    typeof transaction.impactAmount === "number"
      ? roundCurrency(transaction.impactAmount)
      : direction === "credit"
        ? amount
        : -roundCurrency(amount + fee);

  return {
    ...transaction,
    _id: transaction._id || transaction.id,
    id: transaction.id || transaction._id,
    accountId: transaction.accountId || "",
    recipientAccountId: transaction.recipientAccountId || null,
    amount,
    fee,
    direction,
    impactAmount,
    status: String(transaction.status || "completed").toLowerCase(),
  };
};

const normalizeOverview = (overview = {}) => ({
  ...overview,
  account: overview.account ? normalizeAccount(overview.account) : null,
  accounts: Array.isArray(overview.accounts) ? overview.accounts.map(normalizeAccount) : [],
  cards: Array.isArray(overview.cards) ? overview.cards.map(normalizeCard) : [],
  recentTransactions: Array.isArray(overview.recentTransactions)
    ? overview.recentTransactions.map(normalizeTransaction)
    : [],
  transactions: Array.isArray(overview.transactions)
    ? overview.transactions.map(normalizeTransaction)
    : [],
  summary: overview.summary || {
    totalDeposits: 0,
    totalWithdrawals: 0,
    depositCount: 0,
    withdrawalCount: 0,
    activityCount: 0,
    savingsRate: 0,
  },
  insights: overview.insights || {
    totalSpent: 0,
    breakdown: [],
  },
});

const resolvePreferredAccountId = (accounts = [], preferredAccountId = null) => {
  const matchedAccount = accounts.find((account) => String(account._id) === String(preferredAccountId));

  if (matchedAccount) {
    return matchedAccount._id;
  }

  const firstActiveAccount = accounts.find(
    (account) => account.isActive !== false && String(account.status || "active").toLowerCase() === "active"
  );

  return firstActiveAccount?._id || accounts[0]?._id || null;
};

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    readSelectedAccountId(getUserStorageId())
  );
  const [isLoading, setIsLoading] = useState(() => Boolean(window.localStorage.getItem("token")));
  const [error, setError] = useState("");

  const resetState = useCallback((message = "") => {
    writeSelectedAccountId(getUserStorageId(), null);
    setAccounts([]);
    setOverview(null);
    setSelectedAccountId(null);
    setError(message);
  }, []);

  const commitAccounts = useCallback((accountList = [], preferredAccountId = null, userId = getUserStorageId()) => {
    const normalizedAccounts = accountList.map(normalizeAccount);
    const nextSelectedAccountId = resolvePreferredAccountId(normalizedAccounts, preferredAccountId);

    setAccounts(normalizedAccounts);
    setSelectedAccountId(nextSelectedAccountId);
    writeSelectedAccountId(userId, nextSelectedAccountId);

    return {
      accounts: normalizedAccounts,
      selectedAccountId: nextSelectedAccountId,
    };
  }, []);

  const applyOverview = useCallback(
    (payload, preferredAccountId = null, userId = getUserStorageId(), fallbackAccounts = []) => {
      const normalizedOverview = normalizeOverview(payload);
      const sourceAccounts = normalizedOverview.accounts.length > 0 ? normalizedOverview.accounts : fallbackAccounts;
      const nextState = commitAccounts(sourceAccounts, preferredAccountId, userId);
      const selectedAccount =
        nextState.accounts.find((account) => String(account._id) === String(nextState.selectedAccountId)) || null;
      const nextOverview = {
        ...normalizedOverview,
        accounts: nextState.accounts,
        account: selectedAccount,
      };

      setOverview(nextOverview);
      setError("");

      return nextOverview;
    },
    [commitAccounts]
  );

  const loadOverviewForAccount = useCallback(
    async (accountId, fallbackAccounts = [], options = {}) => {
      const { setLoading = true } = options;
      const userId = getUserStorageId();

      if (setLoading) {
        setIsLoading(true);
      }

      try {
        const response = await API.get("/banking/overview", {
          params: accountId ? { accountId } : undefined,
        });

        return applyOverview(response.data, accountId, userId, fallbackAccounts);
      } finally {
        if (setLoading) {
          setIsLoading(false);
        }
      }
    },
    [applyOverview]
  );

  const hydrateAccountState = useCallback(
    async (preferredAccountId = readSelectedAccountId(getUserStorageId())) => {
      const token = window.localStorage.getItem("token");
      const userId = getUserStorageId();

      if (!token) {
        resetState("");
        setIsLoading(false);
        return null;
      }

      setIsLoading(true);

      try {
        const accountResponse = await API.get("/banking/accounts");
        const nextAccountState = commitAccounts(accountResponse.data.accounts || [], preferredAccountId, userId);

        if (!nextAccountState.selectedAccountId) {
          const emptyOverview = normalizeOverview({ accounts: nextAccountState.accounts });
          setOverview({
            ...emptyOverview,
            accounts: nextAccountState.accounts,
            account: null,
          });
          setError("");
          return null;
        }

        return await loadOverviewForAccount(nextAccountState.selectedAccountId, nextAccountState.accounts, {
          setLoading: false,
        });
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          resetState(
            requestError.response?.data?.error ||
              requestError.message ||
              "Your session is no longer active."
          );
        } else {
          setError(
            requestError.response?.data?.error ||
              requestError.message ||
              "Failed to load account data."
          );
        }

        throw requestError;
      } finally {
        setIsLoading(false);
      }
    },
    [commitAccounts, loadOverviewForAccount, resetState]
  );

  const refreshOverview = useCallback(
    async (requestedAccountId = null) => {
      const token = window.localStorage.getItem("token");

      if (!token) {
        resetState("");
        setIsLoading(false);
        return null;
      }

      const nextAccountId =
        requestedAccountId ||
        resolvePreferredAccountId(accounts, selectedAccountId || readSelectedAccountId(getUserStorageId()));

      if (!nextAccountId) {
        return hydrateAccountState();
      }

      try {
        return await loadOverviewForAccount(nextAccountId, accounts, { setLoading: true });
      } catch (requestError) {
        if ([400, 404].includes(requestError.response?.status)) {
          return hydrateAccountState();
        }

        if (requestError.response?.status === 401) {
          resetState(
            requestError.response?.data?.error ||
              requestError.message ||
              "Your session is no longer active."
          );
        } else {
          setError(
            requestError.response?.data?.error ||
              requestError.message ||
              "Failed to refresh account overview."
          );
        }

        throw requestError;
      }
    },
    [accounts, hydrateAccountState, loadOverviewForAccount, resetState, selectedAccountId]
  );

  const selectAccount = useCallback(
    async (accountId) => {
      const userId = getUserStorageId();
      const nextAccountId = resolvePreferredAccountId(accounts, accountId);

      setSelectedAccountId(nextAccountId);
      writeSelectedAccountId(userId, nextAccountId);

      if (!nextAccountId) {
        setOverview((currentOverview) =>
          currentOverview
            ? {
                ...currentOverview,
                account: null,
                cards: [],
                recentTransactions: [],
                transactions: [],
              }
            : null
        );
        return null;
      }

      return refreshOverview(nextAccountId);
    },
    [accounts, refreshOverview]
  );

  useEffect(() => {
    hydrateAccountState().catch(() => {});
  }, [hydrateAccountState]);

  useEffect(() => {
    const handleAuthChanged = () => {
      hydrateAccountState(readSelectedAccountId(getUserStorageId())).catch(() => {});
    };

    window.addEventListener("nexbank-auth-changed", handleAuthChanged);
    return () => window.removeEventListener("nexbank-auth-changed", handleAuthChanged);
  }, [hydrateAccountState]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => String(account._id) === String(selectedAccountId)) || null,
    [accounts, selectedAccountId]
  );

  const hasActiveAccount = Boolean(selectedAccount);

  const createAccount = useCallback(
    async ({ accountType }) => {
      const response = await API.post("/banking/accounts", { accountType });
      const account = normalizeAccount(response.data.account || {});

      await refreshOverview(account._id);
      return account;
    },
    [refreshOverview]
  );

  const runAction = useCallback(
    async (request, accountId, missingAccountMessage, pickResult) => {
      const targetAccountId = accountId || selectedAccount?._id;

      if (!targetAccountId) {
        throw new Error(missingAccountMessage);
      }

      const response = await request(targetAccountId);
      const result = pickResult ? pickResult(response.data) : response.data;

      await refreshOverview(targetAccountId);
      return result;
    },
    [refreshOverview, selectedAccount]
  );

  const depositFunds = useCallback(
    async ({ accountId, amount, category, reference, status = "Completed" }) =>
      runAction(
        (targetAccountId) =>
          API.post("/banking/deposit", {
            accountId: targetAccountId,
            amount,
            category,
            reference,
            status,
          }),
        accountId,
        "Select an account before making a deposit.",
        (data) => data.transaction
      ),
    [runAction]
  );

  const withdrawFunds = useCallback(
    async ({ accountId, amount, fee = 0, category, reference, status = "Completed" }) =>
      runAction(
        (targetAccountId) =>
          API.post("/banking/withdraw", {
            accountId: targetAccountId,
            amount,
            fee,
            category,
            reference,
            status,
          }),
        accountId,
        "Select an account before making a withdrawal.",
        (data) => data.transaction
      ),
    [runAction]
  );

  const transferFunds = useCallback(
    async ({
      accountId,
      amount,
      route,
      recipientAccountId,
      bankName,
      beneficiaryName,
      accountNumber,
      accountType,
      cellphone,
      reference,
      note,
      code,
    }) =>
      runAction(
        (targetAccountId) =>
          API.post("/banking/transfer", {
            accountId: targetAccountId,
            amount,
            route,
            recipientAccountId,
            bankName,
            beneficiaryName,
            accountNumber,
            accountType,
            cellphone,
            reference,
            note,
            code,
          }),
        accountId,
        "Select a source account before sending a transfer.",
        (data) => data.transaction
      ),
    [runAction]
  );

  const payBill = useCallback(
    async ({
      accountId,
      amount,
      category,
      provider,
      accountNumber,
      billName,
      dueDate,
      reference,
      status = "Pending",
    }) =>
      runAction(
        (targetAccountId) =>
          API.post("/banking/pay-bills", {
            accountId: targetAccountId,
            amount,
            category,
            provider,
            accountNumber,
            billName,
            dueDate,
            reference,
            status,
          }),
        accountId,
        "Select an account before paying a bill.",
        (data) => data.transaction
      ),
    [runAction]
  );

  const value = useMemo(
    () => ({
      accounts,
      overview,
      selectedAccount,
      selectedAccountId,
      hasActiveAccount,
      isLoading,
      error,
      hydrateAccountState,
      refreshOverview,
      refreshSummary: refreshOverview,
      selectAccount,
      setSelectedAccount: selectAccount,
      clearSelectedAccount: () => {
        const userId = getUserStorageId();
        writeSelectedAccountId(userId, null);
        setSelectedAccountId(null);
        setOverview(null);
      },
      createAccount,
      depositFunds,
      withdrawFunds,
      transferFunds,
      payBill,
    }),
    [
      accounts,
      createAccount,
      depositFunds,
      error,
      hasActiveAccount,
      hydrateAccountState,
      isLoading,
      overview,
      payBill,
      refreshOverview,
      selectAccount,
      selectedAccount,
      selectedAccountId,
      transferFunds,
      withdrawFunds,
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

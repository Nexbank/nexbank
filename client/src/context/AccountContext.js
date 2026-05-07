import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import API from "../services/api";

const SELECTED_ACCOUNT_KEY_PREFIX = "nexbank-selected-account-id";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ACTIVE_CARD_STATUS = "active";
const FROZEN_CARD_STATUS = "frozen";
const REPLACED_CARD_STATUS = "replaced";

const DEFAULT_LIMITS = Object.freeze({});

const DEFAULT_ACCOUNT_BLUEPRINT = Object.freeze({
  name: "Main Account",
  accountType: "current",
  category: "transactional",
});

const ACCOUNT_OPTION_BLUEPRINTS = Object.freeze({
  "Main Account": {
    name: "Main Account",
    accountType: "current",
    category: "transactional",
  },
  TruSave: {
    name: "TruSave",
    accountType: "savings",
    category: "savings",
  },
  "Transact Account": {
    name: "Transact Account",
    accountType: "current",
    category: "transactional",
  },
  "Student Account": {
    name: "Student Account",
    accountType: "student",
    category: "transactional",
  },
  "Fixed Deposit": {
    name: "Fixed Deposit",
    accountType: "fixed_deposit",
    category: "investment",
  },
  "Tax-Free Savings": {
    name: "Tax-Free Savings",
    accountType: "tax_free_savings",
    category: "savings",
  },
  "Private Banking": {
    name: "Private Banking",
    accountType: "private_banking",
    category: "transactional",
  },
});

const LEGACY_ACCOUNT_COMPATIBILITY = Object.freeze({
  Current: DEFAULT_ACCOUNT_BLUEPRINT,
  "Current Account": DEFAULT_ACCOUNT_BLUEPRINT,
  "Main Account": ACCOUNT_OPTION_BLUEPRINTS["Main Account"],
  current_account: DEFAULT_ACCOUNT_BLUEPRINT,
  main_account: ACCOUNT_OPTION_BLUEPRINTS["Main Account"],
  "Flexi Account": {
    name: "Flexi Account",
    accountType: "current",
    category: "transactional",
  },
  flexi_account: {
    name: "Flexi Account",
    accountType: "current",
    category: "transactional",
  },
  "Transact Account": ACCOUNT_OPTION_BLUEPRINTS["Transact Account"],
  transact_account: ACCOUNT_OPTION_BLUEPRINTS["Transact Account"],
  TruSave: ACCOUNT_OPTION_BLUEPRINTS.TruSave,
  trusave: ACCOUNT_OPTION_BLUEPRINTS.TruSave,
  "Student Account": ACCOUNT_OPTION_BLUEPRINTS["Student Account"],
  student_account: ACCOUNT_OPTION_BLUEPRINTS["Student Account"],
  "Fixed Deposit": ACCOUNT_OPTION_BLUEPRINTS["Fixed Deposit"],
  fixed_deposit: ACCOUNT_OPTION_BLUEPRINTS["Fixed Deposit"],
  "Tax-Free Savings": ACCOUNT_OPTION_BLUEPRINTS["Tax-Free Savings"],
  tax_free_savings: ACCOUNT_OPTION_BLUEPRINTS["Tax-Free Savings"],
  "Private Banking": ACCOUNT_OPTION_BLUEPRINTS["Private Banking"],
  private_banking: ACCOUNT_OPTION_BLUEPRINTS["Private Banking"],
  current: DEFAULT_ACCOUNT_BLUEPRINT,
  savings: ACCOUNT_OPTION_BLUEPRINTS.TruSave,
  student: ACCOUNT_OPTION_BLUEPRINTS["Student Account"],
});
const CATEGORY_COMPATIBILITY = Object.freeze({
  cheque: "transactional",
  transact: "transactional",
  student: "transactional",
  private: "transactional",
  savings: "savings",
  investment: "investment",
  transactional: "transactional",
});
const ACCOUNT_TYPE_RULES = Object.freeze({
  current: {
    monthlyFee: 50,
    dailyTransferLimit: 10000,
    allowsCards: true,
    allowsBillPayments: true,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
  savings: {
    monthlyFee: 0,
    dailyTransferLimit: 5000,
    allowsCards: false,
    allowsBillPayments: false,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
  student: {
    monthlyFee: 0,
    dailyTransferLimit: 3000,
    allowsCards: true,
    allowsBillPayments: true,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
  fixed_deposit: {
    monthlyFee: 0,
    dailyTransferLimit: 0,
    allowsCards: false,
    allowsBillPayments: false,
    allowsWithdrawals: false,
    allowsTransfers: false,
  },
  tax_free_savings: {
    monthlyFee: 0,
    dailyTransferLimit: 36000,
    allowsCards: false,
    allowsBillPayments: false,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
  private_banking: {
    monthlyFee: 150,
    dailyTransferLimit: 100000,
    allowsCards: true,
    allowsBillPayments: true,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
});

const AccountContext = createContext(null);

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;

const sortByCreatedAtDesc = (items = []) =>
  [...items].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

const normalizeAccountType = (value = DEFAULT_ACCOUNT_BLUEPRINT.accountType) => {
  const rawValue = String(value || DEFAULT_ACCOUNT_BLUEPRINT.accountType).trim();
  const directBlueprint = ACCOUNT_OPTION_BLUEPRINTS[rawValue] || LEGACY_ACCOUNT_COMPATIBILITY[rawValue];

  if (directBlueprint?.accountType) {
    return directBlueprint.accountType;
  }

  const normalizedValue = rawValue.toLowerCase().replace(/[\s-]+/g, "_");
  const normalizedCompatibility = LEGACY_ACCOUNT_COMPATIBILITY[normalizedValue];

  return normalizedCompatibility?.accountType || normalizedValue || DEFAULT_ACCOUNT_BLUEPRINT.accountType;
};

const getAccountBlueprint = (accountType = DEFAULT_ACCOUNT_BLUEPRINT.accountType) => {
  const normalizedAccountType = normalizeAccountType(accountType);
  const directBlueprint = ACCOUNT_OPTION_BLUEPRINTS[accountType] || LEGACY_ACCOUNT_COMPATIBILITY[accountType];

  return directBlueprint ||
  LEGACY_ACCOUNT_COMPATIBILITY[normalizedAccountType] || {
    name: humanizeValue(accountType || DEFAULT_ACCOUNT_BLUEPRINT.name),
    accountType: normalizedAccountType,
    category: DEFAULT_ACCOUNT_BLUEPRINT.category,
  };
};
const getAccountRules = (accountType = DEFAULT_ACCOUNT_BLUEPRINT.accountType) =>
  ACCOUNT_TYPE_RULES[normalizeAccountType(accountType)] || ACCOUNT_TYPE_RULES[DEFAULT_ACCOUNT_BLUEPRINT.accountType];

const isActiveAccount = (account) =>
  Boolean(account) && account.status !== "closed" && account.isActive !== false;

const findActiveAccountByType = (accountList = [], accountType) => {
  const normalizedAccountType = normalizeAccountType(accountType);

  return (
    accountList.find(
      (account) =>
        isActiveAccount(account) &&
        normalizeAccountType(account.accountType || account.name) === normalizedAccountType
    ) || null
  );
};

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

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const safeUser = { ...user };
  delete safeUser.password;
  delete safeUser.pinHash;
  return safeUser;
};

const getStoredUser = () => sanitizeUser(safeJsonParse(window.localStorage.getItem("user")));

const getUserStorageId = (user = getStoredUser()) => user?._id || user?.email || "guest";

const getSelectedAccountStorageKey = (userId = getUserStorageId()) =>
  `${SELECTED_ACCOUNT_KEY_PREFIX}:${userId}`;

const hasAuthToken = () => Boolean(window.localStorage.getItem("token"));

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

const toIsoDate = (value) => new Date(value).toISOString();

const normalizeAccount = (account, userId, index) => {
  const accountId = account?._id || account?.id || `account-${userId}-${index + 1}`;
  const legacyBlueprint =
    getAccountBlueprint(account?.accountType) ||
    getAccountBlueprint(account?.name) ||
    DEFAULT_ACCOUNT_BLUEPRINT;
  const accountType = normalizeAccountType(account?.accountType || account?.name || legacyBlueprint.accountType);
  const normalizedBlueprint = getAccountBlueprint(accountType);
  const category =
    CATEGORY_COMPATIBILITY[account?.category] ||
    account?.category ||
    normalizedBlueprint.category ||
    legacyBlueprint.category;
  const name = account?.name || normalizedBlueprint.name || legacyBlueprint.name;
  const rules = {
    ...getAccountRules(accountType),
    ...(account?.rules || {}),
  };
  // 🔹 Future-ready
  // Merge backend rules with normalized defaults so legacy records and new account products stay renderable in one shape.
  const availableBalance = roundCurrency(
    account?.availableBalance ?? account?.balance ?? account?.ledgerBalance ?? 0
  );
  const ledgerBalance = roundCurrency(account?.ledgerBalance ?? availableBalance);
  const isActive = Boolean(account?.isActive);
  const status = String(account?.status || (isActive ? "active" : "inactive")).toLowerCase();

  return {
    _id: accountId,
    id: accountId,
    userId: account?.userId || userId,
    name,
    accountType,
    category,
    rules,
    accountNumber: String(account?.accountNumber || "")
      .replace(/\D/g, "")
      .slice(0, 11)
      .padStart(11, "0"),
    availableBalance,
    ledgerBalance,
    isActive,
    status,
    closedAt: account?.closedAt || null,
    closedReason: account?.closedReason || null,
    limits: {
      ...DEFAULT_LIMITS,
      ...(account?.limits || {}),
    },
    createdAt: account?.createdAt || toIsoDate(Date.now() - (index + 1) * DAY_IN_MS),
  };
};

const normalizeTransaction = (transaction, index) => {
  const transactionId = transaction?._id || transaction?.id || `transaction-${index + 1}`;

  return {
    _id: transactionId,
    id: transactionId,
    accountId: transaction?.accountId || "",
    cardId: transaction?.cardId || transaction?.metadata?.cardId || null,
    amount: roundCurrency(transaction?.amount),
    fee: roundCurrency(transaction?.fee),
    impactAmount:
      typeof transaction?.impactAmount === "number"
        ? roundCurrency(transaction.impactAmount)
        : undefined,
    direction: transaction?.direction || "debit",
    type: transaction?.type || "transfer",
    status: transaction?.status || "completed",
    category: transaction?.category || "",
    reference: transaction?.reference || "",
    description: transaction?.description || humanizeValue(transaction?.type || "transaction"),
    metadata: transaction?.metadata || {},
    billerName: transaction?.billerName || "",
    dynamicFields: transaction?.dynamicFields || {},
    createdAt: transaction?.createdAt || toIsoDate(Date.now() - index * DAY_IN_MS),
  };
};

const normalizeCard = (card, userId, index) => {
  const accountId = card?.accountId || "";
  const normalizedType = normalizeCardType(card?.cardType || card?.type) || "physical";
  const cardId = card?._id || card?.id || `card-${userId}-${accountId}-${normalizedType}-${index}`;
  const createdAt = card?.createdAt || toIsoDate(Date.now() - index * DAY_IN_MS);
  const status = String(card?.status || (card?.isLocked ? FROZEN_CARD_STATUS : ACTIVE_CARD_STATUS))
    .trim()
    .toLowerCase();

  return {
    _id: cardId,
    id: cardId,
    userId: card?.userId || userId,
    accountId,
    cardType: normalizedType === "physical" ? "Physical Card" : "Virtual Card",
    cardName:
      card?.cardName || (normalizedType === "physical" ? "NexBank Physical Card" : "NexBank Virtual Card"),
    last4Digits: String(card?.last4Digits || "0000").slice(-4).padStart(4, "0"),
    expiryDate:
      card?.expiryDate ||
      toIsoDate(new Date(new Date(createdAt).setFullYear(new Date(createdAt).getFullYear() + 4))),
    status,
    isActive: card?.isActive ?? status === ACTIVE_CARD_STATUS,
    isLocked:
      card?.isLocked ??
      (status === FROZEN_CARD_STATUS || status === REPLACED_CARD_STATUS),
    contactlessEnabled: card?.contactlessEnabled ?? true,
    onlinePaymentsEnabled: card?.onlinePaymentsEnabled ?? true,
    atmWithdrawalsEnabled: card?.atmWithdrawalsEnabled ?? normalizedType === "physical",
    replacedByCardId: card?.replacedByCardId || null,
    replacedAt: card?.replacedAt || null,
    cardNumber: String(card?.cardNumber || card?.maskedPan || "").trim(),
    detailsSource: "system",
    createdAt,
  };
};

const normalizeBankingSummary = (summary, userId) => {
  const hasSummaryContent =
    Array.isArray(summary?.accounts) ||
    Array.isArray(summary?.cards) ||
    Array.isArray(summary?.transactions);

  if (!hasSummaryContent) {
    return {
      accounts: [],
      cards: [],
      transactions: [],
    };
  }

  const normalizedAccountsSource =
    Array.isArray(summary?.accounts) && summary.accounts.length > 0
      ? summary.accounts
      : [];

  const normalizedAccounts = normalizedAccountsSource
    .filter(Boolean)
    .map((account, index) => normalizeAccount(account, userId, index));
  const activeAccountTypes = new Set();
  const accounts = normalizedAccounts.filter((account) => {
    if (!isActiveAccount(account)) {
      return true;
    }

    const normalizedAccountType = normalizeAccountType(account.accountType);

    if (activeAccountTypes.has(normalizedAccountType)) {
      return false;
    }

    activeAccountTypes.add(normalizedAccountType);
    return true;
  });

  const transactions = sortByCreatedAtDesc(
    (Array.isArray(summary?.transactions) ? summary.transactions : [])
      .filter(Boolean)
      .map((transaction, index) => normalizeTransaction(transaction, index))
      // 🔹 Safety / Validation
      // Ignore orphaned transaction rows so the UI only renders activity tied to returned accounts.
      .filter((transaction) => accounts.some((account) => account._id === transaction.accountId))
  );

  const cards = sortByCreatedAtDesc(
    (Array.isArray(summary?.cards) ? summary.cards : [])
      .filter(Boolean)
      .map((card, index) => normalizeCard(card, userId, index))
      // 🔹 Banking Logic
      // Replaced cards stay in MongoDB for history, but the live cards UI should only surface current usable records.
      .filter((card) => card.status !== REPLACED_CARD_STATUS)
      .filter((card) => accounts.some((account) => account._id === card.accountId))
  );

  return {
    accounts,
    cards,
    transactions,
  };
};

const validateMoneyMovement = ({ account, amount, type }) => {
  // 🔹 Safety / Validation
  // Mirror the main account-rule checks client-side for fast feedback, while keeping the backend as final authority.
  if (!account) {
    throw new Error("Select an account before continuing.");
  }

  const normalizedAmount = roundCurrency(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const minimumAmount =
    type === "deposit" ? 50 : type === "withdrawal" ? 100 : 10;

  if (normalizedAmount < minimumAmount) {
    throw new Error(`Enter at least R${minimumAmount.toFixed(2)}.`);
  }

  if (type === "bill" && account.rules && !account.rules.allowsBillPayments) {
    throw new Error("Bill payments are not available for this account type.");
  }

  if (type === "withdrawal" && account.rules && !account.rules.allowsWithdrawals) {
    throw new Error("Withdrawals are not available for this account type.");
  }

  if (type === "transfer" && account.rules) {
    if (!account.rules.allowsTransfers) {
      throw new Error("Transfers are not available for this account type.");
    }
  }

  if (type !== "deposit" && normalizedAmount > Number(account.availableBalance || 0)) {
    throw new Error("This exceeds your available balance.");
  }

  return normalizedAmount;
};

const validateCardAuthorization = ({ account, cards, cardId }) => {
  if (!cardId) {
    return null;
  }

  const card = cards.find((item) => item._id === cardId || item.id === cardId) || null;

  if (!card) {
    throw new Error("Card not found for this account.");
  }

  if (card.accountId !== account?._id) {
    throw new Error("This card does not belong to the selected account.");
  }

  if (card.status === FROZEN_CARD_STATUS || card.status === REPLACED_CARD_STATUS) {
    throw new Error("This card cannot authorize transactions in its current state.");
  }

  if (!card.isActive) {
    throw new Error("This card is not active.");
  }

  return card;
};

const resolveInsightCategoryId = (transaction) => {
  if (transaction.type === "bill") {
    return transaction.metadata?.category || "bills";
  }

  if (transaction.type === "card") {
    return transaction.metadata?.merchantCategory || "card-spend";
  }

  if (transaction.type === "withdrawal") {
    return transaction.metadata?.payoutChannel === "atm-code" ? "cash-code" : "cash-withdrawals";
  }

  if (transaction.type === "transfer") {
    return transaction.metadata?.route === "voucher" ? "cash-send" : "transfers";
  }

  return transaction.type || "other";
};

const resolveInsightCategoryLabel = (transaction, categoryId) => {
  if (transaction.type === "bill" && transaction.metadata?.category) {
    return humanizeValue(transaction.metadata.category);
  }

  if (transaction.type === "card" && transaction.metadata?.merchantCategory) {
    return humanizeValue(transaction.metadata.merchantCategory);
  }

  if (categoryId === "cash-code") {
    return "Cash Code";
  }

  if (categoryId === "cash-send") {
    return "Cash Send";
  }

  return humanizeValue(categoryId);
};

export function AccountProvider({ children }) {
  const [accountRecords, setAccountRecords] = useState([]);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cardDetailsById, setCardDetailsById] = useState({});
  const [user, setUser] = useState(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasAuthToken());
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    readSelectedAccountId(getUserStorageId())
  );
  const [isLoading, setIsLoading] = useState(() => hasAuthToken());
  const [hasLoadedSummary, setHasLoadedSummary] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const isCreatingAccountRef = useRef(false);
  const [error, setError] = useState("");

  const applySummary = useCallback((summary, userId = getUserStorageId()) => {
    const nextSummary = normalizeBankingSummary(summary, userId);
    const nextActiveAccounts = nextSummary.accounts.filter(isActiveAccount);
    // 🔹 Banking Logic
    // Preserve historical accounts in state, then derive active selectors separately so closed accounts still appear in reporting views.

    setAccountRecords(nextSummary.accounts);
    setCards(nextSummary.cards);
    setTransactions(nextSummary.transactions);
    setCardDetailsById((currentDetails) =>
      Object.fromEntries(
        Object.entries(currentDetails).filter(([cardId]) =>
          nextSummary.cards.some((card) => card._id === cardId || card.id === cardId)
        )
      )
    );
    setError("");

    setSelectedAccountId((currentSelectedId) => {
      const persistedSelectedId = readSelectedAccountId(userId);
      const preferredSelectedId = [persistedSelectedId, currentSelectedId].find((accountId) =>
        nextActiveAccounts.some((account) => account._id === accountId)
      );
      const nextSelectedId =
        preferredSelectedId || nextActiveAccounts[0]?._id || null;

      writeSelectedAccountId(userId, nextSelectedId);
      return nextSelectedId;
    });

    return nextSummary;
  }, []);

  const resetState = useCallback((message = "") => {
    writeSelectedAccountId(getUserStorageId(), null);
    setAccountRecords([]);
    setCards([]);
    setTransactions([]);
    setCardDetailsById({});
    setUser(null);
    setSelectedAccountId(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    setHasLoadedSummary(false);
    setError(message);
  }, []);

  const updateStoredUser = useCallback((nextUser) => {
    const safeUser = sanitizeUser(nextUser);

    if (!safeUser) {
      window.localStorage.removeItem("user");
      setUser(null);
      return null;
    }

    window.localStorage.setItem("user", JSON.stringify(safeUser));
    setUser(safeUser);
    return safeUser;
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!hasAuthToken()) {
      return null;
    }

    try {
      const response = await API.get("/profile/me");
      return updateStoredUser(response.data);
    } catch {
      return getStoredUser();
    }
  }, [updateStoredUser]);

  const refreshSummary = useCallback(async (userId = getUserStorageId()) => {
    if (!hasAuthToken()) {
      setIsLoading(false);
      setHasLoadedSummary(false);
      setError("Unauthenticated");
      return;
    }

    setIsLoading(true);

    try {
      const response = await API.get("/banking/summary");
      applySummary(response.data, userId);
      setHasLoadedSummary(true);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        resetState(
          requestError.response?.data?.error ||
            requestError.message ||
            "Your session is no longer active."
        );
        throw requestError;
      }
      setHasLoadedSummary(true);
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Failed to load your banking data."
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
    refreshUserProfile().catch(() => {});
  }, [refreshUserProfile]);

  useEffect(() => {
    const handleAuthChanged = () => {
      const nextIsAuthenticated = hasAuthToken();
      setIsAuthenticated(nextIsAuthenticated);

      if (!nextIsAuthenticated) {
        resetState("");
        return;
      }

      const storedUser = getStoredUser();
      const userId = getUserStorageId(storedUser);
      setUser(storedUser);
      setSelectedAccountId(readSelectedAccountId(userId));
      setHasLoadedSummary(false);
      setIsLoading(true);
      setError("");
      refreshUserProfile().catch(() => {});
      refreshSummary(userId).catch(() => {});
    };

    window.addEventListener("nexbank-auth-changed", handleAuthChanged);
    return () => window.removeEventListener("nexbank-auth-changed", handleAuthChanged);
  }, [applySummary, refreshSummary, refreshUserProfile, resetState]);

  const allAccounts = useMemo(() => accountRecords, [accountRecords]);
  const accounts = useMemo(
    () => allAccounts.filter(isActiveAccount),
    [allAccounts]
  );
  const closedAccounts = useMemo(
    () => allAccounts.filter((account) => account.status === "closed" || account.isActive === false),
    [allAccounts]
  );
  const selectedAccount = useMemo(
    () => accounts.find((account) => account._id === selectedAccountId) || accounts[0] || null,
    [accounts, selectedAccountId]
  );
  const needsAccountOnboarding = isAuthenticated && hasLoadedSummary && !isLoading && accounts.length === 0;

  const allTransactions = useMemo(() => sortByCreatedAtDesc(transactions), [transactions]);
  const allCards = useMemo(() => sortByCreatedAtDesc(cards), [cards]);

  const selectedTransactions = useMemo(
    () =>
      selectedAccount
        ? allTransactions.filter((transaction) => transaction.accountId === selectedAccount._id)
        : [],
    [allTransactions, selectedAccount]
  );

  const selectedCards = useMemo(
    () => (selectedAccount ? allCards.filter((card) => card.accountId === selectedAccount._id) : []),
    [allCards, selectedAccount]
  );

  const dashboardSummary = useMemo(() => {
    const totalAvailableBalance = Number(selectedAccount?.availableBalance || 0);
    const totalLedgerBalance = Number(selectedAccount?.ledgerBalance || 0);
    const moneyIn = selectedTransactions
      .filter((transaction) => transaction.direction === "credit")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const moneyOut = selectedTransactions
      .filter((transaction) => transaction.direction === "debit")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const billsPaid = selectedTransactions
      .filter((transaction) => transaction.type === "bill")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return {
      totalAvailableBalance: roundCurrency(totalAvailableBalance),
      totalLedgerBalance: roundCurrency(totalLedgerBalance),
      moneyIn: roundCurrency(moneyIn),
      moneyOut: roundCurrency(moneyOut),
      billsPaid: roundCurrency(billsPaid),
      accountCount: accounts.length,
      cardCount: selectedCards.length,
      activeCardsCount: selectedCards.filter((card) => card.isActive && !card.isLocked).length,
      lockedCardsCount: selectedCards.filter((card) => card.isLocked).length,
      recentTransactions: selectedTransactions.slice(0, 5),
    };
  }, [accounts.length, selectedAccount, selectedCards, selectedTransactions]);

  const insightsSummary = useMemo(() => {
    const spendingTransactions = selectedTransactions.filter(
      (transaction) => transaction.direction === "debit"
    );
    const spendingCategories = spendingTransactions.reduce((categories, transaction) => {
      const categoryId = resolveInsightCategoryId(transaction);
      const existingCategory = categories.get(categoryId);
      const nextAmount = Number(transaction.amount || 0);

      categories.set(categoryId, {
        id: categoryId,
        label: resolveInsightCategoryLabel(transaction, categoryId),
        amount: roundCurrency((existingCategory?.amount || 0) + nextAmount),
        transactionCount: (existingCategory?.transactionCount || 0) + 1,
      });

      return categories;
    }, new Map());

    const categories = [...spendingCategories.values()].sort((left, right) => right.amount - left.amount);
    const totalSpent = categories.reduce((sum, category) => sum + Number(category.amount || 0), 0);

    return {
      totalSpent: roundCurrency(totalSpent),
      categories,
    };
  }, [selectedTransactions]);

  const createAccount = useCallback(
    async ({ accountType = DEFAULT_ACCOUNT_BLUEPRINT.accountType }) => {
      const blueprint = getAccountBlueprint(accountType);
      const existingAccount = findActiveAccountByType(allAccounts, blueprint.accountType);

      if (existingAccount) {
        const userId = getUserStorageId();
        setSelectedAccountId(existingAccount._id);
        writeSelectedAccountId(userId, existingAccount._id);
        setError("");
        return existingAccount;
      }

      if (isCreatingAccountRef.current) {
        throw new Error("Account creation is already in progress.");
      }

      try {
        isCreatingAccountRef.current = true;
        setIsCreatingAccount(true);
        setError("");
        const response = await API.post("/banking/accounts", {
          accountType: blueprint.accountType,
        });
        const account = response.data.account;
        applySummary(response.data, getUserStorageId());

        const userId = getUserStorageId();
        const nextSelectedId = account?._id || account?.id || null;
        setSelectedAccountId(nextSelectedId);
        writeSelectedAccountId(userId, nextSelectedId);

        return account;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to create account."
        );
        throw requestError;
      } finally {
        isCreatingAccountRef.current = false;
        setIsCreatingAccount(false);
      }
    },
    [allAccounts, applySummary]
  );

  const closeAccount = useCallback(
    async (accountId) => {
      try {
        setError("");
        const response = await API.patch(`/banking/accounts/${accountId}/close`);
        applySummary(response.data, getUserStorageId());
        return response.data.account;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to close account."
        );
        throw requestError;
      }
    },
    [applySummary]
  );

  const settleTransaction = useCallback(
    async (transactionId, status = "completed") => {
      try {
        setError("");
        const response = await API.patch(`/banking/transactions/${transactionId}/status`, {
          status,
        });
        applySummary(response.data, getUserStorageId());
        return response.data.transaction;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to update transaction."
        );
        throw requestError;
      }
    },
    [applySummary]
  );

  const submitMoneyMovement = useCallback(
    async ({
      type,
      direction,
      status,
      fee,
      reference,
      description,
      metadata,
      billerName,
      dynamicFields,
      amount,
      accountId = selectedAccount?._id,
      cardId = null,
      route,
    }) => {
      // 🔹 Ledger Update
      // Every money action passes through one backend command path so balances, fees, and status transitions stay server-owned.
      const currentAccount = accounts.find((account) => account._id === accountId) || null;
      const normalizedAmount = validateMoneyMovement({
        account: currentAccount,
        amount,
        type,
        route,
      });
      validateCardAuthorization({
        account: currentAccount,
        cards,
        cardId,
      });
      try {
        setError("");
        const payload = {
          accountId,
          cardId,
          type,
          direction,
          amount: normalizedAmount,
          fee,
          reference,
          description,
          metadata: {
            ...(metadata || {}),
            ...(cardId ? { cardId } : {}),
          },
        };
        // 🔹 Future-ready
        // Keep bill-specific payload fields outside generic metadata so routes can evolve without UI-only branching.
        if (billerName) {
          payload.billerName = billerName;
        }
        if (dynamicFields) {
          payload.dynamicFields = dynamicFields;
        }
        if (status) {
          payload.status = status;
        }
        const response = await API.post("/banking/transactions", payload);
        applySummary(response.data, getUserStorageId());
        return response.data.transaction;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to submit transaction."
        );
        throw requestError;
      }
    },
    [accounts, cards, applySummary, selectedAccount]
  );

  const depositFunds = useCallback(
    async ({
      accountId,
      amount,
      bankName,
      source,
      accountHolder,
      accountNumber,
      reference,
      transferSpeed,
    }) =>
      submitMoneyMovement({
        accountId,
        type: "deposit",
        direction: "credit",
        amount,
        reference,
        description: `Deposit from ${bankName}`,
        metadata: {
          source,
          bankName,
          accountHolder,
          accountNumber,
          transferSpeed,
        },
      }),
    [submitMoneyMovement]
  );

  const withdrawFunds = useCallback(
    async ({
      accountId,
      amount,
      bankName,
      payoutChannel,
      beneficiaryName,
      accountNumber,
      accountType,
      note,
    }) =>
      submitMoneyMovement({
        accountId,
        type: "withdrawal",
        direction: "debit",
        amount,
        reference: note,
        description: `Withdrawal to ${bankName}`,
        metadata: {
          payoutChannel,
          bankName,
          beneficiaryName,
          accountNumber,
          accountType,
        },
      }),
    [submitMoneyMovement]
  );

  const transferFunds = useCallback(
    async ({
      accountId,
      amount,
      route,
      bankName,
      beneficiaryName,
      accountNumber,
      accountType,
      cellphone,
      reference,
      note,
      code,
    }) =>
      submitMoneyMovement({
        accountId,
        type: "transfer",
        direction: "debit",
        amount,
        route,
        reference,
        description:
          route === "voucher"
            ? "Cash send voucher"
            : route === "internal"
              ? "NexBank transfer"
              : "External bank transfer",
        metadata: {
          route,
          bankName,
          beneficiaryName,
          accountNumber,
          accountType,
          cellphone,
          note,
          code,
        },
      }),
    [submitMoneyMovement]
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
      dynamicFields = {},
    }) =>
      submitMoneyMovement({
        accountId,
        type: "bill",
        direction: "debit",
        amount,
        // 🔹 Banking Logic
        // Amount and fee stay separate so ledger history can show the service charge without changing the bill value itself.
        fee: 2,
        reference,
        description: `Bill payment to ${provider}`,
        billerName: provider,
        dynamicFields: {
          accountNumber,
          billName,
          dueDate,
          ...dynamicFields,
        },
        metadata: {
          category,
          provider,
          accountNumber,
          billName,
          dueDate,
          ...dynamicFields,
        },
      }),
    [submitMoneyMovement]
  );

  const createCard = useCallback(
    async ({ cardType, accountId = selectedAccount?._id }) => {
      try {
        setError("");
        const normalizedType = normalizeCardType(cardType);
        const currentAccount = accounts.find((account) => account._id === accountId) || null;

        if (!currentAccount) {
          throw new Error("Select an account before creating a card.");
        }

        if (!normalizedType) {
          throw new Error("Choose a valid card type.");
        }

        if (normalizedType !== "virtual") {
          throw new Error("Physical cards are issued automatically and cannot be created here.");
        }

        const existingCards = cards.filter((card) => card.accountId === accountId);
        const hasCardOfType = existingCards.some(
          (card) => normalizeCardType(card.cardType || card.type) === normalizedType
        );

        if (hasCardOfType) {
          throw new Error("This account already has that card type.");
        }
        const response = await API.post("/banking/cards", {
          accountId,
          cardType: "Virtual Card",
        });
        applySummary(response.data, getUserStorageId());
        return response.data.card;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to create card."
        );
        throw requestError;
      }
    },
    [accounts, cards, applySummary, selectedAccount]
  );

  const updateCard = useCallback(
    async (cardId, payload) => {
      try {
        setError("");
        const response = await API.patch(`/banking/cards/${cardId}`, payload);
        applySummary(response.data, getUserStorageId());
        return response.data.card;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to update card."
        );
        throw requestError;
      }
    },
    [applySummary]
  );

  const freezeCard = useCallback(
    async (cardId) => {
      try {
        setError("");
        const response = await API.post(`/banking/cards/${cardId}/freeze`);
        applySummary(response.data, getUserStorageId());
        return response.data.card;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to freeze card."
        );
        throw requestError;
      }
    },
    [applySummary]
  );

  const replaceCard = useCallback(
    async (cardId) => {
      try {
        setError("");
        const response = await API.post(`/banking/cards/${cardId}/replace`);
        applySummary(response.data, getUserStorageId());
        return response.data.replacement;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to replace card."
        );
        throw requestError;
      }
    },
    [applySummary]
  );

  const getCardDetails = useCallback(
    async (cardId) => {
      const cachedDetails = cardDetailsById[cardId];
      if (cachedDetails) {
        return cachedDetails;
      }
      try {
        setError("");
        const response = await API.get(`/banking/cards/${cardId}/details`);
        const details = response.data.details;

        setCardDetailsById((current) => ({
          ...current,
          [cardId]: details,
        }));

        return details;
      } catch (requestError) {
        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to load card details."
        );
        throw requestError;
      }
    },
    [cardDetailsById]
  );

  const value = useMemo(
    () => ({
      accounts,
      allAccounts,
      closedAccounts,
      user,
      isAuthenticated,
      selectedAccount,
      selectedAccountId,
      selectedCards,
      selectedTransactions,
      allCards,
      allTransactions,
      cardDetailsById,
      isLoading,
      hasLoadedSummary,
      isCreatingAccount,
      error,
      needsAccountOnboarding,
      dashboardSummary,
      insightsSummary,
      refreshSummary,
      refreshUserProfile,
      updateStoredUser,
      selectAccount: (accountId) => {
        const userId = getUserStorageId();
        setSelectedAccountId(accountId);
        writeSelectedAccountId(userId, accountId);
      },
      createAccount,
      closeAccount,
      createCard,
      updateCard,
      freezeCard,
      replaceCard,
      getCardDetails,
      settleTransaction,
      depositFunds,
      withdrawFunds,
      transferFunds,
      payBill,
    }),
    [
      accounts,
      allAccounts,
      allCards,
      allTransactions,
      cardDetailsById,
      closeAccount,
      closedAccounts,
      createAccount,
      createCard,
      dashboardSummary,
      depositFunds,
      error,
      freezeCard,
      getCardDetails,
      hasLoadedSummary,
      isAuthenticated,
      insightsSummary,
      isLoading,
      isCreatingAccount,
      needsAccountOnboarding,
      payBill,
      refreshSummary,
      refreshUserProfile,
      replaceCard,
      selectedAccount,
      selectedAccountId,
      selectedCards,
      selectedTransactions,
      settleTransaction,
      transferFunds,
      updateCard,
      updateStoredUser,
      user,
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

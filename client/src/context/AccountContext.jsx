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
const LOCAL_BANKING_STATE_KEY_PREFIX = "nexbank-banking-state";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINIMUM_ACTIVATION_FUNDING = 0;
const ACTIVE_CARD_STATUS = "active";
const FROZEN_CARD_STATUS = "frozen";
const REPLACED_CARD_STATUS = "replaced";

const DEFAULT_LIMITS = Object.freeze({
  deposit: 50000,
  bill: 15000,
  transferInternal: 20000,
  transferExternal: 10000,
  voucher: 3000,
});

const DEFAULT_ACCOUNT_BLUEPRINT = Object.freeze({
  name: "Main Account",
  accountType: "Main Account",
});

const ACCOUNT_TYPE_BLUEPRINTS = Object.freeze({
  "Main Account": {
    name: "Main Account",
    accountType: "Main Account",
    category: "cheque",
  },
  TruSave: {
    name: "TruSave",
    accountType: "TruSave",
    category: "savings",
  },
  "Flexi Account": {
    name: "Flexi Account",
    accountType: "Flexi Account",
    category: "cheque",
  },
  "Transact Account": {
    name: "Transact Account",
    accountType: "Transact Account",
    category: "transact",
  },
  "Student Account": {
    name: "Student Account",
    accountType: "Student Account",
    category: "student",
  },
  "Private Banking": {
    name: "Private Banking",
    accountType: "Private Banking",
    category: "private",
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

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const sortByCreatedAtDesc = (items = []) =>
  [...items].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

const humanizeValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

const getAccountBlueprint = (accountType = DEFAULT_ACCOUNT_BLUEPRINT.accountType) =>
  ACCOUNT_TYPE_BLUEPRINTS[accountType] || {
    name: accountType || DEFAULT_ACCOUNT_BLUEPRINT.name,
    accountType: accountType || DEFAULT_ACCOUNT_BLUEPRINT.accountType,
    category: "cheque",
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

const getStoredUser = () => safeJsonParse(window.localStorage.getItem("user"));

const getUserStorageId = (user = getStoredUser()) => user?._id || user?.email || "guest";

const getSelectedAccountStorageKey = (userId = getUserStorageId()) =>
  `${SELECTED_ACCOUNT_KEY_PREFIX}:${userId}`;

const getLocalBankingStateStorageKey = (userId = getUserStorageId()) =>
  `${LOCAL_BANKING_STATE_KEY_PREFIX}:${userId}`;

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

const buildAccountNumber = (userId, index) => {
  const digits = String(userId).replace(/\D/g, "").padEnd(8, String(index + 1)).slice(0, 8);
  return `10${index + 1}${digits}`;
};

const buildLast4Digits = (accountNumber, offset = 0) => {
  const baseValue = Number(String(accountNumber).slice(-4) || 0);
  return String(baseValue + offset).padStart(4, "0").slice(-4);
};

const buildMaskedPan = (last4Digits) => `5214 **** **** ${String(last4Digits).slice(-4).padStart(4, "0")}`;

const buildSimulatedCvv = (cardId) =>
  String(
    100 +
      [...String(cardId || "card")]
        .reduce((sum, character) => sum + character.charCodeAt(0), 0) % 900
  );

const toIsoDate = (value) => new Date(value).toISOString();

const resolveAccountActivation = () => ({
  isActive: true,
  status: "active",
});

const normalizeAccount = (account, userId, index) => {
  const accountId = account?._id || account?.id || `account-${userId}-${index + 1}`;
  const blueprint = getAccountBlueprint(account?.accountType);
  const accountType = account?.accountType || blueprint.accountType;
  const name = account?.name || blueprint.name;
  const availableBalance = roundCurrency(
    account?.availableBalance ?? account?.balance ?? account?.ledgerBalance ?? 0
  );
  const ledgerBalance = roundCurrency(account?.ledgerBalance ?? availableBalance);
  const minimumFundingAmount = 0;
  const { isActive, status } = resolveAccountActivation();

  return {
    _id: accountId,
    id: accountId,
    userId: account?.userId || userId,
    name,
    accountType,
    category: account?.category || blueprint.category,
    accountNumber: String(account?.accountNumber || buildAccountNumber(userId, index))
      .replace(/\D/g, "")
      .slice(0, 11)
      .padStart(11, "0"),
    availableBalance,
    ledgerBalance,
    minimumFundingAmount,
    isActive,
    status,
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
    direction: transaction?.direction || "debit",
    type: transaction?.type || "transfer",
    status: transaction?.status || "completed",
    reference: transaction?.reference || "",
    description: transaction?.description || humanizeValue(transaction?.type || "transaction"),
    metadata: transaction?.metadata || {},
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
  (status === FROZEN_CARD_STATUS ||
   status === REPLACED_CARD_STATUS),
    contactlessEnabled: card?.contactlessEnabled ?? true,
    onlinePaymentsEnabled: card?.onlinePaymentsEnabled ?? true,
    atmWithdrawalsEnabled: card?.atmWithdrawalsEnabled ?? normalizedType === "physical",
    replacedByCardId: card?.replacedByCardId || null,
    replacedAt: card?.replacedAt || null,
    cardNumber: String(card?.cardNumber || buildMaskedPan(card?.last4Digits || "0000").replace(/\D/g, "").slice(0, 16)).padStart(16, "0").slice(-16),
    detailsSource: "system",
    createdAt,
  };
};

const createSystemCard = ({ account, cardType, createdAt = new Date().toISOString(), offset = 0 }) =>
  normalizeCard(
    {
      _id: `card-${account._id}-${normalizeCardType(cardType)}`,
      userId: account.userId,
      accountId: account._id,
      cardType,
      cardName:
        normalizeCardType(cardType) === "physical" ? "NexBank Physical Card" : "NexBank Virtual Card",
      cardNumber: `5214${String(account.accountNumber || "").padStart(11, "0").slice(-11)}${String(offset).padStart(1, "0")}`,
      last4Digits: buildLast4Digits(account.accountNumber, offset),
      createdAt,
      expiryDate: toIsoDate(
        new Date(new Date(createdAt).setFullYear(new Date(createdAt).getFullYear() + 4))
      ),
      status: ACTIVE_CARD_STATUS,
      isActive: Boolean(account.isActive),
      isLocked: false,
      contactlessEnabled: true,
      onlinePaymentsEnabled: true,
      atmWithdrawalsEnabled: normalizeCardType(cardType) === "physical",
    },
    account.userId,
    0
  );

const syncAccountActivation = (accounts = []) =>
  accounts.map((account) => ({
    ...account,
    ...resolveAccountActivation(),
  }));

const syncCardsToAccounts = (cards = [], accounts = []) =>
  cards.map((card) => {
    const linkedAccount = accounts.find((account) => account._id === card.accountId);

    if (!linkedAccount) {
      return card;
    }

    const isLifecycleBlocked =
      card.status === FROZEN_CARD_STATUS || card.status === REPLACED_CARD_STATUS;

    return {
      ...card,
      isActive: !isLifecycleBlocked && card.status === ACTIVE_CARD_STATUS,
      isLocked: card.status === FROZEN_CARD_STATUS || card.status === REPLACED_CARD_STATUS,
    };
  });

const applyTransactionToAccount = (account, transaction) => {
  if (account._id !== transaction.accountId) {
    return account;
  }

  const signedAmount =
    transaction.direction === "credit" ? Number(transaction.amount || 0) : -Number(transaction.amount || 0);

  return {
    ...account,
    availableBalance: roundCurrency(account.availableBalance + signedAmount),
    ledgerBalance: roundCurrency(account.ledgerBalance + signedAmount),
  };
};

const buildProvisionedSummary = (userId) => {
  const accounts = [
    normalizeAccount(
      {
        _id: `account-${userId}-1`,
        userId,
        name: DEFAULT_ACCOUNT_BLUEPRINT.name,
        accountType: DEFAULT_ACCOUNT_BLUEPRINT.accountType,
        accountNumber: buildAccountNumber(userId, 0),
        availableBalance: 0,
        ledgerBalance: 0,
        createdAt: toIsoDate(Date.now() - 12 * DAY_IN_MS),
        minimumFundingAmount: MINIMUM_ACTIVATION_FUNDING,
        isActive: true,
      },
      userId,
      0
    ),
  ];

  const cards = [
    createSystemCard({
      account: accounts[0],
      cardType: "Physical Card",
      createdAt: accounts[0].createdAt,
      offset: 0,
    }),
  ];

  return {
    accounts,
    cards,
    transactions: [],
  };
};

const normalizeBankingSummary = (summary, userId) => {
  const hasSummaryContent =
    Array.isArray(summary?.accounts) ||
    Array.isArray(summary?.cards) ||
    Array.isArray(summary?.transactions);

  if (!hasSummaryContent) {
    return buildProvisionedSummary(userId);
  }

  const normalizedAccountsSource =
    Array.isArray(summary?.accounts) && summary.accounts.length > 0
      ? summary.accounts
      : buildProvisionedSummary(userId).accounts;

  const accounts = syncAccountActivation(
    normalizedAccountsSource.map((account, index) =>
    normalizeAccount(account, userId, index)
    )
  );

  const transactions = sortByCreatedAtDesc(
    (Array.isArray(summary?.transactions) ? summary.transactions : [])
      .map((transaction, index) => normalizeTransaction(transaction, index))
      .filter((transaction) => accounts.some((account) => account._id === transaction.accountId))
  );

  const cards = sortByCreatedAtDesc(
    (Array.isArray(summary?.cards) ? summary.cards : [])
      .map((card, index) => normalizeCard(card, userId, index))
      .filter((card) => card.status !== REPLACED_CARD_STATUS)
      .filter((card) => accounts.some((account) => account._id === card.accountId))
  );

  const constrainedCards = accounts.flatMap((account, index) => {
    const accountCards = cards.filter((card) => card.accountId === account._id);
    const hasPhysicalCard = accountCards.some(
      (card) => normalizeCardType(card.cardType || card.type) === "physical"
    );

    if (hasPhysicalCard) {
      return accountCards;
    }

    return [
      ...accountCards,
      createSystemCard({
        account,
        cardType: "Physical Card",
        createdAt: account.createdAt,
        offset: index,
      }),
    ];
  });

  return {
    accounts,
    cards: sortByCreatedAtDesc(syncCardsToAccounts(constrainedCards, accounts)),
    transactions,
  };
};

const loadLocalBankingSummary = (userId, seedSummary = null) => {
  const storedSummary = safeJsonParse(
    window.localStorage.getItem(getLocalBankingStateStorageKey(userId)),
    null
  );
  const nextSummary = normalizeBankingSummary(storedSummary || seedSummary, userId);
  window.localStorage.setItem(getLocalBankingStateStorageKey(userId), JSON.stringify(nextSummary));
  return nextSummary;
};

const shouldUseLocalFallback = (requestError) => {
  const status = requestError.response?.status;
  return !requestError.response || status === 404 || status === 405 || status === 501;
};

const resolveTransferLimitField = (route) => {
  if (route === "internal") {
    return "transferInternal";
  }

  if (route === "external") {
    return "transferExternal";
  }

  return "voucher";
};

const validateMoneyMovement = ({ account, amount, type, route }) => {
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

  const limitField =
    type === "deposit"
      ? "deposit"
      : type === "bill"
        ? "bill"
        : type === "transfer"
          ? resolveTransferLimitField(route)
          : null;

  if (limitField && normalizedAmount > Number(account.limits?.[limitField] || 0)) {
    throw new Error("This exceeds the allowed limit for the selected account.");
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
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cardDetailsById, setCardDetailsById] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    readSelectedAccountId(getUserStorageId())
  );
  const [isLoading, setIsLoading] = useState(() => Boolean(window.localStorage.getItem("token")));
  const [error, setError] = useState("");
  const dataModeRef = useRef("api");
  const bankingStateRef = useRef({
    accounts: [],
    cards: [],
    transactions: [],
  });

  const applySummary = useCallback((summary, userId = getUserStorageId()) => {
    const nextSummary = normalizeBankingSummary(summary, userId);
    bankingStateRef.current = {
      accounts: nextSummary.accounts,
      cards: nextSummary.cards,
      transactions: nextSummary.transactions,
    };

    setAccounts(nextSummary.accounts);
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
      const preferredSelectedId = currentSelectedId || persistedSelectedId;
      const hasPreferredAccount = nextSummary.accounts.some(
        (account) => account._id === preferredSelectedId
      );
      const nextSelectedId =
        hasPreferredAccount ? preferredSelectedId : nextSummary.accounts[0]?._id || null;

      writeSelectedAccountId(userId, nextSelectedId);
      return nextSelectedId;
    });

    return nextSummary;
  }, []);

  const commitLocalSummary = useCallback(
    (summary, userId = getUserStorageId()) => {
      const nextSummary = normalizeBankingSummary(summary, userId);
      window.localStorage.setItem(
        getLocalBankingStateStorageKey(userId),
        JSON.stringify(nextSummary)
      );
      dataModeRef.current = "local";
      applySummary(nextSummary, userId);
      return nextSummary;
    },
    [applySummary]
  );

  const resetState = useCallback((message = "") => {
    writeSelectedAccountId(getUserStorageId(), null);
    bankingStateRef.current = {
      accounts: [],
      cards: [],
      transactions: [],
    };
    setAccounts([]);
    setCards([]);
    setTransactions([]);
    setCardDetailsById({});
    setSelectedAccountId(null);
    setError(message);
  }, []);

  const refreshSummary = useCallback(async () => {
    const token = window.localStorage.getItem("token");
    const userId = getUserStorageId();

    if (!token) {
      resetState("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await API.get("/banking/summary");
      dataModeRef.current = "api";
      applySummary(response.data, userId);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        resetState(
          requestError.response?.data?.error ||
            requestError.message ||
            "Your session is no longer active."
        );
        throw requestError;
      }

      const currentBankingState = bankingStateRef.current;
      const fallbackSummary = loadLocalBankingSummary(
        userId,
        currentBankingState.accounts.length > 0 ||
          currentBankingState.cards.length > 0 ||
          currentBankingState.transactions.length > 0
          ? currentBankingState
          : null
      );

      dataModeRef.current = "local";
      applySummary(fallbackSummary, userId);
    } finally {
      setIsLoading(false);
    }
  }, [applySummary, resetState]);

  useEffect(() => {
    refreshSummary().catch(() => {});
  }, [refreshSummary]);

  useEffect(() => {
    const handleAuthChanged = () => {
      setSelectedAccountId(readSelectedAccountId(getUserStorageId()));
      refreshSummary().catch(() => {});
    };

    window.addEventListener("nexbank-auth-changed", handleAuthChanged);
    return () => window.removeEventListener("nexbank-auth-changed", handleAuthChanged);
  }, [refreshSummary]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account._id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

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

  const hasActiveAccount = Boolean(selectedAccount);

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

  const executeWithBankingFallback = useCallback(
    async ({ apiRequest, localUpdate, extractResult }) => {
      const userId = getUserStorageId();

      if (dataModeRef.current !== "local" && apiRequest) {
        try {
          const response = await apiRequest();
          dataModeRef.current = "api";
          applySummary(response.data, userId);
          return extractResult(response.data);
        } catch (requestError) {
          if (!shouldUseLocalFallback(requestError)) {
            throw requestError;
          }
        }
      }

      const currentBankingState = bankingStateRef.current;
      const currentSummary =
        currentBankingState.accounts.length > 0 ||
        currentBankingState.cards.length > 0 ||
        currentBankingState.transactions.length > 0
          ? currentBankingState
          : null;
      const baseSummary = loadLocalBankingSummary(userId, currentSummary);
      const { nextSummary, result } = localUpdate(baseSummary);

      commitLocalSummary(nextSummary, userId);
      return result;
    },
    [applySummary, commitLocalSummary]
  );

  const createAccount = useCallback(
    async ({ accountType = DEFAULT_ACCOUNT_BLUEPRINT.accountType }) => {
      const blueprint = getAccountBlueprint(accountType);

      const account = await executeWithBankingFallback({
        apiRequest: () =>
          API.post("/banking/accounts", {
            accountType: blueprint.accountType,
          }),
        localUpdate: (summary) => {
          const userId = getUserStorageId();
          const nextAccount = normalizeAccount(
            {
              _id: createId("account"),
              userId,
              name: blueprint.name,
              accountType: blueprint.accountType,
              category: blueprint.category,
              accountNumber: buildAccountNumber(userId, summary.accounts.length),
              availableBalance: 0,
              ledgerBalance: 0,
              createdAt: new Date().toISOString(),
            },
            userId,
            summary.accounts.length
          );
          const nextAccounts = [...summary.accounts, nextAccount];
          const physicalCard = createSystemCard({
            account: nextAccount,
            cardType: "Physical Card",
            createdAt: nextAccount.createdAt,
            offset: summary.accounts.length,
          });

          return {
            nextSummary: {
              ...summary,
              accounts: nextAccounts,
              cards: sortByCreatedAtDesc(
                syncCardsToAccounts([physicalCard, ...summary.cards], nextAccounts)
              ),
            },
            result: nextAccount,
          };
        },
        extractResult: (data) => data.account,
      });

      const userId = getUserStorageId();
      const nextSelectedId = account?._id || account?.id || null;
      setSelectedAccountId(nextSelectedId);
      writeSelectedAccountId(userId, nextSelectedId);

      return account;
    },
    [executeWithBankingFallback]
  );

  const settleTransaction = useCallback(
    async (transactionId, status = "completed") =>
      executeWithBankingFallback({
        apiRequest: () =>
          API.patch(`/banking/transactions/${transactionId}/status`, {
            status,
          }),
        localUpdate: (summary) => {
          const nextTransactions = summary.transactions.map((transaction) =>
            transaction._id === transactionId || transaction.id === transactionId
              ? { ...transaction, status }
              : transaction
          );
          const nextSummary = {
            ...summary,
            transactions: sortByCreatedAtDesc(nextTransactions),
          };
          const result =
            nextTransactions.find(
              (transaction) => transaction._id === transactionId || transaction.id === transactionId
            ) || null;

          return {
            nextSummary,
            result,
          };
        },
        extractResult: (data) => data.transaction,
      }),
    [executeWithBankingFallback]
  );

  const scheduleSettlement = useCallback(
    (transactionId, delayInMs) => {
      if (!delayInMs) {
        return;
      }

      window.setTimeout(() => {
        settleTransaction(transactionId, "completed").catch(() => {});
      }, delayInMs);
    },
    [settleTransaction]
  );

  const submitMoneyMovement = useCallback(
    async ({
      type,
      direction,
      status,
      reference,
      description,
      metadata,
      amount,
      accountId = selectedAccount?._id,
      cardId = null,
      route,
      completionDelayMs,
    }) => {
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

      const transaction = await executeWithBankingFallback({
        apiRequest: () =>
          API.post("/banking/transactions", {
            accountId,
            cardId,
            type,
            direction,
            amount: normalizedAmount,
            status,
            reference,
            description,
            metadata: {
              ...(metadata || {}),
              ...(cardId ? { cardId } : {}),
            },
          }),
        localUpdate: (summary) => {
          const targetAccount = summary.accounts.find((account) => account._id === accountId) || null;
          const validatedAmount = validateMoneyMovement({
            account: targetAccount,
            amount: normalizedAmount,
            type,
            route,
          });
          validateCardAuthorization({
            account: targetAccount,
            cards: summary.cards,
            cardId,
          });
          const transactionId = createId(`transaction-${type}`);
          const nextTransaction = normalizeTransaction(
            {
              _id: transactionId,
              accountId,
              cardId,
              amount: validatedAmount,
              direction,
              type,
              status,
              reference,
              description,
              metadata: {
                ...(metadata || {}),
                ...(cardId ? { cardId } : {}),
              },
              createdAt: new Date().toISOString(),
            },
            summary.transactions.length
          );
          const nextAccounts = syncAccountActivation(
            summary.accounts.map((account) => applyTransactionToAccount(account, nextTransaction))
          );
          const nextTransactions = sortByCreatedAtDesc([nextTransaction, ...summary.transactions]);

          return {
            nextSummary: {
              ...summary,
              accounts: nextAccounts,
              cards: syncCardsToAccounts(summary.cards, nextAccounts),
              transactions: nextTransactions,
            },
            result: nextTransaction,
          };
        },
        extractResult: (data) => data.transaction,
      });

      scheduleSettlement(transaction._id || transaction.id, completionDelayMs);
      return transaction;
    },
    [accounts, cards, executeWithBankingFallback, scheduleSettlement, selectedAccount]
  );

  const depositFunds = useCallback(
    async ({
      amount,
      bankName,
      source,
      accountHolder,
      accountNumber,
      reference,
      transferSpeed,
    }) =>
      submitMoneyMovement({
        type: "deposit",
        direction: "credit",
        status: "pending",
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
        completionDelayMs: transferSpeed === "priority" ? 3000 : 5000,
      }),
    [submitMoneyMovement]
  );

  const withdrawFunds = useCallback(
    async ({
      amount,
      bankName,
      payoutChannel,
      beneficiaryName,
      accountNumber,
      accountType,
      note,
    }) =>
      submitMoneyMovement({
        type: "withdrawal",
        direction: "debit",
        status: "pending",
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
        completionDelayMs: payoutChannel === "atm-code" ? 2500 : 4000,
      }),
    [submitMoneyMovement]
  );

  const transferFunds = useCallback(
    async ({
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
        type: "transfer",
        direction: "debit",
        status: route === "external" ? "pending" : "completed",
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
        completionDelayMs: route === "external" ? 4500 : 0,
      }),
    [submitMoneyMovement]
  );

  const payBill = useCallback(
    async ({ amount, category, provider, accountNumber, billName, dueDate, reference }) =>
      submitMoneyMovement({
        type: "bill",
        direction: "debit",
        status: "pending",
        amount,
        reference,
        description: `Bill payment to ${provider}`,
        metadata: {
          category,
          provider,
          accountNumber,
          billName,
          dueDate,
        },
        completionDelayMs: 4000,
      }),
    [submitMoneyMovement]
  );

  const createCard = useCallback(
    async ({ cardType, accountId = selectedAccount?._id }) => {
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

      return executeWithBankingFallback({
        apiRequest: () =>
          API.post("/banking/cards", {
            accountId,
            cardType: "Virtual Card",
          }),
        localUpdate: (summary) => {
          const targetAccount = summary.accounts.find((account) => account._id === accountId) || null;
          const accountCards = summary.cards.filter((card) => card.accountId === accountId);
          const cardAlreadyExists = accountCards.some(
            (card) => normalizeCardType(card.cardType || card.type) === normalizedType
          );

          if (!targetAccount) {
            throw new Error("Select an account before creating a card.");
          }

          if (cardAlreadyExists) {
            throw new Error("This account already has that card type.");
          }

          const nextCard = createSystemCard({
            account: targetAccount,
            cardType: "Virtual Card",
            createdAt: new Date().toISOString(),
            offset: 17,
          });

          return {
            nextSummary: {
              ...summary,
              cards: sortByCreatedAtDesc([nextCard, ...summary.cards]).filter(
                (card) => card.status !== REPLACED_CARD_STATUS
              ),
            },
            result: nextCard,
          };
        },
        extractResult: (data) => data.card,
      });
    },
    [accounts, cards, executeWithBankingFallback, selectedAccount]
  );

  const updateCard = useCallback(
    async (cardId, payload) =>
      executeWithBankingFallback({
        apiRequest: () => API.patch(`/banking/cards/${cardId}`, payload),
        localUpdate: (summary) => {
          const targetCard =
            summary.cards.find((card) => card._id === cardId || card.id === cardId) || null;

          if (!targetCard) {
            throw new Error("Card not found.");
          }

          if (targetCard.status === REPLACED_CARD_STATUS) {
            throw new Error("A replaced card cannot be changed.");
          }

          const nextCards = summary.cards.map((card) =>
            card._id === cardId || card.id === cardId ? { ...card, ...payload } : card
          );
          const result =
            nextCards.find((card) => card._id === cardId || card.id === cardId) || null;

          return {
            nextSummary: {
              ...summary,
              cards: sortByCreatedAtDesc(syncCardsToAccounts(nextCards, summary.accounts)),
            },
            result,
          };
        },
        extractResult: (data) => data.card,
      }),
    [executeWithBankingFallback]
  );

  const freezeCard = useCallback(
    async (cardId) =>
      executeWithBankingFallback({
        apiRequest: () => API.post(`/banking/cards/${cardId}/freeze`),
        localUpdate: (summary) => {
          const targetCard =
            summary.cards.find((card) => card._id === cardId || card.id === cardId) || null;

          if (!targetCard) {
            throw new Error("Card not found.");
          }

          if (targetCard.status === REPLACED_CARD_STATUS) {
            throw new Error("A replaced card cannot be frozen.");
          }

          const nextCards = summary.cards.map((card) =>
            card._id === cardId || card.id === cardId
              ? {
                  ...card,
                  status: FROZEN_CARD_STATUS,
                  isActive: false,
                  isLocked: true,
                }
              : card
          );
          const nextSummary = {
            ...summary,
            cards: sortByCreatedAtDesc(syncCardsToAccounts(nextCards, summary.accounts)).filter(
              (card) => card.status !== REPLACED_CARD_STATUS
            ),
          };
          const result =
            nextSummary.cards.find((card) => card._id === cardId || card.id === cardId) || null;

          return {
            nextSummary,
            result,
          };
        },
        extractResult: (data) => data.card,
      }),
    [executeWithBankingFallback]
  );

  const replaceCard = useCallback(
    async (cardId) =>
      executeWithBankingFallback({
        apiRequest: () => API.post(`/banking/cards/${cardId}/replace`),
        localUpdate: (summary) => {
          const targetCard =
            summary.cards.find((card) => card._id === cardId || card.id === cardId) || null;

          if (!targetCard) {
            throw new Error("Card not found.");
          }

          const account =
            summary.accounts.find((item) => item._id === targetCard.accountId) || null;

          const existingReplacement =
            summary.cards.find(
              (card) =>
                (card._id === targetCard.replacedByCardId || card.id === targetCard.replacedByCardId) &&
                card.status !== REPLACED_CARD_STATUS
            ) || null;

          if (existingReplacement) {
            const nextCards = summary.cards.filter(
              (card) => card._id !== targetCard._id && card.id !== targetCard.id
            );

            return {
              nextSummary: {
                ...summary,
                cards: sortByCreatedAtDesc(nextCards),
              },
              result: {
                oldCard: {
                  ...targetCard,
                  status: REPLACED_CARD_STATUS,
                  isActive: false,
                  isLocked: true,
                },
                newCard: existingReplacement,
              },
            };
          }

          if (!account) {
            throw new Error("Account not found.");
          }

          const replacementCard = createSystemCard({
            account,
            cardType: targetCard.cardType,
            createdAt: new Date().toISOString(),
            offset: 31,
          });
          const replacementId = createId(`card-${normalizeCardType(targetCard.cardType) || "card"}`);

          const rotatedReplacement = {
            ...replacementCard,
            _id: replacementId,
            id: replacementId,
            cardName: targetCard.cardName,
            status: ACTIVE_CARD_STATUS,
            isActive: Boolean(account.isActive),
            isLocked: false,
            contactlessEnabled: targetCard.contactlessEnabled,
            onlinePaymentsEnabled: targetCard.onlinePaymentsEnabled,
            atmWithdrawalsEnabled: targetCard.atmWithdrawalsEnabled,
          };
          const nextCards = summary.cards.map((card) =>
            card._id === cardId || card.id === cardId
              ? {
                  ...card,
                  status: REPLACED_CARD_STATUS,
                  isActive: false,
                  isLocked: true,
                  replacedByCardId: rotatedReplacement._id,
                  replacedAt: new Date().toISOString(),
                }
              : card
          );
          const nextSummary = {
            ...summary,
            cards: sortByCreatedAtDesc(
              syncCardsToAccounts([rotatedReplacement, ...nextCards], summary.accounts)
            ).filter((card) => card.status !== REPLACED_CARD_STATUS),
          };

          return {
            nextSummary,
            result: {
              oldCard: {
                ...targetCard,
                status: REPLACED_CARD_STATUS,
                isActive: false,
                isLocked: true,
                replacedByCardId: rotatedReplacement._id,
                replacedAt: new Date().toISOString(),
              },
              newCard: rotatedReplacement,
            },
          };
        },
        extractResult: (data) => data.replacement,
      }),
    [executeWithBankingFallback]
  );

  const getCardDetails = useCallback(
    async (cardId) => {
      const cachedDetails = cardDetailsById[cardId];
      if (cachedDetails) {
        return cachedDetails;
      }

      let details;

      if (dataModeRef.current !== "local") {
        try {
          const response = await API.get(`/banking/cards/${cardId}/details`);
          details = response.data.details;
        } catch (requestError) {
          if (!shouldUseLocalFallback(requestError)) {
            throw requestError;
          }
        }
      }

      if (!details) {
        const summary = loadLocalBankingSummary(getUserStorageId(), bankingStateRef.current);
        const targetCard =
          summary.cards.find((card) => card._id === cardId || card.id === cardId) || null;

        if (!targetCard) {
          throw new Error("Card not found.");
        }

        details = {
          cardId: targetCard._id,
          cardType: targetCard.cardType,
          cardName: targetCard.cardName,
          last4Digits: targetCard.last4Digits,
          expiryDate: targetCard.expiryDate,
          status: targetCard.status,
          maskedPan: buildMaskedPan(targetCard.last4Digits),
          cvv: buildSimulatedCvv(targetCard._id),
        };
      }

      setCardDetailsById((current) => ({
        ...current,
        [cardId]: details,
      }));

      return details;
    },
    [cardDetailsById]
  );

  const value = useMemo(
    () => ({
      accounts,
      selectedAccount,
      selectedAccountId,
      selectedCards,
      selectedTransactions,
      allCards,
      allTransactions,
      cardDetailsById,
      hasActiveAccount,
      isLoading,
      error,
      dashboardSummary,
      insightsSummary,
      refreshSummary,
      selectAccount: (accountId) => {
        const userId = getUserStorageId();
        setSelectedAccountId(accountId);
        writeSelectedAccountId(userId, accountId);
      },
      clearSelectedAccount: () => {
        const userId = getUserStorageId();
        setSelectedAccountId(null);
        writeSelectedAccountId(userId, null);
      },
      createAccount,
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
      allCards,
      allTransactions,
      cardDetailsById,
      createAccount,
      createCard,
      dashboardSummary,
      depositFunds,
      error,
      freezeCard,
      getCardDetails,
      hasActiveAccount,
      insightsSummary,
      isLoading,
      payBill,
      refreshSummary,
      replaceCard,
      selectedAccount,
      selectedAccountId,
      selectedCards,
      selectedTransactions,
      settleTransaction,
      transferFunds,
      updateCard,
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

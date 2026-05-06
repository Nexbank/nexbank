const Account = require("../models/Account");
const Card = require("../models/Card");
const Transaction = require("../models/Transaction");

const ACTIVE_CARD_STATUS = "active";
const FROZEN_CARD_STATUS = "frozen";
const REPLACED_CARD_STATUS = "replaced";
const ACTIVE_ACCOUNT_STATUS = "active";
const CLOSED_ACCOUNT_STATUS = "closed";
const ACCOUNT_TYPE_RULES = Object.freeze({
  current: {
    category: "transactional",
    monthlyFee: 50,
    dailyTransferLimit: 10000,
    allowsCards: true,
    allowsBillPayments: true,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
  savings: {
    category: "savings",
    monthlyFee: 0,
    dailyTransferLimit: 5000,
    allowsCards: false,
    allowsBillPayments: false,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
  student: {
    category: "transactional",
    monthlyFee: 0,
    dailyTransferLimit: 3000,
    allowsCards: true,
    allowsBillPayments: true,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
  fixed_deposit: {
    category: "investment",
    monthlyFee: 0,
    dailyTransferLimit: 0,
    allowsCards: false,
    allowsBillPayments: false,
    allowsWithdrawals: false,
    allowsTransfers: false,
  },
  tax_free_savings: {
    category: "savings",
    monthlyFee: 0,
    dailyTransferLimit: 36000,
    allowsCards: false,
    allowsBillPayments: false,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
  private_banking: {
    category: "transactional",
    monthlyFee: 150,
    dailyTransferLimit: 100000,
    allowsCards: true,
    allowsBillPayments: true,
    allowsWithdrawals: true,
    allowsTransfers: true,
  },
});
const DEFAULT_ACCOUNT_CLASSIFICATION = Object.freeze({
  name: "Main Account",
  accountType: "current",
  category: "transactional",
});
const ACCOUNT_CLASSIFICATIONS = Object.freeze({
  current: {
    name: "Main Account",
    accountType: "current",
    category: "transactional",
  },
  savings: {
    name: "TruSave",
    accountType: "savings",
    category: "savings",
  },
  student: {
    name: "Student Account",
    accountType: "student",
    category: "transactional",
  },
  fixed_deposit: {
    name: "Fixed Deposit",
    accountType: "fixed_deposit",
    category: "investment",
  },
  tax_free_savings: {
    name: "Tax-Free Savings",
    accountType: "tax_free_savings",
    category: "savings",
  },
  private_banking: {
    name: "Private Banking",
    accountType: "private_banking",
    category: "transactional",
  },
});
const LEGACY_ACCOUNT_CLASSIFICATIONS = Object.freeze({
  Current: DEFAULT_ACCOUNT_CLASSIFICATION,
  "Current Account": DEFAULT_ACCOUNT_CLASSIFICATION,
  "Main Account": ACCOUNT_CLASSIFICATIONS.current,
  current_account: DEFAULT_ACCOUNT_CLASSIFICATION,
  main_account: ACCOUNT_CLASSIFICATIONS.current,
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
  "Transact Account": {
    name: "Transact Account",
    accountType: "current",
    category: "transactional",
  },
  transact_account: {
    name: "Transact Account",
    accountType: "current",
    category: "transactional",
  },
  TruSave: ACCOUNT_CLASSIFICATIONS.savings,
  trusave: ACCOUNT_CLASSIFICATIONS.savings,
  "Student Account": ACCOUNT_CLASSIFICATIONS.student,
  student_account: ACCOUNT_CLASSIFICATIONS.student,
  "Fixed Deposit": ACCOUNT_CLASSIFICATIONS.fixed_deposit,
  "Tax-Free Savings": ACCOUNT_CLASSIFICATIONS.tax_free_savings,
  "Private Banking": ACCOUNT_CLASSIFICATIONS.private_banking,
  private_banking: ACCOUNT_CLASSIFICATIONS.private_banking,
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

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));
const getDebitImpactAmount = (transaction) =>
  roundMoney(Number(transaction.amount || 0) + Number(transaction.fee || 0));
const generateTransferGroupId = () =>
  `transfer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const normalizeAccountNumberValue = (value) => String(value || "").replace(/\D/g, "").trim();
const normalizeTransactionStatus = (value, fallback = "completed") => {
  const normalized = String(value || fallback).trim().toLowerCase();

  if (normalized === "complete") {
    return "completed";
  }

  if (["created", "pending", "completed", "failed", "expired", "reversed"].includes(normalized)) {
    return normalized;
  }

  return fallback;
};
const normalizeTransactionDirection = (value, fallback = "debit") => {
  const normalized = String(value || fallback).trim().toLowerCase();
  return normalized === "credit" ? "credit" : "debit";
};
const resolveInitialTransactionStatus = (payload = {}) => {
  if (payload.status) {
    return normalizeTransactionStatus(payload.status);
  }

  if (payload.type === "transfer" && payload.metadata?.route === "external") {
    return "pending";
  }

  return "completed";
};
// 🔹 Banking Logic
// Centralize status defaults here so routes cannot diverge on when a transaction should begin as pending or completed.
const shouldAutoCompletePendingTransaction = (payload = {}) =>
  resolveInitialTransactionStatus(payload) === "pending";
const isInternalTransferPayload = (payload = {}) =>
  payload.type === "transfer" && payload.metadata?.route === "internal";

const generateAccountNumber = () =>
  `NB${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
const generateLast4Digits = () => String(Math.floor(1000 + Math.random() * 9000));
const generateCardPan = () =>
  `5214${Math.floor(100000000000 + Math.random() * 900000000000)}`;
const generateCvv = () => String(Math.floor(100 + Math.random() * 900));
const maskPan = (pan) => `${pan.slice(0, 4)} **** **** ${pan.slice(-4)}`;
const maskDate = (monthOffset) => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  return date;
};
const humanizeAccountValue = (value = "") =>
  String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
const normalizeAccountTypeValue = (value = DEFAULT_ACCOUNT_CLASSIFICATION.accountType) => {
  const rawValue = String(value || DEFAULT_ACCOUNT_CLASSIFICATION.accountType).trim();
  const directClassification =
    ACCOUNT_CLASSIFICATIONS[rawValue] ||
    LEGACY_ACCOUNT_CLASSIFICATIONS[rawValue];

  if (directClassification?.accountType) {
    return directClassification.accountType;
  }

  const normalizedValue = rawValue.toLowerCase().replace(/[\s-]+/g, "_");
  const normalizedClassification =
    ACCOUNT_CLASSIFICATIONS[normalizedValue] ||
    LEGACY_ACCOUNT_CLASSIFICATIONS[normalizedValue];

  return (
    normalizedClassification?.accountType ||
    (ACCOUNT_CLASSIFICATIONS[normalizedValue] ? normalizedValue : "") ||
    DEFAULT_ACCOUNT_CLASSIFICATION.accountType
  );
};
const getAccountClassification = (value = "") => {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return null;
  }

  const normalizedValue = rawValue.toLowerCase().replace(/[\s-]+/g, "_");

  return (
    ACCOUNT_CLASSIFICATIONS[rawValue] ||
    LEGACY_ACCOUNT_CLASSIFICATIONS[rawValue] ||
    ACCOUNT_CLASSIFICATIONS[normalizedValue] ||
    LEGACY_ACCOUNT_CLASSIFICATIONS[normalizedValue] ||
    ACCOUNT_CLASSIFICATIONS[normalizeAccountTypeValue(rawValue)] ||
    null
  );
};
const getAccountRules = (accountType = DEFAULT_ACCOUNT_CLASSIFICATION.accountType) =>
  ACCOUNT_TYPE_RULES[accountType] || ACCOUNT_TYPE_RULES[DEFAULT_ACCOUNT_CLASSIFICATION.accountType];
const normalizeAccountClassification = ({
  name,
  accountType,
  category,
} = {}) => {
  const classification =
    getAccountClassification(accountType) ||
    getAccountClassification(name) ||
    DEFAULT_ACCOUNT_CLASSIFICATION;

  return {
    name: name || classification.name,
    accountType: classification.accountType,
    category:
      CATEGORY_COMPATIBILITY[category] ||
      category ||
      getAccountRules(classification.accountType).category ||
      classification.category,
  };
};
const buildAccountRulesSummary = (accountType) => {
  const rules = getAccountRules(accountType);
  return {
    monthlyFee: rules.monthlyFee,
    dailyTransferLimit: rules.dailyTransferLimit,
    allowsCards: rules.allowsCards,
    allowsBillPayments: rules.allowsBillPayments,
    allowsWithdrawals: rules.allowsWithdrawals,
    allowsTransfers: rules.allowsTransfers,
  };
};
const serializeAccount = (account) => ({
  ...account.toObject(),
  // 🔹 Future-ready
  // Ship backend-owned rule summaries with each account so the frontend can explain capabilities without becoming authoritative.
  rules: buildAccountRulesSummary(account.accountType),
});
const serializeAccountsForSummary = (accounts = []) => {
  const activeAccountTypes = new Set();

  return accounts
    .map((account) => serializeAccount(account))
    .filter((account) => {
      if (!isAccountOperational(account)) {
        return true;
      }

      if (activeAccountTypes.has(account.accountType)) {
        return false;
      }

      activeAccountTypes.add(account.accountType);
      return true;
    });
};
const getBillingPeriod = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const normalizeCardType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "virtual" || normalized === "virtual card") {
    return "Virtual Card";
  }

  if (normalized === "physical" || normalized === "physical card") {
    return "Physical Card";
  }

  return "";
};

const cardNameForType = (cardType) =>
  normalizeCardType(cardType) === "Virtual Card" ? "NexBank Virtual Card" : "NexBank Physical Card";

const isCardUsable = (card) => card && card.status === ACTIVE_CARD_STATUS && card.isActive !== false;
const isAccountOperational = (account) =>
  Boolean(account) && account.status !== CLOSED_ACCOUNT_STATUS && account.isActive !== false;
const buildActiveAccountTypeFilter = (userId, accountType, ignoredAccountId = null) => {
  const filter = {
    userId,
    accountType: normalizeAccountTypeValue(accountType),
    status: { $ne: CLOSED_ACCOUNT_STATUS },
    isActive: { $ne: false },
  };

  if (ignoredAccountId) {
    filter._id = { $ne: ignoredAccountId };
  }

  return filter;
};

const syncAccountBalanceCache = (account) => {
  account.balance = roundMoney(account.availableBalance);
  return account;
};

const normalizeExistingAccountOperationalState = (account) => {
  if (account.status === CLOSED_ACCOUNT_STATUS) {
    account.isActive = false;
    return syncAccountBalanceCache(account);
  }

  account.status = ACTIVE_ACCOUNT_STATUS;
  account.isActive = true;
  return syncAccountBalanceCache(account);
};

const ensureAccountIsOperational = (account) => {
  if (!account || account.status === CLOSED_ACCOUNT_STATUS || account.isActive === false) {
    throw new Error("This account is closed.");
  }

  return account;
};

const defaultAccounts = [
  {
    ...DEFAULT_ACCOUNT_CLASSIFICATION,
    ledgerBalance: 0,
    availableBalance: 0,
    limits: {
      deposit: 50000,
      withdrawalCash: 3000,
      withdrawalBank: 10000,
      transferInternal: 20000,
      transferExternal: 10000,
      voucher: 3000,
      bill: 15000,
    },
  },
];

const buildAccountDocument = (userId, overrides = {}) => {
  const normalizedClassification = normalizeAccountClassification(overrides);

  return {
    ...defaultAccounts[0],
    ...normalizedClassification,
    userId,
    accountNumber: generateAccountNumber(),
    status: ACTIVE_ACCOUNT_STATUS,
    isActive: true,
    closedAt: null,
    closedReason: null,
    ...overrides,
    ...normalizedClassification,
  };
};

function buildCardDocument(userId, account, cardType, overrides = {}) {
  const normalizedCardType = normalizeCardType(cardType);
  const pan = generateCardPan();
  const status = overrides.status || ACTIVE_CARD_STATUS;
  const accountOperational = isAccountOperational(account);

  return new Card({
    userId,
    accountId: account._id,
    cardType: normalizedCardType,
    cardName: overrides.cardName || cardNameForType(normalizedCardType),
    last4Digits: overrides.last4Digits || pan.slice(-4),
    expiryDate: overrides.expiryDate || maskDate(normalizedCardType === "Virtual Card" ? 18 : 36),
    status,
    isActive: status === ACTIVE_CARD_STATUS && accountOperational,
    isLocked: status === FROZEN_CARD_STATUS,
    contactlessEnabled:
      overrides.contactlessEnabled ?? normalizedCardType === "Physical Card",
    onlinePaymentsEnabled: overrides.onlinePaymentsEnabled ?? true,
    atmWithdrawalsEnabled:
      overrides.atmWithdrawalsEnabled ??
      (normalizedCardType === "Physical Card" && getAccountRules(account.accountType).allowsWithdrawals),
    maskedPan: overrides.maskedPan || maskPan(pan),
    cvv: overrides.cvv || generateCvv(),
    replacedByCardId: overrides.replacedByCardId || null,
    replacedAt: overrides.replacedAt || null,
  });
}

async function syncCardStatesForAccount(account) {
  const cards = await Card.find({ accountId: account._id, userId: account.userId }).sort({ createdAt: -1 });
  const accountOperational = isAccountOperational(account);
  const accountRules = getAccountRules(account.accountType);
  let hasChanges = false;

  cards.forEach((card) => {
    if (card.status === REPLACED_CARD_STATUS) {
      const shouldBeLocked = true;
      const shouldBeInactive = false;

      if (card.isLocked !== shouldBeLocked || card.isActive !== shouldBeInactive) {
        card.isLocked = shouldBeLocked;
        card.isActive = shouldBeInactive;
        card.updatedAt = new Date();
        hasChanges = true;
      }
      return;
    }

    if (card.status === FROZEN_CARD_STATUS) {
      if (card.isLocked !== true || card.isActive !== false) {
        card.isLocked = true;
        card.isActive = false;
        card.updatedAt = new Date();
        hasChanges = true;
      }
      return;
    }

    const nextActive = accountOperational && accountRules.allowsCards && card.status === ACTIVE_CARD_STATUS;
    const nextLocked = false;

    if (card.isActive !== nextActive || card.isLocked !== nextLocked) {
      card.isActive = nextActive;
      card.isLocked = nextLocked;
      card.updatedAt = new Date();
      hasChanges = true;
    }
  });

  if (hasChanges) {
    await Promise.all(cards.filter((card) => card.isModified()).map((card) => card.save()));
  }

  return cards;
}

async function ensureUserAccounts(userId) {
  const existingAccounts = await Account.find({ userId }).sort({ createdAt: 1 });
  if (existingAccounts.length > 0) {
    let hasChanges = false;
    const activeAccountTypes = new Set();

    existingAccounts.forEach((account) => {
      const previousStatus = account.status;
      const previousIsActive = account.isActive;
      const previousName = account.name;
      const previousAccountType = account.accountType;
      const previousCategory = account.category;
      const normalizedClassification = normalizeAccountClassification({
        name: account.name,
        accountType: account.accountType,
        category: account.category,
      });

      account.name = normalizedClassification.name;
      account.accountType = normalizedClassification.accountType;
      account.category = normalizedClassification.category;
      normalizeExistingAccountOperationalState(account);

      if (isAccountOperational(account)) {
        if (activeAccountTypes.has(account.accountType)) {
          account.status = CLOSED_ACCOUNT_STATUS;
          account.isActive = false;
          account.closedAt = account.closedAt || new Date();
          account.closedReason = account.closedReason || "duplicate_product";
          syncAccountBalanceCache(account);
        } else {
          activeAccountTypes.add(account.accountType);
        }
      }

      if (
        account.status !== previousStatus ||
        account.isActive !== previousIsActive ||
        account.name !== previousName ||
        account.accountType !== previousAccountType ||
        account.category !== previousCategory
      ) {
        account.updatedAt = new Date();
        hasChanges = true;
      }
    });

    if (hasChanges) {
      const modifiedAccounts = existingAccounts.filter((account) => account.isModified());
      const inactiveAccounts = modifiedAccounts.filter((account) => !isAccountOperational(account));
      const activeAccounts = modifiedAccounts.filter((account) => isAccountOperational(account));

      await Promise.all(inactiveAccounts.map((account) => account.save()));
      await Promise.all(activeAccounts.map((account) => account.save()));
    }

    await Promise.all(existingAccounts.map((account) => syncCardStatesForAccount(account)));
    return existingAccounts;
  }

  return [];
}

async function createAccount(userId, payload = {}) {
  const normalizedClassification = normalizeAccountClassification({
    name: payload.name,
    accountType: payload.accountType,
    category: payload.category,
  });
  await ensureUserAccounts(userId);

  const existingActiveAccount = await Account.findOne(
    buildActiveAccountTypeFilter(userId, normalizedClassification.accountType)
  ).sort({ createdAt: 1 });
  if (existingActiveAccount) {
    return {
      account: serializeAccount(existingActiveAccount),
      created: false,
    };
  }

  const account = new Account(
    buildAccountDocument(userId, {
      ...normalizedClassification,
    })
  );

  try {
    await account.save();
  } catch (error) {
    if (
      error.code === 11000 ||
      error.message === "An active account for this product already exists."
    ) {
      const existingAccount = await Account.findOne(
        buildActiveAccountTypeFilter(userId, normalizedClassification.accountType)
      ).sort({ createdAt: 1 });

      if (existingAccount) {
        return {
          account: serializeAccount(existingAccount),
          created: false,
        };
      }
    }

    throw error;
  }

  if (getAccountRules(account.accountType).allowsCards) {
    // 🔹 Banking Logic
    // Transactional-style products get a system-issued physical card automatically; savings-style products do not.
    const physicalCard = buildCardDocument(userId, account, "Physical Card");
    await physicalCard.save();
  }

  return {
    account: serializeAccount(account),
    created: true,
  };
}

async function closeAccount(userId, accountId) {
  await ensureUserAccounts(userId);

  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw new Error("Account not found");
  }

  if (account.status === CLOSED_ACCOUNT_STATUS) {
    throw new Error("This account is already closed.");
  }

  if (roundMoney(account.ledgerBalance) !== 0) {
    throw new Error("Account balance must be R0.00 before closing.");
  }

  const pendingTransaction = await Transaction.findOne({
    userId,
    accountId: account._id,
    status: "pending",
  }).lean();
  if (pendingTransaction) {
    throw new Error("This account has pending transactions and cannot be closed.");
  }

  const activeCards = await Card.find({
    userId,
    accountId: account._id,
    $or: [{ status: ACTIVE_CARD_STATUS }, { isActive: true }],
  });
  if (activeCards.length > 0) {
    // 🔹 Safety / Validation
    // Account closure blocks linked active cards automatically so users do not have to resolve card state in a separate flow.
    await Promise.all(
      activeCards.map(async (card) => {
        card.status = FROZEN_CARD_STATUS;
        card.isActive = false;
        card.isLocked = true;
        card.updatedAt = new Date();
        await card.save();
      })
    );
  }

  account.status = CLOSED_ACCOUNT_STATUS;
  account.isActive = false;
  account.closedAt = new Date();
  account.closedReason = "user_request";
  account.updatedAt = new Date();
  syncAccountBalanceCache(account);
  await account.save();
  await syncCardStatesForAccount(account);

  return serializeAccount(account);
}

function getMonthlyFeeForAccount(account) {
  if (!account) {
    return 0;
  }

  const rules = getAccountRules(account.accountType);
  return roundMoney(rules.monthlyFee || 0);
}

async function ensureSingleCardPerType(accountId, cardType, ignoredCardId = null) {
  const filter = {
    accountId,
    cardType,
    status: { $ne: REPLACED_CARD_STATUS },
  };

  if (ignoredCardId) {
    filter._id = { $ne: ignoredCardId };
  }

  const existingCard = await Card.findOne(filter);
  if (existingCard) {
    throw new Error(`This account already has a ${cardType.toLowerCase()}.`);
  }
}

async function ensureUserCards(userId) {
  await ensureUserAccounts(userId);
  return Card.find({ userId }).sort({ createdAt: -1 });
}

function applyCreateEffect(account, transaction) {
  const debitImpactAmount = getDebitImpactAmount(transaction);
  // 🔹 Ledger Update
  // This is the single posting step that converts a transaction into balance movement, including fees on debit flows.

  if (transaction.status === "completed") {
    if (transaction.direction === "credit") {
      account.ledgerBalance = roundMoney(account.ledgerBalance + transaction.amount);
      account.availableBalance = roundMoney(account.availableBalance + transaction.amount);
      transaction.ledgerPosted = true;
      transaction.fundsReserved = false;
    } else {
      if (account.availableBalance < debitImpactAmount) {
        throw new Error("Insufficient available balance");
      }

      account.ledgerBalance = roundMoney(account.ledgerBalance - debitImpactAmount);
      account.availableBalance = roundMoney(account.availableBalance - debitImpactAmount);
      transaction.ledgerPosted = true;
      transaction.fundsReserved = true;
    }
  }

  if (transaction.status === "pending" && transaction.direction === "debit") {
    if (account.availableBalance < debitImpactAmount) {
      throw new Error("Insufficient available balance");
    }

    account.availableBalance = roundMoney(account.availableBalance - debitImpactAmount);
    transaction.fundsReserved = true;
  }

  syncAccountBalanceCache(account);
  return { account, transaction };
}

function applyStatusTransition(account, transaction, nextStatus) {
  const previousStatus = transaction.status;
  const debitImpactAmount = getDebitImpactAmount(transaction);
  // 🔹 Ledger Update
  // Reuse one transition engine for pending, completed, failed, and reversed states so balance corrections stay deterministic.

  if (previousStatus === nextStatus) {
    return { account, transaction };
  }

  if (!transaction.ledgerPosted && nextStatus === "completed") {
    if (transaction.direction === "credit") {
      account.ledgerBalance = roundMoney(account.ledgerBalance + transaction.amount);
      account.availableBalance = roundMoney(account.availableBalance + transaction.amount);
      transaction.ledgerPosted = true;
    } else {
      account.ledgerBalance = roundMoney(account.ledgerBalance - debitImpactAmount);
      transaction.ledgerPosted = true;

      if (!transaction.fundsReserved) {
        if (account.availableBalance < debitImpactAmount) {
          throw new Error("Insufficient available balance");
        }
        account.availableBalance = roundMoney(account.availableBalance - debitImpactAmount);
        transaction.fundsReserved = true;
      }
    }
  }

  if (
    transaction.direction === "debit" &&
    transaction.fundsReserved &&
    ["failed", "expired", "reversed"].includes(nextStatus) &&
    !transaction.ledgerPosted
  ) {
    account.availableBalance = roundMoney(account.availableBalance + debitImpactAmount);
    transaction.fundsReserved = false;
  }

  if (nextStatus === "reversed" && transaction.ledgerPosted) {
    if (transaction.direction === "credit") {
      account.ledgerBalance = roundMoney(account.ledgerBalance - transaction.amount);
      account.availableBalance = roundMoney(account.availableBalance - transaction.amount);
    } else {
      account.ledgerBalance = roundMoney(account.ledgerBalance + debitImpactAmount);
      account.availableBalance = roundMoney(account.availableBalance + debitImpactAmount);
    }
    transaction.ledgerPosted = false;
    transaction.fundsReserved = false;
  }

  transaction.status = nextStatus;
  syncAccountBalanceCache(account);
  return { account, transaction };
}

function progressPendingTransaction(account, transaction, payload = {}) {
  if (transaction.status !== "pending") {
    return { account, transaction };
  }

  if (!shouldAutoCompletePendingTransaction(payload)) {
    return { account, transaction };
  }

  return applyStatusTransition(account, transaction, "completed");
}

async function getBankingSummary(userId) {
  const accounts = await ensureUserAccounts(userId);
  const cards = await ensureUserCards(userId);
  const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).lean();
  return {
    accounts: serializeAccountsForSummary(accounts),
    cards: cards.map((card) => card.toObject()),
    transactions,
  };
}

async function getUserAccounts(userId) {
  const accounts = await ensureUserAccounts(userId);
  return serializeAccountsForSummary(accounts);
}

async function getUserCards(userId, accountId) {
  await ensureUserAccounts(userId);
  const filter = { userId };

  if (accountId) {
    filter.accountId = accountId;
  }

  return Card.find(filter).sort({ createdAt: -1 }).lean();
}

async function getCardDetails(userId, cardId) {
  const card = await Card.findOne({ _id: cardId, userId }).lean();
  if (!card) {
    throw new Error("Card not found");
  }

  return {
    cardId: card._id,
    cardType: card.cardType,
    cardName: card.cardName,
    last4Digits: card.last4Digits,
    expiryDate: card.expiryDate,
    status: card.status,
    maskedPan: card.maskedPan,
    cvv: card.cvv,
  };
}

async function createCard(userId, payload) {
  await ensureUserAccounts(userId);

  const account = await Account.findOne({ _id: payload.accountId, userId });
  if (!account) {
    throw new Error("Account not found");
  }
  ensureAccountIsOperational(account);
  const accountRules = getAccountRules(account.accountType);

  const cardType = normalizeCardType(payload.cardType || "Virtual Card");
  if (!cardType) {
    throw new Error("Choose a valid card type.");
  }

  if (cardType !== "Virtual Card") {
    throw new Error("Physical cards are system-issued and cannot be created here.");
  }

  if (!accountRules.allowsCards) {
    throw new Error("Cards are not available for this account type.");
  }

  await ensureSingleCardPerType(account._id, cardType);
  const card = buildCardDocument(userId, account, cardType);
  await card.save();
  return card.toObject();
}

async function updateCard(userId, cardId, payload) {
  const card = await Card.findOne({ _id: cardId, userId });
  if (!card) {
    throw new Error("Card not found");
  }

  if (card.status === REPLACED_CARD_STATUS) {
    throw new Error("A replaced card cannot be changed.");
  }

  if (payload.status) {
    const normalizedStatus = String(payload.status).trim().toLowerCase();

    if (normalizedStatus === ACTIVE_CARD_STATUS) {
      card.status = ACTIVE_CARD_STATUS;
      card.isLocked = false;
      card.isActive = true;
    } else if (normalizedStatus === FROZEN_CARD_STATUS) {
      card.status = FROZEN_CARD_STATUS;
      card.isLocked = true;
      card.isActive = false;
    }
  }

  const allowedFields = [
    "contactlessEnabled",
    "onlinePaymentsEnabled",
    "atmWithdrawalsEnabled",
  ];

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      card[field] = Boolean(payload[field]);
    }
  });

  card.updatedAt = new Date();
  await card.save();
  return card.toObject();
}

async function freezeCard(userId, cardId) {
  const card = await Card.findOne({ _id: cardId, userId });
  if (!card) {
    throw new Error("Card not found");
  }

  if (card.status === REPLACED_CARD_STATUS) {
    throw new Error("A replaced card cannot be frozen.");
  }

  card.status = FROZEN_CARD_STATUS;
  card.isActive = false;
  card.isLocked = true;
  card.updatedAt = new Date();

  await card.save();
  return card.toObject();
}

async function replaceCard(userId, cardId) {
  const existingCard = await Card.findOne({ _id: cardId, userId });
  if (!existingCard) {
    throw new Error("Card not found");
  }

  if (existingCard.status === REPLACED_CARD_STATUS) {
    throw new Error("This card has already been replaced.");
  }

  const account = await Account.findOne({ _id: existingCard.accountId, userId });
  if (!account) {
    throw new Error("Account not found");
  }

  const replacementCard = buildCardDocument(userId, account, existingCard.cardType, {
    contactlessEnabled: existingCard.contactlessEnabled,
    onlinePaymentsEnabled: existingCard.onlinePaymentsEnabled,
    atmWithdrawalsEnabled: existingCard.atmWithdrawalsEnabled,
  });

  await replacementCard.save();

  existingCard.status = REPLACED_CARD_STATUS;
  existingCard.isActive = false;
  existingCard.isLocked = true;
  existingCard.replacedByCardId = replacementCard._id;
  existingCard.replacedAt = new Date();
  existingCard.updatedAt = new Date();

  await existingCard.save();

  return {
    oldCard: existingCard.toObject(),
    newCard: replacementCard.toObject(),
  };
}

async function getUserTransactions(userId, accountId) {
  await ensureUserAccounts(userId);
  const filter = { userId };

  if (accountId) {
    filter.accountId = accountId;
  }

  return Transaction.find(filter).sort({ createdAt: -1 }).lean();
}

async function applyMonthlyAccountFee(userId, accountId) {
  await ensureUserAccounts(userId);

  const account = await Account.findOne({ _id: accountId, userId });
  if (!account) {
    throw new Error("Account not found");
  }
  ensureAccountIsOperational(account);

  const monthlyFee = getMonthlyFeeForAccount(account);
  if (monthlyFee <= 0) {
    throw new Error("This account type does not have a monthly fee.");
  }

  if (roundMoney(account.availableBalance) < monthlyFee) {
    throw new Error("Insufficient available balance");
  }

  const billingPeriod = getBillingPeriod();
  const existingFeeTransaction = await Transaction.findOne({
    userId,
    accountId: account._id,
    type: "fee",
    "metadata.feeType": "monthly_account_fee",
    "metadata.billingPeriod": billingPeriod,
    status: { $in: ["completed", "pending"] },
  }).lean();

  if (existingFeeTransaction) {
    throw new Error("Monthly account fee has already been applied for this billing period.");
  }

  // 🔹 Banking Logic
  // Monthly fees are modeled as real debit transactions so they appear in history and use the same ledger path as user activity.
  return createTransaction(userId, {
    accountId: account._id,
    amount: monthlyFee,
    fee: 0,
    type: "fee",
    direction: "debit",
    category: "Account Fees",
    reference: "Monthly account fee",
    description: `${account.name} monthly account fee`,
    metadata: {
      source: "system",
      feeType: "monthly_account_fee",
      accountType: account.accountType,
      billingPeriod,
    },
  });
}

async function validateTransactionAuthorization(userId, account, payload) {
  if (!payload.cardId) {
    return null;
  }

  const card = await Card.findOne({
    _id: payload.cardId,
    userId,
    accountId: account._id,
  });

  if (!card) {
    throw new Error("Card not found for this account.");
  }

  if ([FROZEN_CARD_STATUS, REPLACED_CARD_STATUS].includes(card.status)) {
    throw new Error("This card cannot authorize transactions in its current state.");
  }

  if (!isCardUsable(card)) {
    throw new Error("This card is not active.");
  }

  return card;
}

function validateAccountTransactionRules(account, payload) {
  const rules = getAccountRules(account.accountType);

  if (payload.type === "bill" && !rules.allowsBillPayments) {
    throw new Error("Bill payments are not available for this account type.");
  }

  if (payload.type === "withdrawal" && !rules.allowsWithdrawals) {
    throw new Error("Withdrawals are not available for this account type.");
  }

  if (payload.type === "fee") {
    return;
  }

  if (payload.type === "transfer") {
    if (!rules.allowsTransfers) {
      throw new Error("Transfers are not available for this account type.");
    }
  }
}

async function resolveTransferDestinationAccount(userId, payload, sourceAccountId) {
  if (!isInternalTransferPayload(payload)) {
    return null;
  }

  if (payload.recipientAccountId) {
    const destinationAccount = await Account.findOne({
      _id: payload.recipientAccountId,
    });

    if (!destinationAccount) {
      throw new Error("Destination account not found");
    }

    if (String(destinationAccount._id) === String(sourceAccountId)) {
      throw new Error("Transfer destination must be different from the source account");
    }

    return destinationAccount;
  }

  const normalizedAccountNumber = String(payload.metadata?.accountNumber || "")
    .replace(/\D/g, "")
    .trim();

  if (!normalizedAccountNumber) {
    throw new Error("Destination account number is required for internal transfers");
  }

  const destinationAccount =
    (await Account.findOne({ accountNumber: payload.metadata?.accountNumber || "" })) ||
    (await Account.findOne({
      accountNumber: new RegExp(`${normalizedAccountNumber}$`),
    })) ||
    (
      await Account.find({})
    ).find(
      (candidate) =>
        normalizeAccountNumberValue(candidate.accountNumber) === normalizedAccountNumber
    ) ||
    null;

  if (!destinationAccount) {
    throw new Error("Destination account not found");
  }

  if (String(destinationAccount._id) === String(sourceAccountId)) {
    throw new Error("Transfer destination must be different from the source account");
  }

  return destinationAccount;
}

function buildTransactionDocument({
  userId,
  accountId,
  recipientAccountId = null,
  cardId = null,
  amount,
  fee,
  type,
  direction,
  category,
  status,
  reference,
  description,
  metadata,
  billerName,
  dynamicFields,
}) {
  // 🔹 Future-ready
  // Keep one transaction shape for customer actions and system charges so reporting and reconciliation can use the same model.
  return new Transaction({
    userId,
    accountId,
    recipientAccountId,
    cardId,
    amount: roundMoney(amount),
    fee: roundMoney(fee),
    type,
    direction,
    category: category || "",
    status,
    reference: reference || "",
    description: description || "",
    metadata: metadata || {},
    billerName: billerName || "",
    dynamicFields: dynamicFields || {},
  });
}

async function createTransaction(userId, payload) {
  /*
   * 🔹 Ledger Update
   * Normalize the request, validate account/card/rule constraints, apply ledger effects,
   * create a paired credit for internal transfers, then persist accounts and transactions together.
   */
  await ensureUserAccounts(userId);

  const account = await Account.findOne({ _id: payload.accountId, userId });
  if (!account) {
    throw new Error("Account not found");
  }
  ensureAccountIsOperational(account);

  validateAccountTransactionRules(account, payload);
  const card = await validateTransactionAuthorization(userId, account, payload);
  const destinationAccount = await resolveTransferDestinationAccount(
    userId,
    payload,
    account._id
  );
  if (destinationAccount) {
    ensureAccountIsOperational(destinationAccount);
  }

  const direction = normalizeTransactionDirection(payload.direction);
  const status = resolveInitialTransactionStatus(payload);
  const transferGroupId =
    payload.type === "transfer" ? payload.metadata?.transferGroupId || generateTransferGroupId() : null;
  const baseMetadata = {
    ...(payload.metadata || {}),
    ...(transferGroupId ? { transferGroupId } : {}),
  };
  const transaction = buildTransactionDocument({
    userId,
    accountId: account._id,
    recipientAccountId: destinationAccount?._id || payload.recipientAccountId || null,
    cardId: card?._id || payload.cardId || null,
    amount: payload.amount,
    fee: payload.fee,
    type: payload.type,
    direction,
    category: payload.category || "",
    status,
    reference: payload.reference || "",
    description: payload.description || "",
    metadata: baseMetadata,
    billerName: payload.billerName || "",
    dynamicFields: payload.dynamicFields || {},
  });

  applyCreateEffect(account, transaction);
  progressPendingTransaction(account, transaction, payload);
  account.updatedAt = new Date();
  transaction.updatedAt = new Date();

  const transactionsToSave = [transaction];
  const accountsToSave = [account];

  if (destinationAccount) {
    // 🔹 Banking Logic
    // Internal transfers are stored as two linked ledger records so both sides remain auditable instead of collapsing into one debit.
    const creditTransaction = buildTransactionDocument({
      userId: destinationAccount.userId,
      accountId: destinationAccount._id,
      recipientAccountId: account._id,
      cardId: null,
      amount: payload.amount,
      fee: 0,
      type: payload.type,
      direction: "credit",
      category: payload.category || "",
      status,
      reference: payload.reference || "",
      description: payload.description || "",
      metadata: {
        ...baseMetadata,
        sourceAccountId: account._id,
      },
      billerName: "",
      dynamicFields: {},
    });

    transaction.metadata = {
      ...(transaction.metadata || {}),
      linkedTransactionId: creditTransaction._id,
    };
    creditTransaction.metadata = {
      ...(creditTransaction.metadata || {}),
      linkedTransactionId: transaction._id,
    };

    applyCreateEffect(destinationAccount, creditTransaction);
    progressPendingTransaction(destinationAccount, creditTransaction, {
      ...payload,
      direction: "credit",
      fee: 0,
    });
    destinationAccount.updatedAt = new Date();
    creditTransaction.updatedAt = new Date();

    transactionsToSave.push(creditTransaction);
    accountsToSave.push(destinationAccount);
  }

  await Promise.all(accountsToSave.map((entry) => entry.save()));
  await Promise.all(transactionsToSave.map((entry) => entry.save()));
  await Promise.all(accountsToSave.map((entry) => syncCardStatesForAccount(entry)));

  return transaction.toObject();
}

async function updateTransactionStatus(userId, transactionId, status) {
  const transaction = await Transaction.findOne({ _id: transactionId, userId });
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const account = await Account.findOne({ _id: transaction.accountId, userId });
  if (!account) {
    throw new Error("Account not found");
  }
  ensureAccountIsOperational(account);

  // 🔹 Ledger Update
  // Status updates always flow through the shared transition engine so routes never mutate balances ad hoc.
  applyStatusTransition(account, transaction, normalizeTransactionStatus(status));
  account.updatedAt = new Date();
  transaction.updatedAt = new Date();

  await account.save();
  await transaction.save();
  await syncCardStatesForAccount(account);

  return transaction.toObject();
}

module.exports = {
  ensureUserAccounts,
  ensureUserCards,
  getBankingSummary,
  getUserAccounts,
  getUserCards,
  getCardDetails,
  getUserTransactions,
  createAccount,
  closeAccount,
  createCard,
  updateCard,
  freezeCard,
  replaceCard,
  createTransaction,
  getMonthlyFeeForAccount,
  applyMonthlyAccountFee,
  updateTransactionStatus,
  normalizeTransactionStatus,
  normalizeTransactionDirection,
  resolveInitialTransactionStatus,
  shouldAutoCompletePendingTransaction,
};

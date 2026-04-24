const Account = require("../models/Account");
const Card = require("../models/Card");
const Transaction = require("../models/Transaction");

const ACTIVE_CARD_STATUS = "active";
const FROZEN_CARD_STATUS = "frozen";
const REPLACED_CARD_STATUS = "replaced";
const ACTIVE_ACCOUNT_STATUS = "active";
const MINIMUM_ACTIVATION_FUNDING = 50;

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

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
  account &&
  (account.status === ACTIVE_ACCOUNT_STATUS ||
    account.isActive === true ||
    Number(account.ledgerBalance || 0) >= Number(account.minimumFundingAmount || MINIMUM_ACTIVATION_FUNDING));

const applyAccountActivation = (account) => {
  const active = isAccountOperational(account);
  account.isActive = active;
  account.status = active ? ACTIVE_ACCOUNT_STATUS : "inactive";
  account.balance = roundMoney(account.availableBalance);
  return account;
};

const defaultAccounts = [
  {
    name: "Current Account",
    accountType: "Current",
    category: "cheque",
    ledgerBalance: 0,
    availableBalance: 0,
    minimumFundingAmount: MINIMUM_ACTIVATION_FUNDING,
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

function buildCardDocument(userId, account, cardType, overrides = {}) {
  const normalizedCardType = normalizeCardType(cardType);
  const pan = generateCardPan();
  const status = overrides.status || ACTIVE_CARD_STATUS;

  return new Card({
    userId,
    accountId: account._id,
    cardType: normalizedCardType,
    cardName: overrides.cardName || cardNameForType(normalizedCardType),
    last4Digits: overrides.last4Digits || pan.slice(-4),
    expiryDate: overrides.expiryDate || maskDate(normalizedCardType === "Virtual Card" ? 18 : 36),
    status,
    isActive: status === ACTIVE_CARD_STATUS && isAccountOperational(account),
    isLocked: status === FROZEN_CARD_STATUS,
    contactlessEnabled:
      overrides.contactlessEnabled ?? normalizedCardType === "Physical Card",
    onlinePaymentsEnabled: overrides.onlinePaymentsEnabled ?? true,
    atmWithdrawalsEnabled:
      overrides.atmWithdrawalsEnabled ??
      (normalizedCardType === "Physical Card" && account.category !== "savings"),
    maskedPan: overrides.maskedPan || maskPan(pan),
    cvv: overrides.cvv || generateCvv(),
    replacedByCardId: overrides.replacedByCardId || null,
    replacedAt: overrides.replacedAt || null,
  });
}

async function syncCardStatesForAccount(account) {
  const cards = await Card.find({ accountId: account._id, userId: account.userId }).sort({ createdAt: -1 });
  const accountOperational = isAccountOperational(account);
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

    const nextActive = accountOperational && card.status === ACTIVE_CARD_STATUS;
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

    existingAccounts.forEach((account) => {
      const previousStatus = account.status;
      const previousIsActive = account.isActive;
      applyAccountActivation(account);
      if (account.status !== previousStatus || account.isActive !== previousIsActive) {
        account.updatedAt = new Date();
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await Promise.all(existingAccounts.filter((account) => account.isModified()).map((account) => account.save()));
    }

    await Promise.all(existingAccounts.map((account) => syncCardStatesForAccount(account)));
    return existingAccounts;
  }

  const created = await Account.insertMany(
    defaultAccounts.map((account) => ({
      ...account,
      userId,
      accountNumber: generateAccountNumber(),
      status: "inactive",
      isActive: false,
    }))
  );

  await Promise.all(
    created.map(async (account) => {
      const physicalCard = buildCardDocument(userId, account, "Physical Card");
      await physicalCard.save();
    })
  );

  return Account.find({ userId }).sort({ createdAt: 1 });
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
  if (transaction.status === "completed") {
    if (transaction.direction === "credit") {
      account.ledgerBalance = roundMoney(account.ledgerBalance + transaction.amount);
      account.availableBalance = roundMoney(account.availableBalance + transaction.amount);
      transaction.ledgerPosted = true;
      transaction.fundsReserved = false;
    } else {
      account.ledgerBalance = roundMoney(account.ledgerBalance - transaction.amount);
      account.availableBalance = roundMoney(account.availableBalance - transaction.amount);
      transaction.ledgerPosted = true;
      transaction.fundsReserved = true;
    }
  }

  if (transaction.status === "pending" && transaction.direction === "debit") {
    if (account.availableBalance < transaction.amount) {
      throw new Error("Insufficient available balance");
    }

    account.availableBalance = roundMoney(account.availableBalance - transaction.amount);
    transaction.fundsReserved = true;
  }

  applyAccountActivation(account);
  return { account, transaction };
}

function applyStatusTransition(account, transaction, nextStatus) {
  const previousStatus = transaction.status;

  if (previousStatus === nextStatus) {
    return { account, transaction };
  }

  if (!transaction.ledgerPosted && nextStatus === "completed") {
    if (transaction.direction === "credit") {
      account.ledgerBalance = roundMoney(account.ledgerBalance + transaction.amount);
      account.availableBalance = roundMoney(account.availableBalance + transaction.amount);
      transaction.ledgerPosted = true;
    } else {
      account.ledgerBalance = roundMoney(account.ledgerBalance - transaction.amount);
      transaction.ledgerPosted = true;

      if (!transaction.fundsReserved) {
        if (account.availableBalance < transaction.amount) {
          throw new Error("Insufficient available balance");
        }
        account.availableBalance = roundMoney(account.availableBalance - transaction.amount);
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
    account.availableBalance = roundMoney(account.availableBalance + transaction.amount);
    transaction.fundsReserved = false;
  }

  if (nextStatus === "reversed" && transaction.ledgerPosted) {
    if (transaction.direction === "credit") {
      account.ledgerBalance = roundMoney(account.ledgerBalance - transaction.amount);
      account.availableBalance = roundMoney(account.availableBalance - transaction.amount);
    } else {
      account.ledgerBalance = roundMoney(account.ledgerBalance + transaction.amount);
      account.availableBalance = roundMoney(account.availableBalance + transaction.amount);
    }
    transaction.ledgerPosted = false;
    transaction.fundsReserved = false;
  }

  transaction.status = nextStatus;
  applyAccountActivation(account);
  return { account, transaction };
}

async function getBankingSummary(userId) {
  const accounts = await ensureUserAccounts(userId);
  const cards = await ensureUserCards(userId);
  const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).lean();
  return {
    accounts: accounts.map((account) => account.toObject()),
    cards: cards.map((card) => card.toObject()),
    transactions,
  };
}

async function getUserAccounts(userId) {
  const accounts = await ensureUserAccounts(userId);
  return accounts.map((account) => account.toObject());
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

  const cardType = normalizeCardType(payload.cardType || "Virtual Card");
  if (!cardType) {
    throw new Error("Choose a valid card type.");
  }

  if (cardType !== "Virtual Card") {
    throw new Error("Physical cards are system-issued and cannot be created here.");
  }

  if (!isAccountOperational(account)) {
    throw new Error(
      `Fund this account with at least R${Number(
        account.minimumFundingAmount || MINIMUM_ACTIVATION_FUNDING
      ).toFixed(2)} before creating a virtual card.`
    );
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

async function validateTransactionAuthorization(userId, account, payload) {
  if (!isAccountOperational(account)) {
    throw new Error("This account is inactive and cannot authorize transactions.");
  }

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

async function createTransaction(userId, payload) {
  await ensureUserAccounts(userId);

  const account = await Account.findOne({ _id: payload.accountId, userId });
  if (!account) {
    throw new Error("Account not found");
  }

  const card = await validateTransactionAuthorization(userId, account, payload);

  const transaction = new Transaction({
    userId,
    accountId: account._id,
    recipientAccountId: payload.recipientAccountId || null,
    cardId: card?._id || payload.cardId || null,
    amount: roundMoney(payload.amount),
    fee: roundMoney(payload.fee),
    type: payload.type,
    direction: payload.direction,
    category: payload.category || "",
    status: payload.status || "created",
    reference: payload.reference || "",
    description: payload.description || "",
    metadata: payload.metadata || {},
  });

  applyCreateEffect(account, transaction);
  account.updatedAt = new Date();
  transaction.updatedAt = new Date();

  await account.save();
  await transaction.save();
  await syncCardStatesForAccount(account);

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

  applyStatusTransition(account, transaction, status);
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
  createCard,
  updateCard,
  freezeCard,
  replaceCard,
  createTransaction,
  updateTransactionStatus,
};

const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const {
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
  applyMonthlyAccountFee,
  updateTransactionStatus,
  normalizeTransactionStatus,
  normalizeTransactionDirection,
  resolveInitialTransactionStatus,
} = require("../services/ledgerService");

const router = express.Router();

const WITHDRAW_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Entertainment",
  "Utilities",
];

const DEPOSIT_CATEGORIES = ["Income", "Savings", "Refund", "Gift"];

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

function formatTransaction(transaction) {
  const amount = Number(transaction.amount || 0);
  const fee = Number(transaction.fee || 0);
  const direction =
    transaction.direction ||
    (transaction.type === "deposit" ? "credit" : "debit");

  return {
    _id: transaction._id,
    accountId: transaction.accountId,
    recipientAccountId: transaction.recipientAccountId,
    cardId: transaction.cardId || null,
    amount,
    fee,
    type: transaction.type,
    direction,
    category: transaction.category,
    status: transaction.status,
    reference: transaction.reference,
    description: transaction.description,
    metadata: transaction.metadata || {},
    createdAt: transaction.createdAt,
    impactAmount: direction === "credit" ? amount : -(amount + fee),
    name:
      transaction.reference ||
      transaction.description ||
      (direction === "credit" ? "Deposit" : "Debit"),
  };
}

function buildOverview(summary) {
  const account = summary.accounts[0] || null;
  const transactions = summary.transactions || [];

  if (!account) {
    return {
      account: null,
      summary: {
        totalDeposits: 0,
        totalWithdrawals: 0,
        depositCount: 0,
        withdrawalCount: 0,
        activityCount: 0,
        savingsRate: 0,
      },
      insights: {
        totalSpent: 0,
        breakdown: WITHDRAW_CATEGORIES.map((category) => ({ category, amount: 0 })),
      },
      recentTransactions: [],
    };
  }

  const totalDeposits = transactions
    .filter((transaction) => transaction.type === "deposit")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const totalWithdrawals = transactions
    .filter((transaction) =>
      ["withdrawal", "transfer", "bill", "fee"].includes(transaction.type)
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount || 0) + Number(transaction.fee || 0),
      0
    );

  const withdrawalCount = transactions.filter(
    (transaction) => transaction.type === "withdrawal"
  ).length;

  const depositCount = transactions.filter(
    (transaction) => transaction.type === "deposit"
  ).length;

  const breakdown = WITHDRAW_CATEGORIES.map((category) => ({
    category,
    amount: transactions
      .filter(
        (transaction) =>
          transaction.type === "withdrawal" && transaction.category === category
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
  }));

  const totalSpent = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const accountBalance = Number(
    account.availableBalance ?? account.balance ?? account.ledgerBalance ?? 0
  );
  const savingsRate =
    totalDeposits > 0
      ? Math.max(0, Math.min(100, Math.round((accountBalance / totalDeposits) * 100)))
      : 0;

  return {
    account: {
      _id: account._id,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      status: account.status,
      balance: accountBalance,
    },
    summary: {
      totalDeposits,
      totalWithdrawals,
      depositCount,
      withdrawalCount,
      activityCount: transactions.length,
      savingsRate,
    },
    insights: {
      totalSpent,
      breakdown,
    },
    recentTransactions: transactions.slice(0, 5).map(formatTransaction),
  };
}

async function ensureUserExists(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

async function loadSummary(userId) {
  const summary = await getBankingSummary(userId);
  return {
    ...summary,
    totalBalance: (summary.accounts || []).reduce(
      (sum, item) =>
        sum + Number(item.availableBalance ?? item.balance ?? item.ledgerBalance ?? 0),
      0
    ),
  };
}

router.use(authMiddleware);

router.get("/summary", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    res.json(await loadSummary(req.user.userId));
  } catch (error) {
    console.error(error);
    res.status(error.message === "User not found" ? 404 : 500).json({
      error: error.message === "User not found" ? error.message : "Failed to load banking summary",
    });
  }
});

router.get("/overview", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const summary = await loadSummary(req.user.userId);
    res.json(buildOverview(summary));
  } catch (error) {
    console.error(error);
    res.status(error.message === "User not found" ? 404 : 500).json({
      error: error.message === "User not found" ? error.message : "Failed to load account overview",
    });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const transactions = await getUserTransactions(req.user.userId, req.query.accountId);
    res.json({ transactions: transactions.map(formatTransaction) });
  } catch (error) {
    console.error(error);
    res.status(error.message === "User not found" ? 404 : 500).json({
      error: error.message === "User not found" ? error.message : "Failed to load transactions",
    });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);

    // 🔹 Ledger Update
    // All money actions land here as normalized commands so transaction creation, fee handling, and summary refresh stay centralized.
    const transaction = await createTransaction(req.user.userId, {
      accountId: req.body.accountId,
      recipientAccountId: req.body.recipientAccountId || null,
      cardId: req.body.cardId || null,
      amount: roundMoney(req.body.amount),
      fee: roundMoney(req.body.fee || 0),
      type: req.body.type,
      direction: normalizeTransactionDirection(req.body.direction, "debit"),
      category: req.body.category || req.body.metadata?.category || "",
      status: resolveInitialTransactionStatus({
        type: req.body.type,
        status: req.body.status,
        metadata: req.body.metadata || {},
      }),
      reference: req.body.reference || "",
      description: req.body.description || "",
      metadata: req.body.metadata || {},
      billerName: req.body.billerName || "",
      dynamicFields: req.body.dynamicFields || {},
    });

    const summary = await loadSummary(req.user.userId);
    res.status(201).json({
      message: "Transaction created successfully",
      transaction: formatTransaction(transaction),
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(
      [
        "User not found",
        "Account not found",
        "This account is closed.",
        "Card not found for this account.",
        "This card cannot authorize transactions in its current state.",
        "This card is not active.",
        "Insufficient available balance",
        "Bill payments are not available for this account type.",
        "Withdrawals are not available for this account type.",
        "Transfers are not available for this account type.",
        "Destination account not found",
        "Transfer destination must be different from the source account",
        "Destination account number is required for internal transfers",
      ].includes(error.message) || error.message.includes("daily transfer limit")
        ? 400
        : 500
    ).json({ error: error.message || "Failed to create transaction" });
  }
});

router.patch("/transactions/:id/status", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const transaction = await updateTransactionStatus(
      req.user.userId,
      req.params.id,
      normalizeTransactionStatus(req.body.status, "completed")
    );
    const summary = await loadSummary(req.user.userId);

    res.json({
      message: "Transaction updated successfully",
      transaction: formatTransaction(transaction),
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(
      ["User not found", "Transaction not found", "Account not found", "Insufficient available balance"].includes(error.message)
        ? 400
        : 500
    ).json({ error: error.message || "Failed to update transaction" });
  }
});

router.get("/accounts", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const accounts = await getUserAccounts(req.user.userId);
    res.json({ accounts });
  } catch (error) {
    console.error(error);
    res.status(error.message === "User not found" ? 404 : 500).json({
      error: error.message === "User not found" ? error.message : "Failed to fetch accounts",
    });
  }
});

router.post("/accounts", async (req, res) => {
  try {
    console.log("[banking] POST /api/banking/accounts", {
      userId: req.user?.userId || null,
      body: req.body,
    });
    await ensureUserExists(req.user.userId);
    const account = await createAccount(req.user.userId, {
      accountType: req.body.accountType,
      name: req.body.name,
      category: req.body.category,
    });
    // 🔹 Banking Logic
    // Return the refreshed summary immediately so the frontend never has to invent account state after creation.
    const summary = await loadSummary(req.user.userId);

    res.status(201).json({
      message: "Account created successfully",
      account,
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(error.message === "User not found" ? 404 : 500).json({
      error: error.message === "User not found" ? error.message : "Failed to create account",
    });
  }
});

router.patch("/accounts/:id/close", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    // 🔹 Safety / Validation
    // Closing stays backend-owned because it can freeze linked cards and remove the account from active flows in one operation.
    const account = await closeAccount(req.user.userId, req.params.id);
    const summary = await loadSummary(req.user.userId);

    res.json({
      message: "Account closed successfully",
      account,
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(
      [
        "User not found",
        "Account not found",
        "This account is already closed.",
        "Account balance must be R0.00 before closing.",
        "This account has pending transactions and cannot be closed.",
      ].includes(error.message)
        ? 400
        : 500
    ).json({ error: error.message || "Failed to close account" });
  }
});

router.post("/accounts/:id/apply-monthly-fee", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    // 🔹 Future-ready
    // Monthly fees are real ledger transactions now, even though billing automation is intentionally deferred.
    const transaction = await applyMonthlyAccountFee(req.user.userId, req.params.id);
    const summary = await loadSummary(req.user.userId);

    res.status(201).json({
      message: "Monthly account fee applied successfully",
      transaction: formatTransaction(transaction),
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(
      [
        "User not found",
        "Account not found",
        "This account is closed.",
        "This account type does not have a monthly fee.",
        "Insufficient available balance",
        "Monthly account fee has already been applied for this billing period.",
      ].includes(error.message)
        ? 400
        : 500
    ).json({ error: error.message || "Failed to apply monthly account fee" });
  }
});

router.get("/cards", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const cards = await getUserCards(req.user.userId, req.query.accountId);
    res.json({ cards });
  } catch (error) {
    console.error(error);
    res.status(error.message === "User not found" ? 404 : 500).json({
      error: error.message === "User not found" ? error.message : "Failed to fetch cards",
    });
  }
});

router.get("/cards/:id/details", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const details = await getCardDetails(req.user.userId, req.params.id);
    res.json({ details });
  } catch (error) {
    console.error(error);
    res.status(error.message === "Card not found" ? 404 : 500).json({
      error: error.message || "Failed to load card details",
    });
  }
});

router.post("/cards", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    // 🔹 Banking Logic
    // Card issuance is still subject to backend account rules so unsupported products cannot create cards through UI workarounds.
    const card = await createCard(req.user.userId, req.body);
    const summary = await loadSummary(req.user.userId);

    res.status(201).json({
      message: "Card created successfully",
      card,
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(
      ["User not found", "Account not found", "This account is closed.", "Choose a valid card type.", "Physical cards are system-issued and cannot be created here.", "Cards are not available for this account type."].includes(error.message) ||
        error.message.startsWith("This account already has")
        ? 400
        : 500
    ).json({ error: error.message || "Failed to create card" });
  }
});

router.patch("/cards/:id", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const card = await updateCard(req.user.userId, req.params.id, req.body);
    const summary = await loadSummary(req.user.userId);

    res.json({
      message: "Card updated successfully",
      card,
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(["Card not found", "A replaced card cannot be changed."].includes(error.message) ? 400 : 500).json({
      error: error.message || "Failed to update card",
    });
  }
});

router.post("/cards/:id/freeze", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const card = await freezeCard(req.user.userId, req.params.id);
    const summary = await loadSummary(req.user.userId);

    res.json({
      message: "Card frozen successfully",
      card,
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(["Card not found", "A replaced card cannot be frozen."].includes(error.message) ? 400 : 500).json({
      error: error.message || "Failed to freeze card",
    });
  }
});

router.post("/cards/:id/replace", async (req, res) => {
  try {
    await ensureUserExists(req.user.userId);
    const replacement = await replaceCard(req.user.userId, req.params.id);
    const summary = await loadSummary(req.user.userId);

    res.json({
      message: "Card replaced successfully",
      replacement,
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(
      ["Card not found", "This card has already been replaced.", "Account not found"].includes(error.message)
        ? 400
        : 500
    ).json({ error: error.message || "Failed to replace card" });
  }
});

router.post("/deposit", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const category = req.body.category;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Enter a valid deposit amount" });
    }

    if (category && !DEPOSIT_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Choose a valid deposit category" });
    }

    await ensureUserExists(req.user.userId);

    const transaction = await createTransaction(req.user.userId, {
      accountId: req.body.accountId,
      amount,
      fee: 0,
      type: "deposit",
      direction: "credit",
      category: category || "",
      reference: (req.body.reference || "").trim() || `${category || "General"} deposit`,
      description: `Deposit from ${req.body.source || "external source"}`,
      metadata: {
        source: req.body.source || "external",
        bankName: req.body.bankName || "",
        accountHolder: req.body.accountHolder || "",
        accountNumber: req.body.sourceAccountNumber || "",
      },
    });

    const summary = await loadSummary(req.user.userId);
    res.status(201).json({
      message: "Deposit completed successfully",
      transaction: formatTransaction(transaction),
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || "Deposit failed" });
  }
});

router.post("/withdraw", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const fee = Number(req.body.fee || 0);
    const category = req.body.category;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Enter a valid withdrawal amount" });
    }

    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ error: "Enter a valid withdrawal fee" });
    }

    if (category && !WITHDRAW_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Choose a valid spending category" });
    }

    await ensureUserExists(req.user.userId);

    const transaction = await createTransaction(req.user.userId, {
      accountId: req.body.accountId,
      amount,
      fee,
      type: "withdrawal",
      direction: "debit",
      category: category || "",
      reference: (req.body.reference || "").trim() || `${category || "General"} withdrawal`,
      description: `Withdrawal to ${req.body.bankName || "beneficiary"}`,
      metadata: {
        bankName: req.body.bankName || "",
        payoutChannel: req.body.payoutChannel || "",
        beneficiaryName: req.body.beneficiaryName || "",
        accountNumber: req.body.beneficiaryAccountNumber || "",
        accountType: req.body.accountType || "",
      },
    });

    const summary = await loadSummary(req.user.userId);
    res.status(201).json({
      message: "Withdrawal completed successfully",
      transaction: formatTransaction(transaction),
      ...summary,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || "Withdrawal failed" });
  }
});

module.exports = router;

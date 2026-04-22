const express = require("express");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const WITHDRAW_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Entertainment",
  "Utilities",
];

const DEPOSIT_CATEGORIES = ["Income", "Savings", "Refund", "Gift"];

function generateAccountNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `NB${timestamp}${randomDigits}`;
}

async function ensureAccountForUser(userId) {
  let account = await Account.findOne({ userId });

  if (!account) {
    account = await Account.create({
      userId,
      balance: 0,
      accountNumber: generateAccountNumber(),
      accountType: "Main",
      status: "Active",
    });
  }

  return account;
}

function formatTransaction(transaction) {
  const amount = Number(transaction.amount || 0);
  const fee = Number(transaction.fee || 0);
  const isDeposit = transaction.type === "deposit";

  return {
    _id: transaction._id,
    accountId: transaction.accountId,
    recipientAccountId: transaction.recipientAccountId,
    amount,
    fee,
    type: transaction.type,
    category: transaction.category,
    status: transaction.status,
    reference: transaction.reference,
    createdAt: transaction.createdAt,
    impactAmount: isDeposit ? amount : -(amount + fee),
    name: transaction.reference || (isDeposit ? "Deposit" : "Withdrawal"),
  };
}

function buildOverview(account, transactions) {
  const totalDeposits = transactions
    .filter((transaction) => transaction.type === "deposit")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const totalWithdrawals = transactions
    .filter((transaction) => transaction.type === "withdrawal")
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
  const savingsRate =
    totalDeposits > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((Number(account.balance || 0) / totalDeposits) * 100))
        )
      : 0;

  return {
    account: {
      _id: account._id,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      status: account.status,
      balance: Number(account.balance || 0),
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

router.use(authMiddleware);

router.get("/overview", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const account = await ensureAccountForUser(user._id);
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(buildOverview(account, transactions));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load account overview" });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ transactions: transactions.map(formatTransaction) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

router.post("/deposit", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const category = req.body.category;
    const reference = (req.body.reference || "").trim();
    const status = (req.body.status || "Completed").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Enter a valid deposit amount" });
    }

    if (!DEPOSIT_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Choose a valid deposit category" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const account = await ensureAccountForUser(user._id);
    account.balance = Number(account.balance || 0) + amount;

    const transaction = new Transaction({
      userId: user._id,
      accountId: account._id,
      amount,
      fee: 0,
      type: "deposit",
      category,
      status,
      reference: reference || `${category} deposit`,
    });

    await Promise.all([account.save(), transaction.save()]);

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(201).json({
      message: "Deposit completed successfully",
      transaction: formatTransaction(transaction.toObject()),
      ...buildOverview(account, transactions),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Deposit failed" });
  }
});

router.post("/withdraw", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const fee = Number(req.body.fee || 0);
    const category = req.body.category;
    const reference = (req.body.reference || "").trim();
    const status = (req.body.status || "Completed").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Enter a valid withdrawal amount" });
    }

    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ error: "Enter a valid withdrawal fee" });
    }

    if (!WITHDRAW_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Choose a valid spending category" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const account = await ensureAccountForUser(user._id);
    const debitAmount = amount + fee;

    if (Number(account.balance || 0) < debitAmount) {
      return res.status(400).json({ error: "Insufficient balance for this withdrawal" });
    }

    account.balance = Number(account.balance || 0) - debitAmount;

    const transaction = new Transaction({
      userId: user._id,
      accountId: account._id,
      amount,
      fee,
      type: "withdrawal",
      category,
      status,
      reference: reference || `${category} withdrawal`,
    });

    await Promise.all([account.save(), transaction.save()]);

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(201).json({
      message: "Withdrawal completed successfully",
      transaction: formatTransaction(transaction.toObject()),
      ...buildOverview(account, transactions),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Withdrawal failed" });
  }
});

module.exports = router;

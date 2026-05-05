const express = require("express");
const User = require("../models/User");
const Account = require("../models/Account");
const authMiddleware = require("../middleware/authMiddleware");
const { createNotification } = require("../services/notificationService");
const {
  createTransaction,
  getBankingSummary,
  resolveInitialTransactionStatus,
} = require("../services/ledgerService");

const router = express.Router();

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

// GET ACCOUNTS
router.get("/accounts", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const accounts = await Account.find({ userId: user._id });
    res.json({ accounts });
  } catch (err) {
    console.error("GET ACCOUNTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// PAY BILL
router.post("/pay-bill", authMiddleware, async (req, res) => {
  try {
    const {
      amount,
      fee = 2,
      category,
      billerName,
      reference,
      accountId,
      dynamicFields = {},
      status,
    } = req.body;

    const parsedAmount = Number(amount);
    const parsedFee = Number(fee);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const transaction = await createTransaction(user._id, {
      accountId,
      amount: parsedAmount,
      fee: parsedFee,
      type: "bill",
      direction: "debit",
      category: category || "",
      status: resolveInitialTransactionStatus({
        type: "bill",
        status,
      }),
      reference: reference || `${category || "Bill"} payment`,
      description: `Bill payment to ${billerName || "provider"}`,
      metadata: {
        category: category || "",
        provider: billerName || "",
        ...dynamicFields,
      },
      billerName: billerName || "",
      dynamicFields,
    });
    if (transaction.status === "completed") {
      await createNotification(user._id, {
        title: "Bill payment completed",
        message: `R${Number(transaction.amount || 0).toFixed(2)} was paid to ${billerName || "your biller"}.`,
        type: "transaction",
        metadata: {
          event: "bill_payment_completed",
          transactionId: transaction._id,
          accountId: transaction.accountId,
          amount: transaction.amount,
          fee: transaction.fee || 0,
          billerName: billerName || "",
        },
      });
    }

    return res.status(201).json({
      message: "Bill paid successfully",
      transaction,
      ...(await loadSummary(user._id)),
    });
  } catch (err) {
    console.error("PAY BILL ERROR:", err);
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;

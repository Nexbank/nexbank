const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Account = require("../models/Account");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/authMiddleware");

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
      dynamicFields = {}
    } = req.body;

    const parsedAmount = Number(amount);
    const parsedFee = Number(fee);
    const totalDebit = parsedAmount + parsedFee;

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const account = await Account.findOne({
      _id: accountId,
      userId: user._id
    });

    if (!account) return res.status(404).json({ error: "Account not found" });

    if (account.balance < totalDebit) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Deduct from account
    account.balance -= totalDebit;
    await account.save();

    // Create transaction like profile creates user
    const transaction = await Transaction.create({
      userId: user._id,
      accountId: account._id,
      amount: parsedAmount,
      fee: parsedFee,
      type: "bill",
      category: category,
      reference: reference || `${category} payment`,
      status: "Completed",
      billerName: billerName,           // Now this field exists in schema
      dynamicFields: dynamicFields       // Now this field exists in schema
    });

    // Verify it was saved (like profile does)
    const savedTransaction = await Transaction.findById(transaction._id);
    
    if (!savedTransaction) {
      throw new Error("Transaction was not saved to database");
    }

    return res.status(201).json({
      message: "Bill paid successfully",
      transaction: savedTransaction,
      newBalance: account.balance
    });

  } catch (err) {
    console.error("PAY BILL ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
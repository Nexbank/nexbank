const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
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
} = require("../services/ledgerService");

const router = express.Router();

router.use(authMiddleware);

router.get("/summary", async (req, res) => {
  try {
    const summary = await getBankingSummary(req.user.userId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load banking summary" });
  }
});

router.get("/accounts/:userId", async (req, res) => {
  try {
    if (req.params.userId !== req.user.userId) {
      return res.status(403).json({ error: "You can only view your own accounts" });
    }

    const accounts = await getUserAccounts(req.user.userId);
    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load accounts" });
  }
});

router.get("/cards", async (req, res) => {
  try {
    const cards = await getUserCards(req.user.userId, req.query.accountId);
    res.json({ cards });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load cards" });
  }
});

router.get("/cards/:id/details", async (req, res) => {
  try {
    const details = await getCardDetails(req.user.userId, req.params.id);
    res.json({ details });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to load card details" });
  }
});

router.post("/cards", async (req, res) => {
  try {
    const card = await createCard(req.user.userId, req.body);
    const summary = await getBankingSummary(req.user.userId);
    res.status(201).json({ card, ...summary });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create card" });
  }
});

router.post("/cards/:id/freeze", async (req, res) => {
  try {
    const card = await freezeCard(req.user.userId, req.params.id);
    const summary = await getBankingSummary(req.user.userId);
    res.json({ card, ...summary });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to freeze card" });
  }
});

router.post("/cards/:id/replace", async (req, res) => {
  try {
    const replacement = await replaceCard(req.user.userId, req.params.id);
    const summary = await getBankingSummary(req.user.userId);
    res.json({ replacement, ...summary });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to replace card" });
  }
});

router.patch("/cards/:id", async (req, res) => {
  try {
    const card = await updateCard(req.user.userId, req.params.id, req.body);
    const summary = await getBankingSummary(req.user.userId);
    res.json({ card, ...summary });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update card" });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const transactions = await getUserTransactions(req.user.userId, req.query.accountId);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load transactions" });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const transaction = await createTransaction(req.user.userId, req.body);
    const summary = await getBankingSummary(req.user.userId);
    res.status(201).json({ transaction, ...summary });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create transaction" });
  }
});

router.patch("/transactions/:id/status", async (req, res) => {
  try {
    const transaction = await updateTransactionStatus(
      req.user.userId,
      req.params.id,
      req.body.status
    );
    const summary = await getBankingSummary(req.user.userId);
    res.json({ transaction, ...summary });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update transaction status" });
  }
});

module.exports = router;

router.post("/pay-bill", async (req, res) => {
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

    // ✅ VALIDATION
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!billerName) {
      return res.status(400).json({ error: "Biller name required" });
    }

    if (!category) {
      return res.status(400).json({ error: "Category required" });
    }

    // ✅ USER + ACCOUNT
    const user = await User.findById(req.user.userId);
    const account = await Account.findById(accountId);

    if (!user || !account) {
      return res.status(404).json({ error: "User or account not found" });
    }

    // ✅ BALANCE CHECK
    if (account.balance < totalDebit) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // ✅ DEDUCT (THIS IS THE REAL ACTION)
    account.balance -= totalDebit;

    // ✅ RECORD TRANSACTION (AS WITHDRAWAL)
    const transaction = new Transaction({
      userId: user._id,
      accountId: account._id,

      amount: parsedAmount,
      fee: parsedFee,

      type: "withdrawal", // ✅ ALWAYS for bills
      category,           // Electricity, DSTV, etc.
      billerName,

      dynamicFields,

      reference: reference || `${billerName} bill`,
      status: "Completed"
    });

    await account.save();
    await transaction.save();

    res.status(201).json({
      message: "Bill paid successfully",
      newBalance: account.balance,
      transaction
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bill payment failed" });
  }
});
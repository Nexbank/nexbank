const path = require("path");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});

const APPLY_FLAG = "--apply";
const SMALL_DIFF_THRESHOLD = 5;
const ZERO_TOLERANCE = 0.0001;

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const normalizeStatus = (value, fallback = "completed") => {
  const normalized = String(value || fallback).trim().toLowerCase();

  if (normalized === "complete") {
    return "completed";
  }

  if (["created", "pending", "completed", "failed", "expired", "reversed"].includes(normalized)) {
    return normalized;
  }

  return fallback;
};

const inferDirection = (transaction) => {
  const existingDirection = String(transaction.direction || "").trim().toLowerCase();
  if (existingDirection === "credit") {
    return "credit";
  }

  if (existingDirection === "debit") {
    return "debit";
  }

  if (transaction.type === "deposit") {
    return "credit";
  }

  if (transaction.type === "withdrawal" || transaction.type === "bill") {
    return "debit";
  }

  if (transaction.type === "transfer") {
    return transaction.metadata?.sourceAccountId ? "credit" : "debit";
  }

  return "debit";
};

const inferLedgerPosted = (transaction, status) => {
  if (typeof transaction.ledgerPosted === "boolean") {
    return transaction.ledgerPosted;
  }

  if (status === "completed") {
    return true;
  }

  if (status === "pending") {
    return false;
  }

  return false;
};

const inferFundsReserved = (transaction, direction, status) => {
  if (typeof transaction.fundsReserved === "boolean") {
    return transaction.fundsReserved;
  }

  if (direction === "credit") {
    return false;
  }

  if (status === "pending") {
    return true;
  }

  if (status === "completed") {
    return true;
  }

  return false;
};

const getDebitImpactAmount = (transaction) =>
  roundMoney(Number(transaction.amount || 0) + Number(transaction.fee || 0));

const classifyDiff = (report) => {
  const diffs = [
    Math.abs(report.difference.ledgerVsStoredLedger),
    Math.abs(report.difference.availableVsStoredAvailable),
    Math.abs(report.difference.balanceVsComputedLedger),
  ];
  const largestDiff = Math.max(...diffs);

  if (largestDiff <= ZERO_TOLERANCE) {
    return "match";
  }

  if (largestDiff <= SMALL_DIFF_THRESHOLD) {
    return "small_diff";
  }

  return "huge_diff";
};

const recommendedActionForClass = (classification) => {
  if (classification === "match") {
    return "Do nothing. Stored balances match computed ledger values.";
  }

  if (classification === "small_diff") {
    return "Investigate carefully. This looks like a small rounding or fee-related difference.";
  }

  return "Do not auto-fix. Treat current account balances as source of truth until history is reviewed manually.";
};

function computeAccountReport(account, transactions) {
  const report = {
    accountId: String(account._id),
    name: account.name || "",
    accountNumber: account.accountNumber || "",
    status: account.status || "",
    stored: {
      balance: roundMoney(account.balance ?? 0),
      availableBalance: roundMoney(account.availableBalance ?? 0),
      ledgerBalance: roundMoney(account.ledgerBalance ?? 0),
    },
    computed: {
      ledgerBalance: 0,
      availableBalance: 0,
    },
    transactionCount: transactions.length,
    legacyFieldCounts: {
      missingDirection: 0,
      missingLedgerPosted: 0,
      missingFundsReserved: 0,
    },
    sampleLegacyTransactions: [],
    difference: {
      ledgerVsStoredLedger: 0,
      availableVsStoredAvailable: 0,
      balanceVsComputedLedger: 0,
    },
    classification: "",
    recommendedAction: "",
  };

  for (const transaction of transactions) {
    const status = normalizeStatus(transaction.status);
    const direction = inferDirection(transaction);
    const ledgerPosted = inferLedgerPosted(transaction, status);
    const fundsReserved = inferFundsReserved(transaction, direction, status);
    const amount =
      direction === "credit"
        ? roundMoney(transaction.amount || 0)
        : getDebitImpactAmount(transaction);

    const missingDirection = !String(transaction.direction || "").trim();
    const missingLedgerPosted = typeof transaction.ledgerPosted !== "boolean";
    const missingFundsReserved = typeof transaction.fundsReserved !== "boolean";

    if (missingDirection) {
      report.legacyFieldCounts.missingDirection += 1;
    }
    if (missingLedgerPosted) {
      report.legacyFieldCounts.missingLedgerPosted += 1;
    }
    if (missingFundsReserved) {
      report.legacyFieldCounts.missingFundsReserved += 1;
    }

    if (
      (missingDirection || missingLedgerPosted || missingFundsReserved) &&
      report.sampleLegacyTransactions.length < 3
    ) {
      report.sampleLegacyTransactions.push({
        id: String(transaction._id),
        type: transaction.type,
        status,
        inferredDirection: direction,
        inferredLedgerPosted: ledgerPosted,
        inferredFundsReserved: fundsReserved,
        amount: roundMoney(transaction.amount || 0),
        fee: roundMoney(transaction.fee || 0),
        createdAt: transaction.createdAt,
      });
    }

    if (ledgerPosted) {
      if (direction === "credit") {
        report.computed.ledgerBalance = roundMoney(report.computed.ledgerBalance + amount);
        report.computed.availableBalance = roundMoney(report.computed.availableBalance + amount);
      } else {
        report.computed.ledgerBalance = roundMoney(report.computed.ledgerBalance - amount);
        report.computed.availableBalance = roundMoney(report.computed.availableBalance - amount);
      }
      continue;
    }

    if (status === "pending" && direction === "debit" && fundsReserved) {
      report.computed.availableBalance = roundMoney(report.computed.availableBalance - amount);
    }
  }

  report.difference.ledgerVsStoredLedger = roundMoney(
    report.computed.ledgerBalance - report.stored.ledgerBalance
  );
  report.difference.availableVsStoredAvailable = roundMoney(
    report.computed.availableBalance - report.stored.availableBalance
  );
  report.difference.balanceVsComputedLedger = roundMoney(
    report.stored.balance - report.computed.ledgerBalance
  );
  report.classification = classifyDiff(report);
  report.recommendedAction = recommendedActionForClass(report.classification);

  return report;
}

function buildTransactionPatch(transaction) {
  const status = normalizeStatus(transaction.status);
  const direction = inferDirection(transaction);
  const ledgerPosted = inferLedgerPosted(transaction, status);
  const fundsReserved = inferFundsReserved(transaction, direction, status);
  const patch = {};

  if (!String(transaction.direction || "").trim()) {
    patch.direction = direction;
  }

  if (typeof transaction.ledgerPosted !== "boolean") {
    patch.ledgerPosted = ledgerPosted;
  }

  if (typeof transaction.fundsReserved !== "boolean") {
    patch.fundsReserved = fundsReserved;
  }

  return patch;
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();

  try {
    const db = client.db();
    const apply = process.argv.includes(APPLY_FLAG);
    const accountsCollection = db.collection("accounts");
    const transactionsCollection = db.collection("transactions");

    const [accounts, transactions] = await Promise.all([
      accountsCollection
        .find({})
        .project({
          name: 1,
          accountNumber: 1,
          balance: 1,
          availableBalance: 1,
          ledgerBalance: 1,
          status: 1,
          isLedgerConsistent: 1,
        })
        .toArray(),
      transactionsCollection
        .find({})
        .project({
          userId: 1,
          accountId: 1,
          recipientAccountId: 1,
          amount: 1,
          fee: 1,
          type: 1,
          direction: 1,
          status: 1,
          metadata: 1,
          ledgerPosted: 1,
          fundsReserved: 1,
          createdAt: 1,
        })
        .sort({ createdAt: 1 })
        .toArray(),
    ]);

    const patchOperations = [];
    const transactionsByAccountId = new Map();
    const classificationSummary = {
      totalLegacyDirection: 0,
      totalLegacyLedgerPosted: 0,
      totalLegacyFundsReserved: 0,
      byType: {},
    };

    for (const transaction of transactions) {
      const patch = buildTransactionPatch(transaction);
      const typeKey = transaction.type || "unknown";
      if (!classificationSummary.byType[typeKey]) {
        classificationSummary.byType[typeKey] = {
          total: 0,
          missingDirection: 0,
          missingLedgerPosted: 0,
          missingFundsReserved: 0,
        };
      }
      classificationSummary.byType[typeKey].total += 1;

      if (Object.prototype.hasOwnProperty.call(patch, "direction")) {
        classificationSummary.totalLegacyDirection += 1;
        classificationSummary.byType[typeKey].missingDirection += 1;
      }
      if (Object.prototype.hasOwnProperty.call(patch, "ledgerPosted")) {
        classificationSummary.totalLegacyLedgerPosted += 1;
        classificationSummary.byType[typeKey].missingLedgerPosted += 1;
      }
      if (Object.prototype.hasOwnProperty.call(patch, "fundsReserved")) {
        classificationSummary.totalLegacyFundsReserved += 1;
        classificationSummary.byType[typeKey].missingFundsReserved += 1;
      }

      if (Object.keys(patch).length > 0) {
        patchOperations.push({
          updateOne: {
            filter: { _id: transaction._id },
            update: { $set: patch },
          },
        });
      }

      const accountId = transaction.accountId ? String(transaction.accountId) : "";
      if (!transactionsByAccountId.has(accountId)) {
        transactionsByAccountId.set(accountId, []);
      }

      const patchedTransaction = {
        ...transaction,
        ...patch,
      };
      transactionsByAccountId.get(accountId).push(patchedTransaction);
    }

    const reports = accounts
      .map((account) =>
        computeAccountReport(account, transactionsByAccountId.get(String(account._id)) || [])
      )
      .filter((report) => {
        const hasLegacy = Object.values(report.legacyFieldCounts).some((count) => count > 0);
        const hasDrift =
          Math.abs(report.difference.ledgerVsStoredLedger) > ZERO_TOLERANCE ||
          Math.abs(report.difference.availableVsStoredAvailable) > ZERO_TOLERANCE ||
          Math.abs(report.difference.balanceVsComputedLedger) > ZERO_TOLERANCE;
        return hasLegacy || hasDrift;
      })
      .sort((left, right) => {
        const leftWeight =
          Math.abs(left.difference.ledgerVsStoredLedger) +
          Math.abs(left.difference.availableVsStoredAvailable);
        const rightWeight =
          Math.abs(right.difference.ledgerVsStoredLedger) +
          Math.abs(right.difference.availableVsStoredAvailable);
        return rightWeight - leftWeight;
      });

    const ledgerFlagOperations = accounts.map((account) => {
      const report =
        reports.find((entry) => entry.accountId === String(account._id)) ||
        computeAccountReport(account, transactionsByAccountId.get(String(account._id)) || []);

      return {
        updateOne: {
          filter: { _id: account._id },
          update: {
            $set: {
              isLedgerConsistent: report.classification === "match",
            },
          },
        },
      };
    });

    let transactionPatchResult = { matchedCount: 0, modifiedCount: 0 };
    let ledgerFlagResult = { matchedCount: 0, modifiedCount: 0 };

    if (apply) {
      if (patchOperations.length > 0) {
        transactionPatchResult = await transactionsCollection.bulkWrite(patchOperations);
      }

      if (ledgerFlagOperations.length > 0) {
        ledgerFlagResult = await accountsCollection.bulkWrite(ledgerFlagOperations);
      }
    }

    const output = {
      mode: apply ? "apply" : "dry-run",
      safeDefaults: {
        deposit: "credit",
        withdrawal: "debit",
        bill: "debit",
        transfer: "debit unless metadata.sourceAccountId proves credit",
        completedDeposit: {
          direction: "credit",
          ledgerPosted: true,
          fundsReserved: false,
        },
        completedDebit: {
          direction: "debit",
          ledgerPosted: true,
          fundsReserved: true,
        },
        pendingDebit: {
          ledgerPosted: false,
          fundsReserved: true,
        },
      },
      classificationSummary,
      transactionPatchCount: patchOperations.length,
      transactionPatchResult,
      ledgerFlagResult,
      totals: {
        accountCount: accounts.length,
        transactionCount: transactions.length,
        reportedAccountCount: reports.length,
      },
      driftedAccounts: reports,
    };

    console.log(JSON.stringify(output, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

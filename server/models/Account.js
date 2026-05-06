// models/Account.js
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, default: "Main Account" },
  balance: { type: Number, default: 0 },
  ledgerBalance: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  accountNumber: { type: String, unique: true },
  accountType: { type: String, default: "current" },
  category: { type: String, default: "transactional" },
  status: { type: String, default: "active" },
  isActive: { type: Boolean, default: true },
  isLedgerConsistent: { type: Boolean, default: true },
  closedAt: { type: Date, default: null },
  closedReason: { type: String, default: null },
  limits: {
    deposit: { type: Number, default: 50000 },
    withdrawalCash: { type: Number, default: 3000 },
    withdrawalBank: { type: Number, default: 10000 },
    transferInternal: { type: Number, default: 20000 },
    transferExternal: { type: Number, default: 10000 },
    voucher: { type: Number, default: 3000 },
    bill: { type: Number, default: 15000 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CLOSED_ACCOUNT_STATUS = "closed";
const ACTIVE_ACCOUNT_STATUS = "active";

accountSchema.index(
  { userId: 1, accountType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: ACTIVE_ACCOUNT_STATUS,
      isActive: true,
    },
    name: "unique_active_account_type_per_user",
  }
);

accountSchema.pre("save", async function preventDuplicateActiveAccount() {
  if (
    !this.isNew &&
    !this.isModified("accountType") &&
    !this.isModified("status") &&
    !this.isModified("isActive")
  ) {
    return;
  }

  const isActiveAccount =
    this.isActive !== false &&
    String(this.status || ACTIVE_ACCOUNT_STATUS).toLowerCase() !== CLOSED_ACCOUNT_STATUS;

  if (!isActiveAccount) {
    return;
  }

  const duplicateAccount = await this.constructor.findOne({
    _id: { $ne: this._id },
    userId: this.userId,
    accountType: this.accountType,
    isActive: { $ne: false },
    status: { $ne: CLOSED_ACCOUNT_STATUS },
  }).lean();

  if (duplicateAccount) {
    throw new Error("You already have an active account for this product.");
  }
});

module.exports = mongoose.model("Account", accountSchema);

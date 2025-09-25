import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: [
        "staff_salaries",
        "maintenance",
        "food_raw_materials",
        "cleaning_supplies",
        "utilities",
        "marketing",
        "technology",
        "insurance",
        "rent",
        "equipment",
        "training",
        "other"
      ],
      required: true,
      index: true,
    },
    department: {
      type: String,
      enum: ["Kitchen", "Services", "Maintenance", "Cleaning", "Management", "General"],
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "credit_card", "check", "digital_wallet"],
      default: "bank_transfer",
    },
    vendor: {
      name: String,
      contact: String,
      email: String,
    },
    receiptUrl: {
      type: String,
      validate: {
        validator: (v) => !v || /^(http|https):\/\/[^ "]+$/.test(v),
        message: "Must be a valid URL",
      },
    },
    invoiceNumber: String,
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
    },
    nextRecurringDate: Date,
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    tags: [String],
    notes: String,
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
expenseSchema.index({ category: 1, paidAt: -1 });
expenseSchema.index({ department: 1, paidAt: -1 });
expenseSchema.index({ paidAt: -1 });
expenseSchema.index({ isRecurring: 1, nextRecurringDate: 1 });

// Virtual for getting expense month/year
expenseSchema.virtual('expenseMonth').get(function() {
  return {
    year: this.paidAt.getFullYear(),
    month: this.paidAt.getMonth() + 1,
  };
});

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
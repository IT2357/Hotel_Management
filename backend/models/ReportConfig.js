import mongoose from "mongoose";

const reportConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ["booking", "financial", "operational", "performance", "custom"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    // Report Configuration
    filters: {
      dateRange: {
        start: Date,
        end: Date,
      },
      departments: [String],
      categories: [String],
      status: [String],
      paymentMethods: [String],
      bookingChannels: [String],
      customFilters: mongoose.Schema.Types.Mixed,
    },
    
    // Metrics to include
    metrics: {
      revenue: { type: Boolean, default: true },
      expenses: { type: Boolean, default: true },
      bookings: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      staff: { type: Boolean, default: true },
      guests: { type: Boolean, default: true },
      customMetrics: [String],
    },
    
    // Visualization preferences
    charts: {
      lineCharts: [String],
      barCharts: [String],
      pieCharts: [String],
      donutCharts: [String],
      tableViews: [String],
    },
    
    // Export settings
    exportFormats: {
      pdf: { type: Boolean, default: true },
      excel: { type: Boolean, default: true },
      csv: { type: Boolean, default: false },
    },
    
    // Scheduling settings
    isScheduled: {
      type: Boolean,
      default: false,
    },
    schedule: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly"],
      },
      time: String, // "09:00"
      daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
      dayOfMonth: Number, // 1-31
      recipients: [String], // email addresses
    },
    
    // Alert settings
    alerts: {
      enabled: { type: Boolean, default: false },
      thresholds: {
        occupancyRate: { min: Number, max: Number },
        profitMargin: { min: Number, max: Number },
        taskCompletionRate: { min: Number, max: Number },
        guestSatisfaction: { min: Number, max: Number },
        expenseLimit: Number,
        customThresholds: mongoose.Schema.Types.Mixed,
      },
      notificationMethods: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
    },
    
    // Access control
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      permissions: {
        type: String,
        enum: ["view", "edit", "admin"],
        default: "view",
      },
    }],
    
    // Template settings
    isTemplate: {
      type: Boolean,
      default: false,
    },
    templateCategory: String,
    
    // Usage tracking
    lastUsed: Date,
    usageCount: {
      type: Number,
      default: 0,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
reportConfigSchema.index({ type: 1, createdBy: 1 });
reportConfigSchema.index({ isTemplate: 1, templateCategory: 1 });
reportConfigSchema.index({ isScheduled: 1, "schedule.frequency": 1 });
reportConfigSchema.index({ createdBy: 1, isActive: 1 });

const ReportConfig = mongoose.model("ReportConfig", reportConfigSchema);
export default ReportConfig;
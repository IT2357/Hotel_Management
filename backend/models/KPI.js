import mongoose from "mongoose";

const kpiSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
      required: true,
      index: true,
    },
    
    // Booking Metrics
    totalBookings: {
      type: Number,
      default: 0,
    },
    totalRooms: {
      type: Number,
      default: 0,
    },
    occupiedRooms: {
      type: Number,
      default: 0,
    },
    occupancyRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averageRoomRate: {
      type: Number,
      default: 0,
    },
    revenuePerAvailableRoom: {
      type: Number,
      default: 0,
    },
    
    // Revenue Metrics
    totalRevenue: {
      type: Number,
      default: 0,
    },
    roomRevenue: {
      type: Number,
      default: 0,
    },
    foodRevenue: {
      type: Number,
      default: 0,
    },
    serviceRevenue: {
      type: Number,
      default: 0,
    },
    averageRevenuePerBooking: {
      type: Number,
      default: 0,
    },
    
    // Expense Metrics
    totalExpenses: {
      type: Number,
      default: 0,
    },
    staffExpenses: {
      type: Number,
      default: 0,
    },
    maintenanceExpenses: {
      type: Number,
      default: 0,
    },
    foodExpenses: {
      type: Number,
      default: 0,
    },
    utilitiesExpenses: {
      type: Number,
      default: 0,
    },
    otherExpenses: {
      type: Number,
      default: 0,
    },
    
    // Profitability Metrics
    grossProfit: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    profitMargin: {
      type: Number,
      default: 0,
    },
    
    // Task Metrics
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    pendingTasks: {
      type: Number,
      default: 0,
    },
    cancelledTasks: {
      type: Number,
      default: 0,
    },
    taskCompletionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averageTaskCompletionTime: {
      type: Number, // in minutes
      default: 0,
    },
    
    // Staff Performance Metrics
    totalStaff: {
      type: Number,
      default: 0,
    },
    activeStaff: {
      type: Number,
      default: 0,
    },
    averageTasksPerStaff: {
      type: Number,
      default: 0,
    },
    staffUtilizationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Guest Satisfaction Metrics
    totalReviews: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    guestSatisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Customer Metrics
    totalGuests: {
      type: Number,
      default: 0,
    },
    newGuests: {
      type: Number,
      default: 0,
    },
    returningGuests: {
      type: Number,
      default: 0,
    },
    guestRetentionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Booking Channel Distribution
    channelDistribution: {
      direct: { type: Number, default: 0 },
      online: { type: Number, default: 0 },
      phone: { type: Number, default: 0 },
      walkIn: { type: Number, default: 0 },
      agent: { type: Number, default: 0 },
      corporate: { type: Number, default: 0 },
    },
    
    // Department Task Distribution
    departmentTasks: {
      Kitchen: { type: Number, default: 0 },
      Services: { type: Number, default: 0 },
      Maintenance: { type: Number, default: 0 },
      Cleaning: { type: Number, default: 0 },
    },
    
    // Additional calculated fields
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    calculatedBy: {
      type: String,
      default: "system",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
kpiSchema.index({ period: 1, date: -1 });
kpiSchema.index({ date: -1 });

// Ensure unique KPI per date and period
kpiSchema.index({ date: 1, period: 1 }, { unique: true });

const KPI = mongoose.model("KPI", kpiSchema);
export default KPI;
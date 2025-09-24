import mongoose from "mongoose";

const forecastSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["booking_demand", "revenue", "expenses", "occupancy", "seasonal_trends"],
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
      required: true,
    },
    forecastDate: {
      type: Date,
      required: true,
      index: true,
    },
    
    // Predicted values
    predictedValue: {
      type: Number,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    upperBound: Number,
    lowerBound: Number,
    
    // Historical context
    historicalAverage: Number,
    trend: {
      type: String,
      enum: ["increasing", "decreasing", "stable", "volatile"],
    },
    seasonalityFactor: Number,
    
    // Model information
    model: {
      type: String,
      enum: ["linear_regression", "arima", "seasonal_decomposition", "moving_average", "exponential_smoothing"],
      required: true,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    dataPoints: Number, // number of historical data points used
    
    // Additional metadata
    features: [String], // factors considered in prediction
    anomalies: [{
      date: Date,
      value: Number,
      reason: String,
    }],
    
    // Business context
    factors: {
      events: [String],
      holidays: [String],
      marketing: [String],
      external: [String],
    },
    
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: String,
      default: "ai_system",
    },
    
    // Validation
    actualValue: Number, // filled when actual data is available
    accuracyScore: Number, // calculated after actual value is known
    validated: {
      type: Boolean,
      default: false,
    },
    validatedAt: Date,
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for efficient querying
forecastSchema.index({ type: 1, forecastDate: -1 });
forecastSchema.index({ period: 1, forecastDate: -1 });
forecastSchema.index({ generatedAt: -1 });

// Compound index for unique forecasts
forecastSchema.index(
  { type: 1, period: 1, forecastDate: 1, model: 1 }, 
  { unique: true }
);

const Forecast = mongoose.model("Forecast", forecastSchema);
export default Forecast;
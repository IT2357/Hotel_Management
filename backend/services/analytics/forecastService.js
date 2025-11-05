import Forecast from '../../models/Forecast.js';
import Booking from '../../models/Booking.js';
import Revenue from '../../models/Revenue.js';
import Expense from '../../models/Expense.js';
import KPI from '../../models/KPI.js';
import { subDays, subMonths, addDays, addMonths, format } from 'date-fns';

class ForecastService {
  /**
   * Generate forecast based on historical data
   */
  async generateForecast({ type, period = 'monthly', horizon = 6 }) {
    const existingForecast = await this._getExistingForecast(type, period, horizon);
    
    if (existingForecast && this._isForecastFresh(existingForecast)) {
      return existingForecast;
    }

    // Get historical data for the forecast
    const historicalData = await this._getHistoricalData(type, period, horizon * 2);
    
    if (historicalData.length < 3) {
      throw new Error('Insufficient historical data for forecasting');
    }

    // Generate forecast using different models
    const forecasts = await Promise.all([
      this._linearRegressionForecast(historicalData, horizon),
      this._movingAverageForecast(historicalData, horizon),
      this._seasonalForecast(historicalData, horizon, period),
      this._exponentialSmoothingForecast(historicalData, horizon)
    ]);

    // Combine forecasts using ensemble method
    const combinedForecast = this._combineForecast(forecasts, historicalData);

    // Store forecasts in database
    const storedForecasts = await this._storeForecast(type, period, combinedForecast, horizon);

    return {
      type,
      period,
      horizon,
      forecasts: storedForecasts,
      historical: historicalData.slice(-12), // Last 12 data points for context
      accuracy: await this._calculateAccuracy(type, period),
      generatedAt: new Date(),
      nextUpdate: this._getNextUpdateTime()
    };
  }

  /**
   * Get booking demand forecast
   */
  async getBookingForecast({ startDate, endDate, period = 'monthly' }) {
    const horizon = this._calculateHorizon(startDate, endDate, period);
    
    return await this.generateForecast({
      type: 'booking_demand',
      period,
      horizon
    });
  }

  /**
   * Get revenue forecast
   */
  async getRevenueForecast({ startDate, endDate, period = 'monthly' }) {
    const horizon = this._calculateHorizon(startDate, endDate, period);
    
    return await this.generateForecast({
      type: 'revenue',
      period,
      horizon
    });
  }

  /**
   * Get seasonal trends analysis
   */
  async getSeasonalTrends({ type, period = 'monthly' }) {
    const historicalData = await this._getHistoricalData(type, period, 24); // 2 years of data
    
    const seasonalAnalysis = this._analyzeSeasonality(historicalData, period);
    
    return {
      type,
      period,
      seasonality: seasonalAnalysis,
      recommendations: this._generateSeasonalRecommendations(seasonalAnalysis),
      generatedAt: new Date()
    };
  }

  /**
   * Update forecast accuracy when actual data becomes available
   */
  async updateForecastAccuracy(forecastId, actualValue) {
    const forecast = await Forecast.findById(forecastId);
    
    if (!forecast) {
      throw new Error('Forecast not found');
    }

    const accuracyScore = this._calculateAccuracyScore(forecast.predictedValue, actualValue);
    
    await Forecast.findByIdAndUpdate(forecastId, {
      actualValue,
      accuracyScore,
      validated: true,
      validatedAt: new Date()
    });

    return { accuracyScore, validated: true };
  }

  // Private methods

  async _getExistingForecast(type, period, horizon) {
    return await Forecast.findOne({
      type,
      period,
      forecastDate: { $gte: new Date() },
      generatedAt: { $gte: subDays(new Date(), 1) } // Fresh if generated within last day
    }).sort({ generatedAt: -1 });
  }

  _isForecastFresh(forecast) {
    const daysSinceGenerated = Math.floor((new Date() - forecast.generatedAt) / (1000 * 60 * 60 * 24));
    return daysSinceGenerated < 1; // Consider fresh if less than 1 day old
  }

  async _getHistoricalData(type, period, count) {
    let data = [];

    switch (type) {
      case 'booking_demand':
        data = await this._getBookingHistoricalData(period, count);
        break;
      case 'revenue':
        data = await this._getRevenueHistoricalData(period, count);
        break;
      case 'expenses':
        data = await this._getExpenseHistoricalData(period, count);
        break;
      case 'occupancy':
        data = await this._getOccupancyHistoricalData(period, count);
        break;
      default:
        throw new Error(`Unsupported forecast type: ${type}`);
    }

    return data.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  async _getBookingHistoricalData(period, count) {
    const endDate = new Date();
    const startDate = period === 'monthly' ? subMonths(endDate, count) : subDays(endDate, count);

    const groupStage = period === 'monthly' 
      ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }
      : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };

    const data = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['Confirmed', 'Cancelled'] }
        }
      },
      {
        $group: {
          _id: groupStage,
          bookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, '$totalPrice', 0] }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return data.map(item => ({
      date: this._constructDate(item._id),
      value: item.confirmedBookings,
      metadata: {
        totalBookings: item.bookings,
        revenue: item.revenue
      }
    }));
  }

  async _getRevenueHistoricalData(period, count) {
    const endDate = new Date();
    const startDate = period === 'monthly' ? subMonths(endDate, count) : subDays(endDate, count);

    const groupStage = period === 'monthly' 
      ? { year: { $year: '$receivedAt' }, month: { $month: '$receivedAt' } }
      : { year: { $year: '$receivedAt' }, month: { $month: '$receivedAt' }, day: { $dayOfMonth: '$receivedAt' } };

    const data = await Revenue.aggregate([
      {
        $match: {
          receivedAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: groupStage,
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return data.map(item => ({
      date: this._constructDate(item._id),
      value: item.revenue,
      metadata: {
        transactions: item.transactions
      }
    }));
  }

  async _getExpenseHistoricalData(period, count) {
    const endDate = new Date();
    const startDate = period === 'monthly' ? subMonths(endDate, count) : subDays(endDate, count);

    const groupStage = period === 'monthly' 
      ? { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }
      : { year: { $year: '$paidAt' }, month: { $month: '$paidAt' }, day: { $dayOfMonth: '$paidAt' } };

    const data = await Expense.aggregate([
      {
        $match: {
          paidAt: { $gte: startDate, $lte: endDate },
          isApproved: true
        }
      },
      {
        $group: {
          _id: groupStage,
          expenses: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return data.map(item => ({
      date: this._constructDate(item._id),
      value: item.expenses,
      metadata: {
        transactions: item.transactions
      }
    }));
  }

  async _getOccupancyHistoricalData(period, count) {
    // Use KPI data for occupancy rates
    const endDate = new Date();
    const startDate = period === 'monthly' ? subMonths(endDate, count) : subDays(endDate, count);

    const data = await KPI.find({
      date: { $gte: startDate, $lte: endDate },
      period: period === 'monthly' ? 'monthly' : 'daily'
    }).sort({ date: 1 });

    return data.map(item => ({
      date: item.date,
      value: item.occupancyRate,
      metadata: {
        totalBookings: item.totalBookings,
        revenue: item.totalRevenue
      }
    }));
  }

  /**
   * Linear regression forecast
   */
  async _linearRegressionForecast(data, horizon) {
    const values = data.map(d => d.value);
    const n = values.length;
    
    // Calculate linear regression coefficients
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const forecasts = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= horizon; i++) {
      const predictedValue = intercept + slope * (n + i);
      const forecastDate = this._addPeriod(lastDate, i, 'monthly');
      
      forecasts.push({
        forecastDate,
        predictedValue: Math.max(0, predictedValue), // Ensure non-negative
        confidence: Math.max(50, 90 - (i * 5)), // Decreasing confidence over time
        model: 'linear_regression'
      });
    }
    
    return forecasts;
  }

  /**
   * Moving average forecast
   */
  async _movingAverageForecast(data, horizon) {
    const windowSize = Math.min(6, Math.floor(data.length / 2));
    const recentValues = data.slice(-windowSize).map(d => d.value);
    const average = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    const forecasts = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= horizon; i++) {
      const forecastDate = this._addPeriod(lastDate, i, 'monthly');
      
      forecasts.push({
        forecastDate,
        predictedValue: average,
        confidence: Math.max(60, 85 - (i * 3)),
        model: 'moving_average'
      });
    }
    
    return forecasts;
  }

  /**
   * Seasonal forecast with trend
   */
  async _seasonalForecast(data, horizon, period) {
    const seasonLength = period === 'monthly' ? 12 : 7; // 12 months or 7 days
    
    if (data.length < seasonLength * 2) {
      return this._movingAverageForecast(data, horizon);
    }
    
    // Calculate seasonal indices
    const seasonalIndices = this._calculateSeasonalIndices(data, seasonLength);
    
    // Calculate trend
    const trend = this._calculateTrend(data);
    
    const forecasts = [];
    const lastDate = new Date(data[data.length - 1].date);
    const baseValue = data[data.length - 1].value;
    
    for (let i = 1; i <= horizon; i++) {
      const seasonIndex = (data.length + i - 1) % seasonLength;
      const seasonalFactor = seasonalIndices[seasonIndex];
      const trendValue = baseValue + (trend * i);
      const predictedValue = trendValue * seasonalFactor;
      
      const forecastDate = this._addPeriod(lastDate, i, 'monthly');
      
      forecasts.push({
        forecastDate,
        predictedValue: Math.max(0, predictedValue),
        confidence: Math.max(55, 88 - (i * 4)),
        model: 'seasonal_decomposition',
        seasonalFactor
      });
    }
    
    return forecasts;
  }

  /**
   * Exponential smoothing forecast
   */
  async _exponentialSmoothingForecast(data, horizon) {
    const alpha = 0.3; // Smoothing parameter
    const values = data.map(d => d.value);
    
    let smoothedValue = values[0];
    for (let i = 1; i < values.length; i++) {
      smoothedValue = alpha * values[i] + (1 - alpha) * smoothedValue;
    }
    
    const forecasts = [];
    const lastDate = new Date(data[data.length - 1].date);
    
    for (let i = 1; i <= horizon; i++) {
      const forecastDate = this._addPeriod(lastDate, i, 'monthly');
      
      forecasts.push({
        forecastDate,
        predictedValue: smoothedValue,
        confidence: Math.max(65, 90 - (i * 3)),
        model: 'exponential_smoothing'
      });
    }
    
    return forecasts;
  }

  /**
   * Combine multiple forecasts using weighted ensemble
   */
  _combineForecast(forecasts, historicalData) {
    const weights = {
      linear_regression: 0.25,
      moving_average: 0.20,
      seasonal_decomposition: 0.35,
      exponential_smoothing: 0.20
    };
    
    const combined = [];
    const horizonLength = forecasts[0].length;
    
    for (let i = 0; i < horizonLength; i++) {
      let weightedValue = 0;
      let weightedConfidence = 0;
      let totalWeight = 0;
      
      forecasts.forEach(modelForecasts => {
        if (modelForecasts[i]) {
          const weight = weights[modelForecasts[i].model] || 0.25;
          weightedValue += modelForecasts[i].predictedValue * weight;
          weightedConfidence += modelForecasts[i].confidence * weight;
          totalWeight += weight;
        }
      });
      
      combined.push({
        forecastDate: forecasts[0][i].forecastDate,
        predictedValue: weightedValue / totalWeight,
        confidence: weightedConfidence / totalWeight,
        upperBound: (weightedValue / totalWeight) * 1.2,
        lowerBound: (weightedValue / totalWeight) * 0.8,
        model: 'ensemble'
      });
    }
    
    return combined;
  }

  /**
   * Store forecast in database
   */
  async _storeForecast(type, period, forecasts, horizon) {
    const storedForecasts = [];
    
    for (const forecast of forecasts) {
      const storedForecast = await Forecast.findOneAndUpdate(
        {
          type,
          period,
          forecastDate: forecast.forecastDate,
          model: forecast.model
        },
        {
          ...forecast,
          type,
          period,
          generatedAt: new Date(),
          generatedBy: 'ai_system'
        },
        { upsert: true, new: true }
      );
      
      storedForecasts.push(storedForecast);
    }
    
    return storedForecasts;
  }

  // Helper methods

  _calculateHorizon(startDate, endDate, period) {
    if (period === 'monthly') {
      return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30));
    } else {
      return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    }
  }

  _constructDate(dateObj) {
    if (dateObj.day) {
      return new Date(dateObj.year, dateObj.month - 1, dateObj.day);
    } else {
      return new Date(dateObj.year, dateObj.month - 1, 1);
    }
  }

  _addPeriod(date, amount, period) {
    if (period === 'monthly') {
      return addMonths(date, amount);
    } else {
      return addDays(date, amount);
    }
  }

  _calculateSeasonalIndices(data, seasonLength) {
    const indices = new Array(seasonLength).fill(0);
    const counts = new Array(seasonLength).fill(0);
    
    // Calculate average for each season
    data.forEach((item, index) => {
      const seasonIndex = index % seasonLength;
      indices[seasonIndex] += item.value;
      counts[seasonIndex]++;
    });
    
    // Calculate overall average
    const overallAverage = data.reduce((sum, item) => sum + item.value, 0) / data.length;
    
    // Convert to seasonal factors
    return indices.map((sum, index) => {
      const seasonAverage = counts[index] > 0 ? sum / counts[index] : overallAverage;
      return overallAverage > 0 ? seasonAverage / overallAverage : 1;
    });
  }

  _calculateTrend(data) {
    if (data.length < 2) return 0;
    
    const values = data.map(d => d.value);
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  _analyzeSeasonality(data, period) {
    const seasonLength = period === 'monthly' ? 12 : 7;
    const seasonalIndices = this._calculateSeasonalIndices(data, seasonLength);
    
    const peakSeason = seasonalIndices.indexOf(Math.max(...seasonalIndices));
    const lowSeason = seasonalIndices.indexOf(Math.min(...seasonalIndices));
    
    return {
      indices: seasonalIndices,
      peakSeason: peakSeason + 1, // 1-based
      lowSeason: lowSeason + 1,
      seasonality: Math.max(...seasonalIndices) - Math.min(...seasonalIndices),
      pattern: this._identifySeasonalPattern(seasonalIndices)
    };
  }

  _identifySeasonalPattern(indices) {
    // Simple pattern identification
    const variance = this._calculateVariance(indices);
    
    if (variance < 0.1) return 'stable';
    if (variance < 0.3) return 'moderate_seasonal';
    return 'highly_seasonal';
  }

  _calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  _generateSeasonalRecommendations(seasonalAnalysis) {
    const recommendations = [];
    
    if (seasonalAnalysis.pattern === 'highly_seasonal') {
      recommendations.push({
        type: 'pricing',
        message: 'Consider dynamic pricing based on seasonal demand patterns',
        priority: 'high'
      });
      
      recommendations.push({
        type: 'staffing',
        message: `Increase staffing during peak season (period ${seasonalAnalysis.peakSeason})`,
        priority: 'medium'
      });
    }
    
    if (seasonalAnalysis.seasonality > 0.5) {
      recommendations.push({
        type: 'marketing',
        message: `Focus marketing efforts during low season (period ${seasonalAnalysis.lowSeason})`,
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  async _calculateAccuracy(type, period) {
    const validatedForecasts = await Forecast.find({
      type,
      period,
      validated: true,
      generatedAt: { $gte: subMonths(new Date(), 6) }
    });
    
    if (validatedForecasts.length === 0) {
      return { overall: null, byModel: {} };
    }
    
    const accuracyByModel = {};
    let totalAccuracy = 0;
    
    validatedForecasts.forEach(forecast => {
      const accuracy = forecast.accuracyScore || 0;
      totalAccuracy += accuracy;
      
      if (!accuracyByModel[forecast.model]) {
        accuracyByModel[forecast.model] = { sum: 0, count: 0 };
      }
      
      accuracyByModel[forecast.model].sum += accuracy;
      accuracyByModel[forecast.model].count++;
    });
    
    // Calculate averages
    Object.keys(accuracyByModel).forEach(model => {
      accuracyByModel[model] = accuracyByModel[model].sum / accuracyByModel[model].count;
    });
    
    return {
      overall: totalAccuracy / validatedForecasts.length,
      byModel: accuracyByModel,
      sampleSize: validatedForecasts.length
    };
  }

  _calculateAccuracyScore(predicted, actual) {
    if (actual === 0 && predicted === 0) return 100;
    if (actual === 0) return 0;
    
    const error = Math.abs(predicted - actual) / actual;
    return Math.max(0, 100 - (error * 100));
  }

  _getNextUpdateTime() {
    return addDays(new Date(), 1); // Update daily
  }
}

export const forecastService = new ForecastService();
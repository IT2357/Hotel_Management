import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FoodLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Log food order lifecycle events
   */
  logOrderEvent(event, orderData, additionalData = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      orderId: orderData._id || orderData.id,
      customerEmail: orderData.customerDetails?.email || orderData.customerEmail,
      orderStatus: orderData.status,
      totalPrice: orderData.totalPrice,
      itemCount: orderData.items?.length || 0,
      paymentMethod: orderData.paymentMethod,
      ...additionalData
    };

    this.writeToFile('food-orders.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log food API performance metrics
   */
  logPerformanceMetrics(metrics) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      ...metrics
    };

    this.writeToFile('food-performance.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log food system errors
   */
  logError(error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'error',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    };

    this.writeToFile('food-errors.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log payment events
   */
  logPaymentEvent(event, paymentData, additionalData = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      orderId: paymentData.orderId,
      paymentId: paymentData.paymentId,
      amount: paymentData.amount,
      status: paymentData.status,
      method: paymentData.method,
      ...additionalData
    };

    this.writeToFile('food-payments.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log email events
   */
  logEmailEvent(event, emailData, additionalData = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      orderId: emailData.orderId,
      status: emailData.status,
      ...additionalData
    };

    this.writeToFile('food-emails.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * Log analytics events
   */
  logAnalyticsEvent(event, analyticsData, additionalData = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...analyticsData,
      ...additionalData
    };

    this.writeToFile('food-analytics.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * Get food system health metrics
   */
  getHealthMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      };

      this.writeToFile('food-health.log', JSON.stringify(metrics) + '\n');
      return metrics;
    } catch (error) {
      console.error('Failed to get health metrics:', error);
      return null;
    }
  }

  /**
   * Get recent order statistics
   */
  async getOrderStats(hours = 24) {
    try {
      const logFile = path.join(this.logsDir, 'food-orders.log');
      if (!fs.existsSync(logFile)) {
        return { totalOrders: 0, successfulOrders: 0, failedOrders: 0 };
      }

      const logs = fs.readFileSync(logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoffTime);

      const stats = {
        totalOrders: recentLogs.length,
        successfulOrders: recentLogs.filter(log => log.event === 'order_completed').length,
        failedOrders: recentLogs.filter(log => log.event === 'order_failed').length,
        averageOrderValue: this.calculateAverageOrderValue(recentLogs),
        topPaymentMethods: this.getTopPaymentMethods(recentLogs)
      };

      return stats;
    } catch (error) {
      console.error('Failed to get order stats:', error);
      return { totalOrders: 0, successfulOrders: 0, failedOrders: 0 };
    }
  }

  /**
   * Calculate average order value from logs
   */
  calculateAverageOrderValue(logs) {
    const orderLogs = logs.filter(log => log.totalPrice);
    if (orderLogs.length === 0) return 0;
    
    const totalValue = orderLogs.reduce((sum, log) => sum + (log.totalPrice || 0), 0);
    return totalValue / orderLogs.length;
  }

  /**
   * Get top payment methods from logs
   */
  getTopPaymentMethods(logs) {
    const paymentMethods = {};
    logs.forEach(log => {
      if (log.paymentMethod) {
        paymentMethods[log.paymentMethod] = (paymentMethods[log.paymentMethod] || 0) + 1;
      }
    });
    
    return Object.entries(paymentMethods)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([method, count]) => ({ method, count }));
  }

  /**
   * Write to log file with rotation
   */
  writeToFile(filename, content) {
    try {
      const filePath = path.join(this.logsDir, filename);
      
      // Check file size and rotate if needed (10MB limit)
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > 10 * 1024 * 1024) { // 10MB
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedPath = path.join(this.logsDir, `${filename}.${timestamp}`);
          fs.renameSync(filePath, rotatedPath);
        }
      }
      
      fs.appendFileSync(filePath, content);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Clean old log files (older than 30 days)
   */
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }
}

export default new FoodLogger();

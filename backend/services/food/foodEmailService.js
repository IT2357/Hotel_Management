import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import emailService from '../notification/emailService.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FoodEmailService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../../templates/emails');
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order, customer) {
    try {
      const template = await this.loadTemplate('food-order-confirmation.html');
      
      // Calculate estimated time (30-45 minutes for most orders)
      const estimatedTime = new Date();
      estimatedTime.setMinutes(estimatedTime.getMinutes() + 35);
      
      const templateData = {
        customerName: customer.name || `${customer.firstName} ${customer.lastName}`,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        orderType: order.orderType || 'Dine-in',
        orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        estimatedTime: estimatedTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: order.status || 'pending',
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price.toFixed(2),
          total: (item.price * item.quantity).toFixed(2)
        })),
        subtotal: order.subtotal?.toFixed(2) || '0.00',
        tax: order.tax?.toFixed(2) || '0.00',
        deliveryFee: order.deliveryFee?.toFixed(2) || '0.00',
        totalPrice: order.totalPrice?.toFixed(2) || '0.00',
        specialInstructions: order.specialInstructions || '',
        deliveryAddress: order.deliveryAddress || '',
        qrCode: await this.generateQRCode(order._id.toString()),
        trackingUrl: `${process.env.FRONTEND_URL}/food/order-tracking/${order._id}`,
        websiteUrl: process.env.FRONTEND_URL
      };

      const htmlContent = this.renderTemplate(template, templateData);
      
      await emailService.sendEmail({
        to: customer.email,
        subject: `🍽️ Order Confirmation #${templateData.orderNumber} - Jaffna Hotel`,
        html: htmlContent,
        attachments: [
          {
            filename: `invoice-${templateData.orderNumber}.pdf`,
            content: await this.generateInvoicePDF(order, customer),
            contentType: 'application/pdf'
          }
        ]
      });

      logger.info('Order confirmation email sent', {
        orderId: order._id,
        customerEmail: customer.email
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send order confirmation email', {
        orderId: order._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send status update email
   */
  async sendStatusUpdate(order, customer, newStatus) {
    try {
      const template = await this.loadTemplate('food-order-status-update.html');
      
      const statusConfig = this.getStatusConfig(newStatus);
      
      const templateData = {
        customerName: customer.name || `${customer.firstName} ${customer.lastName}`,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        orderType: order.orderType || 'Dine-in',
        totalPrice: order.totalPrice?.toFixed(2) || '0.00',
        status: newStatus,
        statusIcon: statusConfig.icon,
        statusMessage: statusConfig.message,
        statusLevel: statusConfig.level,
        updateTime: new Date().toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        nextSteps: statusConfig.nextSteps,
        estimatedTime: statusConfig.estimatedTime,
        trackingUrl: `${process.env.FRONTEND_URL}/food/order-tracking/${order._id}`,
        websiteUrl: process.env.FRONTEND_URL
      };

      const htmlContent = this.renderTemplate(template, templateData);
      
      await emailService.sendEmail({
        to: customer.email,
        subject: `📱 Order Update #${templateData.orderNumber} - ${newStatus} - Jaffna Hotel`,
        html: htmlContent
      });

      logger.info('Status update email sent', {
        orderId: order._id,
        customerEmail: customer.email,
        newStatus
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send status update email', {
        orderId: order._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send order ready notification
   */
  async sendOrderReady(order, customer) {
    try {
      const template = await this.loadTemplate('food-order-status-update.html');
      
      const templateData = {
        customerName: customer.name || `${customer.firstName} ${customer.lastName}`,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
        orderType: order.orderType || 'Dine-in',
        totalPrice: order.totalPrice?.toFixed(2) || '0.00',
        status: 'Ready',
        statusIcon: '✅',
        statusMessage: 'Your order is ready for pickup/delivery!',
        statusLevel: 3,
        updateTime: new Date().toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        nextSteps: order.orderType === 'delivery' 
          ? 'Our delivery team is on the way to your location.' 
          : 'Please come to the restaurant to collect your order.',
        estimatedTime: order.orderType === 'delivery' 
          ? '15-20 minutes' 
          : 'Ready for pickup now',
        trackingUrl: `${process.env.FRONTEND_URL}/food/order-tracking/${order._id}`,
        websiteUrl: process.env.FRONTEND_URL
      };

      const htmlContent = this.renderTemplate(template, templateData);
      
      await emailService.sendEmail({
        to: customer.email,
        subject: `🚀 Order Ready #${templateData.orderNumber} - Jaffna Hotel`,
        html: htmlContent
      });

      logger.info('Order ready email sent', {
        orderId: order._id,
        customerEmail: customer.email
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send order ready email', {
        orderId: order._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Load email template
   */
  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(this.templatesPath, templateName);
      return await fs.promises.readFile(templatePath, 'utf8');
    } catch (error) {
      logger.error('Failed to load email template', {
        templateName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Render template with data (simple template engine)
   */
  renderTemplate(template, data) {
    let html = template;
    
    // Replace simple variables {{variable}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key] || '');
    });
    
    // Handle conditional blocks {{#if condition}}...{{/if}}
    html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      return data[condition] ? content : '';
    });
    
    // Handle loops {{#each array}}...{{/each}}
    html = html.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      if (!data[arrayName] || !Array.isArray(data[arrayName])) return '';
      
      return data[arrayName].map(item => {
        let itemContent = content;
        Object.keys(item).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          itemContent = itemContent.replace(regex, item[key] || '');
        });
        return itemContent;
      }).join('');
    });
    
    return html;
  }

  /**
   * Get status configuration
   */
  getStatusConfig(status) {
    const configs = {
      'pending': {
        icon: '📝',
        message: 'Your order has been received and is being processed.',
        level: 1,
        nextSteps: 'We are preparing your order and will update you soon.',
        estimatedTime: '30-45 minutes'
      },
      'Confirmed': {
        icon: '✅',
        message: 'Your order has been confirmed and is being prepared.',
        level: 2,
        nextSteps: 'Our chefs are working on your delicious meal.',
        estimatedTime: '25-35 minutes'
      },
      'Preparing': {
        icon: '👨‍🍳',
        message: 'Your order is being prepared by our expert chefs.',
        level: 2,
        nextSteps: 'We are cooking your meal with fresh ingredients.',
        estimatedTime: '20-30 minutes'
      },
      'Ready': {
        icon: '🚀',
        message: 'Your order is ready for pickup/delivery!',
        level: 3,
        nextSteps: 'Please come to collect your order or wait for delivery.',
        estimatedTime: 'Ready now'
      },
      'Delivered': {
        icon: '🎉',
        message: 'Your order has been delivered successfully!',
        level: 4,
        nextSteps: 'Enjoy your meal! Please rate your experience.',
        estimatedTime: 'Delivered'
      },
      'Cancelled': {
        icon: '❌',
        message: 'Your order has been cancelled.',
        level: 0,
        nextSteps: 'If you have any questions, please contact us.',
        estimatedTime: 'Cancelled'
      }
    };
    
    return configs[status] || configs['pending'];
  }

  /**
   * Generate QR code for order tracking
   */
  async generateQRCode(orderId) {
    try {
      // Simple QR code generation (in production, use a proper QR library)
      const qrData = `${process.env.FRONTEND_URL}/food/order-tracking/${orderId}`;
      // For now, return a placeholder base64 image
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    } catch (error) {
      logger.error('Failed to generate QR code', { orderId, error: error.message });
      return '';
    }
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(order, customer) {
    try {
      // Simple PDF generation (in production, use a proper PDF library like puppeteer or jsPDF)
      const invoiceContent = `
        INVOICE
        Order #${order._id.toString().slice(-8).toUpperCase()}
        Date: ${new Date(order.createdAt).toLocaleDateString()}
        
        Customer: ${customer.name || `${customer.firstName} ${customer.lastName}`}
        Email: ${customer.email}
        
        Items:
        ${order.items.map(item => `${item.name} x${item.quantity} = LKR ${(item.price * item.quantity).toFixed(2)}`).join('\n')}
        
        Subtotal: LKR ${order.subtotal?.toFixed(2) || '0.00'}
        Tax: LKR ${order.tax?.toFixed(2) || '0.00'}
        Total: LKR ${order.totalPrice?.toFixed(2) || '0.00'}
      `;
      
      // For now, return a simple text-based "PDF"
      return Buffer.from(invoiceContent);
    } catch (error) {
      logger.error('Failed to generate invoice PDF', { orderId: order._id, error: error.message });
      return Buffer.from('Invoice generation failed');
    }
  }
}

export default new FoodEmailService();

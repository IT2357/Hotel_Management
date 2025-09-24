// 📁 backend/services/booking/bookingScheduler.js
import Booking from "../../models/Booking.js";
import NotificationService from "../notification/notificationService.js";
import RefundService from "../payment/refundService.js";

class BookingScheduler {
  /**
   * Check for expired bookings and auto-cancel them
   * This should be called periodically (e.g., every hour)
   */
  static async processExpiredBookings() {
    try {
      console.log('🔄 Checking for expired bookings...');

      const expiredBookings = await Booking.find({
        status: 'On Hold',
        holdUntil: { $lte: new Date() }
      }).populate('userId').populate('roomId');

      if (expiredBookings.length === 0) {
        console.log('✅ No expired bookings found');
        return { processed: 0, errors: 0 };
      }

      console.log(`📋 Found ${expiredBookings.length} expired bookings to process`);

      let processed = 0;
      let errors = 0;

      for (const booking of expiredBookings) {
        try {
          await this.expireBooking(booking);
          processed++;
        } catch (error) {
          console.error(`❌ Failed to process expired booking ${booking.bookingNumber}:`, error);
          errors++;
        }
      }

      console.log(`✅ Processed ${processed} expired bookings (${errors} errors)`);
      return { processed, errors };

    } catch (error) {
      console.error('❌ Error processing expired bookings:', error);
      throw error;
    }
  }

  /**
   * Process a single expired booking
   * @param {Object} booking - Expired booking object
   */
  static async expireBooking(booking) {
    try {
      // Update booking status to cancelled
      booking.status = 'Cancelled';
      booking.cancelledAt = new Date();
      booking.autoCancelled = true;
      booking.cancellationReason = 'Booking hold period expired';
      await booking.save();

      console.log(`✅ Auto-cancelled expired booking ${booking.bookingNumber}`);

      // Create refund request if booking has payment
      try {
        const refundRequest = await RefundService.createRefundRequest(
          booking,
          'Booking hold period expired - auto-cancelled',
          'system'
        );

        if (refundRequest) {
          console.log(`✅ Created refund request for auto-cancelled booking ${booking.bookingNumber}`);
        }
      } catch (refundError) {
        console.error(`❌ Failed to create refund request for booking ${booking.bookingNumber}:`, refundError);
        // Don't fail the expiry if refund creation fails
      }

      // Send notification to guest
      try {
        await NotificationService.sendNotification({
          userId: booking.userId._id,
          userType: booking.userId.role,
          type: 'booking_expired',
          title: 'Booking Expired',
          message: `Your booking ${booking.bookingNumber} for ${booking.roomId.title} has expired and been automatically cancelled due to hold period expiration.`,
          channel: 'email',
          metadata: {
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            roomName: booking.roomId.title,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            holdUntil: booking.holdUntil,
            autoCancelled: true
          }
        });

        console.log(`✅ Sent expiration notification for booking ${booking.bookingNumber}`);
      } catch (notificationError) {
        console.error(`❌ Failed to send expiration notification for booking ${booking.bookingNumber}:`, notificationError);
        // Don't fail the expiry if notification fails
      }

    } catch (error) {
      console.error(`❌ Error processing expired booking ${booking.bookingNumber}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old cancelled/rejected bookings
   * Remove bookings older than specified days (default: 90 days)
   * @param {number} daysOld - Days after which to clean up
   */
  static async cleanupOldBookings(daysOld = 90) {
    try {
      console.log(`🧹 Cleaning up bookings older than ${daysOld} days...`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Booking.deleteMany({
        status: { $in: ['Cancelled', 'Rejected'] },
        createdAt: { $lt: cutoffDate }
      });

      console.log(`✅ Cleaned up ${result.deletedCount} old bookings`);
      return result.deletedCount;

    } catch (error) {
      console.error('❌ Error cleaning up old bookings:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics for monitoring
   */
  static async getBookingStats() {
    try {
      const now = new Date();
      const stats = await Booking.aggregate([
        {
          $match: {
            status: 'On Hold',
            holdUntil: { $lte: now }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            oldestExpired: { $min: '$holdUntil' },
            newestExpired: { $max: '$holdUntil' }
          }
        }
      ]);

      const result = stats[0] || { count: 0 };
      console.log(`📊 Found ${result.count} expired bookings awaiting processing`);

      return {
        expiredCount: result.count,
        oldestExpired: result.oldestExpired,
        newestExpired: result.newestExpired
      };

    } catch (error) {
      console.error('❌ Error getting booking stats:', error);
      throw error;
    }
  }

  /**
   * Send reminder notifications for bookings expiring soon
   * @param {number} hoursBefore - Hours before expiry to send reminder
   */
  static async sendExpiryReminders(hoursBefore = 24) {
    try {
      console.log(`📧 Sending expiry reminders for bookings expiring within ${hoursBefore} hours...`);

      const reminderTime = new Date();
      reminderTime.setHours(reminderTime.getHours() + hoursBefore);

      const bookingsNeedingReminder = await Booking.find({
        status: 'On Hold',
        holdUntil: {
          $gte: new Date(),
          $lte: reminderTime
        }
      }).populate('userId').populate('roomId');

      if (bookingsNeedingReminder.length === 0) {
        console.log('✅ No bookings need expiry reminders');
        return { sent: 0 };
      }

      let sent = 0;

      for (const booking of bookingsNeedingReminder) {
        try {
          await NotificationService.sendNotification({
            userId: booking.userId._id,
            userType: booking.userId.role,
            type: 'booking_expiry_reminder',
            title: 'Booking Expiring Soon',
            message: `Your booking ${booking.bookingNumber} for ${booking.roomId.title} will expire on ${new Date(booking.holdUntil).toLocaleString()}. Please confirm or cancel before it expires.`,
            channel: 'email',
            metadata: {
              bookingId: booking._id,
              bookingNumber: booking.bookingNumber,
              roomName: booking.roomId.title,
              holdUntil: booking.holdUntil,
              hoursUntilExpiry: hoursBefore
            }
          });

          sent++;
        } catch (error) {
          console.error(`❌ Failed to send reminder for booking ${booking.bookingNumber}:`, error);
        }
      }

      console.log(`✅ Sent ${sent} expiry reminders`);
      return { sent };

    } catch (error) {
      console.error('❌ Error sending expiry reminders:', error);
      throw error;
    }
  }
}

export default BookingScheduler;

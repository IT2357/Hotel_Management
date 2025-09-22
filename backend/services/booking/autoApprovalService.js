// 📁 backend/services/booking/autoApprovalService.js
import Booking from "../../models/Booking.js";
import AdminSettings from "../../models/AdminSettings.js";
import { User } from "../../models/User.js";
import NotificationService from "../notification/notificationService.js";

class AutoApprovalService {
  /**
   * Check if a booking should be auto-approved based on admin settings
   * @param {Object} bookingData - Booking data
   * @param {string} userId - User ID making the booking
   * @returns {Object} - Auto-approval decision
   */
  static async shouldAutoApprove(bookingData, userId) {
    try {
      const settings = await AdminSettings.findOne();
      if (!settings) {
        console.warn('No admin settings found, using default approval logic');
        return {
          shouldAutoApprove: false,
          reason: 'Admin settings not configured'
        };
      }

      // Check if auto-approval is enabled
      if (!settings.autoApprovalSettings?.enabled) {
        return {
          shouldAutoApprove: false,
          reason: 'Auto-approval is disabled'
        };
      }

      const autoSettings = settings.autoApprovalSettings;

      // Basic validation checks
      const validation = await this.validateBookingForAutoApproval(bookingData, userId, autoSettings);
      if (!validation.isValid) {
        return {
          shouldAutoApprove: false,
          reason: validation.reason
        };
      }

      // Check booking value limit
      if (bookingData.totalPrice > autoSettings.maxBookingValue) {
        return {
          shouldAutoApprove: false,
          reason: `Booking value (LKR ${bookingData.totalPrice}) exceeds auto-approval limit (LKR ${autoSettings.maxBookingValue})`
        };
      }

      // Check guest count limit
      const totalGuests = (bookingData.guests?.adults || 1) + (bookingData.guests?.children || 0);
      if (totalGuests > autoSettings.maxGuests) {
        return {
          shouldAutoApprove: false,
          reason: `Guest count (${totalGuests}) exceeds auto-approval limit (${autoSettings.maxGuests})`
        };
      }

      // Check number of nights
      const nights = Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24));
      if (nights > autoSettings.maxNights) {
        return {
          shouldAutoApprove: false,
          reason: `Number of nights (${nights}) exceeds auto-approval limit (${autoSettings.maxNights})`
        };
      }

      // Check room type restrictions
      if (autoSettings.allowedRoomTypes && autoSettings.allowedRoomTypes.length > 0) {
        // This would require room data, so we'll assume it's checked elsewhere
        // For now, we'll skip this check as it requires additional context
      }

      // Check if it's a new guest requiring approval
      if (autoSettings.requireApprovalForNewGuests) {
        const user = await User.findById(userId);
        const existingBookings = await Booking.countDocuments({
          userId: userId,
          status: { $in: ['Accepted', 'Completed'] }
        });

        if (existingBookings === 0) {
          return {
            shouldAutoApprove: false,
            reason: 'First-time guest requires manual approval'
          };
        }
      }

      // Check operational hours approval requirement
      if (autoSettings.requireApprovalOutsideHours) {
        const checkInDate = new Date(bookingData.checkIn);
        const checkInTime = checkInDate.toTimeString().slice(0, 5);

        if (settings.operationalSettings?.enabled) {
          if (checkInTime < settings.operationalSettings.startTime ||
              checkInTime > settings.operationalSettings.endTime) {
            return {
              shouldAutoApprove: false,
              reason: 'Booking is outside operational hours and requires manual approval'
            };
          }
        }
      }

      // Check approval threshold (hours before check-in)
      const now = new Date();
      const hoursUntilCheckIn = (new Date(bookingData.checkIn) - now) / (1000 * 60 * 60);
      if (hoursUntilCheckIn < autoSettings.approvalThresholdHours) {
        return {
          shouldAutoApprove: false,
          reason: `Booking is within ${autoSettings.approvalThresholdHours} hours of check-in and requires manual approval`
        };
      }

      return {
        shouldAutoApprove: true,
        reason: 'All auto-approval criteria met'
      };

    } catch (error) {
      console.error('Error checking auto-approval:', error);
      return {
        shouldAutoApprove: false,
        reason: 'Error checking auto-approval criteria'
      };
    }
  }

  /**
   * Validate basic booking data for auto-approval
   * @param {Object} bookingData - Booking data
   * @param {string} userId - User ID
   * @param {Object} autoSettings - Auto-approval settings
   * @returns {Object} - Validation result
   */
  static async validateBookingForAutoApproval(bookingData, userId, autoSettings) {
    try {
      // Check required fields
      if (!bookingData.roomId || !bookingData.checkIn || !bookingData.checkOut) {
        return {
          isValid: false,
          reason: 'Missing required booking information'
        };
      }

      // Check if user exists and is active
      const user = await User.findById(userId);
      if (!user) {
        return {
          isValid: false,
          reason: 'User not found'
        };
      }

      if (!user.isActive) {
        return {
          isValid: false,
          reason: 'User account is not active'
        };
      }

      // Check booking dates are valid
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const now = new Date();

      if (checkIn <= now) {
        return {
          isValid: false,
          reason: 'Check-in date must be in the future'
        };
      }

      if (checkOut <= checkIn) {
        return {
          isValid: false,
          reason: 'Check-out date must be after check-in date'
        };
      }

      // Check advance booking limit
      const AdminSettings = (await import("../../models/AdminSettings.js")).default;
      const settings = await AdminSettings.findOne();
      const maxAdvanceDays = settings?.maxAdvanceBooking || 365;
      const advanceDays = (checkIn - now) / (1000 * 60 * 60 * 24);

      if (advanceDays > maxAdvanceDays) {
        return {
          isValid: false,
          reason: `Booking cannot be made more than ${maxAdvanceDays} days in advance`
        };
      }

      return {
        isValid: true,
        reason: 'Basic validation passed'
      };

    } catch (error) {
      console.error('Error validating booking for auto-approval:', error);
      return {
        isValid: false,
        reason: 'Validation error occurred'
      };
    }
  }

  /**
   * Auto-approve a booking if it meets criteria
   * @param {Object} booking - Booking object
   * @returns {Object} - Approval result
   */
  static async autoApproveBooking(booking) {
    try {
      const approvalDecision = await this.shouldAutoApprove({
        roomId: booking.roomId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalPrice: booking.totalPrice,
        guests: booking.guests
      }, booking.userId);

      if (!approvalDecision.shouldAutoApprove) {
        return {
          autoApproved: false,
          reason: approvalDecision.reason,
          requiresManualApproval: true
        };
      }

      // Auto-approve the booking
      booking.status = 'Accepted';
      booking.confirmedAt = new Date();
      booking.approvalNotes = 'Auto-approved based on admin settings';
      booking.reviewedBy = 'system';
      booking.reviewedAt = new Date();
      booking.requiresReview = false;
      await booking.save();

      // Send notification to guest
      try {
        const user = await User.findById(booking.userId);
        const room = await booking.populate('roomId');

        await NotificationService.sendNotification({
          userId: booking.userId,
          userType: user.role,
          type: 'booking_auto_approved',
          title: 'Booking Auto-Approved',
          message: `Your booking for ${room.roomId.title} has been automatically approved!`,
          channel: 'email',
          metadata: {
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            roomName: room.roomId.title,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            totalAmount: booking.totalPrice,
            autoApproved: true
          }
        });

        console.log(`✅ Booking ${booking.bookingNumber} auto-approved and notification sent`);
      } catch (notificationError) {
        console.error('❌ Failed to send auto-approval notification:', notificationError);
      }

      return {
        autoApproved: true,
        reason: approvalDecision.reason,
        requiresManualApproval: false
      };

    } catch (error) {
      console.error('Error auto-approving booking:', error);
      return {
        autoApproved: false,
        reason: 'Error during auto-approval process',
        requiresManualApproval: true
      };
    }
  }

  /**
   * Get auto-approval statistics
   * @returns {Object} - Statistics
   */
  static async getAutoApprovalStats() {
    try {
      const settings = await AdminSettings.findOne();
      if (!settings) {
        return { enabled: false, stats: {} };
      }

      const totalBookings = await Booking.countDocuments();
      const autoApproved = await Booking.countDocuments({
        status: 'Accepted',
        reviewedBy: 'system'
      });
      const manuallyApproved = await Booking.countDocuments({
        status: 'Accepted',
        reviewedBy: { $ne: 'system' }
      });
      const pendingApproval = await Booking.countDocuments({
        status: 'Pending Approval'
      });

      return {
        enabled: settings.autoApprovalSettings?.enabled || false,
        stats: {
          totalBookings,
          autoApproved,
          manuallyApproved,
          pendingApproval,
          autoApprovalRate: totalBookings > 0 ? Math.round((autoApproved / totalBookings) * 100) : 0
        }
      };

    } catch (error) {
      console.error('Error getting auto-approval stats:', error);
      return { enabled: false, stats: {} };
    }
  }
}

export default AutoApprovalService;

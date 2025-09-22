// 📁 backend/services/rooms/roomService.js
// Complete Room Availability Service with real-time booking conflict prevention
import Room from "../../models/Room.js";
import Booking from "../../models/Booking.js";
import AdminSettings from "../../models/AdminSettings.js";
import { addDays, differenceInDays, isWithinInterval, areIntervalsOverlapping } from "date-fns";

class RoomService {
  constructor() {
    this.settingsCache = null;
    this.settingsCacheTime = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached settings
  async getSettings() {
    const now = Date.now();
    if (!this.settingsCache || (now - this.settingsCacheTime) > this.CACHE_DURATION) {
      try {
        this.settingsCache = await AdminSettings.findOne().lean();
        this.settingsCacheTime = now;
      } catch (error) {
        console.error("Failed to fetch settings for room service:", error);
        this.settingsCache = {
          operationalSettings: {
            cleaningBufferHours: 2,
            enabled: true
          }
        };
      }
    }
    return this.settingsCache;
  }

  // Check room availability for given dates
  async checkRoomAvailability(roomId, checkIn, checkOut, excludeBookingId = null) {
    try {
      const settings = await this.getSettings();
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const cleaningBufferHours = settings.operationalSettings?.cleaningBufferHours || 2;

      // Get the room to check its availability array
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Check room's availability array
      const checkInDateOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
      const checkOutDateOnly = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());

      const availabilityCheck = room.availability.some(avail =>
        avail.isAvailable &&
        new Date(avail.startDate).getTime() <= checkInDateOnly.getTime() &&
        new Date(avail.endDate).getTime() >= checkOutDateOnly.getTime()
      );

      // If there are no availability restrictions, room is available
      // If there are restrictions, room is available only if restrictions cover the requested dates
      if (room.availability.length > 0 && !availabilityCheck) {
        return {
          available: false,
          reason: 'Room is not available for the selected dates according to its availability schedule'
        };
      }

      // Find conflicting bookings
      const conflictingBookings = await Booking.find({
        roomId: roomId,
        status: { $in: ['Accepted', 'Pending Approval', 'On Hold'] },
        ...(excludeBookingId && { _id: { $ne: excludeBookingId } }),
        $or: [
          // Booking starts during requested period
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          },
          // Booking ends during requested period
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          },
          // Booking completely contains requested period
          {
            checkIn: { $lte: checkInDate },
            checkOut: { $gte: checkOutDate }
          }
        ]
      });

      if (conflictingBookings.length > 0) {
        return {
          available: false,
          conflicts: conflictingBookings.map(booking => ({
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            status: booking.status
          })),
          reason: 'Room is already booked for the selected dates'
        };
      }

      // Check operational hours if enabled
      if (settings.operationalSettings?.enabled) {
        const operationalCheck = await this.checkOperationalHours(checkInDate, checkOutDate);
        if (!operationalCheck.allowed) {
          return {
            available: false,
            reason: operationalCheck.reason,
            operationalHours: settings.operationalSettings
          };
        }
      }

      // Check maintenance days
      const maintenanceCheck = await this.checkMaintenanceDays(checkInDate, checkOutDate);
      if (!maintenanceCheck.allowed) {
        return {
          available: false,
          reason: maintenanceCheck.reason,
          maintenanceDays: maintenanceCheck.maintenanceDays
        };
      }

      return { available: true };

    } catch (error) {
      console.error('Error checking room availability:', error);
      throw error;
    }
  }

  // Get all available rooms for given dates
  async getAvailableRooms(checkIn, checkOut, filters = {}) {
    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (checkInDate >= checkOutDate) {
        throw new Error('Check-out date must be after check-in date');
      }

      // Get all rooms
      let query = { status: { $in: ["Available", "Maintenance", "Cleaning"] } };

      // Apply filters
      if (filters.type) query.type = filters.type;
      if (filters.minCapacity) query["occupancy.adults"] = { $gte: filters.minCapacity };
      if (filters.maxPrice) query.basePrice = { $lte: filters.maxPrice };

      const rooms = await Room.find(query).populate('amenities');

      const availableRooms = [];

      for (const room of rooms) {
        console.log('Checking availability for room:', room.roomNumber, room._id);
        const availability = await this.checkRoomAvailability(room._id, checkIn, checkOut);
        console.log('Availability result for room', room.roomNumber, ':', availability);

        if (availability.available) {
          // Calculate pricing
          const nights = differenceInDays(checkOutDate, checkInDate);
          const pricing = await this.calculateRoomCost(room, nights, filters.guests || 1);

          availableRooms.push({
            roomId: room._id,
            title: room.title,
            roomNumber: room.roomNumber,
            type: room.type,
            capacity: room.occupancy.adults,
            basePrice: room.basePrice,
            pricing: pricing,
            images: room.images,
            amenities: room.amenities,
            description: room.description
          });
        }
      }

      return availableRooms;

    } catch (error) {
      console.error('Error getting available rooms:', error);
      throw error;
    }
  }

  // Calculate room cost including all fees
  async calculateRoomCost(room, nights, guests = 1) {
    try {
      const settings = await this.getSettings();

      const subtotal = nights * room.basePrice;
      const taxRate = (settings.financialSettings?.taxRate || 0) / 100;
      const serviceFeeRate = (settings.financialSettings?.serviceFee || 0) / 100;

      const tax = subtotal * taxRate;
      const serviceFee = subtotal * serviceFeeRate;
      const total = subtotal + tax + serviceFee;

      // Add guest surcharge if applicable
      let guestSurcharge = 0;
      if (guests > 2 && room.extraGuestFee) {
        guestSurcharge = (guests - 2) * room.extraGuestFee * nights;
      }

      const finalTotal = total + guestSurcharge;

      return {
        nights,
        roomRate: room.basePrice,
        subtotal,
        tax,
        serviceFee,
        guestSurcharge,
        total: finalTotal,
        currency: settings.currency || 'LKR',
        breakdown: {
          roomCost: subtotal,
          taxes: tax,
          serviceFees: serviceFee,
          extraGuests: guestSurcharge
        }
      };

    } catch (error) {
      console.error('Error calculating room cost:', error);
      throw error;
    }
  }

  // Check operational hours for booking
  async checkOperationalHours(checkInDate, checkOutDate) {
    try {
      const settings = await this.getSettings();

      if (!settings.operationalSettings?.enabled) {
        return { allowed: true };
      }

      const operationalSettings = settings.operationalSettings;

      // Check if check-in day is allowed
      const checkInDay = checkInDate.toLocaleLowerCase('en-US', { weekday: 'long' }).toLowerCase();
      const allowedDays = operationalSettings.allowedDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      if (!allowedDays.includes(checkInDay)) {
        return {
          allowed: false,
          reason: `Bookings are not allowed on ${checkInDay.toUpperCase()}. Allowed days: ${allowedDays.join(', ')}`
        };
      }

      // Check check-in time
      const checkInTime = checkInDate.toTimeString().slice(0, 5);
      if (operationalSettings.startTime && operationalSettings.endTime) {
        if (checkInTime < operationalSettings.startTime || checkInTime > operationalSettings.endTime) {
          if (!operationalSettings.allowBookingsOutsideHours) {
            return {
              allowed: false,
              reason: `Check-in time must be between ${operationalSettings.startTime} and ${operationalSettings.endTime}`
            };
          }
        }
      }

      // Check check-out time
      const checkOutTime = checkOutDate.toTimeString().slice(0, 5);
      if (checkOutTime < operationalSettings.startTime || checkOutTime > operationalSettings.endTime) {
        return {
          allowed: false,
          reason: `Check-out time must be between ${operationalSettings.startTime} and ${operationalSettings.endTime}`
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error checking operational hours:', error);
      throw error;
    }
  }

  // Check maintenance days and special closures
  async checkMaintenanceDays(checkInDate, checkOutDate) {
    try {
      const settings = await this.getSettings();

      if (!settings.operationalSettings?.enabled) {
        return { allowed: true };
      }

      const operationalSettings = settings.operationalSettings;

      // Check maintenance days
      const conflictingMaintenanceDays = operationalSettings.maintenanceDays?.filter(day =>
        day.isActive &&
        new Date(day.date).toDateString() >= checkInDate.toDateString() &&
        new Date(day.date).toDateString() <= checkOutDate.toDateString()
      );

      if (conflictingMaintenanceDays?.length > 0) {
        return {
          allowed: false,
          reason: 'The hotel is closed for maintenance on the selected dates',
          maintenanceDays: conflictingMaintenanceDays
        };
      }

      // Check special closures
      const conflictingClosures = operationalSettings.specialClosures?.filter(closure =>
        closure.isActive &&
        checkInDate >= new Date(closure.startDate) &&
        checkInDate <= new Date(closure.endDate)
      );

      if (conflictingClosures?.length > 0) {
        return {
          allowed: false,
          reason: 'The hotel is closed during the selected period',
          specialClosures: conflictingClosures
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error checking maintenance days:', error);
      throw error;
    }
  }

  // Get room details with availability status
  async getRoomDetails(roomId, checkIn, checkOut) {
    try {
      const room = await Room.findById(roomId).populate('amenities');

      if (!room) {
        throw new Error('Room not found');
      }

      let availability = { available: true };
      if (checkIn && checkOut) {
        availability = await this.checkRoomAvailability(roomId, checkIn, checkOut);
      }

      return {
        room,
        availability,
        pricing: checkIn && checkOut ?
          await this.calculateRoomCost(room, differenceInDays(new Date(checkOut), new Date(checkIn)), 1) :
          null
      };

    } catch (error) {
      console.error('Error getting room details:', error);
      throw error;
    }
  }

  // Update room status
  async updateRoomStatus(roomId, status, reason = '') {
    try {
      const room = await Room.findByIdAndUpdate(
        roomId,
        {
          status,
          lastStatusUpdate: new Date(),
          statusReason: reason
        },
        { new: true }
      );

      if (!room) {
        throw new Error('Room not found');
      }

      return room;

    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  }

  // Get room statistics
  async getRoomStats(filters = {}) {
    try {
      const { dateFrom, dateTo, roomType } = filters;

      let matchConditions = {};

      if (dateFrom || dateTo) {
        matchConditions.checkIn = {};
        if (dateFrom) matchConditions.checkIn.$gte = new Date(dateFrom);
        if (dateTo) matchConditions.checkIn.$lte = new Date(dateTo);
      }

      if (roomType) {
        matchConditions.roomType = roomType;
      }

      const stats = await Booking.aggregate([
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'room'
          }
        },
        {
          $unwind: '$room'
        },
        {
          $match: {
            'room.isActive': true,
            ...(roomType && { 'room.type': roomType }),
            ...matchConditions
          }
        },
        {
          $group: {
            _id: '$room._id',
            roomTitle: { $first: '$room.title' },
            roomNumber: { $first: '$room.roomNumber' },
            roomType: { $first: '$room.type' },
            totalBookings: { $sum: 1 },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
            },
            revenue: {
              $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, '$totalPrice', 0] }
            }
          }
        }
      ]);

      return stats;

    } catch (error) {
      console.error('Error getting room statistics:', error);
      throw error;
    }
  }

  // Clear settings cache
  clearSettingsCache() {
    this.settingsCache = null;
    this.settingsCacheTime = 0;
  }
}

export default new RoomService();

// 📁 backend/controllers/staff/scheduleController.js
import StaffProfile from "../../models/profiles/StaffProfile.js";
import { formatResponse } from "../../utils/responseFormatter.js";
import logger from "../../utils/logger.js";

// Get current user's schedule
export const getMySchedule = async (req, res) => {
  try {
    const { userId } = req.user;
    const { date } = req.query;

    const profile = await StaffProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json(formatResponse(false, "Staff profile not found"));
    }

    // For now, return basic schedule info
    // In a real implementation, you would have a separate Schedule model
    const schedule = {
      shift: profile.shift,
      shiftHours: profile.shiftHours,
      availability: profile.availability,
      assignedAreas: profile.assignedAreas,
      department: profile.department,
      position: profile.position
    };

    res.json(formatResponse(true, "Schedule retrieved successfully", schedule));
  } catch (error) {
    logger.error("Error getting schedule:", error);
    res.status(500).json(formatResponse(false, "Failed to get schedule", null, error.message));
  }
};

// Get weekly schedule
export const getWeeklySchedule = async (req, res) => {
  try {
    const { userId } = req.user;
    const { weekStart } = req.query;

    const profile = await StaffProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json(formatResponse(false, "Staff profile not found"));
    }

    // Generate weekly schedule based on shift pattern
    const weekSchedule = generateWeeklySchedule(profile, weekStart);

    res.json(formatResponse(true, "Weekly schedule retrieved successfully", weekSchedule));
  } catch (error) {
    logger.error("Error getting weekly schedule:", error);
    res.status(500).json(formatResponse(false, "Failed to get weekly schedule", null, error.message));
  }
};

// Update availability
export const updateAvailability = async (req, res) => {
  try {
    const { userId } = req.user;
    const { isAvailable, unavailableUntil, reason } = req.body;

    const profile = await StaffProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json(formatResponse(false, "Staff profile not found"));
    }

    // Update availability
    profile.availability = {
      isAvailable: isAvailable !== undefined ? isAvailable : profile.availability.isAvailable,
      unavailableUntil: unavailableUntil ? new Date(unavailableUntil) : profile.availability.unavailableUntil,
      reason: reason || profile.availability.reason
    };

    await profile.save();

    res.json(formatResponse(true, "Availability updated successfully", profile.availability));
  } catch (error) {
    logger.error("Error updating availability:", error);
    res.status(500).json(formatResponse(false, "Failed to update availability", null, error.message));
  }
};

// Helper function to generate weekly schedule
const generateWeeklySchedule = (profile, weekStart) => {
  const startDate = weekStart ? new Date(weekStart) : new Date();
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const schedule = weekDays.map((day, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    
    return {
      day,
      date: date.toISOString().split('T')[0],
      shift: profile.shift,
      startTime: profile.shiftHours.start,
      endTime: profile.shiftHours.end,
      isWorking: isWorkingDay(day, profile.shift),
      assignedAreas: profile.assignedAreas,
      availability: profile.availability.isAvailable
    };
  });

  return {
    weekStart: startDate.toISOString().split('T')[0],
    schedule,
    totalHours: calculateWeeklyHours(profile.shiftHours, schedule)
  };
};

// Helper function to determine if it's a working day
const isWorkingDay = (day, shift) => {
  const weekendDays = ['Saturday', 'Sunday'];
  
  if (shift === 'flexible') {
    return true; // Flexible staff work all days
  }
  
  if (shift === 'night') {
    return !weekendDays.includes(day); // Night shift typically doesn't work weekends
  }
  
  return !weekendDays.includes(day); // Regular shifts don't work weekends
};

// Helper function to calculate weekly hours
const calculateWeeklyHours = (shiftHours, schedule) => {
  const workingDays = schedule.filter(day => day.isWorking).length;
  
  if (workingDays === 0) return 0;
  
  const startTime = new Date(`2000-01-01T${shiftHours.start}`);
  const endTime = new Date(`2000-01-01T${shiftHours.end}`);
  
  let hours = (endTime - startTime) / (1000 * 60 * 60);
  
  // Handle overnight shifts
  if (hours < 0) {
    hours += 24;
  }
  
  return Math.round(hours * workingDays * 100) / 100;
};
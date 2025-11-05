// scripts/seed.js
const bcrypt = require('bcryptjs');
const Task = require('../models/Task');
const Staff = require('../models/Staff');
const Guest = require('../models/Guest');
const Room = require('../models/Room');
const Notification = require('../models/Notification');
const TaskHistory = require('../models/TaskHistory');

const seedData = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Seeding not allowed in production' });
    }

    await Promise.all([Task.deleteMany({}), Staff.deleteMany({}), Guest.deleteMany({}), Room.deleteMany({}), Notification.deleteMany({}), TaskHistory.deleteMany({})]);

    const sampleRooms = [];
    for (let floor = 1; floor <= 5; floor++) {
      for (let room = 1; room <= 20; room++) {
        const roomNumber = `${floor}${room.toString().padStart(2, '0')}`;
        sampleRooms.push({ number: roomNumber, floor, type: room <= 5 ? 'suite' : room <= 15 ? 'deluxe' : 'standard', status: Math.random() > 0.7 ? 'occupied' : 'vacant-clean' });
      }
    }
    await Room.insertMany(sampleRooms);

    const sampleStaff = [
      { name: 'John Manager', email: 'manager@hotel.com', password: await bcrypt.hash('password123', 12), role: 'manager', department: 'Management', isOnline: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
      { name: 'Sarah Concierge', email: 'concierge@hotel.com', password: await bcrypt.hash('password123', 12), role: 'concierge', department: 'Front Office', isOnline: true, avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' },
      { name: 'Mike Maintenance', email: 'maintenance@hotel.com', password: await bcrypt.hash('password123', 12), role: 'maintenance', department: 'Maintenance', isOnline: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      { name: 'Lisa Housekeeping', email: 'housekeeping@hotel.com', password: await bcrypt.hash('password123', 12), role: 'housekeeping', department: 'Housekeeping', isOnline: false, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
      { name: 'David Service', email: 'roomservice@hotel.com', password: await bcrypt.hash('password123', 12), role: 'room-service', department: 'Room Service', isOnline: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
    ];
    const staff = await Staff.insertMany(sampleStaff);

    const sampleGuests = [
      { name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0101', roomNumber: '205', checkIn: new Date(), checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), vipStatus: true, loyaltyTier: 'gold', preferences: [{ type: 'Extra pillows', category: 'bedding' }] },
      { name: 'Bob Smith', email: 'bob@example.com', phone: '+1-555-0102', roomNumber: '312', checkIn: new Date(), checkOut: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), vipStatus: false, loyaltyTier: 'silver', preferences: [{ type: 'Late checkout', category: 'other' }] },
      { name: 'Carol Davis', email: 'carol@example.com', phone: '+1-555-0103', roomNumber: '108', checkIn: new Date(), checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), vipStatus: false, loyaltyTier: 'bronze' }
    ];
    const guests = await Guest.insertMany(sampleGuests);

    await Room.updateMany({ number: { $in: sampleGuests.map(g => g.roomNumber) } }, { $set: { status: 'occupied' } });
    await Room.updateMany({ number: { $in: sampleGuests.map(g => g.roomNumber) } }, { $set: { currentGuest: { $in: guests.map(g => g._id) } } });

    const sampleTasks = [
      { title: 'Room Service Request', description: 'Guest requested extra towels and amenities', category: 'Room Service', priority: 'medium', status: 'pending', guest: guests[0]._id, guestName: guests[0].name, roomNumber: guests[0].roomNumber, estimatedTime: 15, createdBy: staff[0]._id, dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000) },
      { title: 'Air Conditioning Repair', description: 'AC unit not cooling properly in guest room', category: 'Maintenance', priority: 'high', status: 'assigned', guest: guests[1]._id, guestName: guests[1].name, roomNumber: guests[1].roomNumber, assignedTo: staff[2]._id, estimatedTime: 45, createdBy: staff[1]._id, dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000) },
      { title: 'Restaurant Reservation', description: 'Book dinner table for 4 guests', category: 'Concierge', priority: 'low', status: 'completed', guest: guests[2]._id, guestName: guests[2].name, roomNumber: guests[2].roomNumber, assignedTo: staff[1]._id, estimatedTime: 10, actualTime: 8, createdBy: staff[1]._id, completedAt: new Date(Date.now() - 30 * 60 * 1000) }
    ];
    const tasks = await Task.insertMany(sampleTasks);

    const sampleNotifications = [
      { recipient: staff[2]._id, type: 'task_assigned', title: 'New Task Assigned', message: 'You have been assigned a high priority maintenance task', relatedTask: tasks[1]._id, priority: 'high' },
      { recipient: staff[0]._id, type: 'task_completed', title: 'Task Completed', message: 'Restaurant reservation task has been completed', relatedTask: tasks[2]._id, priority: 'low' }
    ];
    await Notification.insertMany(sampleNotifications);

    res.json({
      message: 'Sample data created successfully',
      stats: { rooms: sampleRooms.length, staff: staff.length, guests: guests.length, tasks: tasks.length, notifications: sampleNotifications.length },
      loginCredentials: {
        manager: { email: 'manager@hotel.com', password: 'password123' },
        concierge: { email: 'concierge@hotel.com', password: 'password123' },
        maintenance: { email: 'maintenance@hotel.com', password: 'password123' },
        housekeeping: { email: 'housekeeping@hotel.com', password: 'password123' },
        roomService: { email: 'roomservice@hotel.com', password: 'password123' }
      }
    });
  } catch (error) {
    console.error('Seed data error:', error);
    res.status(500).json({ error: 'Failed to create seed data' });
  }
};

module.exports = { seedData };
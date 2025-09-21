// backend/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional if you don't store user model
  senderRole: { type: String, enum: ['staff','manager'], required: true },
  content: { type: String, required: true },
  readByManager: { type: Boolean, default: false },
  readByStaff: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);

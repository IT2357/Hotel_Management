import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Will be set to manager's ID when assigned
  },
  type: {
    type: String,
    enum: ['general', 'request', 'complaint', 'schedule', 'emergency'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  department: {
    type: String,
    enum: ['maintenance', 'kitchen', 'service', 'cleaning'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  response: {
    message: String,
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  // Chat conversation fields
  conversationId: {
    type: String,
    index: true
  },
  isReply: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  }]
}, {
  timestamps: true,
});

// Indexes for faster queries
messageSchema.index({ sender: 1, status: 1 });
messageSchema.index({ recipient: 1, status: 1 });
messageSchema.index({ department: 1, status: 1 });

export const Message = mongoose.model("Message", messageSchema);

export default Message;
import mongoose from 'mongoose';

const guestFeedbackSchema = new mongoose.Schema({
  guestName: {
    type: String,
    required: true,
  },
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  roomTitle: {
    type: String,
    required: true,
  },
  roomNumber: {
    type: String,
    required: true,
  },
  stayDate: {
    type: Date,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  highlights: [{
    type: String,
  }],
  concerns: [{
    type: String,
  }],
  helpful: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'published', 'archived'],
    default: 'pending',
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
  },
  response: {
    hasResponse: {
      type: Boolean,
      default: false,
    },
    message: String,
    respondedAt: Date,
    respondedBy: String,
  },
}, {
  timestamps: true,
});

// Index for faster queries
guestFeedbackSchema.index({ status: 1, rating: 1 });
guestFeedbackSchema.index({ stayDate: -1 });
guestFeedbackSchema.index({ sentiment: 1 });

const GuestFeedback = mongoose.model('GuestFeedback', guestFeedbackSchema);

export default GuestFeedback;

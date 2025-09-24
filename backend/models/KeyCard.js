import mongoose from 'mongoose';

const keyCardSchema = new mongoose.Schema(
  {
    cardNumber: { type: String, required: true, unique: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    activationDate: { type: Date },
    expirationDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'inactive', 'lost', 'damaged', 'expired'],
      default: 'inactive',
    },
    // Audit fields for status changes
    statusChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    statusChangedAt: { type: Date },
    statusChangeReason: { type: String },
    previousStatus: { type: String },
  },
  { timestamps: true }
);

const KeyCard = mongoose.model('KeyCard', keyCardSchema);
export default KeyCard;

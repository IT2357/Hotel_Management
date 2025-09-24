import mongoose from "mongoose";

const guestServiceRequestSchema = new mongoose.Schema(
  {
    guest: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: function() { return !this.isAnonymous; } 
    },
    room: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Room" 
    },
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Booking" 
    },
    checkInOut: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "CheckInOut" 
    },
    requestType: {
      type: String,
      enum: [
        "room_service", "housekeeping", "concierge", "transport", 
        "maintenance", "laundry", "wakeup_call", "dining", "spa", "other"
      ],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending"
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedAt: { type: Date },
    completedAt: { type: Date },
    estimatedCompletionTime: { type: Date },
    actualCompletionTime: { type: Date },
    guestLocation: String, // Where the guest wants the service (room, pool, etc.)
    specialInstructions: String,
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: { type: Date }
    },
    attachments: [{
      filename: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    notes: [{
      content: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      addedAt: { type: Date, default: Date.now }
    }],
    isAnonymous: { type: Boolean, default: false },
    requiresFollowUp: { type: Boolean, default: false },
    followUpNotes: String
  },
  { timestamps: true }
);

// Indexes for better query performance
guestServiceRequestSchema.index({ guest: 1, status: 1 });
guestServiceRequestSchema.index({ requestType: 1, status: 1 });
guestServiceRequestSchema.index({ priority: 1, status: 1 });
guestServiceRequestSchema.index({ assignedTo: 1, status: 1 });

const GuestServiceRequest = mongoose.model("GuestServiceRequest", guestServiceRequestSchema);
export default GuestServiceRequest;

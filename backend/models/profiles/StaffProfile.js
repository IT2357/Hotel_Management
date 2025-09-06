// 📁 backend/models/profiles/StaffProfile.js
import mongoose from "mongoose";

const staffProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    employeeId: {
      type: String,
      unique: true,
      trim: true
    },
    personalInfo: {
      firstName: {
        type: String,
        required: true,
        trim: true
      },
      lastName: {
        type: String,
        required: true,
        trim: true
      },
      dateOfBirth: Date,
      phone: {
        type: String,
        trim: true
      },
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String
      }
    },
    position: {
      type: String,
      required: true,
      enum: [
        "Head Chef", "Sous Chef", "Cook", "Kitchen Assistant",
        "Restaurant Manager", "Assistant Manager", 
        "Head Waiter", "Waiter", "Waitress", "Hostess",
        "Bartender", "Barista", "Dishwasher", "Cleaner",
        "Cashier", "Food Runner", "Sommelier"
      ]
    },
    department: {
      type: String,
      enum: ["Kitchen", "Service", "Bar", "Management", "Support"],
      required: true
    },
    shift: { 
      type: String, 
      enum: ["Morning", "Afternoon", "Evening", "Night", "Split"],
      required: true
    },
    workSchedule: {
      monday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
      tuesday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
      wednesday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
      thursday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
      friday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
      saturday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
      sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"]
    },
    profileImage: {
      url: String,
      publicId: String // For Cloudinary
    },
    skills: [{
      type: String,
      trim: true
    }],
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date
    }],
    languages: [{
      language: String,
      proficiency: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "Native"]
      }
    }],
    employmentDetails: {
      hireDate: {
        type: Date,
        required: true,
        default: Date.now
      },
      probationEndDate: Date,
      contractType: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract", "Casual"],
        default: "Full-time"
      },
      hourlyRate: Number,
      salary: Number
    },
    performance: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      lastReviewDate: Date,
      notes: String
    },
    assignedTables: [String], // For waitstaff
    specializations: [{
      type: String,
      enum: ["Wine Service", "Cocktail Making", "Italian Cuisine", "Seafood", "Pastry", "Grill", "Vegan Cooking"]
    }],
    isActive: { type: Boolean, default: true },
    terminationDate: Date,
    terminationReason: String
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Generate employee ID before saving
staffProfileSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.employeeId) {
      // Find the last employee ID
      const lastEmployee = await this.constructor
        .findOne({ employeeId: /^EMP/ })
        .sort({ employeeId: -1 });
      
      let sequence = 1;
      if (lastEmployee) {
        const lastSequence = parseInt(lastEmployee.employeeId.slice(3));
        sequence = lastSequence + 1;
      }
      
      this.employeeId = `EMP${sequence.toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for full name
staffProfileSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for years of service
staffProfileSchema.virtual('yearsOfService').get(function() {
  const startDate = this.employmentDetails.hireDate;
  const endDate = this.terminationDate || new Date();
  const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(years * 10) / 10; // Round to 1 decimal place
});

// Indexes
staffProfileSchema.index({ department: 1, position: 1 });
staffProfileSchema.index({ shift: 1, isActive: 1 });
staffProfileSchema.index({ "employmentDetails.hireDate": 1 });

const StaffProfile = mongoose.model("StaffProfile", staffProfileSchema);
export default StaffProfile;

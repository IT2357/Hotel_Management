import mongoose from "mongoose";

const smsTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'booking_confirmation',
        'payment_confirmation',
        'checkin_reminder',
        'checkout_reminder',
        'booking_cancellation',
        'payment_failed',
        'custom_notification',
        'welcome_message',
        'feedback_request'
      ],
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 160, // SMS character limit
    },
    variables: [{
      name: String,
      description: String,
      required: Boolean,
      default: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'si', 'ta'], // English, Sinhala, Tamil
    },
    senderId: {
      type: String,
      default: 'HotelSystem',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
smsTemplateSchema.index({ type: 1, language: 1 });
smsTemplateSchema.index({ isActive: 1 });

// Static methods
smsTemplateSchema.statics.getActiveTemplates = function(type = null, language = 'en') {
  const query = { isActive: true, language };
  if (type) query.type = type;
  return this.find(query);
};

smsTemplateSchema.statics.getTemplateByType = function(type, language = 'en') {
  return this.findOne({ type, language, isActive: true });
};

// Instance methods
smsTemplateSchema.methods.render = function(data = {}) {
  let content = this.content;

  // Replace variables in content
  this.variables.forEach(variable => {
    const placeholder = `{{${variable.name}}}`;
    const value = data[variable.name] || variable.default || '';
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });

  return content;
};

const SMSTemplate = mongoose.model("SMSTemplate", smsTemplateSchema);

export default SMSTemplate;

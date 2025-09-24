import Joi from "joi";

const documentScanSchema = Joi.object({
  documentType: Joi.string().valid("passport", "id", "driver_license", "other").required(),
  frontImage: Joi.string().required(),
  backImage: Joi.string().allow(''),
  verified: Joi.boolean().default(false)
});

const preferencesSchema = Joi.object({
  roomService: Joi.boolean().default(false),
  housekeeping: Joi.string().valid("morning", "evening", "both", "none").default("morning"),
  doNotDisturb: Joi.boolean().default(false),
  specialRequests: Joi.string().allow('')
});

const emergencyContactSchema = Joi.object({
  name: Joi.string().required(),
  relationship: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().allow('')
});

export const validateCheckInData = (data) => {
  const schema = Joi.object({
    bookingId: Joi.string().required(),
    guestId: Joi.string().required(),
    roomId: Joi.string().required(),
    documentType: Joi.string().valid("passport", "id", "driver_license", "other").required(),
    preferences: preferencesSchema,
    emergencyContact: emergencyContactSchema.required()
  });

  return schema.validate(data);
};

export const validateCheckOutData = (data) => {
  const schema = Joi.object({
    checkInOutId: Joi.string().required(),
    damageReport: Joi.string().allow('')
  });

  return schema.validate(data);
};

export const validatePreferencesUpdate = (data) => {
  const schema = Joi.object({
    preferences: preferencesSchema.required()
  });

  return schema.validate(data);
};

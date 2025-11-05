import Joi from 'joi';

const offerSchema = Joi.object({
  title: Joi.string().required().trim().max(100),
  description: Joi.string().required().max(500),
  code: Joi.string().optional().trim().max(20),
  type: Joi.string().valid('percentage', 'fixed_amount', 'free_item').required(),
  discountValue: Joi.number().when('type', {
    is: 'percentage',
    then: Joi.number().min(1).max(100).required(),
    otherwise: Joi.number().min(1).required()
  }),
  target: Joi.object({
    minOrders: Joi.number().min(1).default(1),
    itemType: Joi.string().trim().max(50).optional(),
    category: Joi.string().trim().max(50).optional()
  }).optional(),
  jaffnaItems: Joi.array().items(
    Joi.string().valid(
      'kottu', 'curry', 'seafood', 'mutton', 'chicken', 
      'vegetable', 'dessert', 'beverage', 'appetizer',
      'ஆட்டுக்கறி', 'கறிக்கோசு', 'நீர் கறக்கை', 'கொத்து'
    )
  ).optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  maxRedemptions: Joi.number().min(1).allow(null).optional(),
  isActive: Joi.boolean().default(true)
});

const updateOfferSchema = Joi.object({
  title: Joi.string().trim().max(100).optional(),
  description: Joi.string().max(500).optional(),
  code: Joi.string().optional().trim().max(20),
  type: Joi.string().valid('percentage', 'fixed_amount', 'free_item').optional(),
  discountValue: Joi.number().min(1).optional(),
  target: Joi.object({
    minOrders: Joi.number().min(1).optional(),
    itemType: Joi.string().trim().max(50).optional(),
    category: Joi.string().trim().max(50).optional()
  }).optional(),
  jaffnaItems: Joi.array().items(
    Joi.string().valid(
      'kottu', 'curry', 'seafood', 'mutton', 'chicken', 
      'vegetable', 'dessert', 'beverage', 'appetizer',
      'ஆட்டுக்கறி', 'கறிக்கோசு', 'நீர் கறக்கை', 'கொத்து'
    )
  ).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
  maxRedemptions: Joi.number().min(1).allow(null).optional(),
  isActive: Joi.boolean().optional()
});

export { offerSchema, updateOfferSchema };
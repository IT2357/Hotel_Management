// Validation utilities for food system forms

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0 && numPrice <= 999999.99;
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateMinLength = (value, minLength) => {
  return value && value.toString().trim().length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return !value || value.toString().trim().length <= maxLength;
};

export const validateNumber = (value, min = 0, max = Infinity) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Form validation schemas
export const menuItemValidation = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    message: 'Item name must be between 2 and 100 characters'
  },
  description: {
    maxLength: 500,
    message: 'Description must be less than 500 characters'
  },
  price: {
    required: true,
    validate: validatePrice,
    message: 'Price must be a valid number between 0 and 999,999.99'
  },
  category: {
    required: true,
    message: 'Please select a category'
  },
  cookingTime: {
    validate: (value) => !value || validateNumber(value, 1, 480),
    message: 'Cooking time must be between 1 and 480 minutes'
  }
};

export const guestInfoValidation = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'First name must be between 2 and 50 characters'
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    message: 'Last name must be between 2 and 50 characters'
  },
  email: {
    required: true,
    validate: validateEmail,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: true,
    validate: validatePhone,
    message: 'Please enter a valid phone number'
  }
};

// Real-time validation function
export const validateField = (fieldName, value, schema) => {
  const rules = schema[fieldName];
  if (!rules) return null;

  // Check required
  if (rules.required && !validateRequired(value)) {
    return rules.message || `${fieldName} is required`;
  }

  // Check min length
  if (rules.minLength && !validateMinLength(value, rules.minLength)) {
    return rules.message || `${fieldName} must be at least ${rules.minLength} characters`;
  }

  // Check max length
  if (rules.maxLength && !validateMaxLength(value, rules.maxLength)) {
    return rules.message || `${fieldName} must be less than ${rules.maxLength} characters`;
  }

  // Check custom validation
  if (rules.validate && !rules.validate(value)) {
    return rules.message || `${fieldName} is invalid`;
  }

  return null;
};

// Validate entire form
export const validateForm = (formData, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(fieldName => {
    const error = validateField(fieldName, formData[fieldName], schema);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Character counter utility
export const getCharacterCount = (value, maxLength) => {
  const current = value ? value.toString().length : 0;
  return {
    current,
    max: maxLength,
    remaining: maxLength - current,
    isOverLimit: current > maxLength
  };
};

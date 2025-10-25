const validRequestTypes = [
  'room_service', 'housekeeping', 'concierge', 'transport',
  'maintenance', 'laundry', 'wakeup_call', 'dining', 'spa', 'other'
];

const validateAttachment = (attachment) => {
  if (!attachment) return false;
  return (
    typeof attachment.filename === 'string' &&
    typeof attachment.url === 'string' &&
    typeof attachment.type === 'string'
  );
};

export const validateServiceRequest = (data) => {
  const errors = [];
  
  if (!validRequestTypes.includes(data.requestType)) {
    errors.push('Invalid request type');
  }
  
  if (!data.title || typeof data.title !== 'string' || data.title.length > 100) {
    errors.push('Title is required and must be less than 100 characters');
  }
  
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string' || data.description.length > 500) {
      errors.push('Description must be a string and less than 500 characters');
    }
  }
  
  if (data.guest && typeof data.guest !== 'string') {
    errors.push('Guest must be a string or null');
  }
  
  if (data.room && typeof data.room !== 'string') {
    errors.push('Room must be a string or null');
  }
  
  if (data.guestLocation !== undefined && data.guestLocation !== null) {
    if (typeof data.guestLocation !== 'string') {
      errors.push('Guest location must be a string');
    }
  }
  
  if (data.isAnonymous !== undefined && typeof data.isAnonymous !== 'boolean') {
    errors.push('isAnonymous must be a boolean');
  }
  
  if (data.specialInstructions && (typeof data.specialInstructions !== 'string' || data.specialInstructions.length > 200)) {
    errors.push('Special instructions must be less than 200 characters');
  }
  // Validate attachments if present
  if (data.attachments) {
    if (!Array.isArray(data.attachments) || data.attachments.length > 5) {
      errors.push('Attachments must be an array with a maximum of 5 items');
    } else if (!data.attachments.every(validateAttachment)) {
      errors.push('Each attachment must have filename, url, and type');
    }
  }

  return {
    error: errors.length > 0 ? errors.join(', ') : null,
    value: errors.length === 0 ? data : null
  };
};

const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];

// Pure validator for status update
export const validateStatusUpdateData = (data) => {
  const errors = [];
  
  if (!validStatuses.includes(data.status)) {
    errors.push('Invalid status value');
  }
  
  if (data.assignedTo && typeof data.assignedTo !== 'string') {
    errors.push('assignedTo must be a string or undefined');
  }
  
  return {
    error: errors.length > 0 ? errors.join(', ') : null,
    value: errors.length === 0 ? data : null
  };
};

// Pure validator for note addition
export const validateNoteAdditionData = (data) => {
  const errors = [];
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Content is required');
  } else if (data.content.length > 1000) {
    errors.push('Content must be less than 1000 characters');
  }
  
  return {
    error: errors.length > 0 ? errors.join(', ') : null,
    value: errors.length === 0 ? { content: data.content.trim() } : null
  };
};

// Express middleware wrappers
export const validateStatusUpdate = (req, res, next) => {
  const { error } = validateStatusUpdateData(req.body || {});
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }
  next();
};

export const validateNoteAddition = (req, res, next) => {
  const { error } = validateNoteAdditionData(req.body || {});
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }
  next();
};

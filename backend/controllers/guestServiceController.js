import GuestServiceRequest from "../models/GuestServiceRequest.js";
import { validateServiceRequest } from "../validations/guestServiceValidation.js";
import environment from '../config/environment.js';

export const createServiceRequest = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    // Parse the request body
    const requestData = {
      ...req.body,
      isAnonymous: req.body.isAnonymous === 'true' || req.body.isAnonymous === true,
      guest: req.body.guest || null,
      room: req.body.room || null,
      specialInstructions: req.body.specialInstructions || '',
      status: 'pending'
    };

    // Validate the request data
    const { error } = validateServiceRequest(requestData);
    if (error) {
      console.error('Validation error:', error);
      return res.status(400).json({ message: error.details?.[0]?.message || 'Invalid request data' });
    }

    // Handle file uploads if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      const isCloudinaryConfigured = environment.CLOUDINARY?.CLOUD_NAME &&
        environment.CLOUDINARY?.API_KEY &&
        environment.CLOUDINARY?.API_SECRET;

      attachments = req.files.map(file => ({
        filename: file.originalname,
        url: isCloudinaryConfigured 
          ? file.path 
          : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        type: file.mimetype
      }));
    }

    // Create the service request
    const request = new GuestServiceRequest({
      ...requestData,
      attachments,
      guest: requestData.isAnonymous ? null : requestData.guest
    });

    await request.save();
    console.log('Service request created successfully:', request);
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServiceRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const requests = await GuestServiceRequest.find(filter)
      .populate('guest', 'firstName lastName')
      .populate('room', 'number')
      .sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await GuestServiceRequest.findById(id)
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'number type')
      .populate('assignedTo', 'firstName lastName');
    
    if (!request) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    console.log('🔄 Updating request status:', req.params.id, 'to:', req.body.status);
    console.log('👤 User making request:', req.user);

    const { id } = req.params;
    const { status, assignedTo } = req.body;

    // Additional validation check
    if (!id || !status) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Request ID and status are required' });
    }

    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status:', status);
      return res.status(400).json({ message: 'Invalid status value' });
    }

    console.log('🔍 Finding request in database...');
    const request = await GuestServiceRequest.findById(id);
    if (!request) {
      console.log('❌ Request not found:', id);
      return res.status(404).json({ message: 'Service request not found' });
    }

    console.log('✅ Found request:', request._id, 'Current status:', request.status);

    try {
      const updateData = { 
        status,
        updatedAt: new Date()
      };

      if (status === 'assigned') {
        // Only update assignedTo if it's provided, otherwise keep the current value
        if (assignedTo) {
          updateData.assignedTo = assignedTo;
        } else if (!request.assignedTo) {
          // If no assignedTo is provided and request doesn't have one, assign to current user
          updateData.assignedTo = req.user.id;
        }
        updateData.assignedAt = new Date();
        console.log('👤 Assigning to:', updateData.assignedTo || request.assignedTo);
      } else if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      console.log('💾 Updating request...');
      
      // Use findOneAndUpdate with lean for better performance
      const updatedRequest = await GuestServiceRequest.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { 
          new: true,
          runValidators: true,
          lean: true,
          maxTimeMS: 10000 // 10 second timeout
        }
      ).lean();
      
      if (!updatedRequest) {
        const error = new Error('Failed to update request: Request not found');
        error.statusCode = 404;
        throw error;
      }

      console.log('✅ Request updated successfully to status:', status);
      
      // Send response immediately after update
      res.status(200).json({
        success: true,
        data: updatedRequest,
        message: 'Request updated successfully'
      });
      
    } catch (saveError) {
      console.error('❌ Update error:', saveError);
      const statusCode = saveError.statusCode || 500;
      const message = saveError.message || 'Failed to update request status';
      
      if (!res.headersSent) {
        res.status(statusCode).json({
          success: false,
          message,
          ...(process.env.NODE_ENV === 'development' && { error: saveError.toString() })
        });
      }
      return;
    }  
  } catch (error) {
    console.error('❌ Error updating request status:', error);
    res.status(500).json({ 
      message: 'Failed to update request status',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }) 
    });
  }
};

export const addRequestNotes = async (req, res) => {
  try {
    console.log('📝 Adding notes to request:', req.params.id);
    console.log('👤 User making request:', req.user);
    console.log('📄 Note content:', req.body.content);

    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      console.log('❌ Empty note content');
      return res.status(400).json({ message: 'Note content is required' });
    }

    const request = await GuestServiceRequest.findById(id);
    if (!request) {
      console.log('❌ Request not found:', id);
      return res.status(404).json({ message: 'Service request not found' });
    }

    console.log('✅ Found request:', request._id);

    request.notes.push({
      content,
      addedBy: req.user.id
    });

    await request.save();
    console.log('✅ Notes added successfully');

    res.status(200).json(request);
  } catch (error) {
    console.error('❌ Error adding notes:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyServiceRequests = async (req, res) => {
  try {
    const guestId = req.user._id;
    
    const requests = await GuestServiceRequest.find({ guest: guestId })
      .populate('room', 'number')
      .sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

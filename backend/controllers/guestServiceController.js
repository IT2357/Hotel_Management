import mongoose from 'mongoose';
import GuestServiceRequest from "../models/GuestServiceRequest.js";
import CheckInOut from "../models/CheckInOut.js";
import { validateServiceRequest } from "../validations/guestServiceValidation.js";
import environment from '../config/environment.js';
import StaffTask from "../models/StaffTask.js";
import { assignTask } from "../utils/taskAssigner.js";
import { mapRequestTypeToDeptCategory } from "../utils/requestTypeMapper.js";

export const createServiceRequest = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    // Parse the request body
    const requestData = {
      ...req.body,
      isAnonymous: req.body.isAnonymous === 'true' || req.body.isAnonymous === true,
      // Always take guest from auth context unless anonymous
      guest: null,
      room: null,
      specialInstructions: req.body.specialInstructions || '',
      status: 'pending'
    };

    // Validate the request data
    const { error } = validateServiceRequest(requestData);
    if (error) {
      console.error('Validation error:', error);
      return res.status(400).json({ message: typeof error === 'string' ? error : 'Invalid request data' });
    }

    // Enforce that the requester is an authenticated guest with an active check-in
    // Derive the room/booking/checkInOut from the active check-in record
    try {
      const userId = req.user?._id || req.user?.id;
      
      // For authenticated requests, validate user exists
      if (!requestData.isAnonymous && !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Always try to derive room/booking from active check-in if user is authenticated
      if (userId) {
        const activeCheckIn = await CheckInOut.findOne({
          guest: userId,
          status: 'checked_in'
        }).populate('room booking');

        if (!activeCheckIn) {
          return res.status(400).json({ message: 'No active check-in found. Please check in to your room before requesting services.' });
        }

        // Set guest only if not anonymous
        if (!requestData.isAnonymous) {
          requestData.guest = userId;
        }
        
        // Always set room, booking, and checkInOut from active check-in
        requestData.room = activeCheckIn.room?._id || null;
        requestData.booking = activeCheckIn.booking?._id || null;
        requestData.checkInOut = activeCheckIn._id;
      }
    } catch (deriveErr) {
      console.error('Failed to derive active check-in for service request:', deriveErr);
      return res.status(500).json({ message: 'Unable to verify check-in status' });
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

    console.log('Creating service request with data:', {
      guest: request.guest,
      room: request.room,
      booking: request.booking,
      checkInOut: request.checkInOut,
      isAnonymous: request.isAnonymous,
      requestType: request.requestType,
      title: request.title
    });

    await request.save();
    console.log('Service request created successfully:', request._id);

    // Optionally create a StaffTask for manager oversight under feature flag
    if (environment.FEATURES?.GSR_TO_TASK_PIPELINE) {
      try {
        const { department, category } = mapRequestTypeToDeptCategory(request.requestType);

        const taskPayload = {
          title: `[GSR] ${request.title}`,
          description: request.description || request.title,
          department,
          priority: request.priority || 'medium',
          status: 'pending',
          createdBy: null,
          assignedBy: null,
          assignmentSource: 'system',
          location: (request.guestLocation && ['room','kitchen','lobby','gym','pool','parking'].includes(request.guestLocation.toLowerCase())) ? request.guestLocation.toLowerCase() : 'other',
          category,
          // Linkage fields
          source: 'guest_service',
          sourceModel: 'GuestServiceRequest',
          sourceRef: request._id
        };

        const staffTask = new StaffTask(taskPayload);
        await staffTask.save();

        // Try auto-assignment; ignore failures
        try {
          await assignTask(staffTask._id);
        } catch (assignErr) {
          console.warn('Auto-assign failed for task from GSR:', assignErr?.message || assignErr);
        }
      } catch (pipelineErr) {
        console.error('Failed to create StaffTask from GSR (feature-flagged):', pipelineErr);
      }
    }

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
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber type floor')
      .populate('assignedTo', 'name email phone profilePicture role department')
      .sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }
    
    const request = await GuestServiceRequest.findById(id)
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber type floor')
      .populate('assignedTo', 'name email phone profilePicture role department')
      .populate('notes.addedBy', 'name email');
    
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

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

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

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

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
    
    // Get all check-ins for this guest to include anonymous requests
    const checkIns = await CheckInOut.find({ guest: guestId }).select('_id');
    const checkInIds = checkIns.map(ci => ci._id);
    
    // Find requests where either:
    // 1. guest field matches (non-anonymous)
    // 2. checkInOut matches one of user's check-ins (anonymous)
    const requests = await GuestServiceRequest.find({
      $or: [
        { guest: guestId },
        { checkInOut: { $in: checkInIds } }
      ]
    })
      .populate('room', 'roomNumber type floor')
      .populate('guest', 'name email phone')
      .populate('assignedTo', 'name email phone profilePicture role department')
      .populate('notes.addedBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${requests.length} service requests for guest ${guestId}`);
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching guest service requests:', error);
    res.status(500).json({ message: error.message });
  }
};

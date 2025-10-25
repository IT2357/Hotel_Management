import Message from '../../models/Message.js';
import { User } from '../../models/User.js';

/**
 * Get all staff members for messaging
 * @route GET /api/manager/messaging/staff-list
 */
export const getStaffList = async (req, res) => {
  try {
    // Get all active staff members with their department
    const staff = await User.find({ role: 'staff', isActive: true })
      .select('name email role department')
      .sort({ name: 1 });

    // Format staff list
    const staffWithDepartments = staff.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      value: s._id.toString(),
      department: s.department || 'Unknown',
    }));

    // Add team options
    const departments = [
      { id: 'all', name: 'All Staff', value: 'all', type: 'team' },
      { id: 'housekeeping', name: 'Housekeeping Team', value: 'Housekeeping', type: 'department' },
      { id: 'kitchen', name: 'Kitchen Team', value: 'Kitchen', type: 'department' },
      { id: 'maintenance', name: 'Maintenance Team', value: 'Maintenance', type: 'department' },
      { id: 'service', name: 'Service Team', value: 'Service', type: 'department' },
    ];

    res.status(200).json({
      success: true,
      data: {
        individuals: staffWithDepartments,
        teams: departments,
      },
    });
  } catch (error) {
    console.error('Error fetching staff list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff list',
      error: error.message,
    });
  }
};

/**
 * Send a message to staff
 * @route POST /api/manager/messaging/send
 */
export const sendMessage = async (req, res) => {
  try {
    const { recipient, recipientType, subject, message, messageType, priority } = req.body;
    const senderId = req.user._id;

    // Validation
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required',
      });
    }

    if (!recipient && recipientType !== 'all') {
      return res.status(400).json({
        success: false,
        message: 'Recipient is required',
      });
    }

    // Map message types to Message schema types
    const typeMap = {
      'announcement': 'general',
      'task': 'schedule',
      'alert': 'emergency',
      'feedback': 'general',
      'general': 'general'
    };

    const departmentMap = {
      'Housekeeping': 'cleaning',
      'Kitchen': 'kitchen',
      'Maintenance': 'maintenance',
      'Service': 'service'
    };

    let recipients = [];
    let departmentName = 'service'; // default

    // Determine recipients
    if (recipientType === 'department' || ['Housekeeping', 'Kitchen', 'Maintenance', 'Service'].includes(recipient)) {
      // Department message - find all staff in that department
      departmentName = departmentMap[recipient] || 'service';
      const staffInDept = await User.find({ 
        role: 'staff', 
        department: recipient,
        isActive: true 
      });
      recipients = staffInDept.map(s => s._id);
    } else if (recipientType === 'all' || recipient === 'all') {
      // All staff message
      const allStaff = await User.find({ role: 'staff', isActive: true });
      recipients = allStaff.map(s => s._id);
      departmentName = 'service'; // default for broadcast
    } else {
      // Individual message
      const recipientUser = await User.findById(recipient);
      if (!recipientUser) {
        return res.status(404).json({
          success: false,
          message: 'Recipient not found',
        });
      }
      recipients = [recipient];
      departmentName = departmentMap[recipientUser.department] || 'service';
    }

    // Create message for each recipient
    const messagePromises = recipients.map(recipientId => 
      Message.create({
        sender: senderId,
        recipient: recipientId,
        type: typeMap[messageType] || 'general',
        priority: priority || 'medium',
        subject,
        message,
        department: departmentName,
        status: 'pending'
      })
    );

    const createdMessages = await Promise.all(messagePromises);

    res.status(201).json({
      success: true,
      message: `Message sent successfully to ${recipients.length} recipient(s)`,
      data: {
        count: createdMessages.length,
        recipients: recipients.length
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

/**
 * Get sent messages (messages sent by the manager)
 * @route GET /api/manager/messaging/sent
 */
export const getSentMessages = async (req, res) => {
  try {
    const { messageType, priority, search } = req.query;
    const senderId = req.user._id;

    console.log('📨 Fetching sent messages for manager:', senderId);

    let query = { sender: senderId };
    
    if (messageType && messageType !== 'all') {
      const typeMap = {
        'announcement': 'general',
        'task': 'schedule',
        'alert': 'emergency',
        'feedback': 'general',
        'general': 'general'
      };
      query.type = typeMap[messageType];
    }
    if (priority) {
      query.priority = priority;
    }

    let messages = await Message.find(query)
      .populate('recipient', 'name email role department')
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${messages.length} messages`);

    // Group messages by subject and timestamp (within 1 second) for broadcast messages
    const groupedMessages = {};
    messages.forEach(msg => {
      const timestamp = new Date(msg.createdAt).getTime();
      const roundedTime = Math.floor(timestamp / 1000); // Group by second
      const key = `${msg.subject}_${roundedTime}`;
      
      if (!groupedMessages[key]) {
        groupedMessages[key] = {
          ...msg.toObject(),
          recipients: [msg.recipient],
          recipientCount: 1,
          isBroadcast: false
        };
      } else {
        groupedMessages[key].recipients.push(msg.recipient);
        groupedMessages[key].recipientCount++;
        groupedMessages[key].isBroadcast = true;
      }
    });

    // Convert grouped messages back to array
    let finalMessages = Object.values(groupedMessages).map(msg => {
      if (msg.isBroadcast) {
        // For broadcast, show summary
        const departments = [...new Set(msg.recipients.map(r => r?.department).filter(Boolean))];
        return {
          ...msg,
          recipient: {
            name: departments.length > 1 ? 'All Staff' : `${departments[0]} Team`,
            email: `${msg.recipientCount} recipients`
          },
          recipientSummary: `${msg.recipientCount} staff members`
        };
      }
      return msg;
    });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      finalMessages = finalMessages.filter(
        (msg) =>
          msg.subject.toLowerCase().includes(searchLower) ||
          msg.message.toLowerCase().includes(searchLower) ||
          msg.recipient?.name?.toLowerCase().includes(searchLower)
      );
    }

    console.log(`✅ Returning ${finalMessages.length} grouped messages`);

    res.status(200).json({
      success: true,
      count: finalMessages.length,
      data: finalMessages,
    });
  } catch (error) {
    console.error('❌ Error fetching sent messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

/**
 * Get received messages (messages received by staff)
 * @route GET /api/staff/messaging/received
 */
export const getReceivedMessages = async (req, res) => {
  try {
    const { messageType, priority, status } = req.query;
    const userId = req.user._id;

    // Build query - messages where user is the recipient
    const query = { recipient: userId };

    if (messageType && messageType !== 'all') {
      const typeMap = {
        'announcement': 'general',
        'task': 'schedule',
        'alert': 'emergency',
        'feedback': 'general',
        'general': 'general'
      };
      query.type = typeMap[messageType];
    }
    if (priority) {
      query.priority = priority;
    }
    if (status) {
      query.status = status;
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching received messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

/**
 * Mark message as read
 * @route PUT /api/staff/messaging/:id/read
 */
export const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Update status to 'in-progress' when read
    if (message.status === 'pending') {
      message.status = 'in-progress';
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message,
    });
  }
};

/**
 * Delete a message
 * @route DELETE /api/manager/messaging/:id
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({ _id: id, sender: userId });
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or unauthorized',
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
};

/**
 * Get message statistics
 * @route GET /api/manager/messaging/stats
 */
export const getMessageStats = async (req, res) => {
  try {
    const senderId = req.user._id;

    const totalSent = await Message.countDocuments({ sender: senderId });
    const byType = await Message.aggregate([
      { $match: { sender: senderId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const byPriority = await Message.aggregate([
      { $match: { sender: senderId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSent,
        byType,
        byPriority,
      },
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

/**
 * Get chat conversation between manager and a staff member
 * @route GET /api/manager/messaging/conversation/:staffId
 */
export const getConversation = async (req, res) => {
  try {
    const { staffId } = req.params;
    const managerId = req.user._id;

    console.log(`💬 Fetching conversation between manager ${managerId} and staff ${staffId}`);

    // Get all messages between manager and this staff member
    const messages = await Message.find({
      $or: [
        { sender: managerId, recipient: staffId },
        { sender: staffId, recipient: managerId }
      ]
    })
      .populate('sender', 'name email role')
      .populate('recipient', 'name email role')
      .sort({ createdAt: 1 }); // Oldest first for chat view

    console.log(`✅ Found ${messages.length} messages in conversation`);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('❌ Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message,
    });
  }
};

/**
 * Send a reply in a conversation
 * @route POST /api/manager/messaging/reply
 */
export const sendReply = async (req, res) => {
  try {
    const { recipientId, message, conversationId } = req.body;
    const senderId = req.user._id;

    console.log(`💬 Sending reply from ${senderId} to ${recipientId}`);

    if (!message || !recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Message and recipient are required',
      });
    }

    // Get recipient info to determine department
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found',
      });
    }

    const departmentMap = {
      'Housekeeping': 'cleaning',
      'Kitchen': 'kitchen',
      'Maintenance': 'maintenance',
      'Service': 'service'
    };

    // Create reply message
    const replyMessage = await Message.create({
      sender: senderId,
      recipient: recipientId,
      subject: 'Chat Reply',
      message,
      type: 'general',
      priority: 'medium',
      department: departmentMap[recipient.department] || 'service',
      status: 'pending',
      conversationId: conversationId || `${senderId}_${recipientId}`,
      isReply: true
    });

    await replyMessage.populate('sender', 'name email role');
    await replyMessage.populate('recipient', 'name email role');

    console.log(`✅ Reply sent successfully`);

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: replyMessage,
    });
  } catch (error) {
    console.error('❌ Error sending reply:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message,
    });
  }
};

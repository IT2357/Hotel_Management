import Message from '../../models/Message.js';
import { User } from '../../models/User.js';

/**
 * Send message to manager
 * @route POST /api/staff/messaging/send-to-manager
 */
export const sendMessageToManager = async (req, res) => {
  try {
    const { subject, message, priority } = req.body;
    const staffId = req.user._id || req.user.id;

    // Find a manager to send the message to (first available manager or admin)
    const manager = await User.findOne({
      role: { $in: ['manager', 'admin'] },
      isActive: true
    }).sort({ createdAt: 1 }); // Get the first manager

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'No manager available to receive messages'
      });
    }

    const newMessage = new Message({
      sender: staffId,
      recipient: manager._id,
      subject: subject || 'Staff Inquiry',
      message,
      priority: priority || 'normal',
      recipientType: 'individual',
      readBy: []
    });

    await newMessage.save();

    // Populate sender info
    await newMessage.populate('sender', 'name email role');
    await newMessage.populate('recipient', 'name email role');

    // Emit socket event for real-time notification
    if (req.io) {
      req.io.to(manager._id.toString()).emit('new_message', {
        message: newMessage,
        from: req.user.name
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent to manager successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message to manager:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

/**
 * Get conversation with manager
 * @route GET /api/staff/messaging/conversation
 */
export const getConversationWithManager = async (req, res) => {
  try {
    const staffId = req.user._id || req.user.id;

    // Find messages between staff and any manager
    const messages = await Message.find({
      $or: [
        { sender: staffId, recipient: { $exists: true } },
        { recipient: staffId, sender: { $exists: true } }
      ]
    })
    .populate('sender', 'name email role profileImage')
    .populate('recipient', 'name email role profileImage')
    .sort({ createdAt: 1 });

    // Filter messages that involve a manager
    const managerMessages = messages.filter(msg => {
      const senderRole = msg.sender?.role;
      const recipientRole = msg.recipient?.role;
      return (
        senderRole === 'manager' || 
        senderRole === 'admin' || 
        recipientRole === 'manager' || 
        recipientRole === 'admin'
      );
    });

    res.status(200).json({
      success: true,
      data: managerMessages
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message
    });
  }
};

/**
 * Mark messages as read
 * @route PUT /api/staff/messaging/mark-read
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const staffId = req.user._id || req.user.id;

    await Message.updateMany(
      { recipient: staffId, 'readBy': { $ne: staffId } },
      { $addToSet: { readBy: staffId } }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

/**
 * Get unread message count
 * @route GET /api/staff/messaging/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const staffId = req.user._id || req.user.id;

    const unreadCount = await Message.countDocuments({
      recipient: staffId,
      readBy: { $ne: staffId }
    });

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * Get available managers
 * @route GET /api/staff/messaging/managers
 */
export const getAvailableManagers = async (req, res) => {
  try {
    const managers = await User.find({
      role: { $in: ['manager', 'admin'] },
      isActive: true
    })
    .select('name email role profileImage department')
    .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: managers
    });
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers',
      error: error.message
    });
  }
};

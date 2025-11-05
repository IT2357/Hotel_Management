import api from './api.js';

// Test the messages API
export const testMessagesAPI = async () => {
  try {
    console.log('Testing messages API...');
    const response = await api.get('/messages/test');
    console.log('Test response:', response);
    return response.data;
  } catch (error) {
    console.error('Test API error:', error);
    console.error('Test error response:', error.response);
    throw error.response?.data || { message: 'Test API failed' };
  }
};

// Send a new message
export const sendMessage = async (messageData) => {
  try {
    const response = await api.post('/messages', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Error response:', error.response);
    throw error.response?.data || { message: 'Error sending message' };
  }
};

// Get all messages for the current user
export const getMessages = async () => {
  try {
    console.log('Fetching messages...');
    const response = await api.get('/messages');
    console.log('Messages response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    console.error('Error response:', error.response);
    throw error.response?.data || { message: 'Error fetching messages' };
  }
};

// Get a single message by ID
export const getMessageById = async (messageId) => {
  try {
    console.log('Fetching message by ID...');
    const response = await api.get(`/messages/${messageId}`);
    console.log('Message response:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching message:', error);
    throw error.response?.data || { message: 'Error fetching message' };
  }
};

// Update a message
export const updateMessage = async (messageId, updateData) => {
  try {
    const response = await api.put(`/messages/${messageId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating message:', error);
    throw error.response?.data || { message: 'Error updating message' };
  }
};

// Delete a message
export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error.response?.data || { message: 'Error deleting message' };
  }
};
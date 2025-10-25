# WhatsApp-Style Chat Feature 💬

## Overview
A modern, real-time chat interface for staff members to communicate with managers, designed with a WhatsApp-inspired UI/UX.

## Features ✨

### 1. **WhatsApp-Like Design**
- Green header with online status indicator
- Message bubbles (green for sent, white for received)
- Read receipts (single check, double check, blue double check)
- Typing indicators
- Date dividers
- Smooth animations and transitions

### 2. **Real-Time Communication**
- Socket.io integration for instant messaging
- Live typing indicators
- Online/offline status
- Message delivery and read status
- Real-time notifications

### 3. **Rich Messaging Features**
- Text messages
- Emoji picker (15+ emojis)
- File attachments (planned)
- Voice messages (planned)
- Message timestamps
- Message grouping by date

### 4. **User Experience**
- Smooth scrolling to latest messages
- Auto-scroll on new messages
- Responsive design (mobile & desktop)
- Loading states
- Error handling
- Sound notifications

## File Structure 📁

```
frontend/src/
├── pages/
│   ├── Contact.jsx (Updated - routes to chat for staff)
│   └── staff/
│       └── StaffContactChat.jsx (New - WhatsApp-style chat)
├── services/
│   └── staffMessagingAPI.js (New - API service)

backend/
├── controllers/
│   └── staff/
│       └── messagingController.js (New)
├── routes/
│   └── staff/
│       └── messaging.js (New)
└── utils/
    ├── socket.js (Updated - CORS fixes)
    └── logger.js (Updated - error handling)
```

## API Endpoints 🔌

### Staff Messaging Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/staff/messaging/send-to-manager` | Send message to manager |
| GET | `/api/staff/messaging/conversation` | Get all messages with manager |
| PUT | `/api/staff/messaging/mark-read` | Mark messages as read |
| GET | `/api/staff/messaging/unread-count` | Get unread message count |
| GET | `/api/staff/messaging/managers` | Get available managers |

### Request/Response Examples

#### Send Message
```javascript
POST /api/staff/messaging/send-to-manager
Headers: { Authorization: "Bearer <token>" }
Body: {
  "message": "Hello, I need assistance",
  "subject": "Staff Inquiry",
  "priority": "normal"
}

Response: {
  "success": true,
  "message": "Message sent to manager successfully",
  "data": { /* message object */ }
}
```

#### Get Conversation
```javascript
GET /api/staff/messaging/conversation
Headers: { Authorization: "Bearer <token>" }

Response: {
  "success": true,
  "data": [
    {
      "_id": "...",
      "sender": { /* user object */ },
      "recipient": { /* user object */ },
      "message": "Hello",
      "createdAt": "2025-10-25T...",
      "readBy": []
    }
  ]
}
```

## Socket.io Events 🔌

### Client Emits
- `join-role-room` - Join room based on role
- `send_message` - Send a new message
- `typing` - User is typing
- `stop_typing` - User stopped typing

### Client Listens
- `new_message` - Receive new message
- `typing` - Someone is typing
- `message_read` - Message was read

## Usage Instructions 📝

### For Staff Members

1. **Access the Chat**
   - Navigate to `/contact` page
   - If logged in as staff, you'll automatically see the chat interface
   - Public users see the traditional contact form

2. **Send Messages**
   - Type your message in the input field
   - Press Enter or click the Send button
   - See real-time delivery status

3. **View Messages**
   - All messages appear in chronological order
   - Your messages on the right (green)
   - Manager's messages on the left (white)
   - Date separators for different days

4. **Message Status**
   - ✓ Single check = Sent
   - ✓✓ Double check (gray) = Delivered
   - ✓✓ Double check (blue) = Read

5. **Additional Features**
   - 😊 Click emoji button for emoji picker
   - 📎 Attach files (coming soon)
   - 🎤 Voice messages (coming soon)

### For Managers

Managers can view and respond to staff messages through the existing Manager Messaging interface (`/manager/messaging`).

## Component Props

### StaffContactChat

No props required - uses:
- `localStorage` for user data and auth token
- `useSnackbar` for notifications
- Socket.io for real-time features

## Styling 🎨

### Color Scheme
- **Primary:** Green (#16a34a) - WhatsApp green
- **Sent Messages:** Green-500 background
- **Received Messages:** White background
- **Background:** Light gray with subtle pattern
- **Text:** Dark gray for readability

### Responsive Design
- Mobile: Full-screen chat experience
- Tablet: Optimized layout
- Desktop: Centered with max-width

## Dependencies 📦

### Required Packages

```json
{
  "socket.io-client": "^4.x",
  "framer-motion": "^10.x",
  "date-fns": "^2.x",
  "notistack": "^3.x",
  "lucide-react": "^0.x",
  "axios": "^1.x"
}
```

### Install Dependencies
```bash
cd frontend
npm install socket.io-client framer-motion date-fns notistack lucide-react axios
```

## Configuration ⚙️

### Environment Variables

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
```

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hotel-management
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

## Testing 🧪

### Manual Testing Steps

1. **Test Login**
   - Login as staff member
   - Navigate to `/contact`
   - Verify chat interface loads

2. **Test Messaging**
   - Send a message
   - Check message appears in chat
   - Verify timestamp is correct
   - Check read status

3. **Test Real-Time Features**
   - Open chat in two browsers
   - Send message from one
   - Verify it appears in the other
   - Test typing indicators

4. **Test Responsive Design**
   - Test on mobile viewport
   - Test on tablet viewport
   - Test on desktop viewport

## Troubleshooting 🔧

### Common Issues

**1. Messages Not Sending**
- Check backend server is running
- Verify authentication token is valid
- Check browser console for errors
- Verify API endpoint is correct

**2. Socket.io Connection Failed**
- Ensure backend is running on port 5000
- Check CORS configuration in `utils/socket.js`
- Verify firewall settings

**3. No Messages Displayed**
- Check if conversation exists in database
- Verify API response in network tab
- Check console for errors

**4. Styling Issues**
- Ensure Tailwind CSS is configured
- Check for CSS conflicts
- Verify className props

### Debug Mode

Enable debug logging:
```javascript
// In StaffContactChat.jsx
console.log('Messages:', messages);
console.log('Socket status:', socket?.connected);
console.log('Current user:', currentUser);
```

## Performance Optimization 🚀

1. **Message Pagination** (Recommended for production)
   - Load messages in batches
   - Implement infinite scroll
   - Cache recent messages

2. **Image Optimization**
   - Compress attachments
   - Use thumbnail previews
   - Lazy load images

3. **Socket Connection**
   - Reconnect on disconnect
   - Queue messages when offline
   - Debounce typing indicators

## Future Enhancements 🎯

### Planned Features
- [ ] File attachments (images, PDFs)
- [ ] Voice messages
- [ ] Video calls
- [ ] Message search
- [ ] Message reactions
- [ ] Forward messages
- [ ] Delete messages
- [ ] Edit messages
- [ ] Message threads
- [ ] Group chats (multiple managers)
- [ ] Push notifications
- [ ] Message encryption
- [ ] Offline mode
- [ ] Message export

### UI Improvements
- [ ] Dark mode
- [ ] Custom themes
- [ ] Stickers
- [ ] GIF support
- [ ] Message formatting (bold, italic)
- [ ] Link previews
- [ ] Custom notification sounds

## Security Considerations 🔒

1. **Authentication**
   - All endpoints require JWT token
   - Token validation on every request
   - Role-based access control

2. **Input Validation**
   - Sanitize message content
   - Validate file uploads
   - Prevent XSS attacks

3. **Rate Limiting**
   - Limit messages per minute
   - Prevent spam
   - Throttle API requests

## Support & Maintenance 🛠️

### Logging
- All errors logged to console
- Socket events logged
- API calls logged in network tab

### Monitoring
- Track message delivery rates
- Monitor socket connections
- Check API response times

## Credits & License 📄

**Developed for:** Hotel Management System  
**Date:** October 25, 2025  
**Version:** 1.0.0  
**License:** MIT

---

## Quick Start Guide 🚀

1. **Install dependencies**
   ```bash
   cd frontend && npm install
   cd backend && npm install
   ```

2. **Start servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

3. **Test the chat**
   - Login as staff member
   - Go to `/contact`
   - Start chatting!

---

**Need help?** Check the troubleshooting section or contact the development team.

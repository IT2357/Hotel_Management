# Guest Profile Dashboard - Implementation Guide

## Overview

This implementation provides a modern, responsive Guest Profile Dashboard for the hotel booking system. The dashboard is accessible via the protected route `/user/profile` and offers a comprehensive interface for guests to manage their profile, bookings, favorite rooms, reviews, and security settings.

## Features Implemented

### ✅ Core Features

1. **Header Section**
   - User photo display with upload functionality
   - User name and role (Guest/Customer) display
   - Edit Profile and Logout buttons
   - Gradient styling with hover animations

2. **Quick Actions Bar**
   - 🧾 View My Bookings → navigates to `/guest/my-bookings`
   - ⭐ Favorite Rooms → navigates to `/guest/favorite-rooms`
   - 💬 My Reviews → navigates to `/guest/reviews`
   - ⚙️ Settings → opens Security tab
   - Gradient backgrounds with hover animations

3. **Tabbed Navigation**
   - **Profile Tab**: Editable user info (name, email, phone, address)
   - **My Bookings Tab**: Integrated existing MyBookings component
   - **Favorite Rooms Tab**: Integrated existing FavoriteRooms component
   - **Reviews Tab**: Integrated existing MyReviews component
   - **Security Tab**: Password change and login history

4. **Global Chatbot Integration**
   - Floating chatbot button at bottom-right corner
   - Available across all pages
   - Interactive FAQ system
   - Responsive design with animations

### 🎨 Design Implementation

- **Card-based layout** with subtle shadows and rounded corners
- **Gradient buttons** (from-indigo-600 to-purple-600)
- **Responsive design** - sidebar/tabs adapt to mobile
- **Smooth transitions** for hover and tab changes
- **Framer Motion animations** for page transitions
- **Tailwind CSS** for modern styling

## File Structure

```
frontend/src/
├── pages/
│   ├── UserProfile.jsx           # Main dashboard component
│   └── guest/
│       ├── MyBookings.jsx        # Integrated booking component
│       ├── FavoriteRooms.jsx     # Integrated favorites component
│       └── MyReviews.jsx         # Integrated reviews component
├── components/
│   └── common/
│       └── GlobalChatbot.jsx     # Global chatbot component
├── services/
│   └── authService.js            # Updated with profile picture upload
└── App.jsx                       # Updated with global chatbot
```

## Routes

The following routes are available:

- `/user/profile` → Main Profile Dashboard (protected route)
- `/guest/my-bookings` → My Bookings page
- `/guest/favorite-rooms` → Favorite Rooms page
- `/guest/reviews` → Reviews page

## Component Architecture

### UserProfile.jsx
```jsx
// Main dashboard with:
- Header with profile picture and user info
- Quick action cards
- Tabbed navigation
- Tab content rendering
- Profile editing functionality
- Security settings
```

### GlobalChatbot.jsx
```jsx
// Floating chatbot with:
- Interactive message system
- FAQ responses
- Quick question buttons
- Responsive design
- Global availability
```

## API Integration

### Auth Service Methods Used
```javascript
authService.updateProfile(profileData)     // Update user profile
authService.changePassword(passwordData)   // Change password
authService.uploadProfilePicture(formData) // Upload profile picture
authService.getCurrentUser()               // Get current user data
```

## State Management

### Profile State
```javascript
const [profileData, setProfileData] = useState({
  name: '',
  email: '',
  phone: '',
  address: '',
  profilePicture: null
});
```

### Security State
```javascript
const [passwordData, setPasswordData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
```

## Responsive Design Breakpoints

- **Mobile**: < 768px - Stacked layout, collapsible tabs
- **Tablet**: 768px - 1024px - 2-column grid for quick actions
- **Desktop**: > 1024px - Full 4-column layout, side-by-side content

## Animation Details

### Page Transitions
```javascript
// Entry animations
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}

// Tab content transitions
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
```

### Hover Effects
```javascript
// Button hover animations
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}

// Card hover effects
whileHover={{ scale: 1.02, y: -2 }}
```

## Chatbot Features

### Smart Responses
The chatbot provides intelligent responses for:
- Booking inquiries
- Hotel amenities
- Room service
- Check-in/check-out times
- WiFi information
- Spa and fitness center
- Parking information
- General help

### Quick Questions
Pre-defined quick action buttons for:
- "Show my upcoming bookings"
- "How do I cancel a booking?"
- "What amenities do you offer?"
- "Room service hours?"
- "Check-in/check-out times?"

## Security Features

### Password Management
- Current password verification
- New password confirmation
- Password visibility toggles
- Secure password change flow

### Profile Picture Upload
- File type validation
- Secure upload to backend
- Immediate UI update
- Error handling

## Mobile Optimization

### Touch-Friendly Design
- Large tap targets (44px minimum)
- Swipe gestures for tab navigation
- Responsive grid layouts
- Optimized font sizes

### Performance
- Lazy loading of tab content
- Optimized image rendering
- Efficient re-renders with React.memo where applicable

## Error Handling

### Form Validation
- Required field validation
- Email format validation
- Password match confirmation
- File upload validation

### API Error Handling
- Network error handling
- Authentication error handling
- User-friendly error messages
- Fallback states

## Accessibility Features

### WCAG Compliance
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- High contrast color schemes
- Screen reader compatibility

### Focus Management
- Visible focus indicators
- Logical tab order
- Focus trapping in modals
- Skip links where appropriate

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Installation & Setup

1. **Dependencies**: All required dependencies are already installed in the project (framer-motion, react-router-dom, tailwindcss, etc.)

2. **Backend Requirements**: Ensure the following API endpoints are available:
   ```
   PUT /auth/profile                    # Update profile
   PUT /auth/change-password           # Change password
   POST /auth/upload-profile-picture   # Upload profile picture
   GET /auth/me                       # Get current user
   ```

3. **Environment**: The component uses the existing AuthContext and routing structure.

## Usage Examples

### Accessing the Dashboard
```javascript
// Navigate to profile dashboard
navigate('/user/profile');
```

### Tab Navigation
```javascript
// Programmatically switch tabs
setActiveTab('bookings');
setActiveTab('security');
```

### Profile Updates
```javascript
// Update profile programmatically
const profileData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: '123 Main St'
};
await authService.updateProfile(profileData);
```

## Testing Recommendations

### Unit Tests
- Component rendering tests
- Form submission tests
- Tab navigation tests
- API integration tests

### Integration Tests
- Full user flow tests
- Authentication tests
- File upload tests
- Error scenario tests

### E2E Tests
- Complete profile management flow
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility testing

## Performance Optimization

### Code Splitting
Consider implementing code splitting for tab content:
```javascript
const MyBookings = lazy(() => import('./guest/MyBookings'));
const FavoriteRooms = lazy(() => import('./guest/FavoriteRooms'));
```

### Memoization
Use React.memo for expensive components:
```javascript
const ProfileTabContent = React.memo(ProfileTabContentComponent);
```

## Future Enhancements

1. **Advanced Chatbot**: Integrate with AI/ML backend for more intelligent responses
2. **Social Features**: Add social login integration
3. **Notifications**: Real-time notification system
4. **Theme Support**: Dark/light mode toggle
5. **Internationalization**: Multi-language support
6. **Advanced Analytics**: User behavior tracking
7. **Export Features**: Export booking history, reviews, etc.
8. **Calendar Integration**: Sync with Google/Outlook calendars

## Troubleshooting

### Common Issues

1. **Profile Picture Upload Fails**
   - Check file size limits
   - Verify supported file formats
   - Ensure backend endpoint is configured

2. **Tab Content Not Loading**
   - Verify route protection
   - Check component imports
   - Ensure API endpoints are available

3. **Chatbot Not Responding**
   - Check console for JavaScript errors
   - Verify component is properly mounted
   - Test with simple messages first

4. **Mobile Layout Issues**
   - Check Tailwind breakpoint classes
   - Verify touch event handlers
   - Test on actual devices

### Debug Mode
Enable debug logging:
```javascript
// Add to component for debugging
console.log('Current tab:', activeTab);
console.log('User data:', user);
console.log('Profile data:', profileData);
```

## Support

For issues or questions regarding the Guest Profile Dashboard implementation, please refer to:
- Component documentation in the code comments
- API documentation for backend endpoints
- Tailwind CSS documentation for styling
- Framer Motion documentation for animations

---

**Implementation Status**: ✅ Complete
**Last Updated**: October 24, 2025
**Version**: 1.0.0
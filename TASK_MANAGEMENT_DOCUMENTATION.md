# Hotel Task Management System Documentation

## Overview

This Hotel Task Management System is designed for hotel managers to efficiently assign and track tasks across different departments (Kitchen, Services, Maintenance, and Cleaning). The system provides comprehensive task management, staff coordination, feedback mechanisms, and detailed reporting.

## System Architecture

### Backend Structure
```
backend/
├── models/
│   ├── Task.js                 # Main task model with guest requests
│   ├── TaskFeedback.js         # Feedback system between roles
│   └── profiles/
│       └── StaffProfile.js     # Extended for task assignments
├── controllers/
│   └── manager/
│       ├── newTaskController.js    # Task CRUD operations
│       ├── feedbackController.js   # Feedback management
│       └── reportController.js     # Analytics and reporting
├── routes/
│   └── taskManagement.js       # All task management routes
└── services/
    └── taskManagementAPI.js    # API service layer
```

### Frontend Structure
```
frontend/src/
├── pages/
│   ├── manager/
│   │   ├── ManagerTaskDashboard.jsx  # Manager overview dashboard
│   │   ├── TaskAssignPage.jsx        # Task assignment interface
│   │   └── FeedbackPage.jsx          # Feedback management
│   └── staff/
│       └── StaffTasks.jsx            # Staff task interface
├── services/
│   └── taskManagementAPI.js          # Frontend API service
└── App.jsx                           # Updated with new routes
```

## API Endpoints

### Base URL: `/api/task-management`

### Task Management Endpoints

#### GET `/tasks`
**Description:** Get all tasks with filtering and pagination  
**Access:** Manager, Admin  
**Query Parameters:**
- `status` - Filter by task status (pending, assigned, in-progress, completed)
- `department` - Filter by department (Kitchen, Services, Maintenance, Cleaning)
- `assignedTo` - Filter by assigned staff member ID
- `priority` - Filter by priority (low, medium, high, critical)
- `startDate` - Filter tasks created after this date
- `endDate` - Filter tasks created before this date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50,
      "limit": 10
    }
  }
}
```

#### GET `/tasks/:id`
**Description:** Get single task by ID  
**Access:** Manager, Staff, Admin  
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "task_id",
    "title": "Room cleaning request",
    "description": "Clean room 205",
    "type": "cleaning",
    "priority": "medium",
    "status": "assigned",
    "guestId": "guest_id",
    "guestName": "John Doe",
    "roomNumber": "205",
    "department": "Cleaning",
    "assignedTo": {...},
    "assignedBy": {...},
    "createdAt": "2024-01-01T00:00:00Z",
    "dueDate": "2024-01-01T12:00:00Z"
  }
}
```

#### POST `/tasks`
**Description:** Create new task  
**Access:** Manager, Admin  
**Request Body:**
```json
{
  "title": "Room service request",
  "description": "Deliver food to room 305",
  "type": "food",
  "priority": "medium",
  "guestId": "guest_id",
  "guestName": "Jane Smith",
  "roomNumber": "305",
  "guestPhone": "+1234567890",
  "department": "Services",
  "dueDate": "2024-01-01T14:00:00Z",
  "estimatedDuration": 30,
  "notes": "Guest requested extra towels",
  "attachments": ["https://example.com/image.jpg"]
}
```

#### PUT `/tasks/:id/assign`
**Description:** Assign task to staff member  
**Access:** Manager, Admin  
**Request Body:**
```json
{
  "staffId": "staff_member_id",
  "notes": "Please prioritize this task"
}
```

#### PUT `/tasks/:id/status`
**Description:** Update task status  
**Access:** Staff, Manager, Admin  
**Request Body:**
```json
{
  "status": "completed",
  "notes": "Task completed successfully",
  "completionNotes": "Room cleaned thoroughly",
  "completionAttachments": ["https://example.com/completed.jpg"]
}
```

#### GET `/tasks/staff/:department`
**Description:** Get available staff for department  
**Access:** Manager, Admin  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "staff_id",
      "name": "John Worker",
      "email": "john@hotel.com",
      "phone": "+1234567890",
      "department": "Cleaning",
      "position": "Housekeeper"
    }
  ]
}
```

#### GET `/tasks/my-tasks`
**Description:** Get tasks assigned to current staff member  
**Access:** Staff  
**Query Parameters:**
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

#### DELETE `/tasks/:id`
**Description:** Delete task (soft delete)  
**Access:** Manager, Admin

#### GET `/tasks/stats`
**Description:** Get task statistics  
**Access:** Manager, Admin  
**Query Parameters:**
- `startDate` - Start date for statistics
- `endDate` - End date for statistics
- `department` - Department filter

### Feedback Management Endpoints

#### POST `/feedback`
**Description:** Create new feedback  
**Access:** All authenticated users  
**Request Body:**
```json
{
  "taskId": "task_id",
  "feedbackType": "staff-to-manager",
  "toUser": "user_id",
  "subject": "Task completion update",
  "message": "Task completed successfully with minor issues",
  "rating": 4,
  "priority": "medium",
  "attachments": ["https://example.com/feedback.jpg"]
}
```

#### GET `/feedback/task/:taskId`
**Description:** Get all feedback for a task  
**Access:** Manager, Admin, or users involved in the task

#### GET `/feedback/my-feedback`
**Description:** Get feedback for current user  
**Access:** All authenticated users  
**Query Parameters:**
- `type` - 'received' or 'sent' (default: received)
- `page` - Page number
- `limit` - Items per page

#### PUT `/feedback/:id/read`
**Description:** Mark feedback as read  
**Access:** Recipient of the feedback

#### GET `/feedback/unread-count`
**Description:** Get unread feedback count  
**Access:** All authenticated users

#### POST `/feedback/:id/reply`
**Description:** Reply to feedback  
**Access:** All authenticated users  
**Request Body:**
```json
{
  "subject": "Re: Task completion update",
  "message": "Thank you for the update",
  "priority": "medium"
}
```

#### DELETE `/feedback/:id`
**Description:** Delete feedback  
**Access:** Author of feedback or Manager/Admin

#### GET `/feedback/stats`
**Description:** Get feedback statistics  
**Access:** Manager, Admin

### Reporting Endpoints

#### GET `/reports/tasks`
**Description:** Get comprehensive task reports  
**Access:** Manager, Admin  
**Query Parameters:**
- `startDate` - Report start date
- `endDate` - Report end date
- `department` - Department filter
- `staffId` - Staff member filter
- `reportType` - Type of report (overview, performance, department, staff, guest-satisfaction)

#### GET `/reports/workload`
**Description:** Get staff workload report  
**Access:** Manager, Admin  
**Query Parameters:**
- `department` - Department filter
- `startDate` - Report start date
- `endDate` - Report end date

#### GET `/reports/delayed`
**Description:** Get delayed tasks report  
**Access:** Manager, Admin  
**Query Parameters:**
- `department` - Department filter
- `severity` - Delay severity (critical, high, medium, low, all)

#### GET `/reports/export`
**Description:** Export report data  
**Access:** Manager, Admin  
**Query Parameters:**
- `type` - Report type (tasks, workload, delayed)
- `format` - Export format (json, csv, excel)

## Data Models

### Task Model
```javascript
{
  title: String,              // Task title
  description: String,        // Task description
  type: String,              // food, maintenance, cleaning, services, other
  priority: String,          // low, medium, high, critical
  guestId: ObjectId,         // Reference to guest
  guestName: String,         // Guest name
  roomNumber: String,        // Room number
  guestPhone: String,        // Guest phone (optional)
  assignedTo: ObjectId,      // Reference to staff member
  assignedBy: ObjectId,      // Reference to manager
  department: String,        // Kitchen, Services, Maintenance, Cleaning
  status: String,           // pending, assigned, in-progress, completed, cancelled
  requestedAt: Date,        // When task was requested
  assignedAt: Date,         // When task was assigned
  startedAt: Date,          // When staff started working
  completedAt: Date,        // When task was completed
  dueDate: Date,           // Task due date
  notes: {
    manager: String,        // Manager notes
    staff: String          // Staff notes
  },
  estimatedDuration: Number, // In minutes
  actualDuration: Number,   // In minutes
  attachments: [String],    // URLs to attachments
  completionNotes: String,  // Notes when completed
  completionAttachments: [String], // Completion attachments
  guestRating: Number,      // Guest satisfaction (1-5)
  guestFeedback: String,    // Guest feedback
  isActive: Boolean,        // Soft delete flag
  tags: [String]           // Custom tags
}
```

### TaskFeedback Model
```javascript
{
  taskId: ObjectId,         // Reference to task
  feedbackType: String,     // manager-to-staff, staff-to-manager, etc.
  fromUser: ObjectId,       // Who sent the feedback
  fromUserRole: String,     // Role of sender
  toUser: ObjectId,         // Who receives the feedback
  toUserRole: String,       // Role of recipient
  subject: String,          // Feedback subject
  message: String,          // Feedback message
  rating: Number,           // Rating (1-5, optional)
  isRead: Boolean,          // Read status
  readAt: Date,            // When it was read
  hasResponse: Boolean,     // Has a reply
  responseId: ObjectId,     // Reference to reply
  parentFeedbackId: ObjectId, // Reference to original feedback
  priority: String,         // low, medium, high, urgent
  attachments: [String],    // URLs to attachments
  isActive: Boolean,        // Soft delete flag
}
```

## User Roles and Permissions

### Manager
- Create tasks for guest requests
- Assign tasks to staff members
- View all tasks and their status
- Access comprehensive reports
- Manage feedback
- Track staff performance

### Staff
- View assigned tasks
- Update task status
- Send feedback to managers
- View task history
- Report task completion

### Admin
- All manager permissions
- System-wide access
- User management
- Advanced reporting

### Guest
- Rate completed tasks
- Provide feedback
- View their request history

## Frontend Routes

### Manager Routes
- `/manager/tasks/dashboard` - Main task dashboard
- `/manager/tasks/assign` - Task assignment interface
- `/manager/tasks/feedback` - Feedback management
- `/manager/tasks/reports` - Reporting dashboard

### Staff Routes
- `/staff/tasks` - Staff task interface

## Key Features

### Task Management
1. **Guest Request Handling**: Convert guest requests into trackable tasks
2. **Department-based Assignment**: Assign tasks to appropriate departments
3. **Priority Management**: Set and track task priorities
4. **Status Tracking**: Track tasks from creation to completion
5. **Due Date Management**: Set and monitor task deadlines

### Staff Coordination
1. **Automated Assignment**: Assign tasks to available staff
2. **Workload Balancing**: Monitor staff workload
3. **Real-time Updates**: Instant status updates
4. **Communication**: Built-in feedback system

### Feedback System
1. **Multi-directional Communication**: Manager ↔ Staff ↔ Guest
2. **Rating System**: Guest satisfaction ratings
3. **Threaded Conversations**: Reply to feedback
4. **Notification System**: Real-time notifications

### Reporting & Analytics
1. **Performance Metrics**: Task completion rates and times
2. **Department Analysis**: Department-wise performance
3. **Staff Performance**: Individual staff metrics
4. **Guest Satisfaction**: Satisfaction trends and ratings
5. **Workload Reports**: Staff workload distribution

## Installation & Setup

### Backend Setup
1. Ensure MongoDB is running
2. Add the new routes to your server.js:
```javascript
import taskManagementRoutes from "./routes/taskManagement.js";
app.use("/api/task-management", taskManagementRoutes);
```

### Frontend Setup
1. The new pages are automatically included in App.jsx
2. Install any missing dependencies
3. Update navigation menus to include new routes

## Usage Examples

### Creating a Task (Manager)
1. Navigate to `/manager/tasks/dashboard`
2. Click "Create Task"
3. Fill in guest information and task details
4. Select appropriate department and priority
5. Optionally assign to specific staff member

### Assigning Tasks (Manager)
1. Navigate to `/manager/tasks/assign`
2. Filter tasks by status, department, or priority
3. Select tasks to assign
4. Choose staff members from available pool
5. Add assignment notes if needed

### Managing Tasks (Staff)
1. Navigate to `/staff/tasks`
2. View assigned tasks in Kanban or list view
3. Click on task to view details
4. Update status as work progresses
5. Add completion notes when finishing

### Handling Feedback
1. Both managers and staff can send feedback
2. Feedback is linked to specific tasks
3. Real-time notifications for new feedback
4. Reply functionality for conversations

## Best Practices

### Task Creation
- Provide clear, descriptive titles
- Include all relevant guest information
- Set realistic due dates
- Choose appropriate priority levels

### Task Assignment
- Consider staff workload and availability
- Match tasks to staff expertise
- Provide clear assignment notes
- Monitor task progress regularly

### Feedback Management
- Respond to feedback promptly
- Use appropriate priority levels
- Keep communications professional
- Document important decisions

### Reporting
- Review reports regularly
- Identify performance trends
- Address bottlenecks quickly
- Use data for staff development

## Troubleshooting

### Common Issues
1. **Tasks not showing**: Check user permissions and filters
2. **Assignment failures**: Verify staff availability and department matching
3. **Feedback not loading**: Check authentication and user roles
4. **Report errors**: Verify date ranges and parameters

### Performance Optimization
- Use pagination for large datasets
- Implement proper indexing
- Cache frequently accessed data
- Optimize database queries

## Future Enhancements

1. **Mobile App**: Dedicated mobile app for staff
2. **Real-time Notifications**: WebSocket implementation
3. **Advanced Analytics**: Predictive analytics and insights
4. **Integration**: Hotel management system integration
5. **Automation**: AI-powered task assignment
6. **Multi-language**: Internationalization support
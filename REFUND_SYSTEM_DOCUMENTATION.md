# Hotel Management System - Refund Processing Implementation

## Overview

This document provides comprehensive documentation for the refund processing system implemented in the Hotel Management System. The system provides end-to-end refund management with PayHere payment gateway integration, comprehensive validation, and automated notifications.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Business Rules](#business-rules)
5. [Frontend Interface](#frontend-interface)
6. [Payment Gateway Integration](#payment-gateway-integration)
7. [Notification System](#notification-system)
8. [Error Handling](#error-handling)
9. [Security](#security)
10. [Installation Guide](#installation-guide)
11. [Usage Instructions](#usage-instructions)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)

## System Architecture

### High-Level Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   PayHere       │
│   React App     │◄──►│   Node.js API    │◄──►│   Gateway       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   MongoDB        │
                       │   Database       │
                       └──────────────────┘
```

### Core Services

- **AdminService**: Core refund management operations
- **PaymentService**: PayHere payment gateway integration
- **ValidationService**: Business rules and validation
- **NotificationService**: Email and in-app notifications
- **ErrorHandler**: Comprehensive error management

## Database Schema

### RefundRequest Collection

```javascript
{
  _id: ObjectId,
  bookingId: ObjectId,          // Reference to Booking
  guestId: ObjectId,            // Reference to User (guest)
  invoiceId: ObjectId,          // Reference to Invoice
  amount: Number,               // Refund amount
  currency: String,             // Currency code (default: LKR)
  reason: String,               // Refund reason
  evidence: [{                  // Supporting evidence
    type: String,               // receipt, email, document, photo, other
    description: String,
    fileUrl: String,
    uploadedAt: Date
  }],
  status: String,               // pending, approved, denied, processed, failed, info_requested
  
  // Approval fields
  approvedBy: ObjectId,         // Admin who approved
  approvedAt: Date,
  
  // Denial fields
  deniedBy: ObjectId,           // Admin who denied
  deniedAt: Date,
  denialReason: String,
  
  // Info request fields
  infoRequestedBy: ObjectId,    // Admin who requested info
  infoRequestedAt: Date,
  infoRequested: String,
  
  // Processing fields
  processedAt: Date,
  paymentGatewayRef: String,    // PayHere transaction reference
  failureReason: String,
  gatewayResponse: Object,      // Full gateway response
  
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Admin Refund Management

#### Get Pending Refunds
```http
GET /api/admin/refunds/pending
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "refund_id",
      "bookingId": {
        "bookingNumber": "BK001"
      },
      "guestId": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 15000,
      "currency": "LKR",
      "reason": "Medical emergency",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Get Refund Details
```http
GET /api/admin/refunds/:id
Authorization: Bearer <admin_token>
```

#### Approve Refund
```http
POST /api/admin/refunds/:id/approve
Authorization: Bearer <admin_token>
Content-Type: application/json
```

#### Deny Refund
```http
POST /api/admin/refunds/:id/deny
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Refund policy violation - booking was made 6 months ago"
}
```

#### Request More Information
```http
POST /api/admin/refunds/:id/request-info
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "message": "Please provide proof of medical emergency"
}
```

#### Process Refund
```http
POST /api/admin/payment-gateway/refund
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "id": "refund_id",
  "originalPaymentId": "payhere_payment_id"
}
```

#### Check Refund Status
```http
GET /api/admin/refunds/:id/status
Authorization: Bearer <admin_token>
```

### Webhook Endpoints

#### PayHere Refund Webhook
```http
POST /api/webhooks/payhere/refund
Content-Type: application/json
X-PayHere-Signature: <webhook_signature>

{
  "refund_id": "payhere_refund_id",
  "status": "completed",
  "amount": "150.00",
  "currency": "LKR"
}
```

## Business Rules

### Refund Eligibility

1. **Time Window**: Refunds must be requested within 180 days of booking
2. **Booking Status**: Only confirmed, completed, or cancelled bookings are eligible
3. **Payment Status**: Only paid invoices can be refunded
4. **Amount Validation**: Refund amount cannot exceed original payment
5. **Duplicate Prevention**: Only one active refund per booking

### Approval Requirements

1. **Standard Refunds**: Approved by admin or manager
2. **High-Value Refunds**: Require manager approval (configurable threshold)
3. **Evidence Requirements**: Supporting documentation may be required
4. **Business Hours**: Warnings for out-of-hours processing

### Rate Limiting

1. **Guest Limits**: Maximum 3 refund requests per 24 hours
2. **Frequency Monitoring**: High-frequency guest detection
3. **Account Review**: Automatic flagging for review

## Frontend Interface

### Admin Refund Management Page

The admin interface provides comprehensive refund management capabilities:

#### Features

1. **Dashboard Statistics**
   - Total refunds count
   - Pending, approved, processed, denied counters
   - Real-time updates

2. **Advanced Search & Filtering**
   - Search by booking number, guest name, email, or reason
   - Filter by status (all, pending, approved, processed, denied)
   - Date range filtering

3. **Data Table**
   - Sortable columns
   - Status badges with color coding
   - Action buttons contextual to refund status

4. **Action Modals**
   - Approve refund confirmation
   - Deny refund with reason input
   - Request information with message
   - Process refund with payment ID input
   - View detailed refund information

#### Usage Instructions

1. **Accessing Refund Management**
   ```
   Navigate to Admin Panel → Refunds
   ```

2. **Reviewing Pending Refunds**
   - View all pending refunds in the main table
   - Click "View" to see detailed information including evidence
   - Use search to find specific refunds

3. **Approving Refunds**
   - Click "Approve" button for pending refunds
   - Confirm approval in modal dialog
   - System automatically sends approval notification to guest

4. **Denying Refunds**
   - Click "Deny" button for pending refunds
   - Provide detailed reason for denial (minimum 20 characters)
   - System sends denial notification with reason

5. **Requesting Additional Information**
   - Click "Request Info" for pending refunds
   - Specify what information is needed
   - Guest receives email with detailed request

6. **Processing Approved Refunds**
   - Click "Process" for approved refunds
   - Enter original PayHere payment ID
   - System processes refund through PayHere gateway

7. **Checking Status**
   - Click "Check Status" for processed refunds
   - View real-time status from PayHere

## Payment Gateway Integration

### PayHere Configuration

Add the following environment variables:

```env
# PayHere Configuration
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret
PAYHERE_API_URL=https://sandbox.payhere.lk/pay/api/v2
PAYHERE_API_TOKEN=your_api_token
PAYHERE_WEBHOOK_SECRET=your_webhook_secret
PAYHERE_IS_SANDBOX=true

# Production settings
# PAYHERE_API_URL=https://www.payhere.lk/pay/api/v2
# PAYHERE_IS_SANDBOX=false
```

### Webhook Setup

1. **Configure PayHere Webhook URL**
   ```
   https://your-domain.com/api/webhooks/payhere/refund
   ```

2. **Webhook Security**
   - HMAC signature validation
   - IP whitelist (recommended)
   - HTTPS required

## Notification System

### Email Templates

The system includes professional email templates for:

1. **Refund Request Submitted**: Confirmation to guest
2. **Refund Approved**: Approval notification with timeline
3. **Refund Denied**: Denial with reason and next steps
4. **Refund Processed**: Processing confirmation with transaction details
5. **Refund Failed**: Processing failure with support information
6. **Info Requested**: Request for additional information

### In-App Notifications

Matching in-app notifications provide instant alerts for all refund status changes.

### Template Customization

Templates can be customized by modifying the notification service:

```javascript
// backend/services/notification/refundNotificationService.js
await RefundNotificationService.initializeRefundTemplates();
```

## Error Handling

### Error Categories

1. **Validation Errors**: Business rule violations
2. **Payment Gateway Errors**: PayHere processing failures
3. **Database Errors**: MongoDB operation failures
4. **Permission Errors**: Authorization failures
5. **Rate Limit Errors**: Request frequency violations
6. **Timeout Errors**: Operation timeouts
7. **Notification Errors**: Email/SMS sending failures

### Error Response Format

```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "code": "REFUND_VALIDATION_FAILED",
    "details": {
      "field": "specific error details"
    }
  }
}
```

### Retry Logic

Certain errors are automatically retryable with exponential backoff:
- Payment gateway timeouts
- Network errors
- Temporary database issues

## Security

### Authentication & Authorization

1. **Role-Based Access**: Admin and manager roles for refund operations
2. **Permission System**: Granular permissions for different operations
3. **Token-Based Auth**: JWT tokens with proper expiration
4. **Session Management**: Secure session handling

### Data Protection

1. **Input Validation**: Comprehensive validation on all inputs
2. **SQL Injection Prevention**: Mongoose ODM protection
3. **XSS Prevention**: Input sanitization
4. **HTTPS Required**: Secure communication
5. **Audit Logging**: Complete audit trail

### Rate Limiting

1. **API Rate Limits**: Per-user request limiting
2. **Business Rule Limits**: Refund request frequency limits
3. **DDoS Protection**: Request throttling

## Installation Guide

### Prerequisites

- Node.js 16+ and npm
- MongoDB 4.4+
- PayHere merchant account
- Email service (SMTP)

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Migration**
   ```bash
   node backend/models/migration-js/migrate-refund-requests.js
   ```

4. **Initialize Templates**
   ```bash
   # Templates are auto-initialized on first run
   # Or manually run initialization
   node -e "import('./backend/services/notification/refundNotificationService.js').then(s => s.default.initializeRefundTemplates())"
   ```

5. **Start Server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Update API Configuration**
   ```javascript
   // frontend/src/services/api.js
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Usage Instructions

### For Administrators

#### Daily Operations

1. **Morning Routine**
   - Check pending refunds dashboard
   - Review overnight refund requests
   - Process urgent or high-value refunds

2. **Refund Review Process**
   - Verify booking details and eligibility
   - Check evidence provided by guest
   - Apply business rules consistently
   - Document denial reasons clearly

3. **Processing Guidelines**
   - Approve eligible refunds promptly
   - Request additional information when needed
   - Process approved refunds within 24 hours
   - Monitor failed transactions

#### Best Practices

1. **Communication**
   - Use professional, empathetic tone
   - Provide clear explanations for denials
   - Set realistic timeline expectations
   - Follow up on failed processing

2. **Documentation**
   - Maintain detailed refund logs
   - Document policy exceptions
   - Track resolution times
   - Monitor guest satisfaction

### For Managers

#### High-Value Refund Review

1. **Additional Verification**
   - Verify large refund amounts
   - Check for potential fraud
   - Review guest history
   - Approve or escalate as needed

2. **Policy Decisions**
   - Handle policy exception requests
   - Review denial appeals
   - Update business rules as needed
   - Monitor refund trends

## Testing

### Unit Tests

Test individual components:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Integration Tests

Test API endpoints:

```bash
# Run integration test suite
npm run test:integration
```

### Manual Testing Checklist

#### Refund Workflow Testing

1. **Submit Refund Request**
   - Valid booking refund request
   - Invalid booking attempt
   - Duplicate request prevention
   - Rate limiting verification

2. **Admin Actions**
   - Approve valid refund
   - Deny invalid refund
   - Request additional information
   - Process approved refund

3. **Payment Gateway**
   - Successful processing
   - Failed processing handling
   - Webhook processing
   - Status checking

4. **Notifications**
   - Email delivery
   - In-app notifications
   - Template rendering
   - Error handling

## Troubleshooting

### Common Issues

#### Refund Processing Failures

**Issue**: PayHere refund processing fails
**Solutions**:
1. Verify PayHere credentials
2. Check original payment ID format
3. Confirm payment is refundable
4. Review PayHere dashboard

#### Notification Delivery Issues

**Issue**: Emails not being sent
**Solutions**:
1. Check SMTP configuration
2. Verify email service status
3. Check spam/junk folders
4. Review email service logs

#### Permission Errors

**Issue**: Admin cannot access refund functions
**Solutions**:
1. Verify user role assignments
2. Check permission configuration
3. Refresh authentication token
4. Review role-based access setup

### Logging and Monitoring

#### Log Locations

```bash
# Application logs
./logs/app.log

# Error logs
./logs/error.log

# Refund-specific logs
grep "refund" ./logs/app.log
```

#### Key Metrics to Monitor

1. **Refund Processing Times**
2. **Success/Failure Rates**
3. **Payment Gateway Response Times**
4. **Notification Delivery Rates**
5. **Error Frequency by Type**

### Support Contacts

For technical issues:
- Email: tech-support@hotel.com
- Documentation: [Internal Wiki]
- Emergency: [On-call Number]

---

## Appendices

### Appendix A: Error Codes Reference

| Code | Description | Action Required |
|------|-------------|-----------------|
| REFUND_VALIDATION_FAILED | Input validation error | Fix input data |
| PAYMENT_GATEWAY_FAILED | PayHere processing error | Retry or contact PayHere |
| BUSINESS_RULE_VIOLATION | Policy violation | Review business rules |
| PERMISSION_DENIED | Insufficient privileges | Check user permissions |
| RATE_LIMIT_EXCEEDED | Too many requests | Wait before retrying |

### Appendix B: Configuration Reference

#### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hotel-management

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# PayHere
PAYHERE_MERCHANT_ID=merchant_id
PAYHERE_MERCHANT_SECRET=merchant_secret
PAYHERE_API_URL=api_url
PAYHERE_API_TOKEN=api_token

# Email
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASS=your-password

# Refund Settings
MAX_REFUND_WINDOW_DAYS=180
REQUIRE_MANAGER_APPROVAL_ABOVE=10000
DEFAULT_PROCESSING_TIME_HOURS=24
```

### Appendix C: Database Indexes

Recommended indexes for optimal performance:

```javascript
// RefundRequest collection indexes
db.refundrequests.createIndex({ "bookingId": 1 })
db.refundrequests.createIndex({ "guestId": 1 })
db.refundrequests.createIndex({ "status": 1 })
db.refundrequests.createIndex({ "createdAt": -1 })
db.refundrequests.createIndex({ "paymentGatewayRef": 1 })
```

---

*This documentation is maintained by the development team and updated with each release.*
# Food Review Feature

This feature allows guests to rate and review their food orders after delivery, providing valuable feedback for improving service quality.

## Features

1. **Post-Delivery Review Prompt**: Automatically shows a review modal to guests 5-10 minutes after order delivery
2. **Order Type Specific Questions**: Different rating categories for dine-in, takeaway, and room service
3. **Multi-Step Review Form**: Star ratings, text feedback, and optional photo uploads
4. **Real-time Analytics**: Admin dashboard for viewing review trends and low-score alerts
5. **Multilingual Support**: Review prompts and questions in Tamil, Sinhala, and English

## Implementation Details

### Backend

- **Model**: `FoodReview` schema for storing review data
- **Routes**: `/api/food-reviews` endpoints for submitting, fetching, and analyzing reviews
- **Workflow Integration**: Socket.io event emission when order status changes to "Delivered"

### Frontend

- **Component**: `ReviewModal` for collecting guest feedback
- **Integration**: Added to `FoodOrderHistory` and `FoodStatusTracker` components
- **Auto-trigger**: Review modal automatically appears when "showReview" Socket.io event is received

## API Endpoints

### Submit Review
```
POST /api/food-reviews/submit
```
Submit a food review for a delivered order.

### Fetch Review
```
GET /api/food-reviews/fetch/:orderId
```
Get a specific review by order ID.

### Analytics
```
GET /api/food-reviews/analytics
```
Get aggregated review analytics (admin only).

## Usage Flow

1. Guest places and receives food order
2. Kitchen staff updates order status to "Delivered"
3. Backend emits "showReview" Socket.io event to guest
4. Frontend automatically displays ReviewModal
5. Guest submits review with ratings and feedback
6. Review data is stored and used to update menu item ratings
7. Low scores trigger admin alerts via existing notification system

## Customization

- **Rating Categories**: Modify rating categories based on order type in `ReviewModal.jsx`
- **Timing**: Adjust auto-show delay in frontend components
- **Languages**: Update i18n translations for multilingual support
- **Incentives**: Add loyalty point integration in review submission handler

## Testing

Run unit tests:
```bash
npm test food-reviews
```

Integration tests are located in `__tests__/integration/`.
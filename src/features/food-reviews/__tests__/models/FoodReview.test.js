const mongoose = require('mongoose');
const FoodReview = require('../../models/FoodReview');

describe('FoodReview Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a food review with valid fields', async () => {
    const reviewData = {
      orderId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      orderType: 'dine-in',
      ratings: {
        food: {
          taste: 5,
          freshness: 4,
          presentation: 5
        },
        service: {
          staff: 5,
          speed: 4,
          ambiance: 5
        },
        overall: 4.5
      },
      feedback: 'Great food and service!',
      isAnonymous: false
    };

    const review = new FoodReview(reviewData);
    const savedReview = await review.save();

    expect(savedReview.orderId).toEqual(reviewData.orderId);
    expect(savedReview.userId).toEqual(reviewData.userId);
    expect(savedReview.orderType).toBe('dine-in');
    expect(savedReview.ratings.food.taste).toBe(5);
    expect(savedReview.ratings.service.staff).toBe(5);
    expect(savedReview.feedback).toBe('Great food and service!');
    expect(savedReview.isAnonymous).toBe(false);
    expect(savedReview).toHaveProperty('createdAt');
    expect(savedReview).toHaveProperty('updatedAt');
  });

  it('should fail to create a review with invalid overall rating', async () => {
    const reviewData = {
      orderId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      orderType: 'takeaway',
      ratings: {
        food: {
          taste: 5,
          freshness: 4,
          presentation: 5
        },
        service: {
          staff: 5,
          speed: 4,
          ambiance: 5
        },
        overall: 6 // Invalid rating (should be 1-5)
      },
      feedback: 'Great food and service!'
    };

    let err;
    try {
      const review = new FoodReview(reviewData);
      await review.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });

  it('should fail to create a review with missing required fields', async () => {
    const reviewData = {
      // Missing orderId, userId, orderType, and ratings
      feedback: 'Great food and service!'
    };

    let err;
    try {
      const review = new FoodReview(reviewData);
      await review.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });

  it('should enforce enum values for orderType', async () => {
    const reviewData = {
      orderId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      orderType: 'invalid-type', // Invalid order type
      ratings: {
        food: {
          taste: 5,
          freshness: 4,
          presentation: 5
        },
        service: {
          staff: 5,
          speed: 4,
          ambiance: 5
        },
        overall: 4.5
      },
      feedback: 'Great food and service!'
    };

    let err;
    try {
      const review = new FoodReview(reviewData);
      await review.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });

  it('should trim feedback to maximum length', async () => {
    const longFeedback = 'a'.repeat(600); // Exceeds max length of 500
    const reviewData = {
      orderId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      orderType: 'dine-in',
      ratings: {
        food: {
          taste: 5,
          freshness: 4,
          presentation: 5
        },
        service: {
          staff: 5,
          speed: 4,
          ambiance: 5
        },
        overall: 4.5
      },
      feedback: longFeedback
    };

    let err;
    try {
      const review = new FoodReview(reviewData);
      await review.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });
});
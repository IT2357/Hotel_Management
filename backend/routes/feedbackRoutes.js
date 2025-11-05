const express = require('express');
const { ensureAuth, ensureRole } = require('../middleware/authMiddleware');
const feedbackController = require('../controllers/feedbackController');

const router = express.Router();

router.use(ensureAuth, ensureRole('Guest'));

router.post('/submit', feedbackController.submitFeedback);

module.exports = router;
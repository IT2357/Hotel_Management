const express = require('express');
const { ensureAuth, ensureRole } = require('../middleware/authMiddleware');
const staffController = require('../controllers/staffController');

const router = express.Router();

router.use(ensureAuth, ensureRole('Staff'));

router.get('/assigned-tasks', staffController.getAssignedTasks);
router.post('/accept-task', staffController.acceptTask);

module.exports = router;
// backend/routes/messages.js
const router = require('express').Router();
const Message = require('../models/manager/Message');

// create message (staff → manager OR manager → staff)
router.post('/', async (req, res) => {
  try {
    const { staffId, senderId, senderRole, content } = req.body;
    const msg = await Message.create({ staffId, senderId, senderRole, content });
    // emit real-time event
    const io = req.app.locals.io;
    io.to('managers').emit('new_message', msg);
    io.to(`staff-${staffId}`).emit('new_message', msg);
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// get all messages (manager uses this and groups by staff on frontend)
router.get('/', async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// get messages for a specific staff (thread)
router.get('/staff/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const msgs = await Message.find({ staffId }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// mark message read
router.put('/:id/read', async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { readByManager: true }, { new: true });
    res.json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

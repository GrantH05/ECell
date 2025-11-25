const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');

// Admin middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

// @route   GET /api/events
// @desc    Get all upcoming events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ 
      status: 'upcoming',
      date: { $gte: new Date() }
    })
    .sort({ date: 1 })
    .limit(10);

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch events' 
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch event' 
    });
  }
});

// @route   POST /api/events
// @desc    Create new event (Admin only)
// @access  Private (Admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, date, time, venue, type, maxParticipants, imageUrl } = req.body;

    // Validation
    if (!title || !description || !date || !time || !venue) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      venue,
      type: type || 'other',
      maxParticipants: maxParticipants || 100,
      imageUrl,
      createdBy: req.user._id,
      status: 'upcoming'
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create event' 
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event (Admin only)
// @access  Private (Admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, date, time, venue, type, maxParticipants, status, imageUrl } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (time) event.time = time;
    if (venue) event.venue = venue;
    if (type) event.type = type;
    if (maxParticipants) event.maxParticipants = maxParticipants;
    if (status) event.status = status;
    if (imageUrl) event.imageUrl = imageUrl;

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update event' 
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event (Admin only)
// @access  Private (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete event' 
    });
  }
});

// @route   POST /api/events/:id/register
// @desc    Register for an event
// @access  Private
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }

    // Check if already registered
    if (event.registeredUsers.includes(user._id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already registered for this event' 
      });
    }

    // Check if event is full
    if (event.registeredUsers.length >= event.maxParticipants) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event is full' 
      });
    }

    // Register user
    event.registeredUsers.push(user._id);
    user.registeredEvents.push(event._id);

    await event.save();
    await user.save();

    res.json({
      success: true,
      message: 'Successfully registered for event',
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to register for event' 
    });
  }
});

module.exports = router;
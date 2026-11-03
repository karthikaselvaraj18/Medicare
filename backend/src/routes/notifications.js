const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/notifications
router.get('/', (req, res) => {
  try {
    const notifications = db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    return res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ message: 'Error retrieving notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notifId, req.user.id]
    );
    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification read:', err);
    return res.status(500).json({ message: 'Error updating notification status' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res) => {
  try {
    db.run(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    return res.status(500).json({ message: 'Error updating notifications' });
  }
});

module.exports = router;


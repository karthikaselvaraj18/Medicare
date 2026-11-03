const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/history
router.get('/', (req, res) => {
  try {
    const { status, date, search } = req.query;
    const userId = req.user.id;

    let sql = `
      SELECT h.*, m.medicine_name, m.category, m.led_pin
      FROM medicine_history h
      JOIN medicines m ON h.medicine_id = m.id
      WHERE h.user_id = ?
    `;
    const params = [userId];

    if (status && status !== 'all') {
      sql += ' AND h.status = ?';
      params.push(status);
    }

    if (date) {
      sql += ' AND h.reminder_date = ?';
      params.push(date);
    }

    if (search && search.trim()) {
      sql += ' AND m.medicine_name LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    sql += ' ORDER BY h.reminder_date DESC, h.scheduled_time DESC LIMIT 100';

    const records = db.all(sql, params);
    return res.json(records);
  } catch (err) {
    console.error('History route error:', err);
    return res.status(500).json({ message: 'Error retrieving medicine history' });
  }
});

module.exports = router;


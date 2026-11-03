const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { getTodayISTString, getDayOfWeekIST } = require('../utils/timeUtils');

router.use(authMiddleware);

// Helper to ensure today's history row exists for an active medicine
function syncTodayHistoryForMedicine(med, userId) {
  const today = getTodayISTString();
  const currentDayOfWeek = getDayOfWeekIST();

  let days = [];
  try {
    days = typeof med.repeat_days === 'string' ? JSON.parse(med.repeat_days) : (med.repeat_days || []);
  } catch (e) {
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  if (med.is_active && days.includes(currentDayOfWeek)) {
    const existing = db.get(
      'SELECT id FROM medicine_history WHERE medicine_id = ? AND reminder_date = ?',
      [med.id, today]
    );

    if (!existing) {
      db.run(
        `INSERT INTO medicine_history (medicine_id, user_id, reminder_date, scheduled_time, status)
         VALUES (?, ?, ?, ?, 'upcoming')`,
        [med.id, userId, today, med.scheduled_time]
      );
    }
  }
}

// GET /api/medicines
router.get('/', (req, res) => {
  try {
    const medicines = db.all(
      'SELECT * FROM medicines WHERE user_id = ? ORDER BY scheduled_time ASC',
      [req.user.id]
    );

    const formatted = medicines.map(m => {
      let repeatDays = [];
      try {
        repeatDays = JSON.parse(m.repeat_days);
      } catch (e) {
        repeatDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      }
      return {
        ...m,
        is_active: Boolean(m.is_active),
        repeat_days: repeatDays
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    return res.status(500).json({ message: 'Error fetching medicines' });
  }
});

// POST /api/medicines
router.post('/', (req, res) => {
  try {
    const {
      medicine_name,
      category = 'Morning',
      scheduled_time,
      repeat_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      instructions = '',
      is_active = true
    } = req.body;

    if (!medicine_name || !scheduled_time) {
      return res.status(400).json({ message: 'Medicine name and scheduled time are required' });
    }

    // Hardware mapping: D6 = Morning, D7 = Night
    let led_pin = 'N/A';
    if (category === 'Morning') led_pin = 'D6';
    else if (category === 'Night') led_pin = 'D7';

    const daysJson = JSON.stringify(Array.isArray(repeat_days) ? repeat_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

    const result = db.run(
      `INSERT INTO medicines (user_id, medicine_name, category, scheduled_time, repeat_days, instructions, is_active, led_pin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, medicine_name.trim(), category, scheduled_time, daysJson, instructions.trim(), is_active ? 1 : 0, led_pin]
    );

    const createdId = result.lastInsertRowid;
    const createdMed = db.get('SELECT * FROM medicines WHERE id = ?', [createdId]);

    // Ensure today's history row is present if active today
    syncTodayHistoryForMedicine(createdMed, req.user.id);

    return res.status(201).json({
      message: 'Medicine schedule created successfully',
      medicine: {
        ...createdMed,
        is_active: Boolean(createdMed.is_active),
        repeat_days: JSON.parse(createdMed.repeat_days)
      }
    });
  } catch (err) {
    console.error('Error creating medicine:', err);
    return res.status(500).json({ message: 'Failed to create medicine schedule' });
  }
});

// PUT /api/medicines/:id
router.put('/:id', (req, res) => {
  try {
    const medId = parseInt(req.params.id, 10);
    const existing = db.get('SELECT * FROM medicines WHERE id = ? AND user_id = ?', [medId, req.user.id]);

    if (!existing) {
      return res.status(404).json({ message: 'Medicine schedule not found' });
    }

    const {
      medicine_name = existing.medicine_name,
      category = existing.category,
      scheduled_time = existing.scheduled_time,
      repeat_days = existing.repeat_days,
      instructions = existing.instructions,
      is_active = existing.is_active
    } = req.body;

    let led_pin = 'N/A';
    if (category === 'Morning') led_pin = 'D6';
    else if (category === 'Night') led_pin = 'D7';

    const daysJson = typeof repeat_days === 'string' ? repeat_days : JSON.stringify(repeat_days);

    db.run(
      `UPDATE medicines
       SET medicine_name = ?, category = ?, scheduled_time = ?, repeat_days = ?, instructions = ?, is_active = ?, led_pin = ?
       WHERE id = ? AND user_id = ?`,
      [
        medicine_name.trim(),
        category,
        scheduled_time,
        daysJson,
        instructions ? instructions.trim() : '',
        is_active ? 1 : 0,
        led_pin,
        medId,
        req.user.id
      ]
    );

    const updated = db.get('SELECT * FROM medicines WHERE id = ?', [medId]);
    syncTodayHistoryForMedicine(updated, req.user.id);

    return res.json({
      message: 'Medicine updated successfully',
      medicine: {
        ...updated,
        is_active: Boolean(updated.is_active),
        repeat_days: JSON.parse(updated.repeat_days)
      }
    });
  } catch (err) {
    console.error('Error updating medicine:', err);
    return res.status(500).json({ message: 'Failed to update medicine schedule' });
  }
});

// DELETE /api/medicines/:id
router.delete('/:id', (req, res) => {
  try {
    const medId = parseInt(req.params.id, 10);
    const existing = db.get('SELECT id FROM medicines WHERE id = ? AND user_id = ?', [medId, req.user.id]);

    if (!existing) {
      return res.status(404).json({ message: 'Medicine schedule not found' });
    }

    db.run('DELETE FROM medicines WHERE id = ? AND user_id = ?', [medId, req.user.id]);
    return res.json({ message: 'Medicine schedule removed successfully' });
  } catch (err) {
    console.error('Error deleting medicine:', err);
    return res.status(500).json({ message: 'Failed to delete medicine schedule' });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const db = require('../config/database');
const deviceAuthMiddleware = require('../middleware/deviceAuth');
const telegramService = require('../services/telegramService');
const {
  getTodayISTString,
  getCurrentTimeISTString,
  getCurrentTimeWithSecondsISTString,
  getDayOfWeekIST
} = require('../utils/timeUtils');

router.use(deviceAuthMiddleware);

// GET /api/device/schedules
// ESP8266 periodically retrieves today's schedules
router.get('/schedules', (req, res) => {
  try {
    const userId = req.userId;
    const today = getTodayISTString();
    const currentDayOfWeek = getDayOfWeekIST();
    const user = db.get('SELECT reminder_timeout_seconds FROM users WHERE id = ?', [userId]);
    const timeoutSeconds = user?.reminder_timeout_seconds || 20;

    // Get all active medicines
    const medicines = db.all('SELECT * FROM medicines WHERE user_id = ? AND is_active = 1', [userId]);

    const todaySchedules = [];

    for (const med of medicines) {
      let days = [];
      try {
        days = typeof med.repeat_days === 'string' ? JSON.parse(med.repeat_days) : (med.repeat_days || []);
      } catch (e) {
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      }

      if (days.includes(currentDayOfWeek)) {
        // Ensure row in history exists
        let history = db.get(
          'SELECT * FROM medicine_history WHERE medicine_id = ? AND reminder_date = ?',
          [med.id, today]
        );

        if (!history) {
          db.run(
            `INSERT INTO medicine_history (medicine_id, user_id, reminder_date, scheduled_time, status)
             VALUES (?, ?, ?, ?, 'upcoming')`,
            [med.id, userId, today, med.scheduled_time]
          );
          history = db.get(
            'SELECT * FROM medicine_history WHERE medicine_id = ? AND reminder_date = ?',
            [med.id, today]
          );
        }

        todaySchedules.push({
          history_id: history.id,
          medicine_id: med.id,
          medicine_name: med.medicine_name,
          category: med.category,
          scheduled_time: med.scheduled_time,
          led_pin: med.led_pin || (med.category === 'Morning' ? 'D6' : 'D7'),
          status: history.status,
          timeout_seconds: timeoutSeconds
        });
      }
    }

    return res.json({
      server_time_ist: getCurrentTimeWithSecondsISTString(),
      current_time: getCurrentTimeISTString(),
      today_date: today,
      timeout_seconds: timeoutSeconds,
      schedules: todaySchedules
    });
  } catch (err) {
    console.error('Device schedules error:', err);
    return res.status(500).json({ error: 'Failed to retrieve schedules' });
  }
});

// POST /api/device/events
// ESP8266 reports button press or timeout
router.post('/events', async (req, res) => {
  try {
    const userId = req.userId;
    const { event_type, medicine_id, category, history_id } = req.body;
    const today = getTodayISTString();

    if (!event_type) {
      return res.status(400).json({ error: 'event_type is required ("confirmed", "missed", or "active")' });
    }

    // Locate target history row
    let history = null;
    if (history_id) {
      history = db.get('SELECT * FROM medicine_history WHERE id = ?', [history_id]);
    } else if (medicine_id) {
      history = db.get(
        'SELECT * FROM medicine_history WHERE medicine_id = ? AND reminder_date = ?',
        [medicine_id, today]
      );
    } else if (category) {
      history = db.get(
        `SELECT h.* FROM medicine_history h
         JOIN medicines m ON h.medicine_id = m.id
         WHERE h.user_id = ? AND h.reminder_date = ? AND m.category = ?
         ORDER BY h.id DESC LIMIT 1`,
        [userId, today, category]
      );
    } else {
      // Find the currently active or nearest pending reminder
      history = db.get(
        `SELECT * FROM medicine_history 
         WHERE user_id = ? AND reminder_date = ? AND (status = 'active' OR status = 'upcoming')
         ORDER BY scheduled_time ASC LIMIT 1`,
        [userId, today]
      );
    }

    if (!history) {
      return res.status(404).json({ error: 'No applicable medicine schedule found for event' });
    }

    const med = db.get('SELECT * FROM medicines WHERE id = ?', [history.medicine_id]);
    const user = db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const patient = db.get('SELECT * FROM patients WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);

    if (event_type === 'confirmed') {
      db.run(
        `UPDATE medicine_history
         SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [history.id]
      );

      // Notification
      db.run(
        `INSERT INTO notifications (user_id, type, title, message, medicine_history_id)
         VALUES (?, 'confirmed', 'Medicine Confirmed', ?, ?)`,
        [
          userId,
          `Patient confirmed dose for "${med?.medicine_name || 'Scheduled Medicine'}" (${med?.category || 'Reminder'}).`,
          history.id
        ]
      );

      return res.json({
        success: true,
        message: 'Confirmation successfully registered',
        status: 'confirmed'
      });
    } else if (event_type === 'missed') {
      db.run(
        `UPDATE medicine_history
         SET status = 'missed', missed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [history.id]
      );

      // Create missed notification
      db.run(
        `INSERT INTO notifications (user_id, type, title, message, medicine_history_id)
         VALUES (?, 'missed', 'MISSED MEDICINE ALERT', ?, ?)`,
        [
          userId,
          `Patient did not confirm "${med?.medicine_name || 'Scheduled Medicine'}" scheduled at ${history.scheduled_time}. Buzzer timed out.`,
          history.id
        ]
      );

      // Trigger Telegram push alert if not already sent
      if (!history.telegram_sent) {
        const chatId = user?.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;
        if (chatId) {
          await telegramService.sendMissedMedicineAlert({
            chatId,
            patientName: patient?.patient_name || 'Patient',
            medicineName: med?.medicine_name || 'Scheduled Medicine',
            scheduledTime: history.scheduled_time
          });

          db.run('UPDATE medicine_history SET telegram_sent = 1 WHERE id = ?', [history.id]);
        }
      }

      return res.json({
        success: true,
        message: 'Missed reminder recorded and alert triggered',
        status: 'missed'
      });
    } else if (event_type === 'active') {
      db.run('UPDATE medicine_history SET status = \'active\' WHERE id = ?', [history.id]);
      return res.json({ success: true, status: 'active' });
    }

    return res.status(400).json({ error: 'Unknown event_type' });
  } catch (err) {
    console.error('Device events error:', err);
    return res.status(500).json({ error: 'Failed to process hardware event' });
  }
});

// GET /api/device/status
router.get('/status', (req, res) => {
  return res.json({
    device_online: true,
    server_time: getCurrentTimeWithSecondsISTString(),
    date: getTodayISTString()
  });
});

module.exports = router;


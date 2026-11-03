const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { getTodayISTString, getCurrentTimeISTString, getDayOfWeekIST } = require('../utils/timeUtils');

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayISTString();
    const currentTime = getCurrentTimeISTString();
    const dayOfWeek = getDayOfWeekIST();

    // 1. Patient Info
    const patient = db.get('SELECT * FROM patients WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]) || {};

    // 2. Sync Today's History for active medicines
    const allActiveMedicines = db.all('SELECT * FROM medicines WHERE user_id = ? AND is_active = 1', [userId]);
    for (const med of allActiveMedicines) {
      let days = [];
      try {
        days = typeof med.repeat_days === 'string' ? JSON.parse(med.repeat_days) : (med.repeat_days || []);
      } catch (e) {
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      }

      if (days.includes(dayOfWeek)) {
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

    // 3. Today's History items
    const todayRecords = db.all(
      `SELECT h.*, m.medicine_name, m.category, m.led_pin
       FROM medicine_history h
       JOIN medicines m ON h.medicine_id = m.id
       WHERE h.user_id = ? AND h.reminder_date = ?
       ORDER BY h.scheduled_time ASC`,
      [userId, today]
    );

    const totalScheduled = todayRecords.length;
    const confirmedCount = todayRecords.filter(r => r.status === 'confirmed').length;
    const missedCount = todayRecords.filter(r => r.status === 'missed').length;
    const upcomingCount = todayRecords.filter(r => r.status === 'upcoming' || r.status === 'active').length;

    // 4. Weekly stats
    const weekStats = db.get(
      `SELECT 
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as week_confirmed,
         COUNT(CASE WHEN status = 'missed' THEN 1 END) as week_missed
       FROM medicine_history
       WHERE user_id = ? AND reminder_date >= date('now', '-7 days')`,
      [userId]
    ) || { week_confirmed: 0, week_missed: 0 };

    // 5. Morning & Night Status
    const morningRecord = todayRecords.find(r => r.category === 'Morning');
    const nightRecord = todayRecords.find(r => r.category === 'Night');

    const morningStatus = morningRecord ? morningRecord.status : 'upcoming';
    const nightStatus = nightRecord ? nightRecord.status : 'upcoming';

    // 6. Next Reminder
    const nextReminder = todayRecords.find(
      r => (r.status === 'upcoming' || r.status === 'active') && r.scheduled_time >= currentTime
    ) || todayRecords.find(r => r.status === 'upcoming' || r.status === 'active') || null;

    // 7. Device Online Status
    // Considered online if pinged within the last 45 seconds
    const device = db.get(
      `SELECT *, (strftime('%s', 'now') - strftime('%s', last_seen)) as seconds_ago 
       FROM devices WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    const isDeviceOnline = Boolean(device && device.last_seen && device.seconds_ago !== null && device.seconds_ago < 45);

    // 8. Telegram configured status
    const isTelegramConfigured = Boolean(req.user.telegram_chat_id && req.user.telegram_chat_id.trim().length > 0);

    // 9. Recent Activity (last 10 events)
    const recentActivity = db.all(
      `SELECT h.*, m.medicine_name, m.category, m.led_pin
       FROM medicine_history h
       JOIN medicines m ON h.medicine_id = m.id
       WHERE h.user_id = ?
       ORDER BY h.reminder_date DESC, h.scheduled_time DESC
       LIMIT 10`,
      [userId]
    );

    return res.json({
      patient: {
        patient_name: patient.patient_name || '',
        patient_age: patient.patient_age || '',
        patient_contact: patient.patient_contact || ''
      },
      stats: {
        total: totalScheduled,
        confirmed: confirmedCount,
        missed: missedCount,
        upcoming: upcomingCount,
        week_confirmed: weekStats.week_confirmed || 0,
        week_missed: weekStats.week_missed || 0
      },
      morning_status: morningStatus,
      night_status: nightStatus,
      next_reminder: nextReminder,
      device_online: isDeviceOnline,
      telegram_configured: isTelegramConfigured,
      recent_activity: recentActivity
    });
  } catch (err) {
    console.error('Dashboard route error:', err);
    return res.status(500).json({ message: 'Error retrieving dashboard analytics' });
  }
});

module.exports = router;


const cron = require('node-cron');
const db = require('../config/database');
const telegramService = require('./telegramService');
const {
  getISTDate,
  getTodayISTString,
  getCurrentTimeISTString,
  getDayOfWeekIST
} = require('../utils/timeUtils');

class SchedulerService {
  start() {
    console.log('[Scheduler] Background Missed-Reminder Checker initialized (every 10s)');

    // Run every 10 seconds
    cron.schedule('*/10 * * * * *', async () => {
      try {
        await this.checkReminders();
      } catch (err) {
        console.error('[Scheduler] Error during reminder evaluation:', err.message);
      }
    });
  }

  async checkReminders() {
    const today = getTodayISTString();
    const currentTime = getCurrentTimeISTString();
    const istNow = getISTDate();
    const currentDayOfWeek = getDayOfWeekIST();

    // 1. Sync any missing history rows for active medicines today
    const activeMedicines = db.all('SELECT * FROM medicines WHERE is_active = 1');
    for (const med of activeMedicines) {
      let days = [];
      try {
        days = typeof med.repeat_days === 'string' ? JSON.parse(med.repeat_days) : (med.repeat_days || []);
      } catch (e) {
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      }

      if (days.includes(currentDayOfWeek)) {
        const existing = db.get(
          'SELECT id FROM medicine_history WHERE medicine_id = ? AND reminder_date = ?',
          [med.id, today]
        );
        if (!existing) {
          db.run(
            `INSERT INTO medicine_history (medicine_id, user_id, reminder_date, scheduled_time, status)
             VALUES (?, ?, ?, ?, 'upcoming')`,
            [med.id, med.user_id, today, med.scheduled_time]
          );
        }
      }
    }

    // 2. Transition upcoming reminders to 'active' once scheduled_time is reached
    const dueReminders = db.all(
      `SELECT h.*, m.medicine_name, m.category, u.reminder_timeout_seconds
       FROM medicine_history h
       JOIN medicines m ON h.medicine_id = m.id
       JOIN users u ON h.user_id = u.id
       WHERE h.reminder_date = ? AND h.status = 'upcoming' AND h.scheduled_time <= ?`,
      [today, currentTime]
    );

    for (const reminder of dueReminders) {
      db.run('UPDATE medicine_history SET status = \'active\' WHERE id = ?', [reminder.id]);
      console.log(`[Scheduler] Reminder is now ACTIVE: "${reminder.medicine_name}" (${reminder.category}) scheduled at ${reminder.scheduled_time}`);
    }

    // 3. Check all 'active' reminders for timeout (Missed condition)
    const activeReminders = db.all(
      `SELECT h.*, m.medicine_name, m.category, u.telegram_chat_id, u.reminder_timeout_seconds
       FROM medicine_history h
       JOIN medicines m ON h.medicine_id = m.id
       JOIN users u ON h.user_id = u.id
       WHERE h.reminder_date = ? AND h.status = 'active'`,
      [today]
    );

    for (const reminder of activeReminders) {
      // Calculate elapsed seconds since scheduled_time today
      const [schedHours, schedMins] = reminder.scheduled_time.split(':').map(Number);
      const scheduledDate = getISTDate();
      scheduledDate.setHours(schedHours, schedMins, 0, 0);

      const elapsedSeconds = Math.floor((istNow.getTime() - scheduledDate.getTime()) / 1000);
      const timeoutLimit = reminder.reminder_timeout_seconds || 20;

      if (elapsedSeconds >= timeoutLimit) {
        console.warn(`[Scheduler] ⚠️ TIMEOUT REACHED for "${reminder.medicine_name}" (${elapsedSeconds}s >= ${timeoutLimit}s). Marking as MISSED.`);

        // Mark as missed
        db.run(
          `UPDATE medicine_history
           SET status = 'missed', missed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [reminder.id]
        );

        // Fetch patient name
        const patient = db.get('SELECT patient_name FROM patients WHERE user_id = ? ORDER BY id DESC LIMIT 1', [reminder.user_id]);

        // Add Notification
        db.run(
          `INSERT INTO notifications (user_id, type, title, message, medicine_history_id)
           VALUES (?, 'missed', 'MISSED MEDICINE ALERT', ?, ?)`,
          [
            reminder.user_id,
            `Patient missed "${reminder.medicine_name}" (${reminder.category}) scheduled at ${reminder.scheduled_time}. Confirmation button was not pressed within ${timeoutLimit}s.`,
            reminder.id
          ]
        );

        // Trigger Telegram Alert (if not already sent)
        if (!reminder.telegram_sent) {
          const targetChatId = reminder.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;
          if (targetChatId) {
            console.log(`[Scheduler] 📲 Dispatching Telegram Missed Alert to Chat ID: ${targetChatId}`);
            const result = await telegramService.sendMissedMedicineAlert({
              chatId: targetChatId,
              patientName: patient?.patient_name || 'Patient',
              medicineName: reminder.medicine_name,
              scheduledTime: reminder.scheduled_time
            });

            if (result.success) {
              console.log('[Scheduler] ✅ Telegram alert delivered successfully');
            } else {
              console.error('[Scheduler] ❌ Telegram delivery failed:', result.error);
            }
          } else {
            console.warn('[Scheduler] No Telegram Chat ID set for user. Alert not sent.');
          }

          db.run('UPDATE medicine_history SET telegram_sent = 1 WHERE id = ?', [reminder.id]);
        }
      }
    }
  }
}

module.exports = new SchedulerService();


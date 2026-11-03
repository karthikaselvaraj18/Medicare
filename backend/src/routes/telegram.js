const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const telegramService = require('../services/telegramService');

router.use(authMiddleware);

// POST /api/telegram/test
router.post('/test', async (req, res) => {
  try {
    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const patient = db.get('SELECT patient_name FROM patients WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);

    const targetChatId = user.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;

    if (!targetChatId || !targetChatId.trim()) {
      return res.status(400).json({
        message: 'No Telegram Chat ID configured. Enter your Chat ID in Settings first.'
      });
    }

    const result = await telegramService.sendTestNotification(
      targetChatId,
      user.full_name,
      patient?.patient_name
    );

    if (result.success) {
      // Record test notification
      db.run(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'test', 'Telegram Test Notification Sent', 'A verification test message was delivered to Telegram Chat ID ${targetChatId}.')`,
        [req.user.id]
      );

      return res.json({
        message: `Test alert sent successfully to Telegram Chat ID ${targetChatId}! Please check your Telegram app.`
      });
    } else {
      return res.status(502).json({
        message: `Telegram API Error: ${result.error || 'Failed to deliver message'}. Ensure you sent /start to @MediCare_Alert_Bot.`
      });
    }
  } catch (err) {
    console.error('Telegram test route error:', err);
    return res.status(500).json({ message: 'Internal server error during Telegram test' });
  }
});

module.exports = router;


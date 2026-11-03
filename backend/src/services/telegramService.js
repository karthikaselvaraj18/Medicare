const axios = require('axios');
const { getCurrentTimeWithSecondsISTString, formatTimeTo12Hour } = require('../utils/timeUtils');

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.defaultChatId = process.env.TELEGRAM_CHAT_ID;
  }

  isConfigured() {
    return Boolean(this.token && !this.token.includes('your_telegram_bot_token'));
  }

  async sendMessage(chatId, text) {
    if (!this.isConfigured()) {
      console.warn('[Telegram] Bot token is not configured in .env');
      return { success: false, error: 'Telegram Bot Token not configured in backend .env' };
    }

    const targetChatId = chatId || this.defaultChatId;
    if (!targetChatId) {
      return { success: false, error: 'No Telegram Chat ID configured for this caretaker' };
    }

    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;

    try {
      const response = await axios.post(url, {
        chat_id: targetChatId,
        text: text,
        parse_mode: 'Markdown'
      }, { timeout: 8000 });

      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.description || err.message;
      console.error('[Telegram] Failed to send message:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  async sendMissedMedicineAlert({ chatId, patientName, medicineName, scheduledTime }) {
    const formattedScheduled = formatTimeTo12Hour(scheduledTime);
    const currentTimeStr = getCurrentTimeWithSecondsISTString();

    const message = 
`⚠️ *MEDICARE MONITOR*

🚨 *MISSED MEDICINE ALERT*

*Patient:* ${patientName || 'Patient'}
*Medicine:* ${medicineName}
*Scheduled Time:* ${formattedScheduled}
*Current Time:* ${currentTimeStr}
*Status:* NOT CONFIRMED

⚠️ Please check on the patient immediately.`;

    return this.sendMessage(chatId, message);
  }

  async sendTestNotification(chatId, caretakerName, patientName) {
    const currentTimeStr = getCurrentTimeWithSecondsISTString();

    const message = 
`🏥 *MEDICARE MONITOR* — System Test

Hello *${caretakerName || 'Caretaker'}*!
This is a test notification from your IoT Medicine Reminder System.

*Patient Monitoring:* ${patientName || 'Active'}
*Alert Time:* ${currentTimeStr}
*Status:* Telegram connection established successfully ✅

Your alerts for missed medicine doses will arrive here in real time.`;

    return this.sendMessage(chatId, message);
  }
}

module.exports = new TelegramService();


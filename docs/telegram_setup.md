# Telegram Bot Alert Setup & Security Guide

## 1. Bot Information
- **Bot Name**: MediCare Alert Bot
- **Bot Username**: `@MediCare_Alert_Bot`
- **Official Telegram API**: `https://api.telegram.org/bot<TOKEN>/sendMessage`

---

## 2. Security Best Practices Implemented

1. **No Token in Frontend Code**:
   The bot token is stored strictly in the backend `.env` file and is never sent to the browser or exposed in frontend JavaScript bundles.
2. **Environment Variable Protection**:
   The `.env` file is included in `.gitignore` to prevent leaking credentials to public GitHub repositories.
3. **Caretaker Chat ID Configuration**:
   The caretaker enters their private Chat ID in the web dashboard Settings page, which is saved securely in the SQLite database.

---

## 3. How to Obtain Your Telegram Chat ID

1. Open Telegram and search for `@MediCare_Alert_Bot`.
2. Click **Start** (or send `/start`).
3. Search for `@userinfobot` in Telegram and send any message.
4. It will reply with your numerical **Id** (e.g. `7735871450`).
5. In MediCare Monitor dashboard, navigate to **Settings** -> **Telegram Bot Alert Integration**.
6. Enter your Chat ID and click **Send Test Telegram Alert**.

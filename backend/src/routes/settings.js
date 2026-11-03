const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/settings
router.get('/', (req, res) => {
  try {
    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const patient = db.get('SELECT * FROM patients WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]) || {};
    const device = db.get(
      `SELECT *, (strftime('%s', 'now') - strftime('%s', last_seen)) as seconds_ago 
       FROM devices WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [req.user.id]
    ) || {};

    const isOnline = Boolean(device.last_seen && device.seconds_ago !== null && device.seconds_ago < 45);

    return res.json({
      full_name: user.full_name || '',
      email: user.email || '',
      contact_number: user.contact_number || '',
      patient_name: patient.patient_name || '',
      patient_age: patient.patient_age || '',
      patient_contact: patient.patient_contact || '',
      telegram_chat_id: user.telegram_chat_id || '',
      reminder_timeout_seconds: user.reminder_timeout_seconds || 20,
      device_token: device.device_token || 'medicare-node-token-8266',
      device_name: device.device_name || 'ESP8266 NodeMCU',
      device_ip: device.ip_address || '',
      last_seen: device.last_seen || null,
      is_online: isOnline
    });
  } catch (err) {
    console.error('Settings GET error:', err);
    return res.status(500).json({ message: 'Error retrieving settings' });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const {
      full_name,
      contact_number,
      patient_name,
      patient_age,
      patient_contact,
      telegram_chat_id,
      reminder_timeout_seconds
    } = req.body;

    // Update user
    db.run(
      `UPDATE users
       SET full_name = ?, contact_number = ?, telegram_chat_id = ?, reminder_timeout_seconds = ?
       WHERE id = ?`,
      [
        full_name ? full_name.trim() : req.user.full_name,
        contact_number ? contact_number.trim() : '',
        telegram_chat_id ? telegram_chat_id.trim() : '',
        parseInt(reminder_timeout_seconds, 10) || 20,
        req.user.id
      ]
    );

    // Update or insert patient
    const existingPatient = db.get('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (existingPatient) {
      db.run(
        `UPDATE patients
         SET patient_name = ?, patient_age = ?, patient_contact = ?
         WHERE id = ?`,
        [
          patient_name ? patient_name.trim() : '',
          parseInt(patient_age, 10) || null,
          patient_contact ? patient_contact.trim() : '',
          existingPatient.id
        ]
      );
    } else if (patient_name) {
      db.run(
        `INSERT INTO patients (user_id, patient_name, patient_age, patient_contact)
         VALUES (?, ?, ?, ?)`,
        [
          req.user.id,
          patient_name.trim(),
          parseInt(patient_age, 10) || null,
          patient_contact ? patient_contact.trim() : ''
        ]
      );
    }

    return res.json({ message: 'Settings saved successfully' });
  } catch (err) {
    console.error('Settings PUT error:', err);
    return res.status(500).json({ message: 'Failed to update settings' });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'medicare_jwt_secret_dev';
const DEFAULT_DEVICE_TOKEN = process.env.DEFAULT_DEVICE_TOKEN || 'medicare-node-token-8266';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      contact_number,
      patient_name,
      patient_age,
      patient_contact
    } = req.body;

    if (!full_name || !email || !password || !patient_name) {
      return res.status(400).json({ message: 'Missing required registration fields' });
    }

    // Check duplicate email
    const existing = db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(400).json({ message: 'An account with this email address already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Default chat ID from env if available
    const initialChatId = process.env.TELEGRAM_CHAT_ID || '';

    // Insert user
    const userResult = db.run(
      `INSERT INTO users (full_name, email, password_hash, contact_number, telegram_chat_id, reminder_timeout_seconds)
       VALUES (?, ?, ?, ?, ?, 20)`,
      [full_name.trim(), email.trim().toLowerCase(), password_hash, contact_number || '', initialChatId]
    );

    const userId = userResult.lastInsertRowid;

    // Insert patient
    db.run(
      `INSERT INTO patients (user_id, patient_name, patient_age, patient_contact)
       VALUES (?, ?, ?, ?)`,
      [userId, patient_name.trim(), parseInt(patient_age, 10) || null, patient_contact || '']
    );

    // Auto-create initial device record
    try {
      db.run(
        `INSERT INTO devices (user_id, device_token, device_name, last_seen, ip_address)
         VALUES (?, ?, 'ESP8266 NodeMCU', CURRENT_TIMESTAMP, '127.0.0.1')`,
        [userId, `${DEFAULT_DEVICE_TOKEN}`]
      );
    } catch (e) {
      // Device token may already exist
    }

    // Add welcome notification
    db.run(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES (?, 'info', 'Welcome to MediCare Monitor', 'Your account has been set up successfully. Add your first medicine reminder in the Medicines tab.')`,
      [userId]
    );

    const user = {
      id: userId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      contact_number: contact_number || '',
      telegram_chat_id: initialChatId
    };

    const token = jwt.sign({ id: userId, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Account registered successfully',
      user,
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      contact_number: user.contact_number,
      telegram_chat_id: user.telegram_chat_id,
      reminder_timeout_seconds: user.reminder_timeout_seconds
    };

    return res.json({
      message: 'Logged in successfully',
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, (req, res) => {
  const patient = db.get('SELECT * FROM patients WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);
  return res.json({
    user: req.user,
    patient: patient || null
  });
});

module.exports = router;


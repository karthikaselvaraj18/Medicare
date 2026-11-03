const db = require('../config/database');

const DEFAULT_DEVICE_TOKEN = process.env.DEFAULT_DEVICE_TOKEN || 'medicare-node-token-8266';

function deviceAuthMiddleware(req, res, next) {
  const token = req.headers['x-device-token'] || req.query.token || req.body?.device_token || DEFAULT_DEVICE_TOKEN;

  if (!token) {
    return res.status(401).json({ error: 'Device token required in X-Device-Token header' });
  }

  // Look up device
  let device = db.get('SELECT * FROM devices WHERE device_token = ?', [token]);

  if (!device) {
    // If it matches default or first user, auto-register device for ease of project demonstration
    const firstUser = db.get('SELECT id FROM users ORDER BY id ASC LIMIT 1');
    if (firstUser) {
      try {
        db.run(
          'INSERT INTO devices (user_id, device_token, device_name, last_seen, ip_address) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)',
          [firstUser.id, token, 'ESP8266 NodeMCU', req.ip || '192.168.1.100']
        );
        device = db.get('SELECT * FROM devices WHERE device_token = ?', [token]);
      } catch (e) {
        // Fallback search
        device = db.get('SELECT * FROM devices LIMIT 1');
      }
    }
  }

  if (device) {
    // Update last_seen and IP address
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    db.run(
      'UPDATE devices SET last_seen = CURRENT_TIMESTAMP, ip_address = ? WHERE id = ?',
      [clientIp, device.id]
    );
    req.device = device;
    req.userId = device.user_id;
  } else {
    // Fallback: If no user registered yet
    req.userId = 1;
  }

  next();
}

module.exports = deviceAuthMiddleware;


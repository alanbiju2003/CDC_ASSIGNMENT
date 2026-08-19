import express from 'express';
import db from '../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /emails (Vendor: own emails | Admin: all sent emails)
router.get('/emails', requireAuth, (req, res) => {
  try {
    let emails;
    if (req.user.role === 'admin') {
      emails = db.prepare('SELECT * FROM email_logs ORDER BY sentAt DESC LIMIT 50').all();
    } else {
      emails = db.prepare('SELECT * FROM email_logs WHERE toEmail = ? ORDER BY sentAt DESC LIMIT 50').all(req.user.email);
    }
    return res.json({ emails });
  } catch (err) {
    console.error('Error fetching email logs:', err);
    return res.status(500).json({ error: 'Failed to fetch email logs.' });
  }
});

export default router;

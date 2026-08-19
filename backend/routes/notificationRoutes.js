import express from 'express';
import db from '../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /notifications
router.get('/notifications', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE userEmail = ?
      ORDER BY createdAt DESC
      LIMIT 50
    `).all(req.user.email);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE userEmail = ? AND read = 0
    `).get(req.user.email).count;

    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// PATCH /notifications/:id/read
router.patch('/notifications/:id/read', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND userEmail = ?').run(id, req.user.email);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// PATCH /notifications/read-all
router.patch('/notifications/read-all', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE userEmail = ?').run(req.user.email);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all read:', err);
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

export default router;

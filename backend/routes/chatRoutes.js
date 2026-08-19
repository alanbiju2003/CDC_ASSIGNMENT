import express from 'express';
import db from '../database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /chat/:vendorId/messages
router.get('/chat/:vendorId/messages', requireAuth, (req, res) => {
  try {
    const { vendorId } = req.params; // vendorEmail

    // Security check: vendors can only read their own chat thread
    if (req.user.role !== 'admin' && req.user.email !== vendorId) {
      return res.status(403).json({ error: 'Not authorized to view this chat thread.' });
    }

    const messages = db.prepare(`
      SELECT * FROM chat_messages
      WHERE vendorId = ?
      ORDER BY timestamp ASC
    `).all(vendorId);

    return res.json({ messages });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    return res.status(500).json({ error: 'Failed to fetch chat messages.' });
  }
});

// POST /chat/:vendorId/messages
router.post('/chat/:vendorId/messages', requireAuth, (req, res) => {
  try {
    const { vendorId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    if (req.user.role !== 'admin' && req.user.email !== vendorId) {
      return res.status(403).json({ error: 'Not authorized to post to this chat thread.' });
    }

    const id = `MSG-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const senderRole = req.user.role;

    db.prepare(`
      INSERT INTO chat_messages (id, vendorId, senderEmail, senderRole, message, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, vendorId, req.user.email, senderRole, message.trim(), timestamp);

    // Send in-app notification to recipient
    const recipientEmail = senderRole === 'admin' ? vendorId : 'admin@kickvault.test';
    const notificationTitle = senderRole === 'admin' ? 'New Message from KickVault Admin' : `New Message from ${req.user.name || vendorId}`;
    
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, ?, ?, ?, 'info', 0, ?)
    `).run(`NOTIF-${Date.now()}`, recipientEmail, notificationTitle, message.trim().substring(0, 80) + '...', timestamp);

    const newMessage = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(id);
    return res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Error sending chat message:', err);
    return res.status(500).json({ error: 'Failed to send chat message.' });
  }
});

export default router;

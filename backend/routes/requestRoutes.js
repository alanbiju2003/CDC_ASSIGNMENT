import express from 'express';
import db from '../database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { notifyStakeholders } from '../services/emailService.js';

const router = express.Router();

// GET /price-requests
router.get('/price-requests', requireAuth, (req, res) => {
  try {
    let requests;
    if (req.user.role === 'admin') {
      requests = db.prepare(`
        SELECT pr.*, s.brand, s.model, s.sku, s.askingPrice, s.adminPrice
        FROM price_requests pr
        LEFT JOIN shoes s ON pr.shoeId = s.id
        ORDER BY pr.createdAt DESC
      `).all();
    } else {
      requests = db.prepare(`
        SELECT pr.*, s.brand, s.model, s.sku, s.askingPrice, s.adminPrice
        FROM price_requests pr
        LEFT JOIN shoes s ON pr.shoeId = s.id
        WHERE pr.vendorEmail = ?
        ORDER BY pr.createdAt DESC
      `).all(req.user.email);
    }
    return res.json({ requests });
  } catch (err) {
    console.error('Error fetching price requests:', err);
    return res.status(500).json({ error: 'Failed to fetch price requests.' });
  }
});

// POST /price-requests (vendor submits price change request)
router.post('/price-requests', requireAuth, (req, res) => {
  try {
    const { shoeId, requestedPrice } = req.body;
    if (!shoeId || requestedPrice === undefined) {
      return res.status(400).json({ error: 'Shoe ID and requested price are required.' });
    }

    const shoe = db.prepare('SELECT * FROM shoes WHERE id = ?').get(shoeId);
    if (!shoe) {
      return res.status(404).json({ error: 'Shoe listing not found.' });
    }

    if (req.user.role !== 'admin' && shoe.vendorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized for this listing.' });
    }

    const id = `PR-${Math.floor(4000 + Math.random() * 6000)}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO price_requests (id, shoeId, vendorEmail, requestedPrice, status, createdAt)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(id, shoeId, req.user.email, Number(requestedPrice), createdAt);

    // Notify Admin
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, 'admin@kickvault.test', 'Price Change Requested', ?, 'info', 0, ?)
    `).run(`NOTIF-${Date.now()}`, `Vendor ${req.user.email} requested price change to ₹${requestedPrice} for ${shoe.brand} ${shoe.model}.`, createdAt);

    // Notify Stakeholders
    notifyStakeholders({
      subject: `Price Change Request: ${shoe.brand} ${shoe.model} → ₹${Number(requestedPrice).toLocaleString('en-IN')}`,
      template: 'PRICE_REQUEST_ALERT',
      data: { vendorEmail: req.user.email, shoeId, shoeSku: shoe.sku, requestedPrice: Number(requestedPrice) }
    });

    const newRequest = db.prepare('SELECT * FROM price_requests WHERE id = ?').get(id);
    return res.status(201).json({ request: newRequest, message: 'Price change request submitted.' });
  } catch (err) {
    console.error('Error submitting price request:', err);
    return res.status(500).json({ error: 'Failed to submit price request.' });
  }
});

// POST /admin/price-requests/:id/respond (admin approve / reject)
router.post('/admin/price-requests/:id/respond', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approved" or "rejected".' });
    }

    const pr = db.prepare('SELECT * FROM price_requests WHERE id = ?').get(id);
    if (!pr) {
      return res.status(404).json({ error: 'Price request not found.' });
    }

    db.prepare(`UPDATE price_requests SET status = ? WHERE id = ?`).run(action, id);

    if (action === 'approved') {
      // Update shoe price in inventory
      db.prepare(`
        UPDATE shoes
        SET askingPrice = ?, adminPrice = ?, status = 'priced'
        WHERE id = ?
      `).run(pr.requestedPrice, pr.requestedPrice, pr.shoeId);
    }

    // Notify vendor
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, ?, 'Price Change Request Decision', ?, ?, 0, ?)
    `).run(
      `NOTIF-${Date.now()}`,
      pr.vendorEmail,
      `Your price change request for ${pr.shoeId} was ${action.toUpperCase()}.`,
      action === 'approved' ? 'success' : 'warning',
      createdAt
    );

    const updatedRequest = db.prepare('SELECT * FROM price_requests WHERE id = ?').get(id);
    return res.json({ request: updatedRequest, message: `Price request ${action}.` });
  } catch (err) {
    console.error('Error responding to price request:', err);
    return res.status(500).json({ error: 'Failed to process price request decision.' });
  }
});

// GET /return-requests (Bonus 2)
router.get('/return-requests', requireAuth, (req, res) => {
  try {
    let requests;
    if (req.user.role === 'admin') {
      requests = db.prepare(`
        SELECT rr.*, s.brand, s.model, s.sku, s.status as shoeStatus
        FROM return_requests rr
        LEFT JOIN shoes s ON rr.shoeId = s.id
        ORDER BY rr.createdAt DESC
      `).all();
    } else {
      requests = db.prepare(`
        SELECT rr.*, s.brand, s.model, s.sku, s.status as shoeStatus
        FROM return_requests rr
        LEFT JOIN shoes s ON rr.shoeId = s.id
        WHERE rr.vendorEmail = ?
        ORDER BY rr.createdAt DESC
      `).all(req.user.email);
    }
    return res.json({ requests });
  } catch (err) {
    console.error('Error fetching return requests:', err);
    return res.status(500).json({ error: 'Failed to fetch return requests.' });
  }
});

// POST /return-requests
router.post('/return-requests', requireAuth, (req, res) => {
  try {
    const { shoeId, reason } = req.body;
    if (!shoeId) {
      return res.status(400).json({ error: 'Shoe ID is required for return request.' });
    }

    const shoe = db.prepare('SELECT * FROM shoes WHERE id = ?').get(shoeId);
    if (!shoe) {
      return res.status(404).json({ error: 'Shoe listing not found.' });
    }

    const id = `RET-${Math.floor(5000 + Math.random() * 5000)}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO return_requests (id, shoeId, vendorEmail, reason, status, createdAt)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(id, shoeId, req.user.email, reason || 'Vendor requested inventory recall', createdAt);

    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, 'admin@kickvault.test', 'Return Request Raised', ?, 'warning', 0, ?)
    `).run(`NOTIF-${Date.now()}`, `Vendor ${req.user.email} raised return request for ${shoe.brand} ${shoe.model}.`, createdAt);

    // Notify Stakeholders
    notifyStakeholders({
      subject: `Stock Recall / Return Request: ${shoe.brand} ${shoe.model} by ${req.user.email}`,
      template: 'RETURN_REQUEST_ALERT',
      data: { vendorEmail: req.user.email, shoeId, reason }
    });

    const newRequest = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(id);
    return res.status(201).json({ request: newRequest, message: 'Return request submitted.' });
  } catch (err) {
    console.error('Error creating return request:', err);
    return res.status(500).json({ error: 'Failed to raise return request.' });
  }
});

// POST /admin/return-requests/:id/respond
router.post('/admin/return-requests/:id/respond', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approved' | 'rejected'

    const rr = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(id);
    if (!rr) {
      return res.status(404).json({ error: 'Return request not found.' });
    }

    db.prepare(`UPDATE return_requests SET status = ? WHERE id = ?`).run(action, id);

    if (action === 'approved') {
      db.prepare(`UPDATE shoes SET status = 'returned' WHERE id = ?`).run(rr.shoeId);
    }

    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, ?, 'Return Request Update', ?, ?, 0, ?)
    `).run(
      `NOTIF-${Date.now()}`,
      rr.vendorEmail,
      `Your return request for listing ${rr.shoeId} was ${action.toUpperCase()}.`,
      action === 'approved' ? 'success' : 'warning',
      createdAt
    );

    const updatedRequest = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(id);
    return res.json({ request: updatedRequest, message: `Return request ${action}.` });
  } catch (err) {
    console.error('Error responding to return request:', err);
    return res.status(500).json({ error: 'Failed to respond to return request.' });
  }
});

export default router;

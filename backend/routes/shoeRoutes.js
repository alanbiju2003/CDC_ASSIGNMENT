import express from 'express';
import db from '../database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { notifyStakeholders } from '../services/emailService.js';

const router = express.Router();

// GET /shoes (vendor: own | admin: all)
router.get('/shoes', requireAuth, (req, res) => {
  try {
    let shoes;
    if (req.user.role === 'admin') {
      shoes = db.prepare(`
        SELECT s.*, u.name as vendorName, u.businessName as vendorBusiness
        FROM shoes s
        LEFT JOIN users u ON s.vendorEmail = u.email
        ORDER BY s.createdAt DESC
      `).all();
    } else {
      shoes = db.prepare(`
        SELECT * FROM shoes WHERE vendorEmail = ? ORDER BY createdAt DESC
      `).all(req.user.email);
    }
    return res.json({ shoes });
  } catch (err) {
    console.error('Error fetching shoes:', err);
    return res.status(500).json({ error: 'Failed to fetch inventory.' });
  }
});

// POST /shoes (vendor adds listing)
router.post('/shoes', requireAuth, (req, res) => {
  try {
    const { brand, model, size, sku, condition, askingPrice, qty } = req.body;

    if (!brand || !model || !size || !sku || askingPrice === undefined) {
      return res.status(400).json({ error: 'Brand, model, size, SKU, and asking price are required.' });
    }

    const id = `SHOE-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = new Date().toISOString();
    const vendorEmail = req.user.role === 'admin' && req.body.vendorEmail ? req.body.vendorEmail : req.user.email;
    const initialQty = parseInt(qty, 10) || 1;

    db.prepare(`
      INSERT INTO shoes (id, vendorEmail, brand, model, size, sku, condition, askingPrice, adminPrice, qty, soldQty, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, null, ?, 0, 'submitted', ?)
    `).run(id, vendorEmail, brand, model, size, sku, condition || 'New', Number(askingPrice), initialQty, createdAt);

    const newShoe = db.prepare('SELECT * FROM shoes WHERE id = ?').get(id);

    // Notify Stakeholders
    notifyStakeholders({
      subject: `New Item Listed: ${brand} ${model} (Size ${size}) by ${vendorEmail}`,
      template: 'NEW_ITEM_ALERT',
      data: { vendorEmail, brand, model, size, sku, askingPrice: Number(askingPrice), qty: initialQty }
    });

    // Notify admins
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, 'admin@kickvault.test', 'New Sneaker Submitted', ?, 'info', 0, ?)
    `).run(`NOTIF-${Date.now()}`, `Vendor ${req.user.name} submitted ${brand} ${model} (${sku}) for pricing.`, createdAt);

    return res.status(201).json({ shoe: newShoe, message: 'Sneaker listing submitted for review.' });
  } catch (err) {
    console.error('Error creating shoe:', err);
    return res.status(500).json({ error: 'Failed to create sneaker listing.' });
  }
});

// POST /shoes/bulk (bulk CSV/JSON upload)
router.post('/shoes/bulk', requireAuth, (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required for bulk creation.' });
    }

    const vendorEmail = req.user.email;
    const createdAt = new Date().toISOString();
    const createdShoes = [];

    const insertStmt = db.prepare(`
      INSERT INTO shoes (id, vendorEmail, brand, model, size, sku, condition, askingPrice, adminPrice, qty, soldQty, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, null, ?, 0, 'submitted', ?)
    `);

    db.transaction(() => {
      items.forEach((item, index) => {
        const id = `SHOE-${Math.floor(10000 + Math.random() * 90000)}-${index + 1}`;
        insertStmt.run(
          id,
          vendorEmail,
          item.brand || 'Unknown Brand',
          item.model || 'Unknown Model',
          item.size || 'US M',
          item.sku || `SKU-${Date.now()}-${index}`,
          item.condition || 'New',
          Number(item.askingPrice || item.price || 0),
          parseInt(item.qty || 1, 10),
          createdAt
        );
        createdShoes.push(id);
      });
    })();

    return res.status(201).json({
      message: `Successfully imported ${createdShoes.length} sneaker listings.`,
      count: createdShoes.length
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    return res.status(500).json({ error: 'Failed to process bulk upload.' });
  }
});

// PATCH /shoes/:id (vendor edit)
router.patch('/shoes/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const shoe = db.prepare('SELECT * FROM shoes WHERE id = ?').get(id);
    if (!shoe) {
      return res.status(404).json({ error: 'Shoe listing not found.' });
    }

    if (req.user.role !== 'admin' && shoe.vendorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to edit this listing.' });
    }

    const { brand, model, size, condition, askingPrice, qty } = req.body;

    db.prepare(`
      UPDATE shoes
      SET brand = COALESCE(?, brand),
          model = COALESCE(?, model),
          size = COALESCE(?, size),
          condition = COALESCE(?, condition),
          askingPrice = COALESCE(?, askingPrice),
          qty = COALESCE(?, qty)
      WHERE id = ?
    `).run(brand, model, size, condition, askingPrice !== undefined ? Number(askingPrice) : null, qty !== undefined ? parseInt(qty, 10) : null, id);

    const updatedShoe = db.prepare('SELECT * FROM shoes WHERE id = ?').get(id);
    return res.json({ shoe: updatedShoe, message: 'Listing updated successfully.' });
  } catch (err) {
    console.error('Error updating shoe:', err);
    return res.status(500).json({ error: 'Failed to update shoe listing.' });
  }
});

// POST /admin/shoes/:id/price (admin sets adminPrice + status)
router.post('/admin/shoes/:id/price', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { adminPrice, status } = req.body;

    const shoe = db.prepare('SELECT * FROM shoes WHERE id = ?').get(id);
    if (!shoe) {
      return res.status(404).json({ error: 'Shoe listing not found.' });
    }

    const newAdminPrice = adminPrice !== undefined && adminPrice !== null ? Number(adminPrice) : shoe.adminPrice;
    const newStatus = status || 'priced';

    db.prepare(`
      UPDATE shoes
      SET adminPrice = ?, status = ?
      WHERE id = ?
    `).run(newAdminPrice, newStatus, id);

    // Notify Vendor
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, ?, 'Listing Priced & Updated', ?, 'info', 0, ?)
    `).run(
      `NOTIF-${Date.now()}`,
      shoe.vendorEmail,
      `Admin approved price ₹${newAdminPrice} for ${shoe.brand} ${shoe.model}. Status is now ${newStatus.toUpperCase()}.`,
      createdAt
    );

    const updatedShoe = db.prepare('SELECT * FROM shoes WHERE id = ?').get(id);
    return res.json({ shoe: updatedShoe, message: 'Shoe pricing and status updated by admin.' });
  } catch (err) {
    console.error('Error pricing shoe:', err);
    return res.status(500).json({ error: 'Failed to update shoe pricing.' });
  }
});

export default router;

import express from 'express';
import db from '../database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generateMrnPdf } from '../services/pdfService.js';
import { sendTransactionalEmail } from '../services/emailService.js';

const router = express.Router();

// GET /mrn
router.get('/mrn', requireAuth, (req, res) => {
  try {
    let mrns;
    if (req.user.role === 'admin') {
      mrns = db.prepare(`
        SELECT m.*, u.name as vendorName, u.businessName as vendorBusiness
        FROM mrns m
        LEFT JOIN users u ON m.vendorEmail = u.email
        ORDER BY m.createdAt DESC
      `).all();
    } else {
      mrns = db.prepare('SELECT * FROM mrns WHERE vendorEmail = ? ORDER BY createdAt DESC').all(req.user.email);
    }
    return res.json({ mrns });
  } catch (err) {
    console.error('Error fetching MRNs:', err);
    return res.status(500).json({ error: 'Failed to fetch MRN documents.' });
  }
});

// POST /mrn (admin creates MRN)
router.post('/mrn', requireAuth, requireAdmin, (req, res) => {
  try {
    const { vendorEmail, items } = req.body;
    if (!vendorEmail || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Vendor email and items array are required.' });
    }

    const vendor = db.prepare("SELECT email FROM users WHERE email = ? AND role = 'vendor'").get(vendorEmail);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found.' });
    }

    const id = `MRN-${Math.floor(2000 + Math.random() * 8000)}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO mrns (id, vendorEmail, createdBy, items, status, signedBy, signedAt, createdAt)
      VALUES (?, ?, ?, ?, 'awaiting_signature', null, null, ?)
    `).run(id, vendorEmail, req.user.email, JSON.stringify(items), createdAt);

    // Notify Vendor
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, ?, 'New MRN Created', ?, 'warning', 0, ?)
    `).run(`NOTIF-${Date.now()}`, vendorEmail, `Admin issued Material Receiving Note ${id}. Please review & e-sign.`, createdAt);

    // Dispatch MRN Email
    sendTransactionalEmail({
      to: vendorEmail,
      subject: `MRN Document Issued: ${id} 📄`,
      template: 'MRN_ISSUED',
      data: { mrnId: id }
    });

    const newMrn = db.prepare('SELECT * FROM mrns WHERE id = ?').get(id);
    return res.status(201).json({ mrn: newMrn, message: 'MRN generated and sent for vendor signature.' });
  } catch (err) {
    console.error('Error creating MRN:', err);
    return res.status(500).json({ error: 'Failed to create MRN document.' });
  }
});

// POST /mrn/:id/sign (vendor signs MRN)
router.post('/mrn/:id/sign', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { signedByName } = req.body;

    const mrn = db.prepare('SELECT * FROM mrns WHERE id = ?').get(id);
    if (!mrn) {
      return res.status(404).json({ error: 'MRN document not found.' });
    }

    if (req.user.role !== 'admin' && mrn.vendorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to sign this MRN.' });
    }

    const signerName = signedByName || req.user.name || req.user.email;
    const signedAt = new Date().toISOString();

    db.prepare(`
      UPDATE mrns
      SET status = 'signed', signedBy = ?, signedAt = ?
      WHERE id = ?
    `).run(signerName, signedAt, id);

    // Notify admin
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, 'admin@kickvault.test', 'MRN E-Signed', ?, 'success', 0, ?)
    `).run(`NOTIF-${Date.now()}`, `Vendor ${signerName} electronically signed ${id}.`, signedAt);

    const updatedMrn = db.prepare('SELECT * FROM mrns WHERE id = ?').get(id);
    return res.json({ mrn: updatedMrn, message: 'MRN signed successfully.' });
  } catch (err) {
    console.error('Error signing MRN:', err);
    return res.status(500).json({ error: 'Failed to sign MRN.' });
  }
});

// GET /mrn/:id/pdf (Download PDF)
router.get('/mrn/:id/pdf', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const mrn = db.prepare('SELECT * FROM mrns WHERE id = ?').get(id);
    if (!mrn) {
      return res.status(404).json({ error: 'MRN document not found.' });
    }

    if (req.user.role !== 'admin' && mrn.vendorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const vendorUser = db.prepare('SELECT * FROM users WHERE email = ?').get(mrn.vendorEmail);
    const pdfBuffer = await generateMrnPdf(mrn, vendorUser);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${mrn.id}_Signed_MRN.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('MRN PDF Generation error:', err);
    return res.status(500).json({ error: 'Failed to generate MRN PDF.' });
  }
});

export default router;

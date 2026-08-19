import express from 'express';
import db from '../database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generateInvoicePdf } from '../services/pdfService.js';
import { sendTransactionalEmail } from '../services/emailService.js';

const router = express.Router();

// GET /invoices
router.get('/invoices', requireAuth, (req, res) => {
  try {
    let invoices;
    if (req.user.role === 'admin') {
      invoices = db.prepare(`
        SELECT i.*, u.name as vendorName, u.businessName as vendorBusiness
        FROM invoices i
        LEFT JOIN users u ON i.vendorEmail = u.email
        ORDER BY i.createdAt DESC
      `).all();
    } else {
      invoices = db.prepare('SELECT * FROM invoices WHERE vendorEmail = ? ORDER BY createdAt DESC').all(req.user.email);
    }
    return res.json({ invoices });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return res.status(500).json({ error: 'Failed to fetch invoices.' });
  }
});

// POST /invoices (admin creates invoice)
router.post('/invoices', requireAuth, requireAdmin, (req, res) => {
  try {
    const { vendorEmail, lines, commissionPct } = req.body;
    if (!vendorEmail || !lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'Vendor email and line items are required.' });
    }

    const id = `INV-${Math.floor(3000 + Math.random() * 7000)}`;
    const createdAt = new Date().toISOString();
    const commPct = commissionPct !== undefined ? Number(commissionPct) : 12;

    db.prepare(`
      INSERT INTO invoices (id, vendorEmail, lines, commissionPct, status, createdAt)
      VALUES (?, ?, ?, ?, 'draft', ?)
    `).run(id, vendorEmail, JSON.stringify(lines), commPct, createdAt);

    const newInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    return res.status(201).json({ invoice: newInvoice, message: 'Draft invoice created successfully.' });
  } catch (err) {
    console.error('Error creating invoice:', err);
    return res.status(500).json({ error: 'Failed to create invoice.' });
  }
});

// POST /invoices/:id/send
router.post('/invoices/:id/send', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    db.prepare(`UPDATE invoices SET status = 'sent' WHERE id = ?`).run(id);

    // Notify vendor
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, ?, 'Invoice Issued & Sent', ?, 'success', 0, ?)
    `).run(`NOTIF-${Date.now()}`, invoice.vendorEmail, `Invoice ${id} has been issued. Settlement payout is processing.`, createdAt);

    // Compute payout totals for email
    let lines = [];
    try { lines = JSON.parse(invoice.lines); } catch (e) {}
    const grossTotal = lines.reduce((acc, l) => acc + (l.qtySold * l.unitPrice), 0);
    const netPayout = grossTotal - Math.round((grossTotal * invoice.commissionPct) / 100);

    // Dispatch Invoice Email
    sendTransactionalEmail({
      to: invoice.vendorEmail,
      subject: `Invoice Settlement Issued: ${id} 💳`,
      template: 'INVOICE_SENT',
      data: { invoiceId: id, grossTotal, netPayout }
    });

    const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    return res.json({ invoice: updatedInvoice, message: 'Invoice marked as SENT.' });
  } catch (err) {
    console.error('Error sending invoice:', err);
    return res.status(500).json({ error: 'Failed to send invoice.' });
  }
});

// POST /invoices/:id/cancel
router.post('/invoices/:id/cancel', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    db.prepare(`UPDATE invoices SET status = 'cancelled' WHERE id = ?`).run(id);

    const updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    return res.json({ invoice: updatedInvoice, message: 'Invoice CANCELLED.' });
  } catch (err) {
    console.error('Error cancelling invoice:', err);
    return res.status(500).json({ error: 'Failed to cancel invoice.' });
  }
});

// GET /invoices/:id/pdf
router.get('/invoices/:id/pdf', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (req.user.role !== 'admin' && invoice.vendorEmail !== req.user.email) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const vendorUser = db.prepare('SELECT * FROM users WHERE email = ?').get(invoice.vendorEmail);
    const pdfBuffer = await generateInvoicePdf(invoice, vendorUser);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.id}_Invoice.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Invoice PDF error:', err);
    return res.status(500).json({ error: 'Failed to generate invoice PDF.' });
  }
});

// GET /payments/summary (Bonus 5: Payment summary per vendor)
router.get('/payments/summary', requireAuth, (req, res) => {
  try {
    const targetEmail = req.user.role === 'admin' && req.query.vendorEmail ? req.query.vendorEmail : req.user.email;

    // Fetch sold items for this vendor
    const soldShoes = db.prepare(`
      SELECT * FROM shoes
      WHERE vendorEmail = ? AND soldQty > 0
    `).all(targetEmail);

    let grossSales = 0;
    let itemsSoldTotal = 0;

    soldShoes.forEach(s => {
      const price = s.adminPrice || s.askingPrice || 0;
      grossSales += price * s.soldQty;
      itemsSoldTotal += s.soldQty;
    });

    // Fetch invoices for this vendor
    const invoices = db.prepare('SELECT * FROM invoices WHERE vendorEmail = ?').all(targetEmail);
    const commissionPct = invoices.length > 0 ? invoices[0].commissionPct : 12;

    const totalCommission = Math.round((grossSales * commissionPct) / 100);
    const netPayout = grossSales - totalCommission;

    let pendingPayout = 0;
    let settledPayout = 0;

    invoices.forEach(inv => {
      let lines = [];
      try { lines = JSON.parse(inv.lines); } catch (e) {}
      const invGross = lines.reduce((acc, l) => acc + (l.qtySold * l.unitPrice), 0);
      const invNet = invGross - Math.round((invGross * inv.commissionPct) / 100);

      if (inv.status === 'sent') settledPayout += invNet;
      if (inv.status === 'draft') pendingPayout += invNet;
    });

    return res.json({
      summary: {
        vendorEmail: targetEmail,
        itemsSoldTotal,
        grossSales,
        commissionPct,
        totalCommission,
        netPayout,
        pendingPayout,
        settledPayout,
        soldShoes
      }
    });
  } catch (err) {
    console.error('Payment summary error:', err);
    return res.status(500).json({ error: 'Failed to compute payment summary.' });
  }
});

export default router;

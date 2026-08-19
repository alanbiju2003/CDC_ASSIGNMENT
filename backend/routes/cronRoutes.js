import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const CRON_SECRET = process.env.CRON_SECRET || 'kickvault_cron_secret_2026';

// POST /cron/sync (protected by x-cron-secret header)
router.post('/cron/sync', (req, res) => {
  try {
    const providedSecret = req.headers['x-cron-secret'];
    if (!providedSecret || providedSecret !== CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized cron trigger. Invalid x-cron-secret header.' });
    }

    // Read stock_sync.csv from filesystem or req.body
    let csvData = '';
    if (req.body && typeof req.body === 'string' && req.body.includes('sku')) {
      csvData = req.body;
    } else {
      const csvPath = path.join(__dirname, '..', 'stock_sync.csv');
      if (fs.existsSync(csvPath)) {
        csvData = fs.readFileSync(csvPath, 'utf8');
      } else {
        return res.status(404).json({ error: 'stock_sync.csv file not found on server.' });
      }
    }

    // Simple CSV parser
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or malformed.' });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const skuIdx = headers.indexOf('sku');
    const stockQtyIdx = headers.indexOf('stock_qty');
    const soldQtyIdx = headers.indexOf('sold_qty');

    if (skuIdx === -1 || stockQtyIdx === -1 || soldQtyIdx === -1) {
      return res.status(400).json({ error: 'Invalid CSV headers. Expected sku,stock_qty,sold_qty.' });
    }

    const updatedRows = [];
    const updateStmt = db.prepare(`
      UPDATE shoes
      SET qty = ?, soldQty = ?, status = CASE WHEN ? > 0 AND ? = 0 THEN 'sold' ELSE status END
      WHERE sku = ?
    `);

    db.transaction(() => {
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim());
        if (row.length < 3) continue;

        const sku = row[skuIdx];
        const stockQty = parseInt(row[stockQtyIdx], 10) || 0;
        const soldQty = parseInt(row[soldQtyIdx], 10) || 0;

        const result = updateStmt.run(stockQty, soldQty, soldQty, stockQty, sku);
        if (result.changes > 0) {
          updatedRows.push({ sku, stockQty, soldQty });
        }
      }
    })();

    // Notify admins of cron completion
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, 'admin@kickvault.test', 'Stock Sync Cron Executed', ?, 'info', 0, ?)
    `).run(`NOTIF-${Date.now()}`, `Daily inventory sync updated ${updatedRows.length} sneaker listing SKUs from stock_sync.csv.`, createdAt);

    return res.json({
      success: true,
      message: `Stock & sold quantity sync completed successfully. Updated ${updatedRows.length} SKUs.`,
      updatedRows
    });
  } catch (err) {
    console.error('Cron sync error:', err);
    return res.status(500).json({ error: 'Failed to execute scheduled stock sync.' });
  }
});

export default router;

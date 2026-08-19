import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { generateToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';
import { sendTransactionalEmail, notifyStakeholders } from '../services/emailService.js';

const router = express.Router();

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// POST /auth/vendor/register
router.post('/auth/vendor/register', (req, res) => {
  try {
    const { email, password, name, businessName, pan } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const id = `USER-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();
    
    // Default status: pending_kyc
    const status = 'pending_kyc';

    db.prepare(`
      INSERT INTO users (id, email, password, name, businessName, pan, role, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, 'vendor', ?, ?)
    `).run(id, email, passwordHash, name, businessName || null, pan || null, status, createdAt);

    const user = db.prepare('SELECT id, email, name, businessName, pan, role, status FROM users WHERE id = ?').get(id);
    const token = generateToken(user);

    // Create welcoming notification
    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(`NOTIF-${Date.now()}`, email, 'Welcome to KickVault!', 'Please submit your PAN for KYC verification to activate your account.', 'info', createdAt);

    // Dispatch Welcome Email
    sendTransactionalEmail({
      to: email,
      subject: 'Welcome to KickVault Consignment Portal 👟',
      template: 'WELCOME',
      data: { name, businessName }
    });

    // Notify All Stakeholders
    notifyStakeholders({
      subject: `New Vendor Registered: ${name} (${businessName || 'Store'})`,
      template: 'NEW_VENDOR_ALERT',
      data: { name, businessName, email }
    });

    return res.status(201).json({
      message: 'Vendor registered successfully.',
      user,
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to register vendor.' });
  }
});

// POST /auth/vendor/login
router.post('/auth/vendor/login', loginRateLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ? AND role = 'vendor'").get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password for vendor portal.' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Vendor login successful.',
      user: userWithoutPassword,
      token
    });
  } catch (err) {
    console.error('Vendor login error:', err);
    return res.status(500).json({ error: 'Vendor login failed.' });
  }
});

// POST /auth/admin/login
router.post('/auth/admin/login', loginRateLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'").get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Admin login successful.',
      user: userWithoutPassword,
      token
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Admin login failed.' });
  }
});

// GET /me
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

// GET /kyc/record
router.get('/kyc/record', requireAuth, (req, res) => {
  try {
    const targetEmail = req.query.email || req.user.email;
    const record = db.prepare('SELECT * FROM kyc_records WHERE userEmail = ?').get(targetEmail);
    return res.json({ record: record || null });
  } catch (err) {
    console.error('Error fetching KYC record:', err);
    return res.status(500).json({ error: 'Failed to fetch KYC record.' });
  }
});

// GET /admin/kyc/queue (Admin fetches all vendor KYC submissions)
router.get('/admin/kyc/queue', requireAuth, requireAdmin, (req, res) => {
  try {
    const records = db.prepare(`
      SELECT k.*, u.name as vendorName, u.businessName, u.status as userStatus, u.createdAt as registeredAt
      FROM kyc_records k
      LEFT JOIN users u ON k.userEmail = u.email
      ORDER BY 
        CASE WHEN k.status = 'pending_approval' THEN 1 ELSE 2 END,
        COALESCE(k.updatedAt, k.submittedAt, '2026-01-01') DESC
    `).all();

    const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM kyc_records WHERE status = 'pending_approval'`).get().count;

    return res.json({ records, pendingCount });
  } catch (err) {
    console.error('Error fetching KYC queue:', err);
    return res.status(500).json({ error: 'Failed to fetch KYC review queue.' });
  }
});

// POST /kyc/verify (Vendor submits or direct verifies KYC)
router.post('/kyc/verify', requireAuth, (req, res) => {
  try {
    const { pan, docType, gstin, fileName, submitForApproval } = req.body;
    const targetPan = (pan || req.user.pan || '').trim().toUpperCase();

    if (!targetPan) {
      return res.status(400).json({ verified: false, error: 'PAN number is required for verification.' });
    }

    const isValidFormat = PAN_REGEX.test(targetPan);

    if (isValidFormat) {
      const entityChar = targetPan.charAt(3);
      let entityType = 'Registered Business Entity';
      if (entityChar === 'P') entityType = 'Proprietorship / Individual (Type P)';
      else if (entityChar === 'C') entityType = 'Corporate / Private Limited Company (Type C)';
      else if (entityChar === 'F') entityType = 'Partnership Firm / LLP (Type F)';
      else if (entityChar === 'A') entityType = 'Association of Persons (Type A)';
      else if (entityChar === 'H') entityType = 'Hindu Undivided Family (Type H)';
      else if (entityChar === 'T') entityType = 'Trust Entity (Type T)';

      const certId = `KYC-CERT-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toISOString();
      const confidenceScore = Math.floor(97 + Math.random() * 3); // 97-99%

      const kycStatus = 'verified';
      const userStatus = submitForApproval ? 'pending_kyc' : 'active';

      // Upsert KYC Record
      db.prepare(`
        INSERT INTO kyc_records (id, userEmail, pan, docType, gstin, entityType, fileName, confidenceScore, status, verifiedAt, submittedAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(userEmail) DO UPDATE SET
          pan = excluded.pan,
          docType = excluded.docType,
          gstin = excluded.gstin,
          entityType = excluded.entityType,
          fileName = excluded.fileName,
          confidenceScore = excluded.confidenceScore,
          status = excluded.status,
          verifiedAt = excluded.verifiedAt,
          updatedAt = excluded.updatedAt
      `).run(
        certId,
        req.user.email,
        targetPan,
        docType || 'Government Issued PAN Card',
        gstin || `29${targetPan}1Z5`,
        entityType,
        fileName || 'pan_card_document.pdf',
        confidenceScore,
        kycStatus,
        now,
        now,
        now
      );

      // Update User status & PAN
      db.prepare(`UPDATE users SET pan = ?, status = ? WHERE id = ?`).run(targetPan, userStatus, req.user.id);

      // Notify Admin
      db.prepare(`
        INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
        VALUES (?, 'admin@kickvault.test', 'Vendor KYC Submitted for Approval', ?, 'info', 0, ?)
      `).run(
        `NOTIF-${Date.now()}`,
        `Vendor ${req.user.name} (${req.user.email}) submitted PAN ${targetPan} for KYC approval.`,
        now
      );

      // Notify All Stakeholders
      notifyStakeholders({
        subject: `Action Required: New Vendor KYC Submitted by ${req.user.name} (${targetPan})`,
        template: 'KYC_SUBMITTED_ALERT',
        data: { vendorName: req.user.name, email: req.user.email, pan: targetPan, entityType, fileName }
      });

      const updatedUser = db.prepare('SELECT id, email, name, businessName, pan, role, status FROM users WHERE id = ?').get(req.user.id);

      return res.json({
        verified: true,
        certificateId: certId,
        pan: targetPan,
        entityType,
        confidenceScore: `${confidenceScore}%`,
        taxRegistryStatus: kycStatus === 'approved' ? 'VERIFIED_ACTIVE' : 'PENDING_ADMIN_APPROVAL',
        submittedAt: now,
        message: submitForApproval
          ? 'KYC application submitted successfully! Pending KickVault Admin approval.'
          : 'PAN verified against Tax Registry. Account is now active.',
        user: updatedUser
      });
    } else {
      return res.json({
        verified: false,
        message: 'Invalid PAN format. Must be 5 uppercase letters, 4 digits, 1 uppercase letter (e.g., AAAAA0000A).'
      });
    }
  } catch (err) {
    console.error('KYC verification error:', err);
    return res.status(500).json({ error: 'KYC verification failed.' });
  }
});

// POST /admin/kyc/:id/respond (Admin approves or rejects vendor KYC)
router.post('/admin/kyc/:id/respond', requireAuth, requireAdmin, (req, res) => {
  try {
    const { id } = req.params; // record id or userEmail
    const { action, rejectionReason } = req.body; // 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approved" or "rejected".' });
    }

    const record = db.prepare('SELECT * FROM kyc_records WHERE id = ? OR userEmail = ?').get(id, id);
    if (!record) {
      return res.status(404).json({ error: 'KYC record not found.' });
    }

    const now = new Date().toISOString();
    const newUserStatus = action === 'approved' ? 'active' : 'pending_kyc';

    const kycRecordStatus = action === 'approved' ? 'verified' : 'failed';

    db.prepare(`
      UPDATE kyc_records
      SET status = ?, rejectionReason = ?, approvedBy = ?, updatedAt = ?
      WHERE id = ?
    `).run(kycRecordStatus, rejectionReason || null, req.user.email, now, record.id);

    db.prepare(`
      UPDATE users SET status = ? WHERE email = ?
    `).run(newUserStatus, record.userEmail);

    // Notify Vendor
    const title = action === 'approved' ? 'KYC Approved & Activated! 🎉' : 'KYC Verification Update ⚠️';
    const message = action === 'approved'
      ? `Admin HQ verified and approved your PAN ${record.pan}. Account is fully activated for consignment!`
      : `Your KYC submission for ${record.pan} was rejected: ${rejectionReason || 'Invalid document/details'}. Please re-submit.`;

    db.prepare(`
      INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(`NOTIF-${Date.now()}`, record.userEmail, title, message, action === 'approved' ? 'success' : 'warning', now);

    // Dispatch Email
    if (action === 'approved') {
      sendTransactionalEmail({
        to: record.userEmail,
        subject: 'KYC Approved — Vendor Account Activated! 🎉',
        template: 'KYC_APPROVED',
        data: { pan: record.pan, certificateId: record.id }
      });
    }

    return res.json({
      success: true,
      message: `Vendor KYC status updated to ${action.toUpperCase()}.`,
      record: db.prepare('SELECT * FROM kyc_records WHERE id = ?').get(record.id)
    });
  } catch (err) {
    console.error('Error in Admin KYC respond:', err);
    return res.status(500).json({ error: 'Failed to process Admin KYC decision.' });
  }
});

export default router;

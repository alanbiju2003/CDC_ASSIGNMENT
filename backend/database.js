import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'kickvault.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency performance
db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      businessName TEXT,
      pan TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'vendor')),
      status TEXT NOT NULL CHECK(status IN ('pending_kyc', 'kyc_submitted', 'active', 'kyc_rejected')),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shoes (
      id TEXT PRIMARY KEY,
      vendorEmail TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      size TEXT NOT NULL,
      sku TEXT NOT NULL,
      condition TEXT NOT NULL,
      askingPrice REAL NOT NULL,
      adminPrice REAL,
      qty INTEGER NOT NULL DEFAULT 1,
      soldQty INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('submitted', 'priced', 'live', 'sold', 'returned')),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mrns (
      id TEXT PRIMARY KEY,
      vendorEmail TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      items TEXT NOT NULL, -- JSON string
      status TEXT NOT NULL CHECK(status IN ('awaiting_signature', 'signed')),
      signedBy TEXT,
      signedAt TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      vendorEmail TEXT NOT NULL,
      lines TEXT NOT NULL, -- JSON string
      commissionPct REAL NOT NULL DEFAULT 12,
      status TEXT NOT NULL CHECK(status IN ('draft', 'sent', 'cancelled')),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_requests (
      id TEXT PRIMARY KEY,
      shoeId TEXT NOT NULL,
      vendorEmail TEXT NOT NULL,
      requestedPrice REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS return_requests (
      id TEXT PRIMARY KEY,
      shoeId TEXT NOT NULL,
      vendorEmail TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      vendorId TEXT NOT NULL, -- vendorEmail
      senderEmail TEXT NOT NULL,
      senderRole TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userEmail TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kyc_records (
      id TEXT PRIMARY KEY,
      userEmail TEXT UNIQUE NOT NULL,
      pan TEXT NOT NULL,
      docType TEXT NOT NULL,
      gstin TEXT,
      entityType TEXT,
      fileName TEXT,
      confidenceScore INTEGER DEFAULT 98,
      status TEXT NOT NULL,
      rejectionReason TEXT,
      approvedBy TEXT,
      submittedAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      toEmail TEXT NOT NULL,
      fromEmail TEXT NOT NULL DEFAULT 'no-reply@kickvault.test',
      subject TEXT NOT NULL,
      template TEXT NOT NULL,
      bodyHtml TEXT NOT NULL,
      sentAt TEXT NOT NULL
    );
  `);

  // Column safety migrations for existing SQLite databases
  const kycColumns = db.prepare("PRAGMA table_info(kyc_records)").all().map(c => c.name);
  if (!kycColumns.includes('updatedAt')) {
    db.exec("ALTER TABLE kyc_records ADD COLUMN updatedAt TEXT");
  }
  if (!kycColumns.includes('submittedAt')) {
    db.exec("ALTER TABLE kyc_records ADD COLUMN submittedAt TEXT");
  }
  if (!kycColumns.includes('rejectionReason')) {
    db.exec("ALTER TABLE kyc_records ADD COLUMN rejectionReason TEXT");
  }
  if (!kycColumns.includes('approvedBy')) {
    db.exec("ALTER TABLE kyc_records ADD COLUMN approvedBy TEXT");
  }
}

export default db;

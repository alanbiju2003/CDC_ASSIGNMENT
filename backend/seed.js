import bcrypt from 'bcryptjs';
import db, { initDb } from './database.js';

export function seedDatabase() {
  initDb();

  // Clear existing data
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM shoes').run();
  db.prepare('DELETE FROM mrns').run();
  db.prepare('DELETE FROM invoices').run();
  db.prepare('DELETE FROM price_requests').run();
  db.prepare('DELETE FROM return_requests').run();
  db.prepare('DELETE FROM chat_messages').run();
  db.prepare('DELETE FROM notifications').run();

  const passwordHash = bcrypt.hashSync('Passw0rd!', 10);
  const now = new Date().toISOString();

  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, name, businessName, pan, role, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('USER-001', 'admin@kickvault.test', passwordHash, 'Admin User', 'KickVault HQ', 'ADMIN0000A', 'admin', 'active', now);
  insertUser.run('USER-002', 'vendor1@example.test', passwordHash, 'Vendor One', 'Alpha Kicks Co', 'AAAAA0000A', 'vendor', 'active', now);
  insertUser.run('USER-003', 'vendor2@example.test', passwordHash, 'Vendor Two', 'Beta Soles Co', 'ZZZZZ9999Z', 'vendor', 'pending_kyc', now);

  // Insert Inventory listings (Shoes)
  const insertShoe = db.prepare(`
    INSERT INTO shoes (id, vendorEmail, brand, model, size, sku, condition, askingPrice, adminPrice, qty, soldQty, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertShoe.run(
    'SHOE-1001',
    'vendor1@example.test',
    'Nike',
    'Air Jordan 1 High Chicago',
    'US 9',
    'AJ1-CHI-9',
    'New',
    18999,
    17500,
    2,
    0,
    'live',
    now
  );

  insertShoe.run(
    'SHOE-1002',
    'vendor1@example.test',
    'Adidas',
    'Yeezy Boost 350 V2 Zebra',
    'US 10',
    'YZY-ZEB-10',
    'New',
    22999,
    null,
    1,
    0,
    'submitted',
    now
  );

  insertShoe.run(
    'SHOE-1003',
    'vendor2@example.test',
    'New Balance',
    '550 White Green',
    'US 8',
    'NB550-WG-8',
    'Used - Good',
    9999,
    9500,
    3,
    0,
    'priced',
    now
  );

  // Insert MRN
  const insertMrn = db.prepare(`
    INSERT INTO mrns (id, vendorEmail, createdBy, items, status, signedBy, signedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMrn.run(
    'MRN-2001',
    'vendor1@example.test',
    'admin@kickvault.test',
    JSON.stringify([
      { sku: 'AJ1-CHI-9', qty: 2 },
      { sku: 'YZY-ZEB-10', qty: 1 }
    ]),
    'awaiting_signature',
    null,
    null,
    now
  );

  // Insert Invoice
  const insertInvoice = db.prepare(`
    INSERT INTO invoices (id, vendorEmail, lines, commissionPct, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertInvoice.run(
    'INV-3001',
    'vendor1@example.test',
    JSON.stringify([
      { sku: 'AJ1-CHI-9', qtySold: 1, unitPrice: 17500 }
    ]),
    12,
    'draft',
    now
  );

  // Insert Price Request
  const insertPriceRequest = db.prepare(`
    INSERT INTO price_requests (id, shoeId, vendorEmail, requestedPrice, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertPriceRequest.run(
    'PR-4001',
    'SHOE-1003',
    'vendor2@example.test',
    10500,
    'pending',
    now
  );

  // Insert Initial Chat Message
  const insertChatMessage = db.prepare(`
    INSERT INTO chat_messages (id, vendorId, senderEmail, senderRole, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertChatMessage.run(
    'MSG-101',
    'vendor1@example.test',
    'admin@kickvault.test',
    'admin',
    'Welcome to KickVault Consignment! Let us know if you need help pricing your sneakers.',
    now
  );

  insertChatMessage.run(
    'MSG-102',
    'vendor1@example.test',
    'vendor1@example.test',
    'vendor',
    'Thanks! I just submitted two new listings (AJ1 Chicago & Yeezy Zebra).',
    now
  );

  // Insert Initial Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (id, userEmail, title, message, type, read, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run(
    'NOTIF-01',
    'vendor1@example.test',
    'MRN Ready for Signature',
    'Admin issued MRN-2001 for 3 incoming pairs. Please review and sign.',
    'info',
    0,
    now
  );

  insertNotification.run(
    'NOTIF-02',
    'vendor2@example.test',
    'KYC Verification Pending',
    'Please verify your PAN to start selling on KickVault.',
    'warning',
    0,
    now
  );

  insertNotification.run(
    'NOTIF-03',
    'admin@kickvault.test',
    'New Price Request',
    'Vendor Two requested a price update on SHOE-1003 (New Balance 550).',
    'info',
    0,
    now
  );

  console.log('✅ KickVault database seeded successfully with test data.');
}

if (process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

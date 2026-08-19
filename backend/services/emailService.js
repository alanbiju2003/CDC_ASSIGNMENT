import db from '../database.js';

export const STAKEHOLDER_EMAILS = [
  'itmealanbiju@gmail.com',
  'dephr@crepdogcrew.com',
  'fo3@crepdogcrew.com',
  'hr@crepdogcrew.com'
];

export function sendTransactionalEmail({ to, subject, template, data = {} }) {
  try {
    const id = `MAIL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const fromEmail = 'no-reply@kickvault.test';
    const sentAt = new Date().toISOString();

    let bodyHtml = '';

    switch (template) {
      case 'WELCOME':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px;">
            <h2 style="color: #10b981; margin-top: 0;">Welcome to KickVault Consignment! 👟</h2>
            <p>Hi ${data.name || 'Vendor Partner'},</p>
            <p>Thank you for registering your store (<strong>${data.businessName || 'Consignment Partner'}</strong>) with KickVault.</p>
            <p>To start listing sneakers and receiving disbursements, please complete your instant PAN KYC verification.</p>
            <hr style="border-color: #334155; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8;">KickVault B2B Consignment Operations • Automated Email Engine</p>
          </div>
        `;
        break;

      case 'NEW_VENDOR_ALERT':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px; border-left: 4px solid #10b981;">
            <h2 style="color: #10b981; margin-top: 0;">🚨 Stakeholder Alert: New Vendor Registered</h2>
            <p>A new vendor has registered on KickVault portal:</p>
            <ul style="background: #1e293b; padding: 15px 25px; border-radius: 8px; font-size: 13px;">
              <li><strong>Name:</strong> ${data.name}</li>
              <li><strong>Business Store:</strong> ${data.businessName || 'N/A'}</li>
              <li><strong>Email:</strong> ${data.email}</li>
              <li><strong>Timestamp:</strong> ${sentAt}</li>
            </ul>
            <p>Action Item: Please review and ensure vendor completes KYC verification.</p>
          </div>
        `;
        break;

      case 'KYC_SUBMITTED_ALERT':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <h2 style="color: #f59e0b; margin-top: 0;">⚠️ Action Required: Vendor KYC Submitted for Approval</h2>
            <p>Vendor <strong>${data.vendorName || data.email}</strong> submitted PAN for KYC approval:</p>
            <ul style="background: #1e293b; padding: 15px 25px; border-radius: 8px; font-size: 13px;">
              <li><strong>PAN Number:</strong> <code style="color: #34d399;">${data.pan}</code></li>
              <li><strong>Entity Category:</strong> ${data.entityType || 'Business Entity'}</li>
              <li><strong>Attached File:</strong> ${data.fileName || 'pan_proof.pdf'}</li>
            </ul>
            <p style="font-weight: bold; color: #38bdf8;">Please log in to Admin HQ → KYC Approvals Queue to review and approve/reject.</p>
          </div>
        `;
        break;

      case 'KYC_APPROVED':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px;">
            <h2 style="color: #10b981; margin-top: 0;">KYC Approved & Account Activated! 🎉</h2>
            <p>Hi ${data.name || 'Vendor'},</p>
            <p>Admin HQ has verified your PAN (<strong>${data.pan}</strong>) against the Tax Authority Registry.</p>
            <p>Your KickVault vendor account is now <strong>ACTIVE</strong>. You can now list inventory and sign MRNs.</p>
            <p style="background: #1e293b; padding: 12px; border-radius: 8px; font-family: monospace; color: #34d399;">Certificate ID: ${data.certificateId || 'KYC-CERT-ONLINE'}</p>
          </div>
        `;
        break;

      case 'NEW_ITEM_ALERT':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px; border-left: 4px solid #38bdf8;">
            <h2 style="color: #38bdf8; margin-top: 0;">👟 Stakeholder Alert: New Sneaker Item Listed</h2>
            <p>Vendor <strong>${data.vendorEmail}</strong> submitted new consignment sneaker stock:</p>
            <ul style="background: #1e293b; padding: 15px 25px; border-radius: 8px; font-size: 13px;">
              <li><strong>Item:</strong> ${data.brand} ${data.model}</li>
              <li><strong>Size & SKU:</strong> ${data.size} (${data.sku})</li>
              <li><strong>Asking Price:</strong> ₹${data.askingPrice?.toLocaleString('en-IN')}</li>
              <li><strong>Qty:</strong> ${data.qty} pair(s)</li>
            </ul>
          </div>
        `;
        break;

      case 'PRICE_REQUEST_ALERT':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px; border-left: 4px solid #a855f7;">
            <h2 style="color: #a855f7; margin-top: 0;">🏷️ Stakeholder Alert: Price Change Request</h2>
            <p>Vendor <strong>${data.vendorEmail}</strong> requested price update:</p>
            <ul style="background: #1e293b; padding: 15px 25px; border-radius: 8px; font-size: 13px;">
              <li><strong>Shoe SKU:</strong> ${data.shoeSku || data.shoeId}</li>
              <li><strong>Requested Price:</strong> ₹${data.requestedPrice?.toLocaleString('en-IN')}</li>
              <li><strong>Status:</strong> ${data.status || 'Pending Admin Review'}</li>
            </ul>
          </div>
        `;
        break;

      case 'RETURN_REQUEST_ALERT':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px; border-left: 4px solid #ef4444;">
            <h2 style="color: #ef4444; margin-top: 0;">🔁 Stakeholder Alert: Stock Recall / Return Request</h2>
            <p>Vendor <strong>${data.vendorEmail}</strong> requested inventory return:</p>
            <ul style="background: #1e293b; padding: 15px 25px; border-radius: 8px; font-size: 13px;">
              <li><strong>Shoe ID:</strong> ${data.shoeId}</li>
              <li><strong>Reason:</strong> ${data.reason || 'Recall request'}</li>
              <li><strong>Status:</strong> Pending Approval</li>
            </ul>
          </div>
        `;
        break;

      case 'MRN_ISSUED':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px;">
            <h2 style="color: #f59e0b; margin-top: 0;">Material Receiving Note (MRN) Issued 📄</h2>
            <p>Admin HQ issued document <strong>${data.mrnId}</strong> for received consignment sneakers.</p>
            <p>Please log in to your KickVault portal to review items and apply your electronic signature.</p>
          </div>
        `;
        break;

      case 'INVOICE_SENT':
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px;">
            <h2 style="color: #8b5cf6; margin-top: 0;">Consignment Invoice Issued (${data.invoiceId}) 💳</h2>
            <p>Settlement Invoice <strong>${data.invoiceId}</strong> for gross total <strong>₹${data.grossTotal?.toLocaleString('en-IN')}</strong> has been finalized.</p>
            <p style="color: #34d399; font-weight: bold; font-size: 16px;">Net Vendor Disbursement: ₹${data.netPayout?.toLocaleString('en-IN')}</p>
          </div>
        `;
        break;

      default:
        bodyHtml = `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 25px; border-radius: 12px;">
            <h2 style="color: #10b981; margin-top: 0;">KickVault Operations Alert</h2>
            <p>${data.message || subject}</p>
          </div>
        `;
        break;
    }

    db.prepare(`
      INSERT INTO email_logs (id, toEmail, fromEmail, subject, template, bodyHtml, sentAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, to, fromEmail, subject, template || 'SYSTEM', bodyHtml, sentAt);

    console.log(`\n✉️ [MOCK EMAIL DISPATCH] To: ${to} | Subject: "${subject}" | ID: ${id}`);

    return { id, success: true, to, subject };
  } catch (err) {
    console.error('Email dispatch error:', err);
    return { success: false, error: err.message };
  }
}

// Dispatches email to all 4 requested stakeholders simultaneously
export function notifyStakeholders({ subject, template, data = {} }) {
  STAKEHOLDER_EMAILS.forEach((toEmail) => {
    sendTransactionalEmail({
      to: toEmail,
      subject: `[Stakeholder Alert] ${subject}`,
      template,
      data
    });
  });
}

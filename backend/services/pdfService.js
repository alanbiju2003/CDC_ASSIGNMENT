import PDFDocument from 'pdfkit';

export function generateMrnPdf(mrn, vendorUser) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Primary Cyber Accent Color (#10b981 / Dark Navy)
      doc.rect(0, 0, 612, 100).fill('#0f172a');

      // Title & Logo
      doc.fillColor('#10b981').fontSize(24).font('Helvetica-Bold').text('KICKVAULT', 50, 30);
      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('Consignment Material Receiving Note (MRN)', 50, 60);

      doc.fillColor('#ffffff').fontSize(14).text(mrn.id, 450, 35, { align: 'right' });
      doc.fillColor('#94a3b8').fontSize(9).text(`Date: ${new Date(mrn.createdAt).toLocaleDateString()}`, 450, 55, { align: 'right' });

      doc.moveDown(4);

      // Vendor & Admin Metadata Section
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Consignment Details');
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y + 4).lineTo(562, doc.y + 4).stroke();
      doc.moveDown(0.8);

      const metadataY = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#334155').text('Vendor Information:', 50, metadataY);
      doc.font('Helvetica').fillColor('#475569')
        .text(`Name: ${vendorUser?.name || 'N/A'}`)
        .text(`Business: ${vendorUser?.businessName || 'N/A'}`)
        .text(`Email: ${mrn.vendorEmail}`);

      doc.font('Helvetica-Bold').fillColor('#334155').text('Issuer Information:', 320, metadataY);
      doc.font('Helvetica').fillColor('#475569')
        .text(`Created By: ${mrn.createdBy}`)
        .text(`Status: ${mrn.status.toUpperCase()}`);

      doc.moveDown(2);

      // Items Table Header
      const tableTop = doc.y;
      doc.rect(50, tableTop, 512, 24).fill('#f1f5f9');
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold');
      doc.text('#', 60, tableTop + 7);
      doc.text('SKU / Item Identifier', 100, tableTop + 7);
      doc.text('Quantity Received', 420, tableTop + 7, { align: 'right' });

      let items = [];
      try {
        items = typeof mrn.items === 'string' ? JSON.parse(mrn.items) : mrn.items;
      } catch (e) {
        items = [];
      }

      let yPos = tableTop + 30;
      let totalQty = 0;

      items.forEach((item, index) => {
        totalQty += item.qty || 0;
        doc.fillColor('#334155').fontSize(10).font('Helvetica');
        doc.text((index + 1).toString(), 60, yPos);
        doc.text(item.sku || 'N/A', 100, yPos);
        doc.text((item.qty || 0).toString(), 420, yPos, { align: 'right' });
        yPos += 22;
      });

      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, yPos).lineTo(562, yPos).stroke();
      yPos += 8;

      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold');
      doc.text('Total Received Items:', 100, yPos);
      doc.text(totalQty.toString(), 420, yPos, { align: 'right' });

      yPos += 40;

      // E-Signature Block
      doc.rect(50, yPos, 512, 90).fill('#f8fafc').stroke('#cbd5e1');
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('E-SIGNATURE ACKNOWLEDGMENT', 65, yPos + 12);

      if (mrn.status === 'signed') {
        doc.fillColor('#15803d').fontSize(10).font('Helvetica-Bold').text('✔ ELECTRONICALLY SIGNED', 65, yPos + 32);
        doc.fillColor('#334155').fontSize(9).font('Helvetica')
          .text(`Signed By: ${mrn.signedBy}`, 65, yPos + 48)
          .text(`Timestamp: ${mrn.signedAt ? new Date(mrn.signedAt).toLocaleString() : 'N/A'}`, 65, yPos + 62);
      } else {
        doc.fillColor('#b91c1c').fontSize(10).font('Helvetica-Bold').text('⏳ AWAITING VENDOR SIGNATURE', 65, yPos + 35);
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('This document has been issued by KickVault and requires formal signature from vendor.', 65, yPos + 55);
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('KickVault Streetwear & Sneaker Consignment Portal — Official MRN Document', 50, 720, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateInvoicePdf(invoice, vendorUser) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Dark Navy Banner Header
      doc.rect(0, 0, 612, 100).fill('#090d16');

      doc.fillColor('#8b5cf6').fontSize(24).font('Helvetica-Bold').text('KICKVAULT', 50, 30);
      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('CONSIGNMENT INVOICE & SETTLEMENT', 50, 60);

      doc.fillColor('#ffffff').fontSize(14).text(invoice.id, 450, 35, { align: 'right' });
      doc.fillColor('#94a3b8').fontSize(9).text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 450, 55, { align: 'right' });

      doc.moveDown(4);

      // Status Badge Banner
      let statusColor = '#f59e0b';
      if (invoice.status === 'sent') statusColor = '#10b981';
      if (invoice.status === 'cancelled') statusColor = '#ef4444';

      doc.rect(50, 115, 120, 20).fill(statusColor);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(invoice.status.toUpperCase(), 50, 120, { width: 120, align: 'center' });

      // Addresses
      const topY = 150;
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Billed To (Vendor):', 50, topY);
      doc.font('Helvetica').fontSize(9).fillColor('#475569')
        .text(vendorUser?.businessName || vendorUser?.name || 'Vendor Partner', 50, topY + 16)
        .text(`Email: ${invoice.vendorEmail}`, 50, topY + 30)
        .text(`PAN: ${vendorUser?.pan || 'N/A'}`, 50, topY + 44);

      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Issued By:', 350, topY);
      doc.font('Helvetica').fontSize(9).fillColor('#475569')
        .text('KickVault Consignment HQ', 350, topY + 16)
        .text('Email: finance@kickvault.test', 350, topY + 30)
        .text('Commission Rate: ' + invoice.commissionPct + '%', 350, topY + 44);

      // Line Items Table
      const tableTop = 220;
      doc.rect(50, tableTop, 512, 24).fill('#1e293b');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('SKU / Item', 60, tableTop + 7);
      doc.text('Qty Sold', 260, tableTop + 7, { align: 'right' });
      doc.text('Unit Price', 370, tableTop + 7, { align: 'right' });
      doc.text('Gross Amount', 480, tableTop + 7, { align: 'right' });

      let lines = [];
      try {
        lines = typeof invoice.lines === 'string' ? JSON.parse(invoice.lines) : invoice.lines;
      } catch (e) {
        lines = [];
      }

      let yPos = tableTop + 30;
      let grossTotal = 0;

      lines.forEach((line) => {
        const lineTotal = (line.qtySold || 0) * (line.unitPrice || 0);
        grossTotal += lineTotal;

        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        doc.text(line.sku || 'N/A', 60, yPos);
        doc.text((line.qtySold || 0).toString(), 260, yPos, { align: 'right' });
        doc.text(`₹${(line.unitPrice || 0).toLocaleString('en-IN')}`, 370, yPos, { align: 'right' });
        doc.text(`₹${lineTotal.toLocaleString('en-IN')}`, 480, yPos, { align: 'right' });
        yPos += 22;
      });

      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, yPos).lineTo(562, yPos).stroke();
      yPos += 15;

      const commissionAmount = Math.round((grossTotal * (invoice.commissionPct || 12)) / 100);
      const netPayout = grossTotal - commissionAmount;

      // Summary Breakdown Box
      const summaryLeft = 320;
      doc.fontSize(9).font('Helvetica').fillColor('#475569');
      doc.text('Gross Sales Total:', summaryLeft, yPos);
      doc.text(`₹${grossTotal.toLocaleString('en-IN')}`, 480, yPos, { align: 'right' });

      yPos += 18;
      doc.text(`Commission (${invoice.commissionPct}%):`, summaryLeft, yPos);
      doc.text(`- ₹${commissionAmount.toLocaleString('en-IN')}`, 480, yPos, { align: 'right' });

      yPos += 22;
      doc.rect(summaryLeft - 10, yPos - 4, 252, 28).fill('#f1f5f9');
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold');
      doc.text('Net Vendor Payout:', summaryLeft, yPos + 3);
      doc.text(`₹${netPayout.toLocaleString('en-IN')}`, 480, yPos + 3, { align: 'right' });

      // Payment Terms
      yPos += 50;
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Consignment Payment Terms', 50, yPos);
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica')
        .text('• Payments are disbursed to vendor bank accounts within 5 business days upon invoice state becoming SENT.', 50, yPos + 15)
        .text('• All consignment fees and commissions are calculated based on approved agreement terms.', 50, yPos + 28);

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('KickVault Consignment Portal — Automated Invoice Settlement Engine', 50, 720, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

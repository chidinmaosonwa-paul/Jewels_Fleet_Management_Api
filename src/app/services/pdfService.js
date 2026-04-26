import PDFDocument from 'pdfkit';

// Colour palette
const COLORS = {
  primary:    '#1a1a2e',
  accent:     '#4361ee',
  lightGray:  '#f5f5f5',
  midGray:    '#cccccc',
  textDark:   '#111111',
  textMuted:  '#555555',
  booked:     '#2d6a4f',
  cancelled:  '#c1121f',
};

// Helpers

const formatDate = (date) =>
  new Date(date).toLocaleString('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

const drawHRule = (doc, y, color = COLORS.midGray) => {
  doc.save()
    .strokeColor(color)
    .lineWidth(0.5)
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .stroke()
    .restore();
};

// Main export

const generatePDF = (journey, tickets) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth  = doc.page.width - 100; // usable width (margins = 50 each side)
    const destination = journey.destinationId;
    const vehicle     = journey.vehicleId;
    const booked      = tickets.filter((t) => t.status === 'booked').length;
    const cancelled   = tickets.filter((t) => t.status === 'cancelled').length;
    const totalSeats  = vehicle?.capacity ?? '—';

    // Header bar
    doc.rect(50, 45, pageWidth, 50).fill(COLORS.primary);
    doc.fillColor('#ffffff')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('PASSENGER MANIFEST', 60, 58, { width: pageWidth - 20 });

    // Company sub-line
    doc.fillColor(COLORS.textMuted)
       .fontSize(9)
       .font('Helvetica')
       .text(`Generated: ${formatDate(new Date())}`, 50, 105, { align: 'right', width: pageWidth });

    doc.moveDown(0.5);
    drawHRule(doc, doc.y);
    doc.moveDown(0.8);

    // Journey summary block
    const summaryTop = doc.y;
    const col1 = 50;
    const col2 = 310;
    const labelSize = 8;
    const valueSize = 11;
    const rowGap = 28;

    const summaryRows = [
      ['DESTINATION',    destination?.name       ?? '—',         'DISTANCE',    destination ? `${destination.distance} km` : '—'],
      ['DEPARTURE',      formatDate(journey.departureTime),       'BASE FARE',   destination ? `₦${destination.baseFare.toFixed(2)}` : '—'],
      ['VEHICLE',        vehicle?.model          ?? '—',         'PLATE NO.',   vehicle?.plateNumber ?? '—'],
      ['JOURNEY STATUS', journey.status.replace('_', ' ').toUpperCase(), 'CAPACITY', `${totalSeats} seats`],
    ];

    summaryRows.forEach((row, i) => {
      const y = summaryTop + i * rowGap;
      //Left pair
      doc.fillColor(COLORS.textMuted).fontSize(labelSize).font('Helvetica-Bold')
         .text(row[0], col1, y);
      doc.fillColor(COLORS.textDark).fontSize(valueSize).font('Helvetica')
         .text(row[1], col1, y + 10);
      //Right pair
      doc.fillColor(COLORS.textMuted).fontSize(labelSize).font('Helvetica-Bold')
         .text(row[2], col2, y);
      doc.fillColor(COLORS.textDark).fontSize(valueSize).font('Helvetica')
         .text(row[3], col2, y + 10);
    });

    doc.y = summaryTop + summaryRows.length * rowGap + 10;

    // Seat summary pills
    drawHRule(doc, doc.y);
    doc.moveDown(0.6);

    const pills = [
      { label: 'Total Passengers', value: tickets.length, color: COLORS.accent },
      { label: 'Booked',           value: booked,          color: COLORS.booked },
      { label: 'Cancelled',        value: cancelled,        color: COLORS.cancelled },
      { label: 'Available Seats',  value: journey.availableSeats, color: COLORS.textMuted },
    ];

    const pillW = pageWidth / pills.length;
    const pillY = doc.y;

    pills.forEach((p, i) => {
      const x = 50 + i * pillW;
      doc.rect(x + 4, pillY, pillW - 8, 36).fill(COLORS.lightGray);
      doc.fillColor(p.color)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(String(p.value), x + 4, pillY + 2, { width: pillW - 8, align: 'center' });
      doc.fillColor(COLORS.textMuted)
         .fontSize(7)
         .font('Helvetica')
         .text(p.label.toUpperCase(), x + 4, pillY + 22, { width: pillW - 8, align: 'center' });
    });

    doc.y = pillY + 48;
    doc.moveDown(0.6);
    drawHRule(doc, doc.y);
    doc.moveDown(0.8);

    // Passenger table
    if (tickets.length === 0) {
      doc.fillColor(COLORS.textMuted)
         .fontSize(11)
         .font('Helvetica')
         .text('No passengers booked for this journey.', { align: 'center' });
    } else {
      //Table header
      const cols = { no: 50, name: 75, email: 220, seat: 380, status: 440 };
      const headerY = doc.y;

      doc.rect(50, headerY, pageWidth, 18).fill(COLORS.accent);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('#',       cols.no,     headerY + 4, { width: 20 });
      doc.text('NAME',    cols.name,   headerY + 4, { width: 140 });
      doc.text('EMAIL',   cols.email,  headerY + 4, { width: 155 });
      doc.text('SEAT',    cols.seat,   headerY + 4, { width: 55 });
      doc.text('STATUS',  cols.status, headerY + 4, { width: 80 });

      //Rows
      let rowY = headerY + 20;
      tickets.forEach((ticket, index) => {
        //Alternating row background
        if (index % 2 === 0) {
          doc.rect(50, rowY, pageWidth, 18).fill(COLORS.lightGray);
        }

        const statusColor = ticket.status === 'booked' ? COLORS.booked : COLORS.cancelled;
        const passenger   = ticket.userId;

        doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica')
           .text(String(index + 1), cols.no, rowY + 4, { width: 20 });
        doc.fillColor(COLORS.textDark)
           .text(passenger?.username ?? '—', cols.name, rowY + 4, { width: 140 });
        doc.fillColor(COLORS.textMuted)
           .text(passenger?.email ?? '—', cols.email, rowY + 4, { width: 155 });
        doc.fillColor(COLORS.textDark)
           .text(String(ticket.seatNumber), cols.seat, rowY + 4, { width: 55, align: 'center' });
        doc.fillColor(statusColor).font('Helvetica-Bold')
           .text(ticket.status.toUpperCase(), cols.status, rowY + 4, { width: 80 });

        rowY += 20;

        //Page break guard
        if (rowY > doc.page.height - 80) {
          doc.addPage();
          rowY = 50;
        }
      });
    }

    // Footer
    const footerY = doc.page.height - 45;
    drawHRule(doc, footerY);
    doc.fillColor(COLORS.textMuted)
       .fontSize(8)
       .font('Helvetica')
       .text(
         `Journey ID: ${journey._id}  |  Jewel Fleet Management`,
         50,
         footerY + 8,
         { width: pageWidth, align: 'center' }
       );

    doc.end();
  });
};

export { generatePDF };
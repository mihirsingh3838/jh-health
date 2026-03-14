const nodemailer = require('nodemailer');

function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
}

async function sendOTPEmail(to, otp, ticketId, userName) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@jhhealthwifi.gov.in';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0F4C81;">JH Health WiFi Complaint Portal</h2>
      <p>Dear ${userName},</p>
      <p>Your complaint ticket <strong>${ticketId}</strong> has been marked for resolution by our engineer.</p>
      <p>To confirm the resolution, please share this <strong>6-digit OTP</strong> with the engineer:</p>
      <div style="background: #f0f4f8; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 12px;">This OTP is valid for 15 minutes. Do not share it with anyone except the engineer handling your complaint.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 11px;">Jharkhand Health Department · NIC</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from,
      to,
      subject: `Resolution OTP for Ticket ${ticketId} - JH Health WiFi`,
      html
    });
  } else {
    // Fallback: log to console when SMTP not configured (for development)
    console.log('\n📧 [Email not configured] OTP would be sent to:', to);
    console.log('   Ticket:', ticketId, '| OTP:', otp, '| Valid 15 min\n');
  }
}

module.exports = { sendOTPEmail };

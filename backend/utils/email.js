const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const templates = {
  welcome: (data) => ({
    subject: 'Welcome to TradeX India! 🎉',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e1a;color:#f0f4ff;border-radius:12px;overflow:hidden;">
        <div style="background:#00d084;padding:24px;text-align:center;">
          <h1 style="color:#022b1d;margin:0;font-size:28px;">TradeX India</h1>
        </div>
        <div style="padding:32px;">
          <h2>Welcome, ${data.name}! 🎉</h2>
          <p style="color:#8b9cc8;">Your account has been created successfully.</p>
          <div style="background:#111827;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#8b9cc8;">Client ID</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#00d084;">${data.clientId}</p>
          </div>
          <p style="color:#8b9cc8;">Complete your KYC to unlock trading. It takes less than 5 minutes.</p>
          <a href="${process.env.FRONTEND_URL}/kyc" style="display:inline-block;background:#00d084;color:#022b1d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Complete KYC →</a>
        </div>
        <div style="padding:16px;text-align:center;color:#4a5580;font-size:12px;">
          This is an automated message from TradeX India. Do not reply.
        </div>
      </div>
    `
  }),
  kycApproved: (data) => ({
    subject: 'KYC Approved — Start Trading Now!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>✅ KYC Approved, ${data.name}!</h2>
        <p>Your KYC has been verified. Demat Account: <strong>${data.dematNumber}</strong></p>
        <p>You can now start trading on TradeX India.</p>
        <a href="${process.env.FRONTEND_URL}/trading" style="display:inline-block;background:#00d084;color:#022b1d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Start Trading →</a>
      </div>
    `
  }),
  kycRejected: (data) => ({
    subject: 'KYC Update Required',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>KYC Rejected — Action Required</h2>
        <p>Dear ${data.name}, your KYC was rejected for the following reason:</p>
        <blockquote style="border-left:4px solid #ff4f6a;padding:8px 16px;background:#1a0a0e;">${data.reason}</blockquote>
        <p>Please re-submit your KYC with the correct documents.</p>
        <a href="${process.env.FRONTEND_URL}/kyc" style="display:inline-block;background:#ff4f6a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Re-submit KYC →</a>
      </div>
    `
  }),
  otp: (data) => ({
    subject: 'TradeX India — Your OTP',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Your OTP</h2>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#00d084;margin:16px 0;">${data.otp}</div>
        <p style="color:#666;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `
  }),
};

async function sendEmail({ to, template, data, subject, html }) {
  try {
    let emailContent;
    if (template && templates[template]) {
      emailContent = templates[template](data || {});
    } else {
      emailContent = { subject, html };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'TradeX India <noreply@tradex.in>',
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err);
    throw err;
  }
}

module.exports = { sendEmail };

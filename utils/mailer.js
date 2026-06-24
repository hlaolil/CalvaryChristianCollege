const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"Calvary Christian College" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request',
    html: `
      <p>You requested a password reset for your Calvary Christian College account.</p>
      <p>Click the link below to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
}

module.exports = { sendPasswordResetEmail };

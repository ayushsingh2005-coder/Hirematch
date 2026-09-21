import transporter from '../config/nodemailer.js';

export default async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials are not configured. Skipping email send.');
    return;
  }

  await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html,
  });
}

import nodemailer from 'nodemailer';

const smtpUser = process.env.MAIL_USER || process.env.SMTP_USER;
const smtpPass = process.env.MAIL_PASS || process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: 'mail.spacemail.com',
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const fromAddress = `"GoldXchange" <${smtpUser}>`;

export async function sendOtpEmail(to: string, otp: string, purpose: 'withdrawal' | 'login' = 'withdrawal'): Promise<void> {
  const purposeText = purpose === 'login' ? 'login verification' : 'withdrawal verification';
  const subjectText = purpose === 'login' ? 'Your GoldXchange Login OTP' : 'Your GoldXchange Withdrawal OTP';
  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: subjectText,
    text: `Your OTP code is: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#111;border-radius:12px;color:#fff;">
        <h2 style="color:#d4af37;margin:0 0 16px;">GoldXchange</h2>
        <p style="margin:0 0 20px;color:#ccc;">Your ${purposeText} code:</p>
        <div style="background:#1a1a2e;border:1px solid #d4af37;border-radius:8px;padding:20px;text-align:center;margin:0 0 20px;">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#d4af37;">${otp}</span>
        </div>
        <p style="margin:0 0 8px;color:#999;font-size:13px;">This code expires in <strong>5 minutes</strong>.</p>
        <p style="margin:0;color:#999;font-size:13px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}

export function generateOtp(): string {
  const bytes = require('crypto').randomBytes(3);
  const num = (bytes[0] * 65536 + bytes[1] * 256 + bytes[2]) % 1000000;
  return num.toString().padStart(6, '0');
}

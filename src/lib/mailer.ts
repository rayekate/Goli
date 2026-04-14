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

const SENDER_NAME = "GoldXchange Support";
const fromAddress = `"${SENDER_NAME}" <${smtpUser}>`;

export async function sendOtpEmail(to: string, otp: string, purpose: 'withdrawal' | 'login' | 'registration' | 'password_reset' = 'withdrawal', name?: string): Promise<void> {
  const purposeMap = {
    withdrawal: { text: 'withdrawal verification', subject: 'Your GoldXchange Withdrawal OTP' },
    login: { text: 'login verification', subject: 'Your GoldXchange Login OTP' },
    registration: { text: 'email verification', subject: 'Verify Your GoldXchange Email' },
    password_reset: { text: 'password reset', subject: 'Reset Your GoldXchange Password' },
  };
  const { text: purposeText, subject: subjectText } = purposeMap[purpose];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://goldxchange.org';
  const verifyUrl = `${baseUrl}/verify-email?email=${encodeURIComponent(to)}&otp=${otp}`;

  const purposeLabel = purposeText.toUpperCase();

  // For login/withdrawal: show OTP code to enter manually
  // For registration: show a clickable verification button
  const htmlBody = purpose === 'registration' ? `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px;background:#1a1c22;border-radius:12px;color:#ffffff;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      <h2 style="color:#f7931a;margin:0 0 24px;text-align:center;font-size:24px;letter-spacing:1px;">Email Verification</h2>
      <p style="margin:0 0 16px;color:#eeeeee;font-size:16px;">Hi ${name || 'there'},</p>
      <p style="margin:0 0 32px;color:#cccccc;font-size:15px;line-height:1.6;">Please verify your email address to activate your GoldXchange account. Click the button below to complete your registration.</p>
      <div style="text-align:center;margin-bottom:40px;">
        <a href="${verifyUrl}" style="display:inline-block;background:#f7931a;color:#000000;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:18px;font-weight:bold;box-shadow:0 4px 15px rgba(247,147,26,0.3);">
          Verify Email
        </a>
      </div>
      <div style="border-top:1px solid #333333;padding-top:24px;">
        <p style="margin:0 0 8px;color:#777777;font-size:13px;">If the button doesn't work, copy and paste this link:</p>
        <p style="margin:0 0 24px;color:#3b82f6;font-size:12px;word-break:break-all;">
          <a href="${verifyUrl}" style="color:#3b82f6;text-decoration:none;">${verifyUrl}</a>
        </p>
        <p style="margin:0;color:#777777;font-size:12px;">This link expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
      </div>
      <div style="margin-top:40px;text-align:center;">
        <p style="margin:0;color:#555555;font-size:11px;text-transform:uppercase;letter-spacing:2px;">© 2026 GoldXchange Global. All rights reserved.</p>
      </div>
    </div>
  ` : `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px;background:#1a1c22;border-radius:12px;color:#ffffff;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      <h2 style="color:#f7931a;margin:0 0 24px;text-align:center;font-size:24px;letter-spacing:1px;">${purposeLabel}</h2>
      <p style="margin:0 0 16px;color:#eeeeee;font-size:16px;">Hi ${name || 'there'},</p>
      <p style="margin:0 0 28px;color:#cccccc;font-size:15px;line-height:1.6;">
        Your one-time verification code for <strong>${purposeText}</strong>. Enter this code in the app to continue.
      </p>
      <div style="background:#0d1117;border:2px solid #f7931a;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
        <p style="margin:0 0 8px;color:#888888;font-size:11px;text-transform:uppercase;letter-spacing:3px;">Your OTP Code</p>
        <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:12px;color:#f7931a;font-family:monospace;">${otp}</p>
      </div>
      <div style="background:#13161d;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;color:#888888;font-size:13px;">⏱ This code expires in <strong style="color:#ffffff;">10 minutes</strong></p>
      </div>
      <p style="margin:0;color:#555555;font-size:12px;text-align:center;">If you did not initiate this request, please secure your account immediately.</p>
      <div style="margin-top:40px;text-align:center;border-top:1px solid #333;padding-top:24px;">
        <p style="margin:0;color:#555555;font-size:11px;text-transform:uppercase;letter-spacing:2px;">© 2026 GoldXchange Global. All rights reserved.</p>
      </div>
    </div>
  `;

  const textBody = purpose === 'registration'
    ? `Verify your account: ${verifyUrl}\n\nExpires in 10 minutes.`
    : `Your ${purposeText} OTP: ${otp}\n\nExpires in 10 minutes. Do not share this code.`;

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: subjectText,
    text: textBody,
    html: htmlBody,
  });
}


export function generateOtp(): string {
  const bytes = require('crypto').randomBytes(3);
  const num = (bytes[0] * 65536 + bytes[1] * 256 + bytes[2]) % 1000000;
  return num.toString().padStart(6, '0');
}

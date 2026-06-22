const nodemailer = require("nodemailer");

let resendClient = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    const { Resend } = require("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getDefaultFrom() {
  return (
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    process.env.EMAIL ||
    process.env.EMAIL_USER ||
    "e-GranthaAlaya <onboarding@resend.dev>"
  );
}

function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });
  }

  if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return null;
}

async function sendEmail(to, subject, html) {
  if (!to) return false;

  const resend = getResend();
  if (resend) {
    const { error } = await resend.emails.send({
      from: getDefaultFrom(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    if (error) {
      console.error("Resend email failed:", error.message || error);
      return false;
    }
    return true;
  }

  const transporter = getSmtpTransporter();
  if (!transporter) {
    console.warn("Email not configured: set RESEND_API_KEY or SMTP/EMAIL credentials");
    return false;
  }

  await transporter.sendMail({
    from: getDefaultFrom(),
    to,
    subject,
    html,
  });
  return true;
}

function isEmailConfigured() {
  return Boolean(getResend() || getSmtpTransporter());
}

module.exports = { sendEmail, isEmailConfigured, getDefaultFrom };

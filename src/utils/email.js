const nodemailer = require("nodemailer");

let transporter;
const EMAIL_TIMEOUT_MS = 15000;

const getEmailCredentials = () => {
  const user = String(process.env.EMAIL_USER || "").trim();
  const pass = String(process.env.EMAIL_APP_PASSWORD || "").replace(/\s+/g, "").trim();
  return { user, pass };
};

const canSendEmail = () => {
  const { user, pass } = getEmailCredentials();
  return Boolean(user && pass);
};

const getTransporter = () => {
  if (!transporter) {
    const { user, pass } = getEmailCredentials();
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      connectionTimeout: EMAIL_TIMEOUT_MS,
      greetingTimeout: EMAIL_TIMEOUT_MS,
      socketTimeout: EMAIL_TIMEOUT_MS,
      auth: { user, pass }
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!canSendEmail() || !to) return false;

  const { user } = getEmailCredentials();
  try {
    await getTransporter().sendMail({
      from: `"Nanbell Couture" <${user}>`,
      to,
      subject,
      text,
      html
    });
    console.error(`[EMAIL] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to ${to}: ${error.message}`);
    return false;
  }
};

module.exports = { sendEmail, canSendEmail };

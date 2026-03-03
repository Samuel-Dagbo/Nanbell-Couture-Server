const nodemailer = require("nodemailer");

const EMAIL_TIMEOUT_MS = 10000;

const getEmailCredentials = () => {
  const user = String(process.env.EMAIL_USER || "").trim();
  const pass = String(process.env.EMAIL_APP_PASSWORD || "").replace(/\s+/g, "").trim();
  return { user, pass };
};

const canSendEmail = () => {
  const { user, pass } = getEmailCredentials();
  return Boolean(user && pass);
};

const buildTransport = (user, pass, port, secure) =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure,
    requireTLS: !secure,
    connectionTimeout: EMAIL_TIMEOUT_MS,
    greetingTimeout: EMAIL_TIMEOUT_MS,
    socketTimeout: EMAIL_TIMEOUT_MS,
    auth: { user, pass }
  });

const sendEmail = async ({ to, subject, text, html }) => {
  if (!canSendEmail() || !to) return false;

  const { user, pass } = getEmailCredentials();
  const attempts = [
    { port: 465, secure: true, label: "smtp-465-ssl" },
    { port: 587, secure: false, label: "smtp-587-tls" }
  ];

  for (const attempt of attempts) {
    try {
      const transporter = buildTransport(user, pass, attempt.port, attempt.secure);
      await transporter.sendMail({
        from: `"Nanbell Couture" <${user}>`,
        to,
        subject,
        text,
        html
      });
      return true;
    } catch (error) {
      console.error(`[EMAIL] ${attempt.label} failed to ${to}: ${error.message}`);
    }
  }

  return false;
};

module.exports = { sendEmail, canSendEmail };

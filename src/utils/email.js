const nodemailer = require("nodemailer");

let transporter;
const EMAIL_TIMEOUT_MS = 8000;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      connectionTimeout: EMAIL_TIMEOUT_MS,
      greetingTimeout: EMAIL_TIMEOUT_MS,
      socketTimeout: EMAIL_TIMEOUT_MS,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });
  }
  return transporter;
};

const canSendEmail = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);

const sendEmail = async ({ to, subject, text, html }) => {
  if (!canSendEmail() || !to) return false;

  try {
    const mailTask = getTransporter().sendMail({
      from: `"Nanbell Couture" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    const timeoutTask = new Promise((resolve) => {
      setTimeout(() => resolve(false), EMAIL_TIMEOUT_MS);
    });

    const result = await Promise.race([mailTask, timeoutTask]);
    if (!result) {
      console.error("Email send timed out.");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    return false;
  }
};

module.exports = { sendEmail, canSendEmail };

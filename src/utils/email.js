const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
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
    await getTransporter().sendMail({
      from: `"Nanbell Couture" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    return false;
  }
};

module.exports = { sendEmail, canSendEmail };

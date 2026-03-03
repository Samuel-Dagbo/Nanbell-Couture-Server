const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const EMAIL_TIMEOUT_MS = 15000;
const OAUTH_REDIRECT_URI = "https://developers.google.com/oauthplayground";

const getEmailCredentials = () => ({
  user: String(process.env.EMAIL_USER || "").trim(),
  clientId: String(process.env.GOOGLE_CLIENT_ID || "").trim(),
  clientSecret: String(process.env.GOOGLE_CLIENT_SECRET || "").trim(),
  refreshToken: String(process.env.GOOGLE_REFRESH_TOKEN || "").trim()
});

const canSendEmail = () => {
  const { user, clientId, clientSecret, refreshToken } = getEmailCredentials();
  return Boolean(user && clientId && clientSecret && refreshToken);
};

const getAccessToken = async ({ clientId, clientSecret, refreshToken }) => {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, OAUTH_REDIRECT_URI);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const tokenResponse = await oauth2Client.getAccessToken();
  return tokenResponse?.token || "";
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!canSendEmail() || !to) return false;

  const { user, clientId, clientSecret, refreshToken } = getEmailCredentials();

  try {
    const accessToken = await getAccessToken({ clientId, clientSecret, refreshToken });
    if (!accessToken) {
      console.error("[EMAIL] Could not obtain Gmail access token.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      connectionTimeout: EMAIL_TIMEOUT_MS,
      greetingTimeout: EMAIL_TIMEOUT_MS,
      socketTimeout: EMAIL_TIMEOUT_MS,
      auth: {
        type: "OAuth2",
        user,
        clientId,
        clientSecret,
        refreshToken,
        accessToken
      }
    });

    await transporter.sendMail({
      from: `"Nanbell Couture" <${user}>`,
      to,
      subject,
      text,
      html
    });

    return true;
  } catch (error) {
    console.error(`[EMAIL] Gmail OAuth send failed to ${to}: ${error.message}`);
    return false;
  }
};

module.exports = { sendEmail, canSendEmail };

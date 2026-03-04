const { google } = require("googleapis");

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
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, OAUTH_REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const accessToken = await getAccessToken({ clientId, clientSecret, refreshToken });
    if (!accessToken) return false;
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const lines = [
      `From: Nanbell Couture <${user}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0"
    ];

    if (html) {
      lines.push('Content-Type: text/html; charset="UTF-8"', "", html);
    } else {
      lines.push('Content-Type: text/plain; charset="UTF-8"', "", text || "");
    }

    const raw = Buffer.from(lines.join("\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw }
    });

    return true;
  } catch (error) {
    console.error(`[EMAIL] Gmail OAuth send failed to ${to}: ${error.message}`);
    return false;
  }
};

module.exports = { sendEmail, canSendEmail };

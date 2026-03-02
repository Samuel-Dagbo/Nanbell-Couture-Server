require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const SELF_PING_ENABLED = true;
const SELF_PING_INTERVAL_MS = 10 * 60 * 1000;
const SELF_PING_PATH = "/api/keepalive";

const startSelfPing = () => {
  if (!SELF_PING_ENABLED) return;

  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const targetUrl = `${baseUrl}${SELF_PING_PATH}`;
  const ping = async () => {
    try {
      const response = await fetch(targetUrl, { method: "GET" });
      console.log(`Self-ping ${targetUrl} -> ${response.status}`);
    } catch (error) {
      console.error("Self-ping failed:", error.message);
    }
  };

  ping();
  setInterval(ping, SELF_PING_INTERVAL_MS);
};

connectDB().then(() => {
  app.listen(PORT, () => {
    startSelfPing();
  });
});

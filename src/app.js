const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const templateRoutes = require("./routes/templateRoutes");
const shopItemRoutes = require("./routes/shopItemRoutes");
const orderRoutes = require("./routes/orderRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/keepalive", (_req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/shop-items", shopItemRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);

module.exports = app;

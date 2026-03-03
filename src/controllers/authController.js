const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const createToken = require("../config/token");
const { sendEmail } = require("../utils/email");

const getAppBaseUrl = () => process.env.APP_BASE_URL || "http://localhost:5173";

const register = async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;
    if (!fullName || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, phone, email: normalizedEmail, password: hashedPassword, role: "customer" });

    await sendEmail({
      to: user.email,
      subject: "Welcome to Nanbell Couture",
      text: `Hi ${user.fullName}, welcome to Nanbell Couture. Your account is ready and you can start placing orders now.`
    });

    const token = createToken({ id: user._id, role: user.role });
    return res.status(201).json({
      token,
      user: { id: user._id, fullName: user.fullName, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "emailOrPhone and password are required" });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }]
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    await sendEmail({
      to: user.email,
      subject: "Login alert - Nanbell Couture",
      text: `Hello ${user.fullName}, your account was accessed on ${new Date().toISOString()}. If this was not you, reset your password immediately.`
    });

    const token = createToken({ id: user._id, role: user.role });
    return res.json({
      token,
      user: { id: user._id, fullName: user.fullName, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMe = async (req, res) => res.json(req.user);

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.json({ message: "If the account exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const resetUrl = `${getAppBaseUrl()}/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Nanbell Couture password",
      text: `Hi ${user.fullName}, reset your password using this link: ${resetUrl}. This link expires in 30 minutes.`
    });

    return res.json({ message: "If the account exists, a reset link has been sent." });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Reset link is invalid or expired" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Password changed - Nanbell Couture",
      text: `Hello ${user.fullName}, your password was reset successfully.`
    });

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };

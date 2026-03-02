const bcrypt = require("bcryptjs");
const User = require("../models/User");
const createToken = require("../config/token");

const register = async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;
    if (!fullName || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, phone, email, password: hashedPassword, role: "customer" });

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

module.exports = { register, login, getMe };

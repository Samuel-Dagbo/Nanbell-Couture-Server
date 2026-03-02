const jwt = require("jsonwebtoken");

const createToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

module.exports = createToken;

require("dotenv").config();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const con = require("../db");
const sendEmail = require("../utils/sendemail");

const attempsbyip = {};
const refreshtokens = [];

const login = async (req, res) => {
  const ip = req.ip;
  const { email, password } = req.body;
  const key = `${ip}-${email}`;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Enter the username and password." });
  }

  if (attempsbyip[key] === undefined) {
    attempsbyip[key] = 0;
  }

  if (attempsbyip[key] >= 10) {
    return res.status(429).json({ message: "Too many attempts" });
  }

  try {
    const result = await con.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    console.log(user);

    if (!user) {
      attempsbyip[key]++;
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      attempsbyip[key]++;
      return res.status(401).json({ message: "Invalid email or password" });
    }

    attempsbyip[key] = 0;

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );

    refreshtokens.push(refreshToken);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      role: user.role,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Enter the credentials." });
  }

  try {
    const exist = await con.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (exist.rows.length > 0) {
      return res.status(400).json({ message: "This user already exists" });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    await con.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
      [email, hashpassword],
    );

    return res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const forgotpassword = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await con.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res
        .status(200)
        .json({ message: "If this account exists, an email will be sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3_600_000);

    await con.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
      [resetToken, resetTokenExpires, email],
    );

    const resetLink = `http://localhost:3000/resetpassword?token=${resetToken}`;

    await sendEmail(
      email,
      "Reset Password",
      `<p>For the changing password <a href="${resetLink}">click here!</a></p>
       <p>This link is available for 1 hour.</p>`,
    );

    return res.status(200).json({ message: "Link sent to your email!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const resetpassword = async (req, res) => {
  try {
    const { token, newpassword } = req.body;

    const result = await con.query(
      "SELECT * FROM users WHERE reset_token = $1",
      [token],
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "This token is not valid!" });
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: "This token has expired!" });
    }

    const hashpassword = await bcrypt.hash(newpassword, 10);

    await con.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [hashpassword, user.id],
    );

    return res.status(200).json({ message: "Password changed successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

function authenticateToken(req, res, next) {
  const autheader = req.headers["authorization"];
  if (!autheader) return res.status(401).json({ message: "Unauthorized" });

  const token = autheader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Forbidden" });
    req.user = user;
    next();
  });
}

const refreshtoken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  if (!refreshtokens.includes(token))
    return res.status(403).json({ message: "Forbidden" });

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Forbidden" });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    return res.json({ accessToken });
  });
};

const logout = (req, res) => {
  const { token } = req.body;
  const index = refreshtokens.indexOf(token);
  if (index !== -1) {
    refreshtokens.splice(index, 1);
  }
  return res.status(200).json({ message: "Logged out" });
};
function authorizeAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
module.exports = {
  login,
  register,
  forgotpassword,
  resetpassword,
  authenticateToken,
  refreshtoken,
  logout,
  authorizeAdmin,
};

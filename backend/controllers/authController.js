const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return process.env.JWT_SECRET;
};

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  username: user.username,
  profileImage: user.profileImage,
  bio: user.bio,
  skills: user.skills,
  location: user.location,
  experience: user.experience,
  timezone: user.timezone,
  socialLinks: user.socialLinks,
  createdAt: user.createdAt,
});

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, timezone } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim();
    if (!firstName || !lastName || !normalizedEmail || !normalizedUsername || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    if (String(password).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });

    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] });
    if (existing) return res.status(409).json({ message: "User already exists." });

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      username: normalizedUsername,
      password: await bcrypt.hash(password, 12),
      profileImage: req.file ? `/uploads/${req.file.filename}` : null,
      timezone: timezone || undefined,
    });
    res.status(201).json({ message: "User registered", user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

const loginUser = async (req, res) => {
  try {
    const identifier = String(req.body.identifier ?? req.body.email ?? "").trim();
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({ error: "Username/email and password are required" });
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: identifier },
      ],
    }).select("+password");

    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ error: "Invalid username/email or password" });
    }

    const token = jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: "2h" });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

module.exports = { registerUser, loginUser };

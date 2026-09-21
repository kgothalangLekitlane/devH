const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return process.env.JWT_SECRET;
};

const getClientUrl = () => String(process.env.CLIENT_URL || process.env.FRONTEND_URL || "").replace(/\/$/, "");

const publicUser = (user) => {
  const value = user?.toObject ? user.toObject() : { ...user };
  const id = String(value._id ?? value.id ?? "");

  return {
    id,
    firstName: value.firstName,
    lastName: value.lastName,
    email: value.email,
    username: value.username,
    profileImage: value.profileImage?.startsWith("gridfs:") ? `/api/users/${id}/avatar` : value.profileImage,
    headline: value.headline,
    currentRole: value.currentRole,
    bio: value.bio,
    skills: Array.isArray(value.skills) ? value.skills : [],
    location: value.location,
    experience: value.experience,
    timezone: value.timezone,
    openToWork: Boolean(value.openToWork),
    workPreference: value.workPreference ?? "",
    preferredLocation: value.preferredLocation,
    salaryExpectation: value.salaryExpectation,
    socialLinks: {
      github: String(value.socialLinks?.github || ""),
      linkedin: String(value.socialLinks?.linkedin || ""),
      twitter: String(value.socialLinks?.twitter || ""),
      website: String(value.socialLinks?.website || ""),
    },
    createdAt: value.createdAt,
  };
};

const storeProfileImage = async (file, userId) => {
  if (!file?.buffer) return null;
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) throw new Error("Database is not ready for profile image upload");
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "profileImages" });
  const uploadStream = bucket.openUploadStream(`${userId}-${Date.now()}`, { contentType: file.mimetype, metadata: { userId: String(userId) } });
  await new Promise((resolve, reject) => { uploadStream.on("finish", resolve).on("error", reject); uploadStream.end(file.buffer); });
  return `gridfs:${uploadStream.id.toString()}`;
};

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, timezone } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim();
    if (!firstName || !lastName || !normalizedEmail || !normalizedUsername || !password) return res.status(400).json({ message: "Missing required fields." });
    if (String(password).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] });
    if (existing) return res.status(409).json({ message: "User already exists." });
    const user = await User.create({ firstName, lastName, email: normalizedEmail, username: normalizedUsername, password: await bcrypt.hash(password, 12), timezone: timezone || undefined });
    try {
      if (req.file) { const profileImage = await storeProfileImage(req.file, user._id); if (profileImage) { user.profileImage = profileImage; await user.save(); } }
    } catch (uploadError) { await user.deleteOne(); throw uploadError; }
    res.status(201).json({ message: "User registered", user: publicUser(user) });
  } catch (error) { console.error(error); res.status(500).json({ message: "Server error." }); }
};

const loginUser = async (req, res) => {
  try {
    const identifier = String(req.body.identifier ?? req.body.email ?? "").trim();
    const password = req.body.password;
    if (!identifier || !password) return res.status(400).json({ error: "Username/email and password are required" });
    const user = await User.findOne({ $or: [{ email: identifier.toLowerCase() }, { username: identifier }] }).select("+password");
    if (!user || !(await bcrypt.compare(String(password), user.password))) return res.status(401).json({ error: "Invalid username/email or password" });
    const token = jwt.sign({ id: String(user._id) }, getJwtSecret(), { expiresIn: "2h" });
    res.json({ token, user: publicUser(user) });
  } catch (error) { console.error("Login error:", error); res.status(500).json({ error: "Server error during login" }); }
};

const requestPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email is required" });
    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
    const response = { message: "If an account exists for that email, a password reset link has been sent." };
    if (!user) return res.json(response);
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !getClientUrl()) {
      console.error("Password reset email is not configured. Set RESEND_API_KEY, RESEND_FROM_EMAIL and CLIENT_URL.");
      return res.status(503).json({ error: "Password reset email is temporarily unavailable. Please try again later." });
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const resetUrl = `${getClientUrl()}/auth/reset-password?token=${rawToken}`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Reset your DevHeaven password</h2><p>We received a request to reset your password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p><p>This link expires in 30 minutes. If you did not request this, you can safely ignore this email.</p></div>`;
    const mailResponse = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL, to: [user.email], subject: "Reset your DevHeaven password", html }) });
    if (!mailResponse.ok) { user.passwordResetToken = null; user.passwordResetExpires = null; await user.save(); throw new Error(`Email provider returned ${mailResponse.status}`); }
    return res.json(response);
  } catch (error) { console.error("Password reset request error:", error); return res.status(500).json({ error: "Unable to process password reset request" }); }
};

const resetPassword = async (req, res) => {
  try {
    const token = String(req.body.token || "");
    const password = String(req.body.password || "");
    if (!token || password.length < 8) return res.status(400).json({ error: "A valid reset token and password of at least 8 characters are required." });
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: new Date() } }).select("+passwordResetToken +passwordResetExpires");
    if (!user) return res.status(400).json({ error: "This password reset link is invalid or has expired." });
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.json({ message: "Password reset successful. You can now sign in with your new password." });
  } catch (error) { console.error("Password reset error:", error); return res.status(500).json({ error: "Unable to reset password" }); }
};

const getCurrentUser = async (req, res) => {
  try { const user = await User.findById(req.user.id); if (!user) return res.status(404).json({ error: "User not found" }); res.json({ user: publicUser(user) }); }
  catch (error) { console.error("Current user error:", error); res.status(500).json({ error: "Failed to fetch current user" }); }
};

module.exports = { registerUser, loginUser, requestPasswordReset, resetPassword, getCurrentUser };

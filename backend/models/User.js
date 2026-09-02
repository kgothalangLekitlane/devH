const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
  password: { type: String, required: true, select: false },
  tokenVersion: { type: Number, default: 0, min: 0 },
  profileImage: { type: String },
  bio: { type: String, trim: true, maxlength: 2000, default: "" },
  skills: [{ type: String, trim: true, maxlength: 50 }],
  location: { type: String, trim: true, maxlength: 120 },
  experience: { type: Number, min: 0, max: 80 },
  timezone: { type: String, trim: true, maxlength: 80 },
  socialLinks: {
    github: { type: String, trim: true, maxlength: 500 },
    linkedin: { type: String, trim: true, maxlength: 500 },
    twitter: { type: String, trim: true, maxlength: 500 },
    website: { type: String, trim: true, maxlength: 500 },
  },
  profileViews: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model("User", userSchema)

module.exports = User

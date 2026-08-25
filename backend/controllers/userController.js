const User = require("../models/User")
const mongoose = require("mongoose")

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const publicProjection = "-password"

const searchCandidates = async (req, res) => {
  try {
    const { q, skill, location, experience } = req.query
    const query = {}
    const text = String(q || "").trim()

    if (text) {
      const pattern = { $regex: escapeRegex(text), $options: "i" }
      query.$or = [
        { firstName: pattern },
        { lastName: pattern },
        { username: pattern },
        { email: pattern },
        { skills: pattern },
      ]
    }
    if (skill) query.skills = { $regex: escapeRegex(String(skill)), $options: "i" }
    if (location) query.location = { $regex: escapeRegex(String(location)), $options: "i" }
    if (experience) query.experience = { $gte: Number(experience) }

    const candidates = await User.find(query, publicProjection).sort({ createdAt: -1 }).limit(50)
    res.json({ candidates })
  } catch (err) {
    console.error("Search users error:", err)
    res.status(400).json({ message: err.message })
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, publicProjection).sort({ createdAt: -1 }).limit(100)
    res.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
}

const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid user ID" })
    const user = await User.findById(req.params.id, publicProjection)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user)
  } catch (error) {
    console.error("Get user by ID error:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
}

const updateMyProfile = async (req, res) => {
  try {
    const allowed = ["firstName", "lastName", "bio", "location", "experience", "timezone", "skills"]
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    if (updates.skills && !Array.isArray(updates.skills)) {
      updates.skills = String(updates.skills).split(",").map((v) => v.trim()).filter(Boolean).slice(0, 30)
    }
    if (updates.experience !== undefined) updates.experience = Number(updates.experience)
    if (req.body.github !== undefined || req.body.linkedin !== undefined || req.body.twitter !== undefined) {
      updates.socialLinks = {
        github: String(req.body.github || "").trim(),
        linkedin: String(req.body.linkedin || "").trim(),
        twitter: String(req.body.twitter || "").trim(),
      }
    }
    if (req.file) updates.profileImage = `/uploads/${req.file.filename}`

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select(publicProjection)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json({ user })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(400).json({ error: error.message || "Failed to update profile" })
  }
}

module.exports = { getUsers, getUserById, searchCandidates, updateMyProfile };

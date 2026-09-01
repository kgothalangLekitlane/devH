const User = require("../models/User")
const mongoose = require("mongoose")
const { GridFSBucket, ObjectId } = require("mongodb")

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const publicProjection = "-password -email"

const toPublicUser = (user) => {
  const value = user?.toObject ? user.toObject() : { ...user }
  if (value.profileImage?.startsWith("gridfs:")) value.profileImage = `/api/users/${value._id}/avatar`
  value.profileViewCount = Array.isArray(value.profileViews) ? value.profileViews.length : 0
  delete value.profileViews
  delete value.email
  delete value.password
  return value
}

const searchCandidates = async (req, res) => {
  try {
    const { q, skill, location, experience } = req.query
    const query = {}
    const text = String(q || "").trim().slice(0, 100)
    if (text) {
      const pattern = { $regex: escapeRegex(text), $options: "i" }
      query.$or = [{ firstName: pattern }, { lastName: pattern }, { username: pattern }, { skills: pattern }]
    }
    if (skill) query.skills = { $regex: escapeRegex(String(skill).trim().slice(0, 50)), $options: "i" }
    if (location) query.location = { $regex: escapeRegex(String(location).trim().slice(0, 120)), $options: "i" }
    if (experience !== undefined && experience !== "") {
      const years = Number(experience)
      if (!Number.isFinite(years) || years < 0 || years > 80) return res.status(400).json({ message: "Experience must be between 0 and 80 years." })
      query.experience = { $gte: years }
    }
    const candidates = await User.find(query, publicProjection).sort({ createdAt: -1 }).limit(50)
    res.json({ candidates: candidates.map(toPublicUser) })
  } catch (err) {
    console.error("Search users error:", err)
    res.status(400).json({ message: "Unable to search users" })
  }
}

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, publicProjection).sort({ createdAt: -1 }).limit(100)
    res.json(users.map(toPublicUser))
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
    res.json(toPublicUser(user))
  } catch (error) {
    console.error("Get user by ID error:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
}

const recordProfileView = async (req, res) => {
  try {
    const targetId = String(req.params.id)
    if (!mongoose.Types.ObjectId.isValid(targetId)) return res.status(400).json({ error: "Invalid user ID" })
    const viewerId = String(req.user.id)
    if (viewerId === targetId) return res.json({ viewed: false, count: 0 })
    const user = await User.findByIdAndUpdate(targetId, { $addToSet: { profileViews: new mongoose.Types.ObjectId(viewerId) } }, { new: true }).select(publicProjection)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json({ viewed: true, count: Array.isArray(user.profileViews) ? user.profileViews.length : 0 })
  } catch (error) {
    console.error("Record profile view error:", error)
    res.status(500).json({ error: "Failed to record profile view" })
  }
}

const getAvatar = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid user ID" })
    const user = await User.findById(req.params.id, "profileImage")
    if (!user?.profileImage) return res.status(404).json({ error: "Profile image not found" })
    const fileId = user.profileImage.startsWith("gridfs:") ? user.profileImage.slice(7) : null
    if (!fileId || !ObjectId.isValid(fileId)) return res.status(404).json({ error: "Profile image not found" })
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "profileImages" })
    const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray()
    if (!files.length) return res.status(404).json({ error: "Profile image not found" })
    res.set("Content-Type", files[0].contentType || "image/jpeg")
    res.set("Cache-Control", "no-store")
    bucket.openDownloadStream(new ObjectId(fileId)).on("error", () => { if (!res.headersSent) res.status(404).end() }).pipe(res)
  } catch (error) {
    console.error("Get avatar error:", error)
    res.status(500).json({ error: "Failed to fetch profile image" })
  }
}

const updateMyProfile = async (req, res) => {
  try {
    const allowed = ["firstName", "lastName", "bio", "location", "experience", "timezone", "skills"]
    const updates = {}
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key]
    if (updates.skills && !Array.isArray(updates.skills)) updates.skills = String(updates.skills).split(",").map(v => v.trim()).filter(Boolean).slice(0, 30)
    if (updates.experience !== undefined) {
      updates.experience = Number(updates.experience)
      if (!Number.isFinite(updates.experience) || updates.experience < 0 || updates.experience > 80) return res.status(400).json({ error: "Experience must be between 0 and 80 years." })
    }
    if (["github", "linkedin", "twitter", "website"].some(key => req.body[key] !== undefined)) {
      const current = await User.findById(req.user.id, "socialLinks")
      const links = {
        github: String(req.body.github ?? current?.socialLinks?.github ?? "").trim(),
        linkedin: String(req.body.linkedin ?? current?.socialLinks?.linkedin ?? "").trim(),
        twitter: String(req.body.twitter ?? current?.socialLinks?.twitter ?? "").trim(),
        website: String(req.body.website ?? current?.socialLinks?.website ?? "").trim(),
      }
      for (const [key, value] of Object.entries(links)) {
        if (!value) continue
        try {
          const parsed = new URL(value)
          if (!["http:", "https:"].includes(parsed.protocol)) throw new Error()
        } catch {
          return res.status(400).json({ error: `${key} must be a valid HTTP or HTTPS URL.` })
        }
      }
      updates.socialLinks = links
    }
    if (req.file?.buffer) {
      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "profileImages" })
      const filename = `${req.user.id}-${Date.now()}`
      const uploadStream = bucket.openUploadStream(filename, { contentType: req.file.mimetype, metadata: { userId: req.user.id } })
      await new Promise((resolve, reject) => { uploadStream.on("finish", resolve).on("error", reject); uploadStream.end(req.file.buffer) })
      updates.profileImage = `gridfs:${uploadStream.id.toString()}`
    }
    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select(publicProjection)
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json({ user: toPublicUser(user) })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(400).json({ error: error.message || "Failed to update profile" })
  }
}

module.exports = { getUsers, getUserById, getAvatar, searchCandidates, updateMyProfile, recordProfileView };

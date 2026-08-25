const User = require("../models/User")
const mongoose = require("mongoose")
const { GridFSBucket, ObjectId } = require("mongodb")

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const publicProjection = "-password"

const searchCandidates = async (req, res) => {
  try {
    const { q, skill, location, experience } = req.query
    const query = {}
    const text = String(q || "").trim()
    if (text) {
      const pattern = { $regex: escapeRegex(text), $options: "i" }
      query.$or = [{ firstName: pattern }, { lastName: pattern }, { username: pattern }, { email: pattern }, { skills: pattern }]
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
    res.set("Cache-Control", "public, max-age=3600")
    bucket.openDownloadStream(new ObjectId(fileId)).on("error", () => {
      if (!res.headersSent) res.status(404).end()
    }).pipe(res)
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
    if (updates.experience !== undefined) updates.experience = Number(updates.experience)

    if (["github", "linkedin", "twitter", "website"].some(key => req.body[key] !== undefined)) {
      const current = await User.findById(req.user.id, "socialLinks")
      updates.socialLinks = {
        github: String(req.body.github ?? current?.socialLinks?.github ?? "").trim(),
        linkedin: String(req.body.linkedin ?? current?.socialLinks?.linkedin ?? "").trim(),
        twitter: String(req.body.twitter ?? current?.socialLinks?.twitter ?? "").trim(),
        website: String(req.body.website ?? current?.socialLinks?.website ?? "").trim(),
      }
    }

    if (req.file?.buffer) {
      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "profileImages" })
      const filename = `${req.user.id}-${Date.now()}`
      const uploadStream = bucket.openUploadStream(filename, { contentType: req.file.mimetype, metadata: { userId: req.user.id } })
      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve).on("error", reject)
        uploadStream.end(req.file.buffer)
      })
      updates.profileImage = `gridfs:${uploadStream.id.toString()}`
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select(publicProjection)
    if (!user) return res.status(404).json({ error: "User not found" })
    user.profileImage = user.profileImage?.startsWith("gridfs:") ? `/api/users/${user._id}/avatar` : user.profileImage
    res.json({ user })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(400).json({ error: error.message || "Failed to update profile" })
  }
}

module.exports = { getUsers, getUserById, getAvatar, searchCandidates, updateMyProfile };

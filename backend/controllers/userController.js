const User = require("../models/User")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const { GridFSBucket, ObjectId } = require("mongodb")

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const publicProjection = "-password -email"

const normalizeUrl = (value) => {
  const input = String(value ?? "").trim()
  if (!input) return ""
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`
  try {
    const url = new URL(withProtocol)
    if (!["http:", "https:"].includes(url.protocol)) return ""
    return url.toString()
  } catch {
    return ""
  }
}

const extractGithubUsername = (value) => {
  const input = String(value ?? "").trim().replace(/^@/, "")
  if (!input) return ""
  if (/^[A-Za-z0-9-]{1,39}$/.test(input)) return input
  const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`
  try {
    const url = new URL(candidate)
    if (!/^github\.com$/i.test(url.hostname)) return ""
    const parts = url.pathname.split("/").filter(Boolean)
    if (parts.length !== 1 || !/^[A-Za-z0-9-]{1,39}$/.test(parts[0])) return ""
    return parts[0]
  } catch {
    return ""
  }
}

const normalizeGithubUrl = (value) => {
  const input = String(value ?? "").trim()
  if (!input) return ""
  const username = extractGithubUsername(input)
  return username ? `https://github.com/${username}` : null
}

const toPublicUser = (user) => {
  const value = user?.toObject ? user.toObject() : { ...user }
  const id = String(value._id ?? value.id ?? "")
  if (value.profileImage?.startsWith("gridfs:")) value.profileImage = `/api/users/${id}/avatar`
  value.id = id
  delete value._id
  value.profileViewCount = Array.isArray(value.profileViews) ? value.profileViews.length : 0
  delete value.profileViews
  delete value.email
  delete value.password
  return value
}

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured")
  return process.env.JWT_SECRET
}

const issueSessionToken = (userId) => jwt.sign({ id: String(userId) }, getJwtSecret(), { expiresIn: "2h" })

const storeProfileImage = async (file, userId) => {
  if (!file?.buffer) return null
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) throw new Error("Database is not ready for profile image upload")
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "profileImages" })
  const filename = `${userId}-${Date.now()}`
  const uploadStream = bucket.openUploadStream(filename, { contentType: file.mimetype, metadata: { userId: String(userId) } })
  await new Promise((resolve, reject) => { uploadStream.on("finish", resolve).on("error", reject); uploadStream.end(file.buffer) })
  return `gridfs:${uploadStream.id.toString()}`
}

const deleteGridFsImage = async (profileImage) => {
  if (!profileImage?.startsWith("gridfs:")) return
  const fileId = profileImage.slice(7)
  if (!ObjectId.isValid(fileId) || mongoose.connection.readyState !== 1 || !mongoose.connection.db) return
  try {
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "profileImages" })
    await bucket.delete(new ObjectId(fileId))
  } catch (error) {
    console.error("Delete old avatar error:", error)
  }
}

const searchCandidates = async (req, res) => {
  try {
    const { q, skill, location, experience } = req.query
    const query = {}
    const text = String(q || "").trim()
    if (text) {
      const pattern = { $regex: escapeRegex(text), $options: "i" }
      query.$or = [{ firstName: pattern }, { lastName: pattern }, { username: pattern }, { headline: pattern }, { skills: pattern }]
    }
    if (skill) query.skills = { $regex: escapeRegex(String(skill)), $options: "i" }
    if (location) query.location = { $regex: escapeRegex(String(location)), $options: "i" }
    if (experience !== undefined && experience !== "") {
      const minimumExperience = Number(experience)
      if (!Number.isFinite(minimumExperience) || minimumExperience < 0) return res.status(400).json({ error: "Experience must be a non-negative number" })
      query.experience = { $gte: minimumExperience }
    }
    const candidates = await User.find(query, publicProjection).sort({ createdAt: -1 }).limit(50)
    res.json({ candidates: candidates.map(toPublicUser) })
  } catch (err) {
    console.error("Search users error:", err)
    res.status(500).json({ error: "Failed to search users" })
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

const getMyNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "emailNotifications")
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json({ emailNotifications: { messages: user.emailNotifications?.messages !== false } })
  } catch (error) {
    console.error("Get notification preferences error:", error)
    res.status(500).json({ error: "Failed to fetch notification preferences" })
  }
}

const updateMyNotificationPreferences = async (req, res) => {
  try {
    const messages = req.body?.emailNotifications?.messages
    if (typeof messages !== "boolean") return res.status(400).json({ error: "emailNotifications.messages must be a boolean" })
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { "emailNotifications.messages": messages } }, { new: true, runValidators: true }).select("emailNotifications")
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json({ message: "Notification preferences updated", emailNotifications: { messages: user.emailNotifications?.messages !== false } })
  } catch (error) {
    console.error("Update notification preferences error:", error)
    res.status(400).json({ error: error.message || "Failed to update notification preferences" })
  }
}

const updateMyProfile = async (req, res) => {
  try {
    const allowed = ["firstName", "lastName", "headline", "currentRole", "bio", "location", "experience", "timezone", "skills", "openToWork", "workPreference", "preferredLocation", "salaryExpectation"]
    const updates = {}
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key]
    if (updates.skills && !Array.isArray(updates.skills)) updates.skills = String(updates.skills).split(",").map(v => v.trim()).filter(Boolean).slice(0, 30)
    if (updates.experience !== undefined) {
      const experience = Number(updates.experience)
      if (!Number.isFinite(experience) || experience < 0 || experience > 80) return res.status(400).json({ error: "Experience must be between 0 and 80" })
      updates.experience = experience
    }
    if (updates.openToWork !== undefined) updates.openToWork = String(updates.openToWork) === "true" || updates.openToWork === true
    if (updates.workPreference !== undefined && !["remote", "hybrid", "onsite", "flexible", ""].includes(String(updates.workPreference))) return res.status(400).json({ error: "Invalid work preference" })

    if (req.body.github !== undefined) {
      const github = normalizeGithubUrl(req.body.github)
      if (github === null) return res.status(400).json({ error: "Enter a valid GitHub profile URL, for example https://github.com/username" })
      const current = await User.findById(req.user.id, "socialLinks")
      updates.socialLinks = {
        github,
        linkedin: req.body.linkedin !== undefined ? normalizeUrl(req.body.linkedin) : String(current?.socialLinks?.linkedin || ""),
        twitter: req.body.twitter !== undefined ? normalizeUrl(req.body.twitter) : String(current?.socialLinks?.twitter || ""),
        website: req.body.website !== undefined ? normalizeUrl(req.body.website) : String(current?.socialLinks?.website || ""),
      }
    } else if (["linkedin", "twitter", "website"].some(key => req.body[key] !== undefined)) {
      const current = await User.findById(req.user.id, "socialLinks")
      updates.socialLinks = {
        github: String(current?.socialLinks?.github || ""),
        linkedin: req.body.linkedin !== undefined ? normalizeUrl(req.body.linkedin) : String(current?.socialLinks?.linkedin || ""),
        twitter: req.body.twitter !== undefined ? normalizeUrl(req.body.twitter) : String(current?.socialLinks?.twitter || ""),
        website: req.body.website !== undefined ? normalizeUrl(req.body.website) : String(current?.socialLinks?.website || ""),
      }
    }

    let previousProfileImage = null
    if (req.file?.buffer) {
      const current = await User.findById(req.user.id, "profileImage")
      previousProfileImage = current?.profileImage || null
      updates.profileImage = await storeProfileImage(req.file, req.user.id)
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true }).select("-password")
    if (!user) return res.status(404).json({ error: "User not found" })

    if (updates.profileImage && previousProfileImage && previousProfileImage !== updates.profileImage) await deleteGridFsImage(previousProfileImage)

    // Rotate the access token after a successful profile mutation. This makes
    // the session deterministic even when the client arrived with a legacy
    // token that had a serialized MongoDB ObjectId.
    const token = issueSessionToken(user._id)
    res.json({ user: toPublicUser(user), token })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(400).json({ error: error.message || "Failed to update profile" })
  }
}

module.exports = { getUsers, getUserById, getAvatar, searchCandidates, updateMyProfile, recordProfileView, getMyNotificationPreferences, updateMyNotificationPreferences }

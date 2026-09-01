const mongoose = require("mongoose")
const Recruiter = require("../models/Recruiter")
const Job = require("../models/Job")

const createRecruiter = async (req, res) => {
  try {
    const { name, email, company } = req.body
    if (!name || !email) return res.status(400).json({ message: "Name and email are required" })
    const recruiter = new Recruiter({ owner: req.user.id, name: String(name).trim(), email: String(email).trim().toLowerCase(), company: company ? String(company).trim() : undefined })
    await recruiter.save()
    res.status(201).json({ recruiter })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Recruiter with this email already exists" })
    res.status(400).json({ message: err.message })
  }
}

const postJob = async (req, res) => {
  try {
    const { title, description, recruiterId, location, type, remote, skills, salaryMin, salaryMax } = req.body || {}
    if (!title || !description || !recruiterId) return res.status(400).json({ message: "Title, description, and recruiterId are required" })
    if (!mongoose.Types.ObjectId.isValid(recruiterId)) return res.status(400).json({ message: "Invalid recruiterId" })
    const recruiter = await Recruiter.findOne({ _id: recruiterId, owner: req.user.id })
    if (!recruiter) return res.status(403).json({ message: "You do not own this recruiter profile" })
    const normalizedSkills = Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 30) : []
    const min = salaryMin === "" || salaryMin == null ? undefined : Number(salaryMin)
    const max = salaryMax === "" || salaryMax == null ? undefined : Number(salaryMax)
    if (min != null && (!Number.isFinite(min) || min < 0) || max != null && (!Number.isFinite(max) || max < 0) || min != null && max != null && min > max) return res.status(400).json({ message: "Invalid salary range" })
    const job = new Job({ title: String(title).trim(), description: String(description).trim(), recruiter: recruiterId, company: recruiter.company, location: location ? String(location).trim() : undefined, type: type || "full-time", remote: Boolean(remote), skills: normalizedSkills, salaryMin: min, salaryMax: max })
    await job.save()
    recruiter.jobs.push(job._id)
    await recruiter.save()
    await job.populate("recruiter", "name company")
    res.status(201).json({ job })
  } catch (err) { res.status(400).json({ message: err.message }) }
}

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("recruiter", "name company").sort({ createdAt: -1 }).limit(100)
    res.json({ jobs })
  } catch (err) { res.status(500).json({ message: "Failed to fetch jobs" }) }
}

const getRecruiters = async (req, res) => {
  try {
    const recruiters = await Recruiter.find().select("name email company jobs createdAt").sort({ createdAt: -1 }).limit(100)
    res.json({ recruiters })
  } catch (err) { res.status(500).json({ message: "Failed to fetch recruiters" }) }
}

module.exports = { getRecruiters, createRecruiter, postJob, getJobs }

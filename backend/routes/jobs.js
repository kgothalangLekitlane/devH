const express = require("express")
const mongoose = require("mongoose")
const Job = require("../models/Job")
const Application = require("../models/Application")
const ApplicationEvent = require("../models/ApplicationEvent")
const SavedJob = require("../models/SavedJob")
const authenticate = require("../middleware/authMiddleware")

const router = express.Router()
const validId = (id) => mongoose.Types.ObjectId.isValid(id)

router.get("/", async (req, res) => {
  try {
    const { q, location, type, remote, skill } = req.query
    const filter = {}
    if (q) filter.$or = [{ title: new RegExp(String(q).trim(), "i") }, { description: new RegExp(String(q).trim(), "i") }]
    if (location) filter.location = new RegExp(String(location).trim(), "i")
    if (type) filter.type = String(type)
    if (remote === "true") filter.remote = true
    if (skill) filter.skills = { $regex: String(skill).trim(), $options: "i" }
    const jobs = await Job.find(filter).populate("recruiter", "name company").sort({ createdAt: -1 }).limit(100).lean()
    res.json({ jobs })
  } catch (err) { res.status(500).json({ message: "Failed to fetch jobs" }) }
})

router.get("/saved", authenticate, async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user.id }).populate({ path: "job", populate: { path: "recruiter", select: "name company" } }).sort({ createdAt: -1 }).lean()
    res.json({ jobs: saved.map((item) => item.job).filter(Boolean) })
  } catch (err) { res.status(500).json({ message: "Failed to fetch saved jobs" }) }
})

router.post("/:jobId/save", authenticate, async (req, res) => {
  try {
    if (!validId(req.params.jobId)) return res.status(400).json({ message: "Invalid job id" })
    const job = await Job.findById(req.params.jobId)
    if (!job) return res.status(404).json({ message: "Job not found" })
    const existing = await SavedJob.findOne({ job: job._id, user: req.user.id })
    if (existing) { await existing.deleteOne(); return res.json({ saved: false }) }
    await SavedJob.create({ job: job._id, user: req.user.id })
    res.status(201).json({ saved: true })
  } catch (err) { res.status(400).json({ message: err.code === 11000 ? "Job already saved" : err.message }) }
})

router.post("/:jobId/apply", authenticate, async (req, res) => {
  try {
    if (!validId(req.params.jobId)) return res.status(400).json({ message: "Invalid job id" })
    const { coverLetter = "", resumeUrl = "" } = req.body || {}
    const job = await Job.findById(req.params.jobId)
    if (!job) return res.status(404).json({ message: "Job not found" })
    const application = await Application.create({ job: job._id, applicant: req.user.id, coverLetter: String(coverLetter), resumeUrl: String(resumeUrl) })
    await ApplicationEvent.create({ application: application._id, status: "submitted" })
    await job.updateOne({ $addToSet: { applicants: req.user.id } })
    await application.populate([{ path: "job", populate: { path: "recruiter", select: "name company" } }, { path: "applicant", select: "firstName lastName username profileImage" }])
    res.status(201).json({ application })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "You have already applied for this job" })
    res.status(400).json({ message: err.message })
  }
})

router.get("/applications/me", authenticate, async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user.id }).populate({ path: "job", populate: { path: "recruiter", select: "name company" } }).sort({ updatedAt: -1 }).lean()
    const counts = applications.reduce((acc, item) => { acc.total += 1; acc[item.status] = (acc[item.status] || 0) + 1; return acc }, { total: 0, submitted: 0, reviewing: 0, shortlisted: 0, rejected: 0, accepted: 0, withdrawn: 0 })
    res.json({ applications, stats: counts })
  } catch (err) { res.status(500).json({ message: "Failed to fetch applications" }) }
})

router.get("/applications/:id", authenticate, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid application id" })
    const application = await Application.findOne({ _id: req.params.id, applicant: req.user.id }).populate({ path: "job", populate: { path: "recruiter", select: "name company" } })
    if (!application) return res.status(404).json({ message: "Application not found" })
    const events = await ApplicationEvent.find({ application: application._id }).sort({ createdAt: 1 }).lean()
    res.json({ application, events })
  } catch (err) { res.status(500).json({ message: "Failed to fetch application" }) }
})

router.post("/applications/:id/withdraw", authenticate, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid application id" })
    const application = await Application.findOne({ _id: req.params.id, applicant: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found" })
    if (["rejected", "accepted", "withdrawn"].includes(application.status)) return res.status(409).json({ message: "This application can no longer be withdrawn" })
    application.status = "withdrawn"
    await application.save()
    await ApplicationEvent.create({ application: application._id, status: "withdrawn", note: "Application withdrawn by candidate" })
    res.json({ application })
  } catch (err) { res.status(400).json({ message: err.message }) }
})

module.exports = router

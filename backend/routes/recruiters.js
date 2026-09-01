const express = require("express")
const mongoose = require("mongoose")
const router = express.Router()
const { getRecruiters, createRecruiter, postJob, getJobs } = require("../controllers/recruiterController")
const Recruiter = require("../models/Recruiter")
const Job = require("../models/Job")
const Application = require("../models/Application")
const ApplicationEvent = require("../models/ApplicationEvent")
const Notification = require("../models/Notification")
const authenticate = require("../middleware/authMiddleware")

const validId = (id) => mongoose.Types.ObjectId.isValid(id)
const recruiterForUser = (userId, recruiterId) => Recruiter.findOne({ _id: recruiterId, owner: userId })

router.get("/", getRecruiters)
router.post("/register", authenticate, createRecruiter)
router.post("/jobs", authenticate, postJob)
router.get("/jobs", getJobs)

router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const recruiters = await Recruiter.find({ owner: req.user.id }).select("name email company jobs createdAt").lean()
    const recruiterIds = recruiters.map((r) => r._id)
    const jobs = await Job.find({ recruiter: { $in: recruiterIds } }).sort({ createdAt: -1 }).lean()
    const jobIds = jobs.map((j) => j._id)
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate("applicant", "firstName lastName username profileImage skills location experience bio")
      .populate("job", "title company location type remote status")
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean()
    const stats = applications.reduce((acc, item) => {
      acc.total += 1
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, { total: 0, submitted: 0, reviewing: 0, shortlisted: 0, rejected: 0, accepted: 0, withdrawn: 0 })
    res.json({ recruiters, jobs, applications, stats })
  } catch (err) {
    res.status(500).json({ message: "Failed to load recruiter dashboard" })
  }
})

router.get("/jobs/:jobId/applications", authenticate, async (req, res) => {
  try {
    if (!validId(req.params.jobId)) return res.status(400).json({ message: "Invalid job id" })
    const job = await Job.findById(req.params.jobId).populate("recruiter", "name company owner")
    if (!job) return res.status(404).json({ message: "Job not found" })
    if (!job.recruiter || String(job.recruiter.owner) !== String(req.user.id)) return res.status(403).json({ message: "You do not own this job" })
    const applications = await Application.find({ job: job._id })
      .populate("applicant", "firstName lastName username profileImage skills location experience bio socialLinks")
      .sort({ updatedAt: -1 }).lean()
    res.json({ job, applications })
  } catch (err) { res.status(500).json({ message: "Failed to fetch applicants" }) }
})

router.patch("/applications/:id/status", authenticate, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid application id" })
    const { status, note = "" } = req.body || {}
    const allowed = ["submitted", "reviewing", "shortlisted", "rejected", "accepted"]
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid application status" })
    const application = await Application.findById(req.params.id).populate("job", "title recruiter")
    if (!application) return res.status(404).json({ message: "Application not found" })
    const recruiter = await Recruiter.findOne({ _id: application.job.recruiter, owner: req.user.id })
    if (!recruiter) return res.status(403).json({ message: "You do not own this job" })
    if (application.status === "withdrawn") return res.status(409).json({ message: "A withdrawn application cannot be changed" })
    const previous = application.status
    application.status = status
    await application.save()
    await ApplicationEvent.create({ application: application._id, status, note: String(note).trim().slice(0, 1000) })
    await Notification.create({ recipient: application.applicant, sender: req.user.id, type: "application_status", text: `Your application for ${application.job.title} is now ${status}.`, link: `/applications/${application._id}` })
    res.json({ application, previousStatus: previous })
  } catch (err) { res.status(400).json({ message: err.message }) }
})

module.exports = router

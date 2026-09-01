const mongoose = require("mongoose")

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coverLetter: { type: String, trim: true, maxlength: 5000, default: "" },
  resumeUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["submitted", "reviewing", "shortlisted", "rejected", "accepted", "withdrawn"], default: "submitted" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true })
applicationSchema.index({ applicant: 1, status: 1, updatedAt: -1 })
applicationSchema.pre("save", function(next) { this.updatedAt = new Date(); next() })

module.exports = mongoose.model("Application", applicationSchema)

const mongoose = require("mongoose")

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 10000 },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter", required: true, index: true },
  company: { type: String, trim: true, maxlength: 160 },
  location: { type: String, trim: true, maxlength: 160 },
  type: { type: String, enum: ["full-time", "part-time", "contract", "internship", "freelance"], default: "full-time" },
  remote: { type: Boolean, default: false },
  skills: [{ type: String, trim: true, maxlength: 60 }],
  salaryMin: { type: Number, min: 0 },
  salaryMax: { type: Number, min: 0 },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["open", "closed"], default: "open", index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

jobSchema.index({ status: 1, createdAt: -1 })
jobSchema.index({ recruiter: 1, createdAt: -1 })
jobSchema.index({ title: "text", description: "text", company: "text", skills: "text" })
jobSchema.pre("save", function(next) { this.updatedAt = new Date(); next() })

module.exports = mongoose.model("Job", jobSchema)

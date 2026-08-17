const mongoose = require("mongoose")

const recruiterSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  company: { type: String, trim: true, maxlength: 160 },
  jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  createdAt: { type: Date, default: Date.now }
})

const Recruiter = mongoose.model("Recruiter", recruiterSchema)

module.exports = Recruiter

const mongoose = require("mongoose")

const savedJobSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
})

savedJobSchema.index({ job: 1, user: 1 }, { unique: true })

module.exports = mongoose.model("SavedJob", savedJobSchema)

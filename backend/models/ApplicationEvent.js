const mongoose = require("mongoose")

const applicationEventSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
  status: { type: String, enum: ["submitted", "reviewing", "shortlisted", "rejected", "accepted", "withdrawn"], required: true },
  note: { type: String, trim: true, maxlength: 1000, default: "" },
  createdAt: { type: Date, default: Date.now }
})

applicationEventSchema.index({ application: 1, createdAt: -1 })

module.exports = mongoose.model("ApplicationEvent", applicationEventSchema)

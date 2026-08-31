const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["like", "comment", "connection", "message", "system"], required: true },
  text: { type: String, required: true, trim: true, maxlength: 300 },
  link: { type: String, trim: true, maxlength: 500 },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true })

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, createdAt: -1 })

module.exports = mongoose.model("Notification", notificationSchema)

const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  text: { type: String, required: true, trim: true, maxlength: 5000 },
  read: { type: Boolean, default: false, index: true },
  deliveredAt: { type: Date, default: null },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
})

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 })
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: -1 })
messageSchema.index({ receiverId: 1, read: 1, createdAt: -1 })

const Message = mongoose.model("Message", messageSchema)

module.exports = Message

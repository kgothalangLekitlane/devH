const mongoose = require("mongoose")
const Message = require("../models/Message")
const User = require("../models/User")
const Notification = require("../models/Notification")

const populateMessageQuery = (query) => query
  .populate("senderId", "firstName lastName username profileImage")
  .populate("receiverId", "firstName lastName username profileImage")

const populateMessageDocument = async (message) => {
  await message.populate([
    { path: "senderId", select: "firstName lastName username profileImage" },
    { path: "receiverId", select: "firstName lastName username profileImage" },
  ])
  return message.toObject()
}

const createMessageNotification = async ({ recipient, sender, link }) => {
  if (!recipient || String(recipient) === String(sender)) return
  try {
    const notification = await Notification.create({ recipient, sender, type: "message", text: "sent you a message", link })
    const io = global.__devheaven_io
    if (io) io.to(`user:${recipient}`).emit("notification", notification.toObject())
  } catch (error) {
    console.error("Create message notification error:", error)
  }
}

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100)
    const messages = await populateMessageQuery(Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] }))
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean()
    res.json({ messages, page, limit })
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ error: "Failed to fetch messages" })
  }
}

const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiverId: req.user.id, read: false })
    res.json({ count })
  } catch (error) {
    console.error("Get unread message count error:", error)
    res.status(500).json({ error: "Failed to fetch unread message count" })
  }
}

const markConversationRead = async (req, res) => {
  try {
    const userId = req.user.id
    const otherUserId = req.params.userId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) return res.status(400).json({ error: "Invalid user ID" })
    const readAt = new Date()
    const result = await Message.updateMany(
      { senderId: otherUserId, receiverId: userId, read: false },
      { $set: { read: true, readAt } },
    )
    const io = global.__devheaven_io
    if (io && result.modifiedCount) {
      io.to(`user:${otherUserId}`).emit("messagesRead", { userId, readAt })
    }
    res.json({ message: "Conversation marked as read", modifiedCount: result.modifiedCount, readAt })
  } catch (error) {
    console.error("Mark conversation read error:", error)
    res.status(500).json({ error: "Failed to mark conversation as read" })
  }
}

const getMessagesWithUser = async (req, res) => {
  try {
    const userId = req.user.id
    const otherUserId = req.params.userId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) return res.status(400).json({ error: "Invalid user ID" })
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100)
    const messages = await populateMessageQuery(Message.find({ $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ] }))
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean()
    res.json({ messages: messages.reverse(), page, limit })
  } catch (error) {
    console.error("Get messages with user error:", error)
    res.status(500).json({ error: "Failed to fetch conversation" })
  }
}

const postMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body
    const senderId = req.user.id
    if (!receiverId || typeof text !== "string") return res.status(400).json({ error: "Receiver ID and text are required" })
    if (!mongoose.Types.ObjectId.isValid(receiverId)) return res.status(400).json({ error: "Invalid receiver ID" })
    if (String(receiverId) === String(senderId)) return res.status(400).json({ error: "You cannot message yourself" })
    const trimmedText = text.trim()
    if (!trimmedText || trimmedText.length > 5000) return res.status(400).json({ error: "Message text must be between 1 and 5000 characters" })
    const receiver = await User.findById(receiverId).select("_id")
    if (!receiver) return res.status(404).json({ error: "Receiver not found" })

    const message = await Message.create({ senderId, receiverId, text: trimmedText, deliveredAt: new Date() })
    const chat = await populateMessageDocument(message)
    const io = global.__devheaven_io
    if (io) io.to(`user:${receiverId}`).emit("message", chat)

    await createMessageNotification({ recipient: receiverId, sender: senderId, link: `/messages?user=${receiverId}` })
    res.status(201).json({ message: "Message sent", chat })
  } catch (error) {
    console.error("Post message error:", error)
    res.status(500).json({ error: "Failed to send message" })
  }
}

module.exports = { getMessages, getUnreadCount, markConversationRead, getMessagesWithUser, postMessage }

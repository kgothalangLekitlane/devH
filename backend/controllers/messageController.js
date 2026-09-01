const mongoose = require("mongoose")
const Message = require("../models/Message")
const User = require("../models/User")
const Notification = require("../models/Notification")

const populateMessage = (query) => query
  .populate("senderId", "firstName lastName username profileImage")
  .populate("receiverId", "firstName lastName username profileImage")

const createMessageNotification = async ({ recipient, sender, link }) => {
  if (!recipient || String(recipient) === String(sender)) return
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type: "message",
      text: "sent you a message",
      link,
    })

    const io = global.__devheaven_io
    if (io) io.to(`user:${recipient}`).emit("notification", notification)
  } catch (error) {
    // Notification failure must never prevent the message itself from being sent.
    console.error("Create message notification error:", error)
  }
}

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100)
    const skip = (page - 1) * limit

    const messages = await populateMessage(Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

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

    const result = await Message.updateMany(
      { senderId: otherUserId, receiverId: userId, read: false },
      { $set: { read: true } }
    )

    res.json({ message: "Conversation marked as read", modifiedCount: result.modifiedCount })
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
    const skip = (page - 1) * limit

    const messages = await populateMessage(Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

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

    const message = await populateMessage(Message.create({ senderId, receiverId, text: trimmedText }))
    const chat = await message.lean()

    const io = global.__devheaven_io
    if (io) {
      io.to(`user:${receiverId}`).emit("message", chat)
      io.to(`conversation:${[String(senderId), String(receiverId)].sort().join(":")}`).emit("message", chat)
    }

    await createMessageNotification({
      recipient: receiverId,
      sender: senderId,
      link: `/messages?user=${receiverId}`,
    })

    res.status(201).json({ message: "Message sent", chat })
  } catch (error) {
    console.error("Post message error:", error)
    res.status(500).json({ error: "Failed to send message" })
  }
}

module.exports = { getMessages, getUnreadCount, markConversationRead, getMessagesWithUser, postMessage }

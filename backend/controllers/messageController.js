const mongoose = require("mongoose")
const Message = require("../models/Message")
const User = require("../models/User")

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100)
    const skip = (page - 1) * limit

    const messages = await Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] })
      .populate("senderId", "firstName lastName username")
      .populate("receiverId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.json({ messages, page, limit })
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ error: "Failed to fetch messages" })
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

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    })
      .populate("senderId", "firstName lastName username")
      .populate("receiverId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

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
    if (!receiverId || !text) return res.status(400).json({ error: "Receiver ID and text are required" })
    if (!mongoose.Types.ObjectId.isValid(receiverId)) return res.status(400).json({ error: "Invalid receiver ID" })
    if (String(receiverId) === String(senderId)) return res.status(400).json({ error: "You cannot message yourself" })

    const trimmedText = String(text).trim()
    if (!trimmedText || trimmedText.length > 5000) return res.status(400).json({ error: "Message text must be between 1 and 5000 characters" })

    const receiver = await User.findById(receiverId).select("_id")
    if (!receiver) return res.status(404).json({ error: "Receiver not found" })

    const message = await Message.create({ senderId, receiverId, text: trimmedText })
    await message.populate("senderId", "firstName lastName username")
    await message.populate("receiverId", "firstName lastName username")

    res.status(201).json({ message: "Message sent", chat: message })
  } catch (error) {
    console.error("Post message error:", error)
    res.status(500).json({ error: "Failed to send message" })
  }
}

module.exports = { getMessages, getMessagesWithUser, postMessage }

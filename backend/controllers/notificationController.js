const Notification = require("../models/Notification")

const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50)
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "firstName lastName username profileImage")
      .sort({ createdAt: -1 })
      .limit(limit)
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false })
    res.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ error: "Failed to fetch notifications" })
  }
}

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { $set: { read: true } })
    res.json({ message: "Notifications marked as read" })
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read" })
  }
}

const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { read: true } },
      { new: true }
    )
    if (!notification) return res.status(404).json({ error: "Notification not found" })
    res.json({ notification })
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read" })
  }
}

module.exports = { getNotifications, markAllRead, markRead }

const express = require("express")
const authenticate = require("../middleware/authMiddleware")
const { getNotifications, getUnreadCount, markAllRead, markRead } = require("../controllers/notificationController")

const router = express.Router()
router.use(authenticate)
router.get("/", getNotifications)
router.get("/unread/count", getUnreadCount)
router.patch("/read-all", markAllRead)
router.patch("/:id/read", markRead)

module.exports = router

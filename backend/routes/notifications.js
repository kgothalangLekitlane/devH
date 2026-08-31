const express = require("express")
const authenticate = require("../middleware/authMiddleware")
const { getNotifications, markAllRead, markRead } = require("../controllers/notificationController")

const router = express.Router()
router.use(authenticate)
router.get("/", getNotifications)
router.patch("/read-all", markAllRead)
router.patch("/:id/read", markRead)

module.exports = router

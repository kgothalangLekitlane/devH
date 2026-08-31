const express = require("express");
const router = express.Router();
const { getMessages, getUnreadCount, markConversationRead, getMessagesWithUser, postMessage } = require("../controllers/messageController");
const authenticate = require("../middleware/authMiddleware");

router.get("/", authenticate, getMessages);
router.get("/unread/count", authenticate, getUnreadCount);
router.patch("/:userId/read", authenticate, markConversationRead);
router.get("/:userId", authenticate, getMessagesWithUser);
router.post("/", authenticate, postMessage);

module.exports = router;

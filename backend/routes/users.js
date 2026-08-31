const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { getUsers, getUserById, getAvatar, searchCandidates, updateMyProfile, recordProfileView } = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");

router.get("/", authenticate, getUsers);
router.get("/search", authenticate, searchCandidates);
router.get("/:id/avatar", getAvatar);
router.post("/:id/view", authenticate, recordProfileView);
router.get("/:id", getUserById);
router.put("/me", authenticate, (req, res, next) => {
  upload.single("profile")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Invalid file upload" });
    next();
  });
}, updateMyProfile);

module.exports = router;

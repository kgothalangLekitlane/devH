const express = require("express");
const router = express.Router();
const { registerUser, loginUser, logoutUser, getCurrentUser } = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", (req, res, next) => {
  upload.single("profile")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Invalid file upload" });
    }
    next();
  });
}, registerUser);
router.post("/login", loginUser);
router.post("/logout", authenticate, logoutUser);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;

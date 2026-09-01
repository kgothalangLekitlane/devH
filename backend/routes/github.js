const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { getIdentity, getPublicIdentity } = require("../controllers/githubController");

router.get("/me", authenticate, getIdentity);
router.get("/user/:username", getPublicIdentity);

module.exports = router;

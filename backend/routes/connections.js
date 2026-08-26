const express = require("express");
const mongoose = require("mongoose");
const Connection = require("../models/Connection");
const User = require("../models/User");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/summary", authenticate, async (req, res) => {
  try {
    const count = await Connection.countDocuments({
      status: "accepted",
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
    });
    res.json({ count });
  } catch (error) {
    console.error("Get connection summary error:", error);
    res.status(500).json({ error: "Failed to fetch connection summary" });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
    })
      .populate("requester", "firstName lastName username profileImage")
      .populate("recipient", "firstName lastName username profileImage")
      .sort({ updatedAt: -1 });
    res.json({ connections });
  } catch (error) {
    console.error("List connections error:", error);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});

router.post("/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: "Invalid user ID" });
    if (String(userId) === String(req.user.id)) return res.status(400).json({ error: "You cannot connect with yourself" });
    const target = await User.findById(userId).select("_id");
    if (!target) return res.status(404).json({ error: "User not found" });

    const existing = await Connection.findOne({
      $or: [
        { requester: req.user.id, recipient: userId },
        { requester: userId, recipient: req.user.id },
      ],
    });
    if (existing) return res.status(409).json({ error: "A connection request already exists", connection: existing });

    const connection = await Connection.create({ requester: req.user.id, recipient: userId });
    res.status(201).json({ connection });
  } catch (error) {
    console.error("Create connection error:", error);
    res.status(500).json({ error: "Failed to create connection request" });
  }
});

router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid connection ID" });
    const connection = await Connection.findById(id);
    if (!connection) return res.status(404).json({ error: "Connection not found" });

    const isRequester = String(connection.requester) === String(req.user.id);
    const isRecipient = String(connection.recipient) === String(req.user.id);
    const status = String(req.body.status || "");

    if (!isRequester && !isRecipient) return res.status(403).json({ error: "Not authorized" });
    if (!["accepted", "rejected"].includes(status)) return res.status(400).json({ error: "Status must be accepted or rejected" });
    if (status === "accepted" && !isRecipient) return res.status(403).json({ error: "Only the recipient can accept a request" });

    connection.status = status;
    await connection.save();
    res.json({ connection });
  } catch (error) {
    console.error("Update connection error:", error);
    res.status(500).json({ error: "Failed to update connection" });
  }
});

module.exports = router;

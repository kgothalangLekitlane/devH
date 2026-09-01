const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Connection = require("../models/Connection");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

const publicFields = "firstName lastName username profileImage bio skills location experience socialLinks";

router.get("/suggestions", authenticate, async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("skills location experience").lean();
    if (!me) return res.status(404).json({ error: "User not found" });

    const connections = await Connection.find({ $or: [{ requester: req.user.id }, { recipient: req.user.id }] }).select("requester recipient status").lean();
    const excluded = new Set([String(req.user.id)]);
    connections.forEach((c) => {
      if (c.status === "accepted" || c.status === "pending") {
        excluded.add(String(c.requester));
        excluded.add(String(c.recipient));
      }
    });

    const candidates = await User.find({ _id: { $nin: [...excluded].filter((id) => mongoose.Types.ObjectId.isValid(id)) } }, publicFields).limit(100).lean();
    const mySkills = new Set((me.skills || []).map((s) => String(s).toLowerCase()));
    const scored = candidates.map((user) => {
      const skills = (user.skills || []).map((s) => String(s).toLowerCase());
      const sharedSkills = skills.filter((s) => mySkills.has(s)).length;
      const sameLocation = me.location && user.location && String(me.location).toLowerCase() === String(user.location).toLowerCase() ? 2 : 0;
      const experienceMatch = me.experience != null && user.experience != null && Math.abs(Number(me.experience) - Number(user.experience)) <= 2 ? 1 : 0;
      return { user, score: sharedSkills * 5 + sameLocation + experienceMatch, sharedSkills };
    }).sort((a, b) => b.score - a.score || String(a.user.firstName).localeCompare(String(b.user.firstName))).slice(0, 20);

    res.json({ suggestions: scored.map(({ user, sharedSkills }) => ({ ...user, sharedSkills })) });
  } catch (error) {
    console.error("Network suggestions error:", error);
    res.status(500).json({ error: "Failed to generate network suggestions" });
  }
});

module.exports = router;

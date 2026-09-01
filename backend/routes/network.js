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

    const q = String(req.query.q || "").trim();
    const location = String(req.query.location || "").trim();
    const skill = String(req.query.skill || "").trim();
    const experience = Number(req.query.experience);

    const relationships = await Connection.find({ $or: [{ requester: req.user.id }, { recipient: req.user.id }] })
      .select("requester recipient status")
      .lean();

    const excluded = new Set([String(req.user.id)]);
    const acceptedIds = new Set();
    relationships.forEach((c) => {
      const other = String(c.requester) === String(req.user.id) ? String(c.recipient) : String(c.requester);
      if (c.status === "accepted") acceptedIds.add(other);
      if (c.status === "accepted" || c.status === "pending") excluded.add(other);
    });

    const query = { _id: { $nin: [...excluded].filter((id) => mongoose.Types.ObjectId.isValid(id)) } };
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ firstName: regex }, { lastName: regex }, { username: regex }, { location: regex }, { skills: regex }];
    }
    if (location) query.location = new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (skill) query.skills = new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (Number.isFinite(experience)) query.experience = { $gte: Math.max(0, experience - 2), $lte: experience + 2 };

    const candidates = await User.find(query, publicFields).limit(100).lean();
    const candidateIds = candidates.map((u) => u._id);

    const mutualRows = acceptedIds.size && candidateIds.length
      ? await Connection.aggregate([
          { $match: { status: "accepted", $or: [{ requester: { $in: [...acceptedIds].filter(mongoose.Types.ObjectId.isValid) } }, { recipient: { $in: [...acceptedIds].filter(mongoose.Types.ObjectId.isValid) } }] } },
          { $project: { people: ["$requester", "$recipient"] } },
          { $unwind: "$people" },
          { $match: { people: { $in: candidateIds } } },
          { $group: { _id: "$people", count: { $sum: 1 } } },
        ])
      : [];
    const mutualMap = new Map(mutualRows.map((row) => [String(row._id), row.count]));

    const mySkills = new Set((me.skills || []).map((s) => String(s).toLowerCase()));
    const scored = candidates.map((user) => {
      const skills = (user.skills || []).map((s) => String(s).toLowerCase());
      const sharedSkills = skills.filter((s) => mySkills.has(s)).length;
      const sameLocation = me.location && user.location && String(me.location).toLowerCase() === String(user.location).toLowerCase() ? 2 : 0;
      const experienceMatch = me.experience != null && user.experience != null && Math.abs(Number(me.experience) - Number(user.experience)) <= 2 ? 1 : 0;
      const mutualConnections = mutualMap.get(String(user._id)) || 0;
      return { user, score: sharedSkills * 5 + mutualConnections * 4 + sameLocation + experienceMatch, sharedSkills, mutualConnections };
    }).sort((a, b) => b.score - a.score || b.mutualConnections - a.mutualConnections || String(a.user.firstName).localeCompare(String(b.user.firstName))).slice(0, 20);

    res.json({ suggestions: scored.map(({ user, sharedSkills, mutualConnections }) => ({ ...user, sharedSkills, mutualConnections })) });
  } catch (error) {
    console.error("Network suggestions error:", error);
    res.status(500).json({ error: "Failed to generate network suggestions" });
  }
});

router.get("/stats", authenticate, async (req, res) => {
  try {
    const accepted = await Connection.find({ status: "accepted", $or: [{ requester: req.user.id }, { recipient: req.user.id }] }).select("requester recipient").lean();
    const pending = await Connection.countDocuments({ status: "pending", recipient: req.user.id });
    const connectionIds = accepted.map((c) => String(c.requester) === String(req.user.id) ? c.recipient : c.requester);
    const people = connectionIds.length ? await Connection.find({ status: "accepted", $or: [{ requester: { $in: connectionIds } }, { recipient: { $in: connectionIds } }] }).select("requester recipient").lean() : [];
    const uniqueMutualCandidates = new Set();
    people.forEach((c) => {
      [c.requester, c.recipient].forEach((id) => {
        const value = String(id);
        if (value !== String(req.user.id) && !connectionIds.some((own) => String(own) === value)) uniqueMutualCandidates.add(value);
      });
    });
    res.json({ connections: accepted.length, pendingRequests: pending, extendedNetwork: uniqueMutualCandidates.size });
  } catch (error) {
    console.error("Network stats error:", error);
    res.status(500).json({ error: "Failed to load network statistics" });
  }
});

module.exports = router;

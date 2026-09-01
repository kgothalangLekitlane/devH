const User = require("../models/User");
const { getGithubProfile } = require("../services/githubService");

const getIdentity = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("socialLinks");
    const githubUrl = user?.socialLinks?.github || "";
    const match = githubUrl.match(/github\.com\/([A-Za-z0-9-]{1,39})/i);
    if (!match) return res.status(400).json({ message: "Add a valid GitHub profile URL to your profile first" });
    const data = await getGithubProfile(match[1]);
    res.json(data);
  } catch (error) {
    console.error("GitHub identity error:", error);
    res.status(error.status || 500).json({ message: error.message || "Unable to load GitHub profile" });
  }
};

const getPublicIdentity = async (req, res) => {
  try {
    const data = await getGithubProfile(req.params.username);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Unable to load GitHub profile" });
  }
};

module.exports = { getIdentity, getPublicIdentity };

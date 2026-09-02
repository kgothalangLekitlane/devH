const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server auth is not configured" });
  }

  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const verified = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!verified?.id || typeof verified.id !== "string") {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    const user = await User.findById(verified.id).select("tokenVersion").lean();
    if (!user) return res.status(401).json({ message: "Account no longer exists" });

    const tokenVersion = Number.isInteger(verified.tokenVersion) ? verified.tokenVersion : 0;
    const currentVersion = Number.isInteger(user.tokenVersion) ? user.tokenVersion : 0;
    if (tokenVersion !== currentVersion) {
      return res.status(401).json({ message: "Authentication session revoked" });
    }

    req.user = { ...verified, tokenVersion: currentVersion };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token expired" });
    }
    return res.status(401).json({ message: "Invalid authentication token" });
  }
};

module.exports = authenticate;

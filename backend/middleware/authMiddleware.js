const jwt = require("jsonwebtoken");

const normalizeUserId = (value) => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.$oid === "string" && value.$oid.trim()) return value.$oid.trim();
  }
  return null;
};

const authenticate = (req, res, next) => {
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
    const userId = normalizeUserId(verified?.id);

    if (!userId) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    // Normalize both current JWTs and legacy tokens that serialized the
    // MongoDB ObjectId as an object. This keeps existing sessions valid while
    // all newly-issued tokens continue to use a plain string id.
    req.user = { ...verified, id: userId };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token expired" });
    }
    return res.status(401).json({ message: "Invalid authentication token" });
  }
};

module.exports = authenticate;

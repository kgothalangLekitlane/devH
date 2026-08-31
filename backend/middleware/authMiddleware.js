const jwt = require("jsonwebtoken");

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
    const verified = jwt.verify(match[1], process.env.JWT_SECRET);
    if (!verified?.id) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    req.user = verified;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token expired" });
    }
    return res.status(401).json({ message: "Invalid authentication token" });
  }
};

module.exports = authenticate;

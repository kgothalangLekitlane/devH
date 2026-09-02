const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const connectDB = require("./models/db");
const cors = require("cors");
const dotenv = require("dotenv");
const securityHeaders = require("./middleware/security");

dotenv.config();
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters long");
  process.exit(1);
}

const app = express();
const configuredClientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);
const defaultClientUrls = ["https://dev-h-drab.vercel.app", "https://dev-h-qzun.vercel.app"];
const allowedOrigins = new Set([...defaultClientUrls, ...configuredClientUrls]);
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "");
  return allowedOrigins.has(normalized);
};
const corsOptions = {
  origin: (origin, callback) => isAllowedOrigin(origin)
    ? callback(null, true)
    : callback(new Error("CORS origin not allowed")),
  credentials: true,
};
const PORT = Number(process.env.PORT) || 5000;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d" }));

const buckets = new Map();
const rateLimit = ({ windowMs, max }) => (req, res, next) => {
  const key = `${req.ip}:${req.baseUrl}:${req.path}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > max) {
    res.set("Retry-After", String(Math.ceil((windowMs - (now - bucket.startedAt)) / 1000)));
    return res.status(429).json({ message: "Too many requests. Please try again later." });
  }
  next();
};
const rateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.startedAt > 60 * 60 * 1000) buckets.delete(key);
  }
}, 10 * 60 * 1000);
rateLimitCleanup.unref();

app.get("/", (req, res) => res.status(200).json({ status: "ok", service: "devheaven-api", message: "DevHeaven API is running" }));
app.get("/health", (req, res) => res.status(200).json({ status: "ok", service: "devheaven-api", uptime: process.uptime() }));
app.get("/health/db", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "unavailable", database: connected ? "connected" : "disconnected" });
});

app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use("/api/auth/register", rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }));
app.use("/api/messages", rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.use("/api/posts", rateLimit({ windowMs: 60 * 1000, max: 60 }));
app.use("/api/network", rateLimit({ windowMs: 60 * 1000, max: 60 }));
app.use("/api/jobs", rateLimit({ windowMs: 60 * 1000, max: 60 }));
app.use("/api/candidate-matches", rateLimit({ windowMs: 60 * 1000, max: 60 }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/github", require("./routes/github"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/resources", require("./routes/resources"));
app.use("/api/recruiters", require("./routes/recruiters"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/candidate-matches", require("./routes/candidateMatches"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/connections", require("./routes/connections"));
app.use("/api/network", require("./routes/network"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api", require("./routes/api"));

app.use((err, req, res, next) => {
  console.error("Unhandled request error:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: "Internal server error" });
});

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });
global.__devheaven_io = io;

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return next(new Error("Authentication required"));
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid authentication token"));
  }
});

const conversationRoom = (a, b) => {
  const ids = [String(a), String(b)].sort();
  return `conversation:${ids[0]}:${ids[1]}`;
};

io.on("connection", (socket) => {
  socket.join(`user:${socket.user.id}`);
  socket.on("joinConversation", ({ userId } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(userId) || String(userId) === String(socket.user.id)) return;
    socket.join(conversationRoom(socket.user.id, userId));
  });
  socket.on("leaveConversation", ({ userId } = {}) => {
    if (typeof userId !== "string" || !mongoose.Types.ObjectId.isValid(userId)) return;
    socket.leave(conversationRoom(socket.user.id, userId));
  });
});

let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  clearInterval(rateLimitCleanup);
  io.close();
  server.close(async () => {
    await mongoose.connection.close(false);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

connectDB()
  .then(() => server.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

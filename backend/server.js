const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./models/db");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/resources", require("./routes/resources"));
app.use("/api/recruiters", require("./routes/recruiters"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api", require("./routes/api"));

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: clientUrl, credentials: true }
});

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  return process.env.JWT_SECRET;
};

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return next(new Error("Authentication required"));
    socket.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    next(new Error("Invalid authentication token"));
  }
});

io.on("connection", (socket) => {
  console.log("Authenticated user connected:", socket.user.id);

  socket.on("joinRoom", (room) => {
    if (typeof room !== "string" || room.length > 100) return;
    socket.join(room);
  });

  socket.on("sendMessage", ({ room, message }) => {
    if (typeof room !== "string" || typeof message !== "string") return;
    const text = message.trim();
    if (!text || text.length > 5000) return;
    io.to(room).emit("receiveMessage", {
      message: text,
      user: socket.user.id,
      time: new Date()
    });
  });
});

connectDB()
  .then(() => server.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

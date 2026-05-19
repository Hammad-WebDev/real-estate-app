import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoute from "./routes/auth.route.js";
import postRoute from "./routes/post.route.js";
import testRoute from "./routes/test.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";

dotenv.config();

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
// Allow dynamic origin reflection for local development (preserves credentials)
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., curl, server-to-server)
      if (!origin) return callback(null, true);
      // allow any localhost origin (covers different vite ports)
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      // fallback to configured clientUrl
      if (origin === clientUrl) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/test", testRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Please stop any existing server and retry.`);
    process.exit(1);
  }
  console.error("Server error:", err);
  process.exit(1);
});

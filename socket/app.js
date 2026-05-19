import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  },
});

let onlineUser = [];

const addUser = (userId, socketId) => {
  const userExits = onlineUser.find((user) => user.userId === userId);
  if (!userExits) {
    onlineUser.push({ userId, socketId });
  }
};

const removeUser = (socketId) => {
  onlineUser = onlineUser.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUser.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    console.log("sendMessage received for", receiverId, "data:", data);
    const receiver = getUser(receiverId);
    if (receiver) {
      console.log("Forwarding message to socket", receiver.socketId);
      io.to(receiver.socketId).emit("getMessage", data);
    } else {
      console.log("Receiver not online", receiverId);
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
  });
});

const SOCKET_PORT = process.env.PORT || 4000;
const socketServer = io.listen(SOCKET_PORT);

socketServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Socket port ${SOCKET_PORT} is already in use. Please stop any existing socket server and retry.`);
    process.exit(1);
  }
  console.error("Socket server error:", err);
  process.exit(1);
});

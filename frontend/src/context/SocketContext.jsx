import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:4000");
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
  currentUser && socket?.emit("newUser", currentUser.id);
  }, [currentUser, socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => {
      console.log("Socket connected (client):", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err);
    });
    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

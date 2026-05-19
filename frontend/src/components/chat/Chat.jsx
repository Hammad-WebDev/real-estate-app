import { useContext, useEffect, useRef, useState } from "react";
import "./chat.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { format } from "timeago.js";
import { SocketContext } from "../../context/SocketContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Chat({ chats }) {
  const [chat, setChat] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const messageEndRef = useRef();
  const formRef = useRef(null);

  const decrease = useNotificationStore((state) => state.decrease);

  const getReceiver = (chatItem) => {
    if (chatItem?.receiver) return chatItem.receiver;
    if (!chatItem?.users || !currentUser?.id) return null;
    return chatItem.users.find((user) => String(user.id) !== String(currentUser.id)) || null;
  };

  const visibleChats = chats
    ?.map((chatItem) => ({
      ...chatItem,
      receiver: getReceiver(chatItem),
    }))
    .filter(
      (chatItem) =>
        chatItem.receiver &&
        currentUser &&
        String(chatItem.receiver.id) !== String(currentUser.id)
    );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleOpenChat = async (id, receiver) => {
    try {
      console.log("Opening chat", id, receiver);
      const res = await apiRequest("/chats/" + id);
      if (!res.data.seenBy?.includes(currentUser.id)) {
        decrease();
      }
      setChat({ ...res.data, receiver });
    } catch (err) {
      console.error("Failed to open chat:", err);
      alert("Failed to open chat. Check console for details.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const text = formData.get("text");

    console.log("handleSubmit called", { chatId: chat?.id, text });

    if (!text) {
      console.log("No text to send");
      return;
    }

    try {
      setIsSending(true);
      const res = await apiRequest.post("/messages/" + chat.id, { text });
      console.log("Message POST response", res);
      setChat((prev) => ({ ...prev, messages: [...prev.messages, res.data] }));
      e.target.reset();

      if (socket && chat.receiver?.id) {
        socket.emit("sendMessage", {
          receiverId: chat.receiver.id,
          data: res.data,
        });
        console.log("Socket emit sendMessage", { receiverId: chat.receiver.id });
      } else if (!socket) {
        console.warn("Socket not initialized, cannot emit message");
      } else {
        console.warn("No receiver id available, skipping socket emit");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Check console for details.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const read = async () => {
      try {
        await apiRequest.put("/chats/read/" + chat.id);
      } catch (err) {
        console.log(err);
      }
    };

    if (chat && socket) {
      socket.on("getMessage", (data) => {
        if (chat.id === data.chatId) {
          setChat((prev) => ({ ...prev, messages: [...prev.messages, data] }));
          read();
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("getMessage");
      }
    };
  }, [socket, chat]);

  return (
    <div className="chat">
      <div className="messages">
        <h1>Messages</h1>
        {visibleChats?.map((c) => (
          <div
            className="message"
            key={c.id}
            style={{
              backgroundColor:
                (c.seenBy?.includes(currentUser.id) || chat?.id === c.id)
                  ? "white"
                  : "#fecd514e",
            }}
            onClick={() => handleOpenChat(c.id, c.receiver)}
          >
            <img src={c.receiver?.avatar || "/noavatar.jpg"} alt="" />
            <span>{c.receiver?.username || "Unknown"}</span>
            <p>{c.lastMessage}</p>
          </div>
        ))}
      </div>
      {chat && (
        <div className="chatBox">
          <div className="top">
            <div className="user">
              <img src={chat.receiver?.avatar || "noavatar.jpg"} alt="" />
              {chat.receiver?.username || "Unknown"}
            </div>
            <span className="close" onClick={() => setChat(null)}>
              X
            </span>
          </div>
          <div className="center">
            {chat.messages.map((message) => (
              <div
                className="chatMessage"
                style={{
                  alignSelf:
                    message.userId === currentUser.id
                      ? "flex-end"
                      : "flex-start",
                  textAlign:
                    message.userId === currentUser.id ? "right" : "left",
                }}
                key={message.id}
              >
                <p>{message.text}</p>
                <span>{format(message.createdAt)}</span>
              </div>
            ))}
            <div ref={messageEndRef}></div>
          </div>
          <form ref={formRef} onSubmit={handleSubmit} className="bottom">
            <textarea name="text"></textarea>
            <button
              type="button"
              disabled={isSending}
              onClick={(e) => {
                console.log("Send button clicked");
                e.preventDefault();
                formRef.current?.requestSubmit();
              }}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;

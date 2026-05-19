import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import "./card.scss";

function Card({ item }) {
  const { currentUser } = useContext(AuthContext);
  const [saved, setSaved] = useState(item.isSaved || false);
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    setSaved((prev) => !prev);

    try {
      await apiRequest.post("/users/save", { postId: item.id });
    } catch (err) {
      console.error("Failed to save post:", err);
      setSaved((prev) => !prev);
      alert("Failed to save post. Please try again.");
    }
  };

  const handleChat = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    const receiverId = item.user?.id || item.userId || item.sellerId || item.ownerId;

    if (!receiverId) {
      console.warn("Chat receiver id is missing for item:", item);
      alert("Unable to start chat for this listing. Please open the details page.");
      return;
    }

    try {
      await apiRequest.post("/chats", { receiverId });
      navigate("/profile");
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert("Failed to open chat. Please try again.");
    }
  };

  return (
    <div className="card">
      <Link to={`/${item.id}`} className="imageContainer">
        <img src={item.images[0]} alt="" />
      </Link>
      <div className="textContainer">
        <h2 className="title">
          <Link to={`/${item.id}`}>{item.title}</Link>
        </h2>
        <p className="address">
          <img src="/pin.png" alt="" />
          <span>{item.address}</span>
        </p>
        <p className="price">$ {item.price}</p>
        <div className="bottom">
          <div className="features">
            <div className="feature">
              <img src="/bed.png" alt="" />
              <span>{item.bedroom} bedroom</span>
            </div>
            <div className="feature">
              <img src="/bath.png" alt="" />
              <span>{item.bathroom} bathroom</span>
            </div>
          </div>
          <div className="icons">
            <button
              className={`icon ${saved ? "saved" : ""}`}
              onClick={handleSave}
              title="Save post"
              type="button"
            >
              <img src="/save.png" alt="Save icon" />
            </button>
            <button className="icon" onClick={handleChat} title="Chat with seller" type="button">
              <img src="/chat.png" alt="Chat icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;

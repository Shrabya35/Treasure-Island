import React, { useState } from "react";
import "./Component.css";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import chest1 from "../assets/PinkChest.svg";
import chest2 from "../assets/WoodenChest.svg";
import chest3 from "../assets/ReddishChest.svg";
import chest4 from "../assets/IronChest.svg";
import chest5 from "../assets/PurpleChest.svg";

const HomePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  function formatUUID(uuid) {
    return uuid.replace(/-/g, "").substring(0, 8);
  }

  const handleCreateRoom = () => {
    const roomId = formatUUID(uuidv4());
    navigate(`/cr/?Id=${roomId}`, { state: { playerName: name } });
  };

  const handleJoinRoom = () => {
    const Id = formatUUID(uuidv4());
    navigate(`/r/`, { state: { playerName: name, searchId: Id } });
  };

  const handleJoinBot = () => {
    navigate(`/bot`);
  };
  return (
    <div className="Home">
      <div className="home-main">
        <div className="home-top">
          <div className="home-title">Treasure Island</div>
          <div className="home-icons">
            <img src={chest1} alt="chest" />
            <img src={chest2} alt="chest" />
            <img src={chest3} alt="chest" />
            <img src={chest4} alt="chest" />
            <img src={chest5} alt="chest" />
          </div>
        </div>
        <div className="home-bottom">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="home-game-room">
            <div className="home-small" onClick={handleJoinBot}>
              Single Player
            </div>
            <div className="home-small" onClick={handleJoinRoom}>
              Play
            </div>
            <div className="home-small" onClick={handleCreateRoom}>
              Create Room
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

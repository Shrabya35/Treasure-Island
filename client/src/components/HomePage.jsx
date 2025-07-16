import React, { useState, useEffect } from "react";
import "./Component.css";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";

import chest1 from "../assets/PinkChest.svg";
import chest2 from "../assets/WoodenChest.svg";
import chest3 from "../assets/ReddishChest.svg";
import chest4 from "../assets/IronChest.svg";
import chest5 from "../assets/PurpleChest.svg";

const HomePage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    if (storedName) {
      setName(storedName);
    }
  }, []);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    localStorage.setItem("playerName", newName);
  };

  function formatUUID(uuid) {
    return uuid.replace(/-/g, "").substring(0, 8);
  }

  const handleCreateRoom = () => {
    if (!name.trim().length) {
      toast.success("Please select your username for Multiplayer mode");
      return;
    }
    localStorage.setItem("playerName", name);
    const roomId = formatUUID(uuidv4());
    navigate(`/cr/?Id=${roomId}`, { state: { playerName: name } });
  };

  const handleJoinRoom = () => {
    if (!name.trim().length) {
      toast.success("Please select your username for Multiplayer mode");
      return;
    }
    localStorage.setItem("playerName", name);
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
            <img src={chest1} alt="chest1" />
            <img src={chest2} alt="chest2" />
            <img src={chest3} alt="chest3" />
            <img src={chest4} alt="chest4" />
            <img src={chest5} alt="chest5" />
          </div>
        </div>
        <div className="home-bottom">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={handleNameChange}
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
      <Toaster />
    </div>
  );
};

export default HomePage;

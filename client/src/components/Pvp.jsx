import React, { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import chest1 from "../assets/PinkChest.svg";
import chest2 from "../assets/WoodenChest.svg";
import chest3 from "../assets/ReddishChest.svg";
import chest4 from "../assets/IronChest.svg";
import chest5 from "../assets/PurpleChest.svg";
import shovel from "../assets/Shovel.svg";

import { FaPlay, FaShuffle } from "react-icons/fa6";
import { MdMyLocation } from "react-icons/md";

const chestImages = [null, chest1, chest2, chest3, chest4, chest5];
const chestImageNames = {
  [chest1]: "Light Wood Chest",
  [chest2]: "Wooden Chest",
  [chest3]: "Rusty Chest",
  [chest4]: "Iron Chest",
  [chest5]: "Magical Chest",
};

const SOCKET_SERVER_URL = "http://192.168.1.10:9080";

const Pvp = () => {
  const location = useLocation();
  const { playerName } = location.state || {};
  const finalPlayerName = playerName || "guest";
  const { searchId } = location.state;

  const [socket, setSocket] = useState(null);
  const [searching, setSearching] = useState(false);
  const [gameStart, setGameStart] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [opponentReady, setOpponentRedy] = useState(false);
  const [Strategy, setStrategy] = useState(true);
  const [chestClicked, setChestClicked] = useState(false);
  const [userTurn, setUserTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winnerMsg, setWinnerMsg] = useState(null);
  const [userTarget, setUserTarget] = useState("");
  const [opponentChest1, setOpponentChest1] = useState(null);
  const [opponentChest2, setOpponentChest2] = useState(null);
  const [opponentChest3, setOpponentChest3] = useState(null);
  const [opponentChest4, setOpponentChest4] = useState(null);
  const [opponentChest5, setOpponentChest5] = useState(null);
  const [opponentGuess, setOpponentGuess] = useState(null);
  const [opponentName, setOpponentName] = useState("");
  const [userChest1, setUserChest1] = useState(1);
  const [userChest2, setUserChest2] = useState(2);
  const [userChest3, setUserChest3] = useState(3);
  const [userChest4, setUserChest4] = useState(4);
  const [userChest5, setUserChest5] = useState(5);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [userGuessedElements, setUserGuessedElements] = useState(new Set());

  const chestPositions = [
    { position: userChest1, type: 1 },
    { position: userChest2, type: 2 },
    { position: userChest3, type: 3 },
    { position: userChest4, type: 4 },
    { position: userChest5, type: 5 },
  ];
  const userChestArray = useMemo(
    () => [userChest1, userChest2, userChest3, userChest4, userChest5],
    [userChest1, userChest2, userChest3, userChest4, userChest5]
  );

  const opponentChestArray = [
    opponentChest1,
    opponentChest2,
    opponentChest3,
    opponentChest4,
    opponentChest5,
  ];

  const generateRandomNumber = () => Math.floor(Math.random() * 64) + 1;

  const handleOpponentGuess = useCallback(() => {
    if (!gameOver) {
      let element;
      element = document.getElementById(`box-${opponentGuess}`);
      if (userChestArray.includes(opponentGuess)) {
        element.style.backgroundColor = "green";

        setOpponentScore((prevScore) => prevScore + 1);
      } else {
        element.innerHTML = `<img class="shovel" src="${shovel}">`;
      }

      setUserTurn(true);
    }
  }, [gameOver, opponentGuess, userChestArray, setOpponentScore, setUserTurn]);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to Socket.io server:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
    });

    newSocket.on("searching", () => {
      setSearching(true);
    });

    newSocket.on("matched", (data) => {
      const { name } = data;
      setOpponentName(name);
      setSearching(false);
      setGameStart(true);
    });

    newSocket.on("existingUsers", (users) => {
      if (users.length > 0) {
        setOpponentName(users[0]);
      }
    });

    newSocket.on("opponentReady", (data) => {
      const { ready, chest } = data;
      if (ready === 1) {
        setOpponentRedy(true);
      }
      if (chest.length >= 5) {
        setOpponentChest1(chest[0]);
        setOpponentChest2(chest[1]);
        setOpponentChest3(chest[2]);
        setOpponentChest4(chest[3]);
        setOpponentChest5(chest[4]);
      }
    });

    newSocket.on("opponentGuess", (data) => {
      const { Id } = data;
      setOpponentGuess(Id);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (opponentGuess !== null) {
      handleOpponentGuess();
    }
  }, [opponentGuess, handleOpponentGuess]);

  useEffect(() => {
    if (socket && searchId && finalPlayerName) {
      console.log("Emitting searchStranger event:", {
        name: finalPlayerName,
      });
      socket.emit("searchStranger", { name: finalPlayerName });
    }
  }, [socket, searchId, finalPlayerName]);

  const gridItems1 = [];
  const gridItems2 = [];

  for (let i = 1; i <= 64; i++) {
    const chest = chestPositions.find((chest) => chest.position === i);
    const chestType = chest ? chest.type : null;
    gridItems1.push(
      <div
        key={i}
        id={`box-${i}`}
        className="grid-item"
        onClick={(e) => {
          handleChestPosition(e, chestType, i);
        }}
      >
        {chest && (
          <img
            className="hello"
            src={chestType ? chestImages[chestType] : null}
            alt={`Chest ${i}`}
          />
        )}
      </div>
    );
  }
  for (let i = 1; i <= 64; i++) {
    gridItems2.push(
      <div
        key={i}
        id={`grid1-box-${i}`}
        className="grid-item"
        onClick={(e) => UserGuess(e, i)}
      ></div>
    );
  }
  const handleChestPosition = (e, chestType, i) => {
    const setUserChests = [
      setUserChest1,
      setUserChest2,
      setUserChest3,
      setUserChest4,
      setUserChest5,
    ];
    if (!userReady) {
      if (chestType != null) {
        if (!chestClicked) {
          setChestClicked(true);
          setUserTarget(chestType);
        } else {
          toast.error("a chest is already placed here");
        }
      } else {
        if (chestClicked) {
          setUserChests[userTarget - 1](i);
          setChestClicked(false);
          toast.loading(`Placed ${chestImageNames[chestImages[userTarget]]}`);
        } else {
          toast.error("cant place your chest here");
        }
      }
    }
  };

  const handleStrategy = () => {
    const ready = 1;
    const chest = [userChest1, userChest2, userChest3, userChest4, userChest5];
    socket.emit("userReady", { ready, chest });
    setUserReady(true);
  };

  const UserGuess = (e, Id) => {
    if (gameOver) {
      e.preventDefault();
    } else {
      if (!userGuessedElements.has(Id)) {
        const index = opponentChestArray.indexOf(Id);
        if (!Strategy && userTurn) {
          setUserGuessedElements((prevGuessedElements) => {
            const updatedUserGuessedElements = new Set(prevGuessedElements);
            updatedUserGuessedElements.add(Id);
            return updatedUserGuessedElements;
          });
          if (index !== -1) {
            const src = chestImages[index + 1];
            e.target.innerHTML = `<img src="${src}">`;
            setPlayerScore(playerScore + 1);
            toast.success(
              `You Found ${chestImageNames[chestImages[index + 1]]}`
            );
          } else {
            e.target.innerHTML = `<img class="shovel" src="${shovel}">`;
          }
          setUserTurn(false);
          socket.emit("userGuess", { Id });
        }
      } else {
        toast.error("Already Searched here");
      }
    }
  };

  useEffect(() => {
    if (userReady && opponentReady) {
      setStrategy(false);
    }
  }, [userReady, opponentReady]);

  const handleShuffle = () => {
    if (Strategy) {
      let chest1, chest2, chest3, chest4, chest5;
      let allUnique = false;

      while (!allUnique) {
        chest1 = generateRandomNumber();
        chest2 = generateRandomNumber();
        chest3 = generateRandomNumber();
        chest4 = generateRandomNumber();
        chest5 = generateRandomNumber();
        const chests = [chest1, chest2, chest3, chest4, chest5];
        allUnique = new Set(chests).size === chests.length;
      }
      setUserChest1(chest1);
      setUserChest2(chest2);
      setUserChest3(chest3);
      setUserChest4(chest4);
      setUserChest5(chest5);
      toast.success("successfully shuffled all chests");
    }
  };

  useEffect(() => {
    if (playerScore >= 5 && playerScore > opponentScore) {
      setGameOver(true);
      setWinnerMsg("You Win!");
    } else if (opponentScore >= 5 && opponentScore > playerScore) {
      setGameOver(true);
      setWinnerMsg(`${opponentName} Win`);
    }
  }, [playerScore, opponentScore, opponentName]);

  const handleGameOver = () => {
    setGameOver(false);
    window.location.reload();
  };

  return (
    <div className="Bot Pvp-Custom Pvp">
      {searching && !gameStart && (
        <div>
          <div className="hello"></div>
          <div className="pvp-c-waiting">
            <div className="pvp-c-waiting-container">
              <div className="pvp-c-waiting-text">Waiting For Opponent</div>
              <div className="loader"></div>
            </div>
          </div>
        </div>
      )}
      {!searching && gameStart && (
        <div
          className="bot-container"
          style={{
            filter: gameOver ? "blur(0.75px)" : "none",
          }}
        >
          <div className="island your-island">
            <div className="island-header">
              Your Island{" "}
              {!Strategy && userTurn && (
                <MdMyLocation
                  style={{
                    color: "green",
                  }}
                />
              )}
            </div>
            <div className="grid-container">{gridItems1}</div>
            {Strategy &&
              (!userReady ? (
                <div className="strategy-phase">
                  <div className="strategy-shuffle" onClick={handleShuffle}>
                    <FaShuffle />
                  </div>
                  <div className="strategy-ready" onClick={handleStrategy}>
                    <FaPlay />
                  </div>
                </div>
              ) : (
                <div className="strategy-phase opponent ready">
                  Waiting for Opponent....
                </div>
              ))}
          </div>
          <div className="island opponent-island">
            <div className="island-header">{opponentName}'s Island</div>
            <div className="grid-container">{gridItems2}</div>
            {Strategy &&
              (opponentReady ? (
                <div className="strategy-phase opponent ready">
                  Waiting for you....
                </div>
              ) : (
                <div className="strategy-phase opponent waiting">
                  Hiding the chest...
                </div>
              ))}
          </div>
        </div>
      )}
      <div className={`game-over ${gameOver ? "active" : ""}`}>
        <div className="game-over-title">{winnerMsg}</div>
        <div className="game-over-score">Chests left: {5 - opponentScore}</div>
        <div className="game-over-score">Chest Looted : {playerScore}</div>
        <button className="game-reset-btn" onClick={handleGameOver}>
          Play Again ?
        </button>
      </div>
      <Toaster />
    </div>
  );
};

export default Pvp;

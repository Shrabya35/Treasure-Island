import React, { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import chest1 from "../assets/PinkChest.svg";
import chest2 from "../assets/WoodenChest.svg";
import chest3 from "../assets/ReddishChest.svg";
import chest4 from "../assets/IronChest.svg";
import chest5 from "../assets/PurpleChest.svg";
import shovel from "../assets/Shovel.svg";

import { FaPlay, FaShuffle, FaStop } from "react-icons/fa6";
import { MdMyLocation } from "react-icons/md";

const chestImages = [null, chest1, chest2, chest3, chest4, chest5];
const chestImageNames = {
  [chest1]: "Light Wood Chest",
  [chest2]: "Wooden Chest",
  [chest3]: "Rusty Chest",
  [chest4]: "Iron Chest",
  [chest5]: "Magical Chest",
};

const SOCKET_SERVER_URL = "http://localhost:9080";

const Pvp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, searchId } = location.state || {};

  const [socket, setSocket] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [gameStart, setGameStart] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [strategy, setStrategy] = useState(true);
  const [chestClicked, setChestClicked] = useState(false);
  const [userTarget, setUserTarget] = useState("");
  const [userTurn, setUserTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winnerMsg, setWinnerMsg] = useState(null);
  const [opponentName, setOpponentName] = useState("");
  const [userChests, setUserChests] = useState([1, 2, 3, 4, 5]);
  const [opponentChests, setOpponentChests] = useState([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [opponentGuess, setOpponentGuess] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [userGuessedElements, setUserGuessedElements] = useState(new Set());

  const chestPositions = useMemo(
    () =>
      userChests.map((position, index) => ({
        position,
        type: index + 1,
      })),
    [userChests]
  );

  const generateRandomNumber = () => Math.floor(Math.random() * 64) + 1;

  const handleOpponentGuess = useCallback(() => {
    if (!gameOver && opponentGuess !== null) {
      const element = document.getElementById(`box-${opponentGuess}`);
      if (element && userChests.includes(opponentGuess)) {
        element.style.backgroundColor = "green";
        setOpponentScore((prevScore) => prevScore + 1);
      } else if (element) {
        element.innerHTML = `<img class="shovel" src="${shovel}" alt="Shovel" />`;
      }
      setUserTurn(true);
    }
  }, [gameOver, opponentGuess, userChests]);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.onAny((event, ...args) => {
      console.log(`Received event: ${event}`, args);
    });

    newSocket.on("connect", () => {
      console.log("Connected to Socket.io server:", newSocket.id);
      setConnectionError(null);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message, error.stack);
      setConnectionError(
        `Failed to connect to the server: ${error.message}. Please try again.`
      );
      toast.error(`Connection error: ${error.message}`);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
      setSearching(false);
      setGameStart((g) => {
        if (g) toast.error("Disconnected from server. Game ended.");
        return false;
      });
      setConnectionError("Disconnected from server. Please reconnect.");
    });

    newSocket.on("searching", () => {
      setSearching(true);
      toast.loading("Searching for an opponent...");
    });

    newSocket.on("matched", (data) => {
      if (!data || !data.name) {
        console.error("Invalid matched event data:", data);
        toast.error("Invalid match data received.");
        return;
      }
      setOpponentName(data.name);
      setSearching(false);
      setGameStart(true);
      toast.dismiss();
      toast.success(`Matched with ${data.name}!`);
    });

    newSocket.on("matchmakingTimeout", (data) => {
      setSearching(false);
      toast.dismiss();
    });

    newSocket.on("searchCancelled", () => {
      setSearching(false);
      toast.dismiss();
      toast.success("Matchmaking cancelled.");
    });

    newSocket.on("opponentDisconnected", (data) => {
      setGameOver(true);
      setWinnerMsg(data?.message || "Your opponent has left the game.");
      toast.error(data?.message || "Opponent disconnected.");
    });

    newSocket.on("existingUsers", (users) => {
      if (Array.isArray(users) && users.length > 0) {
        setOpponentName(users[0]);
      }
    });

    newSocket.on("opponentReady", (data) => {
      if (!data) {
        console.error("Invalid opponentReady event data:", data);
        return;
      }
      const { ready, chest } = data;
      if (ready === 1) {
        setOpponentReady(true);
      }
      if (Array.isArray(chest) && chest.length >= 5) {
        setOpponentChests(chest);
      }
    });

    newSocket.on("opponentGuess", (data) => {
      if (!data || !data.Id) {
        console.error("Invalid opponentGuess event data:", data);
        return;
      }
      setOpponentGuess(data.Id);
    });

    newSocket.on("error", (data) => {
      toast.error(data?.message || "An error occurred.");
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
    if (!playerName || !searchId) {
      toast.error("Invalid access. Please start a new game.");
      setConnectionError("Missing game data. Please start a new game.");
      return;
    }
    if (socket) {
      console.log("Emitting searchStranger event:", { name: playerName });
      socket.emit("searchStranger", { name: playerName });
    }
  }, [socket, searchId, playerName]);

  const handleCancelSearch = () => {
    if (socket && searching) {
      socket.emit("cancelSearch");
      setSearching(false);
    }
  };

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
        onClick={(e) => handleChestPosition(e, chestType, i)}
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
        onClick={(e) => userGuess(e, i)}
      ></div>
    );
  }

  const handleChestPosition = (e, chestType, i) => {
    if (!userReady) {
      if (chestType != null) {
        if (!chestClicked) {
          setChestClicked(true);
          setUserTarget(chestType);
        } else {
          toast.error("A chest is already placed here");
        }
      } else {
        if (chestClicked) {
          setUserChests((prev) => {
            const newChests = [...prev];
            newChests[userTarget - 1] = i;
            return newChests;
          });
          setChestClicked(false);
          toast.success(`Placed ${chestImageNames[chestImages[userTarget]]}`);
        } else {
          toast.error("Can't place your chest here");
        }
      }
    }
  };

  const handleStrategy = () => {
    const ready = 1;
    socket.emit("userReady", { ready, chest: userChests });
    setUserReady(true);
  };

  const userGuess = (e, Id) => {
    if (gameOver) {
      e.preventDefault();
      return;
    }
    if (!userGuessedElements.has(Id)) {
      const index = opponentChests.indexOf(Id);
      if (!strategy && userTurn) {
        setUserGuessedElements((prev) => new Set(prev).add(Id));
        if (index !== -1) {
          const src = chestImages[index + 1];
          e.target.innerHTML = `<img src="${src}" alt="Chest" />`;
          setPlayerScore((prev) => prev + 1);
          toast.success(`You found ${chestImageNames[chestImages[index + 1]]}`);
        } else {
          e.target.innerHTML = `<img class="shovel" src="${shovel}" alt="Shovel" />`;
        }
        setUserTurn(false);
        socket.emit("userGuess", { Id });
      }
    } else {
      toast.error("Already searched here");
    }
  };

  useEffect(() => {
    if (userReady && opponentReady) {
      setStrategy(false);
    }
  }, [userReady, opponentReady]);

  const handleShuffle = () => {
    if (strategy) {
      let newChests;
      let allUnique = false;

      while (!allUnique) {
        newChests = Array.from({ length: 5 }, () => generateRandomNumber());
        allUnique = new Set(newChests).size === newChests.length;
      }
      setUserChests(newChests);
      toast.success("Successfully shuffled all chests");
    }
  };

  useEffect(() => {
    if (playerScore >= 5 && playerScore > opponentScore) {
      setGameOver(true);
      setWinnerMsg("You Win!");
    } else if (opponentScore >= 5 && opponentScore > playerScore) {
      setGameOver(true);
      setWinnerMsg(`${opponentName} Wins`);
    }
  }, [playerScore, opponentScore, opponentName]);

  const handleGameOver = () => {
    setGameOver(false);
    navigate("/");
  };

  const handleRetryConnection = () => {
    if (socket) {
      socket.connect();
    } else {
      const newSocket = io(SOCKET_SERVER_URL, {
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      setSocket(newSocket);
    }
    setConnectionError(null);
  };

  if (!playerName || !searchId) {
    return (
      <div className="Bot Pvp-Custom Pvp">
        <div className="error-container">
          <h2>Error</h2>
          <p>Invalid game data. Please start a new game from the home page.</p>
          <button className="game-reset-btn" onClick={() => navigate("/")}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="Bot Pvp-Custom Pvp">
        <div className="error-container">
          <h2>Connection Error</h2>
          <p>{connectionError}</p>
          <button className="game-reset-btn" onClick={handleRetryConnection}>
            Retry Connection
          </button>
          <button className="game-reset-btn" onClick={() => navigate("/")}>
            Go to Home
          </button>
        </div>
        <Toaster />
      </div>
    );
  }

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
              {!strategy && userTurn && (
                <MdMyLocation style={{ color: "green" }} />
              )}
            </div>
            <div className="grid-container">{gridItems1}</div>
            {strategy &&
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
                  Waiting for Opponent...
                </div>
              ))}
          </div>
          <div className="island opponent-island">
            <div className="island-header">{opponentName}'s Island</div>
            <div className="grid-container">{gridItems2}</div>
            {strategy &&
              (opponentReady ? (
                <div className="strategy-phase opponent ready">
                  Waiting for you...
                </div>
              ) : (
                <div className="strategy-phase opponent waiting">
                  Hiding the chest...
                </div>
              ))}
          </div>
        </div>
      )}
      {!searching && !gameStart && (
        <div className="pvp-c-waiting">
          <div className="pvp-c-waiting-container">
            <div className="pvp-c-waiting-text">Connecting to server...</div>
            <div className="loader"></div>
          </div>
        </div>
      )}
      <div className={`game-over ${gameOver ? "active" : ""}`}>
        <div className="game-over-title">{winnerMsg}</div>
        <div className="game-over-score">Chests left: {5 - opponentScore}</div>
        <div className="game-over-score">Chests Looted: {playerScore}</div>
        <button className="game-reset-btn" onClick={handleGameOver}>
          Play Again?
        </button>
      </div>
      <Toaster />
    </div>
  );
};

export default Pvp;

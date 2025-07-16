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

const PvpCustom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const roomId = queryParams.get("Id");
  const { playerName: statePlayerName } = location.state || {};
  const [playerName, setPlayerName] = useState(
    statePlayerName || localStorage.getItem("playerName") || ""
  );
  const [tempName, setTempName] = useState(playerName);
  const name = playerName || "guest";

  const [socket, setSocket] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [showLink, setShowLink] = useState(true);
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

  const resetGridStyles = () => {
    for (let i = 1; i <= 64; i++) {
      const element = document.getElementById(`box-${i}`);
      if (element) {
        element.style.backgroundColor = "";
        element.innerHTML = "";
      }
    }
  };

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
      toast.error("Disconnected from server. Game ended.");
      setConnectionError("Disconnected from server. Please reconnect.");
    });

    newSocket.on("error", (data) => {
      toast.error(data?.message || "An error occurred.");
      setConnectionError(data?.message || "An error occurred.");
    });

    newSocket.on("userJoined", (data) => {
      if (!data || !data.name) {
        console.error("Invalid userJoined event data:", data);
        return;
      }
      setOpponentName(data.name);
      toast.success(`${data.name} joined the room!`);
    });

    newSocket.on("existingUsers", (users) => {
      if (Array.isArray(users) && users.length > 0) {
        setOpponentName(users[0]);
      }
    });

    newSocket.on("updateUserCount", (number) => {
      if (number === 2) {
        setShowLink(false);
      }
    });

    newSocket.on("roomFull", (data) => {
      toast.error(data?.message || "The room is already full.");
      setConnectionError(data?.message || "The room is already full.");
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

    newSocket.on("opponentDisconnected", (data) => {
      setGameOver(true);
      setWinnerMsg(data?.message || "Your opponent has left the game.");
      toast.error(data?.message || "Opponent disconnected.");
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
    if (roomId && playerName && socket) {
      console.log("Emitting joinRoom event:", { roomId, name });
      socket.emit("joinRoom", { roomId, name });
    }
  }, [socket, roomId, playerName, name]);

  const handleCancelSearch = () => {
    if (socket && showLink) {
      socket.emit("cancelSearch");
      setShowLink(false);
      navigate("/");
    }
  };

  const handleChestPosition = (e, chestType, i) => {
    if (!userReady) {
      if (chestType != null) {
        if (!chestClicked) {
          setChestClicked(true);
          setUserTarget(chestType);
          toast.success(`Selected ${chestImageNames[chestImages[chestType]]}`);
        } else {
          toast.error("A chest is already selected");
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
          toast.error("Select a chest first");
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
    if (userReady && opponentReady) {
      setStrategy(false);
    }
  }, [userReady, opponentReady]);

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

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Invite link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy invite link");
      });
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

  const handleJoinWithName = () => {
    if (!tempName.trim()) {
      toast.error("Please enter a username");
      return;
    }
    localStorage.setItem("playerName", tempName);
    setPlayerName(tempName);
    toast.success(`Joined as ${tempName}`);
  };

  if (!roomId) {
    return (
      <div className="Bot Pvp-Custom">
        <div className="error-container">
          <h2>Error</h2>
          <p>
            Missing room ID. Please start a new game or enter a valid room link.
          </p>
          <button className="game-reset-btn" onClick={() => navigate("/")}>
            Go to Home
          </button>
        </div>
        <Toaster />
      </div>
    );
  }

  if (!playerName) {
    return (
      <div className="Bot Pvp-Custom">
        <div className="error-container">
          <h2>Welcome to Treasure Island</h2>
          <p>Please enter your username to join the game.</p>
          <input
            type="text"
            placeholder="Enter your name"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="name-input"
          />
          <button className="game-reset-btn" onClick={handleJoinWithName}>
            Join Game
          </button>
          <button className="game-reset-btn" onClick={() => navigate("/")}>
            Go to Home
          </button>
        </div>
        <Toaster />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="Bot Pvp-Custom">
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
    <div className="Bot Pvp-Custom">
      {showLink ? (
        <div className="pvp-c-waiting">
          <div className="pvp-c-waiting-container">
            <div className="pvp-c-waiting-text">Waiting For Opponent</div>
            <div className="loader"></div>
            <button className="cancel-search-btn" onClick={handleCancelSearch}>
              <FaStop /> Cancel Search
            </button>
          </div>
          <div className="pvp-c-copy">
            <div className="pvp-c-copy-top">Invite Your Friend!</div>
            <div className="pvp-c-copy-bottom">
              <div className="pvp-c-copy-text">{window.location.href}</div>
              <button className="pvp-c-copy-btn" onClick={copyLink}>
                Copy
              </button>
            </div>
          </div>
        </div>
      ) : (
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
            <div className="grid-container">
              {Array.from({ length: 64 }, (_, i) => i + 1).map((i) => {
                const chest = chestPositions.find((c) => c.position === i);
                return (
                  <div
                    key={i}
                    id={`box-${i}`}
                    className="grid-item"
                    onClick={(e) =>
                      handleChestPosition(e, chest?.type || null, i)
                    }
                  >
                    {chest && (
                      <img
                        className="hello"
                        src={chestImages[chest.type]}
                        alt={`Chest ${chest.type}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
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
            <div className="grid-container">
              {Array.from({ length: 64 }, (_, i) => i + 1).map((i) => (
                <div
                  key={i}
                  id={`grid1-box-${i}`}
                  className="grid-item"
                  onClick={(e) => userGuess(e, i)}
                ></div>
              ))}
            </div>
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

export default PvpCustom;

import React, { useCallback, useEffect, useState } from "react";
import "./Component.css";
import chest1 from "../assets/PinkChest.svg";
import chest2 from "../assets/WoodenChest.svg";
import chest3 from "../assets/ReddishChest.svg";
import chest4 from "../assets/IronChest.svg";
import chest5 from "../assets/PurpleChest.svg";
import shovel from "../assets/Shovel.svg";

import { FaPlay, FaShuffle } from "react-icons/fa6";
import toast, { Toaster } from "react-hot-toast";

const chestImages = [null, chest1, chest2, chest3, chest4, chest5];
const chestImageNames = {
  [chest1]: "Light Wood Chest",
  [chest2]: "Wooden Chest",
  [chest3]: "Rusty Chest",
  [chest4]: "Iron Chest",
  [chest5]: "Magical Chest",
};

const Bot = () => {
  const [Strategy, setStrategy] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winnerMsg, setWinnerMsg] = useState(null);
  const [chestClicked, setChestClicked] = useState(false);
  const [userTarget, setUserTarget] = useState("");
  const [userTurn, setUserTurn] = useState(true);
  const [opponentChest1, setOpponentChest1] = useState(null);
  const [opponentChest2, setOpponentChest2] = useState(null);
  const [opponentChest3, setOpponentChest3] = useState(null);
  const [opponentChest4, setOpponentChest4] = useState(null);
  const [opponentChest5, setOpponentChest5] = useState(null);
  const [userChest1, setUserChest1] = useState(1);
  const [userChest2, setUserChest2] = useState(2);
  const [userChest3, setUserChest3] = useState(3);
  const [userChest4, setUserChest4] = useState(4);
  const [userChest5, setUserChest5] = useState(5);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [botGuessedElements, setBotGuessedElements] = useState(new Set());
  const [userGuessedElements, setUserGuessedElements] = useState(new Set());

  const chestPositions = [
    { position: userChest1, type: 1 },
    { position: userChest2, type: 2 },
    { position: userChest3, type: 3 },
    { position: userChest4, type: 4 },
    { position: userChest5, type: 5 },
  ];
  let userChestArray = [
    userChest1,
    userChest2,
    userChest3,
    userChest4,
    userChest5,
  ];
  const opponentChestArray = [
    opponentChest1,
    opponentChest2,
    opponentChest3,
    opponentChest4,
    opponentChest5,
  ];

  const generateRandomNumber = () => Math.floor(Math.random() * 64) + 1;

  const generateUniqueRandomNumbers = useCallback(() => {
    const uniqueNumbers = new Set();

    while (uniqueNumbers.size < 5) {
      uniqueNumbers.add(generateRandomNumber());
    }

    return [...uniqueNumbers];
  }, []);

  const generateRandomNumbers = useCallback(() => {
    const [chest1, chest2, chest3, chest4, chest5] =
      generateUniqueRandomNumbers();

    setOpponentChest1(chest1);
    setOpponentChest2(chest2);
    setOpponentChest3(chest3);
    setOpponentChest4(chest4);
    setOpponentChest5(chest5);
  }, [generateUniqueRandomNumbers]);

  useEffect(() => {
    generateRandomNumbers();
  }, [generateRandomNumbers]);

  const handleStrategy = () => {
    setStrategy(false);
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
              `player Found ${chestImageNames[chestImages[index + 1]]}`
            );
          } else {
            e.target.innerHTML = `<img class="shovel" src="${shovel}">`;
          }
          setUserTurn(false);
          handleOpponentGuess();
        }
      } else {
        toast.error("Already Searched here");
      }
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
    if (Strategy) {
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
          toast.success(`Placed ${chestImageNames[chestImages[userTarget]]}`);
        } else {
          toast.error("cant place your chest here");
        }
      }
    }
  };

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

  const handleOpponentGuess = () => {
    if (!gameOver) {
      let opponentGuess;
      let element;
      let isValidGuess = false;

      do {
        opponentGuess = generateRandomNumber();
        element = document.getElementById(`box-${opponentGuess}`);

        if (!botGuessedElements.has(opponentGuess)) {
          isValidGuess = true;
        }
      } while (!isValidGuess);

      setBotGuessedElements((prevGuessedElements) => {
        const updatedBotGuessedElements = new Set(prevGuessedElements);
        updatedBotGuessedElements.add(opponentGuess);
        return updatedBotGuessedElements;
      });

      if (userChestArray.includes(opponentGuess)) {
        const chestIndex = userChestArray.indexOf(opponentGuess);

        element.style.backgroundColor = "green";

        setOpponentScore(opponentScore + 1);
        toast.success(
          `Bot found ${chestImageNames[chestImages[chestIndex + 1]]}`
        );
      } else {
        element.innerHTML = `<img class="shovel" src="${shovel}">`;
      }

      setUserTurn(true);
    }
  };
  useEffect(() => {
    if (playerScore >= 5 && playerScore > opponentScore) {
      setGameOver(true);
      setWinnerMsg("You Win!");
    } else if (opponentScore >= 5 && opponentScore > playerScore) {
      setGameOver(true);
      setWinnerMsg("You Lose!");
    }
  }, [playerScore, opponentScore]);

  const handleGameOver = () => {
    setGameOver(false);
    window.location.reload();
  };

  return (
    <div className="Bot">
      <div
        className="bot-container"
        style={{
          filter: gameOver ? "blur(0.75px)" : "none",
        }}
      >
        <div className="island your-island">
          <div className="island-header">Your Island</div>
          <div className="grid-container">{gridItems1}</div>
          {Strategy && (
            <div className="strategy-phase">
              <div className="strategy-shuffle" onClick={handleShuffle}>
                <FaShuffle />
              </div>
              <div className="strategy-ready" onClick={handleStrategy}>
                <FaPlay />
              </div>
            </div>
          )}
        </div>
        <div className="island opponent-island">
          <div className="island-header">Bot's Island</div>
          <div className="grid-container">{gridItems2}</div>
          {Strategy && (
            <div className="strategy-phase opponent">Waiting For User...</div>
          )}
        </div>
      </div>
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

export default Bot;

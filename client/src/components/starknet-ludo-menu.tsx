import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./ludomenu/Header";
// import JoinRoom from "./ludomenu/JoinRoom";
import Body from "./ludomenu/MenuBody";
import GameLobby from "./ludomenu/GameLobby";
// import BabylonGame from "./gameloop/mainLoop";
// import LudoGame from "./gameloop/LudoLoop";
import LudoGame from "./gameloop/LudoLoop";
// import LudoBoard from "./gameloop/mainLoop";

// Main Component
export default function StarkNetLudoMenu() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("mainnet");
  const [walletAddress, setWalletAddress] = useState("");
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [gameMode, setGameMode] = useState("casual");
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const connectWallet = async () => {
    // Simulate wallet connection
    setIsWalletConnected(true);
    setWalletAddress("0x1234...abcd");
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
  };

  const handleJoinRoom = () => {
    setShowJoinRoom(true);
  };

  const handleCreateRoom = () => {
    setShowCreateRoom(true);
  };

  // const closeCreateRoom = () => {
  //   setShowCreateRoom(false);
  // };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-600/20 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute top-40 right-32 w-24 h-24 bg-blue-600/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-32 left-32 w-40 h-40 bg-indigo-600/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-28 h-28 bg-cyan-600/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      {/* Header Component */}

      <Header
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
        showNetworkDropdown={showNetworkDropdown}
        setShowNetworkDropdown={setShowNetworkDropdown}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />

      {/* Body Component */}
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <Body
                isWalletConnected={true}
                gameMode={gameMode}
                setGameMode={setGameMode}
              />
            }
          />
          <Route path="lobby/:roomCode" element={<GameLobby />} />
          <Route path="game/:gameId" element={<LudoGame />} />
        </Routes>
      </Router>

      {/* <GameLobby /> */}
      {/* <BabylonGame /> */}
      {/* <BabylonGame /> */}

      {/* <LudoGame /> */}

      {/* Create Room Modal */}

      {/* Join Room Modal */}
      {/* <JoinRoom
        isOpen={false}
        onClose={closeJoinRoom}
        isWalletConnected={isWalletConnected}
      /> */}
    </div>
  );
}

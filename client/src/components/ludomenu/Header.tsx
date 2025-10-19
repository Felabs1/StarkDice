import React, { useState, useCallback, useEffect } from "react";
import {
  Wallet,
  Globe,
  ChevronDown,
  Loader2,
  CheckCircle,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useAccount } from "@starknet-react/core";
import { useSpawnPlayer } from "../../dojo/hooks/useSpawnPlayer";
import { usePlayer } from "../../dojo/hooks/usePlayer";

const Header = ({
  isWalletConnected,
  walletAddress,
  selectedNetwork,
  setSelectedNetwork,
  showNetworkDropdown,
  setShowNetworkDropdown,
  connectWallet,
  disconnectWallet,
}) => {
  const networks = [
    { id: "mainnet", name: "StarkNet Mainnet", color: "text-green-400" },
    { id: "testnet", name: "StarkNet Testnet", color: "text-yellow-400" },
  ];

  const { status, address, isConnecting, handleConnect, handleDisconnect } =
    useStarknetConnect();
  const { connector } = useAccount();
  const { player, isLoading: playerLoading } = usePlayer();
  const { initializePlayer, isInitializing, txStatus, txHash } =
    useSpawnPlayer();

  const isConnected = status === "connected";
  const isLoading =
    isConnecting || status === "connecting" || isInitializing || playerLoading;

  useEffect(() => {
    if (isConnected && !player && !isInitializing && !playerLoading) {
      console.log(
        "🎮 Controller connected but no player found, auto-initializing..."
      );
      // setTimeout(() => {
      //   initializePlayer().then((result) => {
      //     console.log("🎮 Auto-initialization result:", result);
      //   });
      // }, 500);
    }
  }, [isConnected, player, isInitializing, playerLoading, initializePlayer]);

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getStatusMessage = () => {
    if (!isConnected) return "connect your controller to start playing";
    if (playerLoading) return "Loading player data...";
    if (isInitializing) {
      if (txStatus === "PENDING") return "Creating player on blockchain...";
      if (txStatus === "SUCCESS") return "Player created successfully";
      return "Initializing player...";
    }

    if (player) return "Ready to play";
    return "connected";
  };

  const getPlayerStatus = () => {
    if (!isConnected) return { color: "bg-red-500", text: "Disconnected" };
    if (isInitializing) return { color: "bg-yellow-500", text: "Creating..." };
    if (player) return { color: "bg-green-500", text: "Ready" };
    return { color: "bg-yellow-500", text: "Loading..." };
  };

  const VITE_PUBLIC_DEPLOY_TYPE = "sepolia" as any;
  const getDeploymentType = () => {
    switch (VITE_PUBLIC_DEPLOY_TYPE) {
      case "localhost":
        return "Localhost";
      case "mainnet":
        return "Mainnet";
      case "sepolia":
        return "Sepolia";
      default:
        return "Sepolia";
    }
  };

  const handlePlayerReady = useCallback(() => {
    if (!connector || !("controller" in connector)) {
      console.error("Connector not initialized");
      return;
    }
    if (
      connector.controller &&
      typeof connector.controller === "object" &&
      "openProfile" in connector.controller
    ) {
      (
        connector.controller as { openProfile: (profile: string) => void }
      ).openProfile("achievements");
    } else {
      console.error("Connector controller is not properly initialized");
    }
  }, [connector]);

  const playerStatus = getPlayerStatus();
  const deploymentType = getDeploymentType();

  return (
    <div className="relative z-10 p-6">
      <div className="flex justify-between items-center mb-8">
        {/* Network selector */}
        <div className="relative">
          {/* <button
            onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            className="flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-700 hover:border-purple-500 transition-all"
          >
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="text-white text-sm">
              {networks.find((n) => n.id === selectedNetwork)?.name}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button> */}

          {/* {showNetworkDropdown && (
            <div className="absolute top-12 left-0 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-20">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => {
                    setSelectedNetwork(network.id);
                    setShowNetworkDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors ${network.color}`}
                >
                  {network.name}
                </button>
              ))}
            </div>
          )} */}
          <div className="text-center md:text-right">
            <div className="flex items-center gap-2 text-sm mb-1">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${playerStatus.color}`}
              ></div>
              <span className="text-slate-300">
                {playerStatus.text} • {deploymentType}
              </span>
            </div>
            <div className="text-xs text-slate-400">{getStatusMessage()}</div>
          </div>
        </div>

        {/* Wallet connection */}
        {isConnected ? (
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-green-500/50">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-mono">
                  {formatAddress(address)}
                </span>
              </div>
            </div>
            <button
              onClick={isConnected ? handlePlayerReady : undefined}
              className="bg-red-600/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl hover:bg-red-600/30 transition-all"
              disabled={!player}
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Player
                </>
              ) : isConnected ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Player Ready
                </>
              ) : playerLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading Player
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Preparing
                </>
              )}
            </button>
            <button
              onClick={handleDisconnect}
              variant="outline"
              className="px-4 py-3 border-red-400/40 hover:border-red-400/60 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all duration-300"
              disabled={isInitializing}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center space-x-2 hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            {/* <Wallet className="w-5 h-5" /> */}
            {isConnecting || status === "connecting" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Controller
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;

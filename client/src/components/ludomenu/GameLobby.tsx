import React, { useState } from "react";
import { Users, Crown, Copy, Check, Play, LogOut, Shield } from "lucide-react";
import { useParams } from "react-router-dom";
import { usePlayers } from "../../dojo/hooks/usePlayers";
import { useGame } from "../../dojo/hooks/useGame";
import { useStartGameAction } from "../../dojo/hooks/useStartGame";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { addAddressPadding } from "starknet";
import { useNavigate } from "react-router-dom";
import { useStarkDiceStore } from "../../store/strkDice";

export default function GameLobby() {
  const { status, address } = useStarknetConnect();
  const [copied, setCopied] = useState(false);
  const isConnected = status === "connected";
  const gameid = useParams();
  console.log(gameid);
  const roomCode = gameid.roomCode!.toUpperCase();
  const navigate = useNavigate();
  const { players, isLoading, error, refetch } = usePlayers(roomCode);
  console.log("players length ", players?.length);
  const { games } = useGame();
  const roomData = games?.filter((game) => game.id === roomCode);

  const {set_game_id} = useStarkDiceStore();

  const { startGameState, executeStartGame, canStartGame } =
    useStartGameAction();

  const isStartGameLoading = startGameState.isLoading;

  const handleLeaveGame = () => {
    navigate("/");
  };

  const startGame = () => {
    executeStartGame(roomCode);
    set_game_id(roomCode);
  };

  // console.log(roomData)

  // Current user (for demo purposes, assume they're the host)
  const currentUserAddress = address;
  const isHost =
    roomData && addAddressPadding(roomData[0].owner) === currentUserAddress;
  console.log("is host ", isHost);
  // console.log("room owner", roomData[0].owner);
  // console.log("currentUserAddress ", currentUserAddress);
  const copyRoomCode = () => {
    if (!roomData) return;
    navigator.clipboard.writeText(roomData[0].id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getColorClass = (playerIndex: any) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
    ];

    return colors[playerIndex] || "bg-gray-500";
  };

  return (
    <div className="relative z-10 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-600/20 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-40 h-40 bg-blue-600/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center space-x-2 mb-2">
              <Users className="w-8 h-8 text-purple-400" />
              <span>Game Lobby 🎮 </span>
            </h2>
            <div className="flex items-center space-x-2 text-gray-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Waiting for players...</span>
            </div>
          </div>

          <button
            className="text-gray-400 hover:text-red-400 transition-colors"
            onClick={handleLeaveGame}
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        {/* Room Info */}
        <div className="bg-gray-700/50 rounded-2xl p-5 mb-6 border border-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">Room Code</div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold font-mono text-lg">
                  {roomData && roomData[0].id}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-sm mb-1">Players</div>
              <div className="text-white font-semibold text-lg">
                {roomData && roomData[0].joined_players}/
                {roomData && roomData[0].max_players}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-sm mb-1">Stake</div>
              <div className="text-green-400 font-semibold text-lg">
                {"Free"}
              </div>
            </div>

            <div>
              <div className="text-gray-400 text-sm mb-1">Host</div>
              <div className="text-white font-mono text-sm">
                {roomData && roomData[0].owner.slice(0, 4)}...
                {roomData && roomData[0].owner.slice(-4)}
              </div>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <span>Players in Lobby</span>
            <span className="text-gray-500 text-sm">
              ({players?.length}/{roomData && roomData[0].max_players})
            </span>
          </h3>

          <div className="space-y-3">
            {roomData &&
              players?.map((player, index) => (
                <div
                  key={player.addr}
                  className="bg-gray-700/80 rounded-xl p-4 border border-gray-600 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Player Color Indicator */}
                      <div
                        className={`w-12 h-12 ${getColorClass(
                          player.index
                        )} rounded-full flex items-center justify-center border-4 border-gray-600`}
                      >
                        <span className="text-white font-bold text-lg">
                          {index + 1}
                        </span>
                      </div>

                      {/* Player Info */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-mono font-semibold">
                            {player.addr.slice(0, 4)}...{player.addr.slice(-4)}
                          </span>
                          {player.addr == roomData[0].owner && (
                            <div className="flex items-center space-x-1 bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/30">
                              <Crown className="w-3 h-3 text-yellow-400" />
                              <span className="text-yellow-400 text-xs font-semibold">
                                Host
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Joined 1m ago
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm font-medium capitalize">
                        {player.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {/* Empty Slots */}
            {/* {Array.from({ length: roomData[0].max_players - players.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-gray-700/30 rounded-xl p-4 border-2 border-dashed border-gray-600"
              >
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <Users className="w-5 h-5" />
                  <span>Waiting for player...</span>
                </div>
              </div>
            ))} */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {isHost && players ? (
            <>
              <button
                onClick={startGame}
                disabled={!(players.length >= 2)}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-3 ${
                  players.length >= 2
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Play className="w-6 h-6" />
                <span>
                  {players.length >= 2
                    ? "Start Game"
                    : "Need at least 2 players"}
                </span>
              </button>

              <div className="text-center text-gray-400 text-sm">
                You are the host. Click start when ready!
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
                <div className="text-blue-400 font-medium">
                  Waiting for host to start the game...
                </div>
              </div>

              <button className="w-full bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-all">
                Ready
              </button>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <span className="text-indigo-400">Powered by StarkNet</span>
            </div>
            <div className="text-gray-500">
              Game Mode:{" "}
              <span className="text-white font-semibold">{`Free`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

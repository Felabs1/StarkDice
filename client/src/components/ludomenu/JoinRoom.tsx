

import React, { useState } from 'react';
import { Users, X, Copy, Search } from 'lucide-react';
// import { useAccount } from '@starknet-react/core';
import { useGame } from '../../dojo/hooks/useGame'; 
import { useJoinGameAction } from '../../dojo/hooks/useJoinGame';
import { useStarknetConnect } from '../../dojo/hooks/useStarknetConnect';
// import {useDojo} from "@dojoengine/sdk"

// import useAppStore from '../../zustand/store';

interface JoinRoomProps {
  isOpen: boolean,
  onClose: () => void;
  isWalletConnected: boolean;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ isOpen, onClose, isWalletConnected }) => {
  const { status } = useStarknetConnect();
  const isConnected = status === "connected";

  // 🔥 use your custom hook
  const { games, isLoading, error, refetch } = useGame();
  const {joinGameState, executeJoinGame, canJoinGame} = useJoinGameAction();


  const [roomCode, setRoomCode] = useState('');
  const [searchMode, setSearchMode] = useState<'code' | 'browse'>('code');

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const isJoinGameLoading = joinGameState.isLoading;

  const handleJoinGame = () => {
    // alert("hello world");
    executeJoinGame(roomCode);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Join Room</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-700 rounded-xl p-1 mb-6">
          <button
            onClick={() => setSearchMode('code')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              searchMode === 'code' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Enter Code
          </button>
          <button
            onClick={() => setSearchMode('browse')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              searchMode === 'browse' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Browse Rooms
          </button>
        </div>

        {searchMode === 'code' ? (
          /* Room Code Input */
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Room Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code (e.g., ROOM001)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
                <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>
            
            <button
              disabled={!isWalletConnected || !roomCode}
              onClick={handleJoinGame}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                isWalletConnected && roomCode
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:scale-105'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {!isWalletConnected ? 'Connect Wallet First' : 'Join Room'}
            </button>
          </div>
        ) : (
          /* Browse Available Rooms */
          <div className="space-y-4">
            <div className="text-gray-300 text-sm mb-4 flex justify-between">
              <span>Available Rooms ({games?.length ?? 0})</span>
              <button
                onClick={refetch}
                className="text-xs px-2 py-1 bg-gray-600 rounded-md text-gray-300 hover:text-white hover:bg-gray-500"
              >
                Refresh
              </button>
            </div>

            {isLoading && <div className="text-gray-400">Loading rooms...</div>}
            {error && <div className="text-red-400">Error: {error.message}</div>}
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {games && games.length > 0 ? (
                games.map((room) => (
                  <div
                    key={room.id}
                    className={`border rounded-xl p-4 transition-all ${
                      room.joined_players >= room.max_players
                        ? 'border-gray-600 bg-gray-700/50 opacity-60'
                        : 'border-gray-600 bg-gray-700/80 hover:border-purple-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold text-white">{room.id}</div>
                        <button
                          onClick={() => copyRoomCode(room.id)}
                          className="text-gray-400 hover:text-purple-400 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.joined_players < room.max_players
                          ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                          : 'bg-red-600/20 text-red-400 border border-red-600/30'
                      }`}>
                        {room.joined_players < room.max_players ? "Waiting" : "Full"}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Players</div>
                        <div className="text-white font-medium">
                          {room.joined_players}/{room.max_players}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Stake</div>
                        <div className="text-white font-medium">Free</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Host</div>
                        <div className="text-white font-mono text-xs">{room.owner.slice(0,6)}...{room.owner.slice(-4)}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setRoomCode(room.id);
                        handleJoinGame();
                      }}
                      disabled={!isWalletConnected || room.joined_players >= room.max_players}
                      className={`w-full mt-3 py-2 px-4 rounded-lg font-medium transition-all ${
                        isWalletConnected && room.joined_players < room.max_players
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {room.joined_players >= room.max_players ? 'Room Full' : 'Join Room'}
                    </button>
                  </div>
                ))
              ) : (
                !isLoading && <div className="text-gray-400">No rooms available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinRoom;

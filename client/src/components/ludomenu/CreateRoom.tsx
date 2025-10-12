import { useState } from "react";
import { Play, X, Plus } from 'lucide-react';
import { useStarknetConnect } from '../../dojo/hooks/useStarknetConnect';
import { useCreateGameAction } from "../../dojo/hooks/useCreateGame";


import useAppStore from "../../zustand/store";

interface CreateRoomProps {
  isOpen: boolean;
  onClose: () => void;
  isWalletConnected: boolean;
  gameMode: string;
}

const CreateRoom: React.FC<CreateRoomProps> = ({ isOpen, onClose, isWalletConnected, gameMode }) => {
  const [roomData, setRoomData] = useState({
    gameId: '',
    maxPlayers: 4,
    stakeAmount: '0.01',
    isPrivate: false,
    password: ''
  });

  const {createGameState, executeCreateGame, canCreateGame} = useCreateGameAction();

  const isLoading = createGameState.isLoading;



  
  // const [isCreating, setIsCreating] = useState(false);
const { status, address } = useStarknetConnect();
const isConnected = status === "connected";

  const generateGameId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ROOM';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomData(prev => ({ ...prev, gameId: result }));
  };
  // const player = useAppStore((state) => state);

  const createRoom = async () => {
    // setIsCreating(true);

    executeCreateGame(roomData.gameId, roomData.maxPlayers);
    // // Simulate room creation

    // setTimeout(() => {
    //   setIsCreating(false);
    //   onClose();
    //   // You would typically call your smart contract here
    //   alert(`Room ${roomData.gameId} created successfully!`);
    // }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-lg w-full border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Plus className="w-6 h-6 text-green-400" />
            <span>Create Room</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Game ID */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Game ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={roomData.gameId}
                onChange={(e) => setRoomData(prev => ({ ...prev, gameId: e.target.value.toUpperCase() }))}
                placeholder="Enter custom ID or generate"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
              <button
                onClick={generateGameId}
                className="bg-purple-600 text-white px-4 py-3 rounded-xl hover:bg-purple-700 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Max Players
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setRoomData(prev => ({ ...prev, maxPlayers: num }))}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    roomData.maxPlayers === num
                      ? 'bg-purple-600 text-white border-2 border-purple-400'
                      : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {num} Players
                </button>
              ))}
            </div>
          </div>

          {/* Stake Amount (only for stake games) */}
          {gameMode === 'stake' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Stake Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={roomData.stakeAmount}
                onChange={(e) => setRoomData(prev => ({ ...prev, stakeAmount: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
          )}

          {/* Room Privacy */}
          {/* <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={roomData.isPrivate}
                onChange={(e) => setRoomData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-gray-300 font-medium">Private Room</span>
            </label>
            <p className="text-gray-500 text-sm mt-1 ml-8">
              Private rooms won't appear in public listings
            </p>
          </div> */}

          {/* Password (if private) */}
          {roomData.isPrivate && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Room Password
              </label>
              <input
                type="password"
                value={roomData.password}
                onChange={(e) => setRoomData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter room password"
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
          )}

          {/* Room Summary */}
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
            <h3 className="text-white font-semibold mb-3">Room Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Game ID:</span>
                <span className="text-white ml-2 font-mono">{roomData.gameId || 'Not set'}</span>
              </div>
              <div>
                <span className="text-gray-400">Max Players:</span>
                <span className="text-white ml-2">{roomData.maxPlayers}</span>
              </div>
              <div>
                <span className="text-gray-400">Game Mode:</span>
                <span className="text-white ml-2 capitalize">{gameMode}</span>
              </div>
              {gameMode === 'stake' && (
                <div>
                  <span className="text-gray-400">Stake:</span>
                  <span className="text-white ml-2">{roomData.stakeAmount} ETH</span>
                </div>
              )}
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={createRoom}
            disabled={!isConnected || !roomData.gameId || isLoading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-3 ${
              isConnected && roomData.gameId && !isLoading
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:scale-105'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Creating Room...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>
                  {!isConnected? 'Connect Wallet First' : 
                   !roomData.gameId ? 'Enter Game ID' : 
                   'Create Room'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
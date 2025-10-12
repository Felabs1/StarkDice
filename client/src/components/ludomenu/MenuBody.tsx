import {useState} from 'react';
import { Play, Users, Settings, Trophy, Coins, Shield, Plus } from 'lucide-react';
// import useAppStore from '../../zustand/store';
import { useStarknetConnect } from '../../dojo/hooks/useStarknetConnect';
import CreateRoom from "./CreateRoom"
import JoinRoom from './JoinRoom';

interface BodyProps {
  isWalletConnected: boolean;
  gameMode: string;
  setGameMode: (mode: string) => void;
}

const Body: React.FC<BodyProps> = ({ isWalletConnected, gameMode, setGameMode }) => {
  // const player = useAppStore((state) => state.player);
const { status, address } = useStarknetConnect();
const [showCreateRoom, setShowCreateRoom] = useState(false);
const [showJoinRoom, setShowJoinRoom] = useState(false);

  const closeCreateRoom = () => {
    setShowCreateRoom(false);
  };

    const handleCreateRoom = () => {
    setShowCreateRoom(true);
  };

    const closeJoinRoom = () => {
    setShowJoinRoom(false);
  };

    const handleJoinRoom = () => {
    setShowJoinRoom(true);
  };

  

const isConnected = status === "connected";
  return (
    <div className="relative z-10 flex items-center justify-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-lg w-full border border-gray-700/50">
        {/* Game Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-2">
            StarkDice
          </h1>
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <Shield className="w-5 h-5" />
            <span className="text-lg font-medium">On StarkNet</span>
          </div>
        </div>

        {/* Game modes */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Game Mode</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'casual', name: 'Casual', icon: Play, desc: 'Free to play' },
              { id: 'stake', name: 'Stake Game', icon: Coins, desc: 'Bet ETH' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setGameMode(mode.id)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  gameMode === mode.id
                    ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                }`}
              >
                <mode.icon className="w-6 h-6 mx-auto mb-2" />
                <div className="font-semibold">{mode.name}</div>
                <div className="text-xs text-gray-400">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            disabled={!isConnected}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center space-x-3 ${
              isConnected
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6" />
            <span>{isConnected ? 'Quick Match' : 'Connect Wallet to Play'}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleCreateRoom}
              disabled={!isConnected}
              className={`py-3 px-4 rounded-2xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                isConnected
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>

            <button 
              onClick={handleJoinRoom}
              disabled={!isConnected}
              className={`py-3 px-4 rounded-2xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                isConnected
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Join</span>
            </button>
          </div>

          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3">
            <Trophy className="w-5 h-5" />
            <span>Leaderboard</span>
          </button>

          <button className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-3">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
          <CreateRoom
              isOpen={showCreateRoom}
              onClose={closeCreateRoom}
              isWalletConnected={isConnected}
              gameMode={gameMode}
            />

            <JoinRoom
              isOpen={showJoinRoom}
              onClose={closeJoinRoom}
              isWalletConnected={isConnected}
            />

        {/* Game stats */}
        {isConnected && (
          <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-gray-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">12</div>
              <div className="text-xs text-gray-500">Games Won</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">0.5</div>
              <div className="text-xs text-gray-500">ETH Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">Elite</div>
              <div className="text-xs text-gray-500">Rank</div>
            </div>
          </div>
        )}

        {/* StarkNet branding */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-indigo-400 text-sm">Powered by StarkNet</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Body;

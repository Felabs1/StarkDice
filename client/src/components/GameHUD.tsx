
const GameHUD = ({ 
  game,
  currentPlayer, 
  playerPieces = [],
  allPlayers = [],
  diceRoll,
  gameInfo,
  canRollDice
} ) => {
  // Helper functions
  const getPlayerColor = (index) => {
    const colors = ['🔵 Blue', '🟢 Green', '🔴 Red', '🟡 Yellow'];
    return colors[index] || '⚪ Unknown';
  };

  const getPiecesAtHome = () => playerPieces.filter(p => p.is_home).length;
  const getPiecesInPlay = () => playerPieces.filter(p => !p.is_home && !p.is_finished).length;
  const getPiecesFinished = () => playerPieces.filter(p => p.is_finished).length;

  const isMyTurn = game?.current_turn?.toString() === currentPlayer?.index?.toString();

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      color: 'white',
      background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(50, 50, 80, 0.95))',
      padding: '20px',
      borderRadius: 15,
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
      minWidth: 280,
      border: '2px solid rgba(255,255,255,0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: 15, 
        fontSize: '20px', 
        fontWeight: 'bold',
        borderBottom: '2px solid rgba(255,255,255,0.2)',
        paddingBottom: 10
      }}>
   
      </div>

      {/* Game Status */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '12px',
        borderRadius: 8,
        marginBottom: 12
      }}>
        <div style={{ marginBottom: 8, fontSize: '16px', fontWeight: 'bold' }}>
          Game Status
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span>Room:</span>
          <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
            {game?.id || 'Loading...'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span>Active:</span>
          <span style={{ 
            fontWeight: 'bold', 
            color: game?.is_active ? '#4CAF50' : '#f44336' 
          }}>
            {game?.is_active ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Players:</span>
          <span style={{ fontWeight: 'bold' }}>
            {game?.joined_players || 0} / {game?.max_players || 4}
          </span>
        </div>
      </div>

      {/* Current Turn */}
      <div style={{
        background: isMyTurn ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0,0,0,0.3)',
        padding: '12px',
        borderRadius: 8,
        marginBottom: 12,
        border: isMyTurn ? '2px solid #4CAF50' : 'none'
      }}>
        <div style={{ marginBottom: 8, fontSize: '16px', fontWeight: 'bold' }}>
          {isMyTurn ? '🎯 Your Turn!' : 'Current Turn'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span>Player:</span>
          <span style={{ fontWeight: 'bold' }}>
            {getPlayerColor(Number(game?.current_turn || 0))}
          </span>
        </div>
        {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Dice:</span>
          <span style={{ 
            fontWeight: 'bold', 
            fontSize: '18px',
            color: game?.dice_roll ? '#FFD700' : '#999'
          }}>
            {game?.dice_roll ? `🎲 ${game.dice_roll}` : '⚪'}
          </span>
        </div> */}
      </div>

      {/* Your Info */}
      {currentPlayer && (
        <div style={{
          background: 'rgba(33, 150, 243, 0.3)',
          padding: '12px',
          borderRadius: 8,
          marginBottom: 12
        }}>
          <div style={{ marginBottom: 8, fontSize: '16px', fontWeight: 'bold' }}>
            Your Info
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>Color:</span>
            <span style={{ fontWeight: 'bold' }}>
              {getPlayerColor(Number(currentPlayer.index))}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>Position:</span>
            <span style={{ fontWeight: 'bold' }}>
              Player {Number(currentPlayer.index) + 1}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Can Roll:</span>
            <span style={{ 
              fontWeight: 'bold',
              color: canRollDice ? '#4CAF50' : '#f44336'
            }}>
              {canRollDice ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      )}

      {/* Your Pieces */}
      {playerPieces.length > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '12px',
          borderRadius: 8,
          marginBottom: 12
        }}>
          <div style={{ marginBottom: 8, fontSize: '16px', fontWeight: 'bold' }}>
            Your Pieces
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>🏠</div>
              <div style={{ fontSize: '12px' }}>Home</div>
              <div style={{ fontWeight: 'bold', color: '#FFD700' }}>
                {getPiecesAtHome()}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>🎮</div>
              <div style={{ fontSize: '12px' }}>Playing</div>
              <div style={{ fontWeight: 'bold', color: '#2196F3' }}>
                {getPiecesInPlay()}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>🏆</div>
              <div style={{ fontSize: '12px' }}>Finished</div>
              <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {getPiecesFinished()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Dice Roll */}
      {diceRoll && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.2)',
          padding: '12px',
          borderRadius: 8,
          marginBottom: 12
        }}>
          <div style={{ marginBottom: 8, fontSize: '16px', fontWeight: 'bold' }}>
            Last Roll
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>Turn:</span>
            <span style={{ fontWeight: 'bold' }}>#{diceRoll.turn_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Value:</span>
            <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#FFD700' }}>
              🎲 {diceRoll.value}
            </span>
          </div>
        </div>
      )}

      {/* Winner Display */}
      {game?.winner && Number(game.winner) > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.4), rgba(139, 195, 74, 0.4))',
          padding: '15px',
          borderRadius: 8,
          textAlign: 'center',
          border: '2px solid #4CAF50',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ fontSize: '24px', marginBottom: 5 }}>🏆</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Player {game.winner} Wins!
          </div>
        </div>
      )}

      {/* Game State Indicator */}
      <div style={{
        marginTop: 12,
        padding: '10px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {gameInfo?.gameState === 0 
          ? '🎲 Click dice to roll' 
          : '🎯 Select a piece to move'}
      </div>
    </div>
  );
};

export default  GameHUD;
import { create } from 'zustand';
import { DiceRoll, Game, Piece, Player, PlayerProfile } from '../dojo/models.gen';

// Store types
type GameState = {
    games: Record<string, Game>;
    players: Record<string, Player>;
    pieces: Record<string, Piece>;
    diceRolls: Record<string, DiceRoll>;
    playerProfiles: Record<string, PlayerProfile>;
    
    // Current game context
    currentGameId: string | null;
    currentPlayerAddress: string | null;
    
    // Setters
    setGame: (game: Game) => void;
    setPlayer: (player: Player) => void;
    setPiece: (piece: Piece) => void;
    setDiceRoll: (diceRoll: DiceRoll) => void;
    setPlayerProfile: (profile: PlayerProfile) => void;
    
    // Context setters
    setCurrentGame: (gameId: string) => void;
    setCurrentPlayer: (address: string) => void;
    
    // Getters
    getGame: (gameId: string) => Game | undefined;
    getPlayersByGame: (gameId: string) => Player[];
    getPiecesByGame: (gameId: string) => Piece[];
    getPiecesByPlayer: (gameId: string, playerAddress: string) => Piece[];
    getDiceRollsByGame: (gameId: string) => DiceRoll[];
    getPlayerProfile: (address: string) => PlayerProfile | undefined;
    getPieceByIndex: (gameId: number, playerAddress: string, pieceIndex: number) => Piece | undefined;
    getPlayerPiecesArray: (gameId: number, playerAddress: string) => Piece[];
    
    // Game logic helpers
    isPlayerTurn: (gameId: string, playerAddress: string) => boolean;
    getPlayerPiecesAtHome: (gameId: string, playerAddress: string) => Piece[];
    getPlayerPiecesInPlay: (gameId: string, playerAddress: string) => Piece[];
    getPlayerPiecesFinished: (gameId: string, playerAddress: string) => Piece[];
    canPlayerMove: (gameId: string, playerAddress: string) => boolean;
    
    // Utility
    clear: () => void;
    clearGame: (gameId: string) => void;
};

// Create store
export const useGameStore = create<GameState>((set, get) => ({
    games: {},
    players: {},
    pieces: {},
    diceRolls: {},
    playerProfiles: {},
    currentGameId: null,
    currentPlayerAddress: null,
    
    // Setters
    setGame: (game: Game) => set((state) => ({
        games: {
            ...state.games,
            [`${game.id}`]: game
        }
    })),
    
    setPlayer: (player: Player) => set((state) => ({
        players: {
            ...state.players,
            [`${player.game_id}_${player.addr}`]: player
        }
    })),
    
    setPiece: (piece: Piece) => set((state) => ({
        pieces: {
            ...state.pieces,
            [`${piece.game_id}_${piece.player_address}_${piece.piece_index}`]: piece
        }
    })),
    
    setDiceRoll: (diceRoll: DiceRoll) => set((state) => ({
        diceRolls: {
            ...state.diceRolls,
            [`${diceRoll.game_id}_${diceRoll.turn_number}_${diceRoll.roller}`]: diceRoll
        }
    })),
    
    setPlayerProfile: (profile: PlayerProfile) => set((state) => ({
        playerProfiles: {
            ...state.playerProfiles,
            [`${profile.owner}`]: profile
        }
    })),
    
    // Context setters
    setCurrentGame: (gameId: string) => set({ currentGameId: gameId }),
    
    setCurrentPlayer: (address: string) => set({ currentPlayerAddress: address }),
    
    // Getters
    getGame: (gameId: string) => {
        const state = get();
        return state.games[`${gameId}`];
    },
    
    getPlayersByGame: (gameId: string) => {
        const state = get();
        return Object.values(state.players).filter(
            player => player.game_id.toString() === gameId.toString()
        );
    },
    
    getPiecesByGame: (gameId: string) => {
        const state = get();
        return Object.values(state.pieces).filter(
            piece => piece.game_id.toString() === gameId.toString()
        );
    },
      getPieceByIndex: (gameId: number, playerAddress: string, pieceIndex: number) => {
    const state = get();
    return state.pieces[`${gameId}_${playerAddress}_${pieceIndex}`];
  },
  
  // Get all 4 pieces for a player as an array [piece0, piece1, piece2, piece3]
  getPlayerPiecesArray: (gameId: number, playerAddress: string) => {
    const state = get();
    const pieces: Piece[] = [];
    
    // Get pieces in order: 0, 1, 2, 3
    for (let i = 0; i < 4; i++) {
      const piece = state.pieces[`${gameId}_${playerAddress}_${i}`];
      if (piece) {
        pieces.push(piece);
      }
    }
    
    return pieces;
  },
    
    getPiecesByPlayer: (gameId: string, playerAddress: string) => {
        const state = get();
        return Object.values(state.pieces).filter(
            piece => 
                piece.game_id.toString() === gameId.toString() && 
                piece.player_address.toLowerCase() === playerAddress.toLowerCase()
        );
    },
    
    getDiceRollsByGame: (gameId: string) => {
        const state = get();
        return Object.values(state.diceRolls)
            .filter(roll => roll.game_id.toString() === gameId.toString())
            .sort((a, b) => Number(a.turn_number) - Number(b.turn_number));
    },
    
    getPlayerProfile: (address: string) => {
        const state = get();
        return state.playerProfiles[address];
    },
    
    // Game logic helpers
    isPlayerTurn: (gameId: string, playerAddress: string) => {
        const state = get();
        const game = state.games[`${gameId}`];
        const player = state.players[`${gameId}_${playerAddress}`];
        
        if (!game || !player) return false;
        
        return game.current_turn.toString() === player.index.toString();
    },
    
    getPlayerPiecesAtHome: (gameId: string, playerAddress: string) => {
        const state = get();
        return Object.values(state.pieces).filter(
            piece => 
                piece.game_id.toString() === gameId.toString() && 
                piece.player_address.toLowerCase() === playerAddress.toLowerCase() &&
                piece.is_home === true &&
                piece.is_finished === false
        );
    },
    
    getPlayerPiecesInPlay: (gameId: string, playerAddress: string) => {
        const state = get();
        return Object.values(state.pieces).filter(
            piece => 
                piece.game_id.toString() === gameId.toString() && 
                piece.player_address.toLowerCase() === playerAddress.toLowerCase() &&
                piece.is_home === false &&
                piece.is_finished === false
        );
    },
    
    getPlayerPiecesFinished: (gameId: string, playerAddress: string) => {
        const state = get();
        return Object.values(state.pieces).filter(
            piece => 
                piece.game_id.toString() === gameId.toString() && 
                piece.player_address.toLowerCase() === playerAddress.toLowerCase() &&
                piece.is_finished === true
        );
    },
    
    canPlayerMove: (gameId: string, playerAddress: string) => {
        const state = get();
        const game = state.games[`${gameId}`];
        
        if (!game || !game.is_active) return false;
        
        // Check if it's player's turn
        if (!get().isPlayerTurn(gameId, playerAddress)) return false;
        
        // Check if player has pieces that can move
        const inPlay = get().getPlayerPiecesInPlay(gameId, playerAddress);
        const atHome = get().getPlayerPiecesAtHome(gameId, playerAddress);
        
        return inPlay.length > 0 || (atHome.length > 0 && Number(game.dice_roll) === 6);
    },
    
    // Utility
    clear: () => set({
        games: {},
        players: {},
        pieces: {},
        diceRolls: {},
        playerProfiles: {},
        currentGameId: null,
        currentPlayerAddress: null
    }),
    
    clearGame: (gameId: string) => set((state) => {
        const newGames = { ...state.games };
        const newPlayers = { ...state.players };
        const newPieces = { ...state.pieces };
        const newDiceRolls = { ...state.diceRolls };
        
        // Remove game
        delete newGames[`${gameId}`];
        
        // Remove all related players
        Object.keys(newPlayers).forEach(key => {
            if (key.startsWith(`${gameId}_`)) {
                delete newPlayers[key];
            }
        });
        
        // Remove all related pieces
        Object.keys(newPieces).forEach(key => {
            if (key.startsWith(`${gameId}_`)) {
                delete newPieces[key];
            }
        });
        
        // Remove all related dice rolls
        Object.keys(newDiceRolls).forEach(key => {
            if (key.startsWith(`${gameId}_`)) {
                delete newDiceRolls[key];
            }
        });
        
        return {
            games: newGames,
            players: newPlayers,
            pieces: newPieces,
            diceRolls: newDiceRolls
        };
    }),
}));
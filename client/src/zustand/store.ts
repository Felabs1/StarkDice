import { create } from "zustand";
import { persist } from "zustand/middleware";

// Interface matching your bindings //changed from Player
// export interface Player {
//   owner: string;
//   experience: number;
//   health: number;
//   coins: number;
//   creation_day: number;
// }

export interface PlayerProfile {
  owner: string;
  games_won: number;
  games_lost: number;
  creation_day: number;
}

export interface Player {
  game_id: string;
  addr: string;
  index: number;
  has_joined: boolean;
}

export interface Game {
  id: string;
  is_active: boolean;
  owner: string;
  current_turn: number;
  dice_roll: string;
  winner: number;
  max_players: number;
  joined_players: number;
}

export interface Piece {
  game_id: string;
  player_index: number;
  piece_index: number;
  player_address: string;
  position: number;
  is_home: boolean;
  is_finished: boolean;
}

export interface DiceRoll {
  game_id: string;
  turn_number: number;
  roller: string;
  value: number;
}

// Application state
interface AppState {
  // Player data
  // player: Player | null;
  player: PlayerProfile | null;
  ludoPlayer: Player | null;
  ludoPlayers: Player[] | null;
  game: Game | null;
  games: Game[] | null;
  piece: Piece | null;
  pieces: Piece[] | null;
  diceRoll: DiceRoll | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Game state
  gameStarted: boolean;
}

// Store actions
interface AppActions {
  // Player actions
  // setPlayer: (player: Player | null) => void;
  setPlayer: (player: PlayerProfile | null) => void;
  updatePlayerHasJoined: (has_joined: boolean) => void;

  setLudoPlayer: (ludoplayer: Player | null) => void;
  setLudoPlayers: (ludoPlayers: Player[] | null) => void;

  setGame: (game: Game | null) => void;
  setGames: (game: Game[] | null) => void;
  updateGameIsActive: (is_active: boolean) => void;
  updateGameCurrentTurn: (current_turn: number) => void;
  updateGameDiceRoll: (dice_roll: string) => void;
  updateGameWinner: (winner: number) => void;
  updateGameJoinedPlayers: (joined_players: number) => void;

  setPiece: (piece: Piece | null) => void;
  setPieces: (pieces: Piece[] | null) => void;
  updatePiecePosition: (position: number) => void;
  updatePieceIsHome: (is_home: boolean) => void;
  updatePieceIsFinished: (is_finished: boolean) => void;

  setDiceRoll: (diceRoll: DiceRoll | null) => void;
  updateTurnNumber: (turn_number: number) => void;
  updateRoller: (roller: string) => void;
  updateValue: (value: number) => void;

  // updatePlayerCoins: (coins: number) => void;
  // updatePlayerExperience: (experience: number) => void;
  // updatePlayerHealth: (health: number) => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Game actions
  startGame: () => void;
  endGame: () => void;

  // Utility actions
  resetStore: () => void;
}

// Combine state and actions
type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  player: null,
  ludoPlayer: null,
  ludoPlayers: null,
  pieces: null,
  game: null,
  games: null,
  piece: null,
  diceRoll: null,
  isLoading: false,
  error: null,
  gameStarted: false,
};

// Create the store
const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,

      // Player actions
      setPlayer: (player) => set({ player }),
      setLudoPlayer: (ludoPlayer) => set({ ludoPlayer }),
      setLudoPlayers: (ludoPlayers) => set({ ludoPlayers }),
      setGame: (game) => set({ game }),
      setGames: (games) => set({ games }),
      setPieces: (pieces) => set({ pieces }),
      updatePlayerHasJoined: (has_joined) =>
        set((state) => ({
          ludoPlayer: state.ludoPlayer
            ? { ...state.ludoPlayer, has_joined }
            : null,
        })),
      updateGameIsActive: (is_active) =>
        set((state) => ({
          game: state.game ? { ...state.game, is_active } : null,
        })),
      updateGameCurrentTurn: (current_turn) =>
        set((state) => ({
          game: state.game ? { ...state.game, current_turn } : null,
        })),
      updateGameDiceRoll: (dice_roll) =>
        set((state) => ({
          game: state.game ? { ...state.game, dice_roll } : null,
        })),
      updateGameWinner: (winner) =>
        set((state) => ({
          game: state.game ? { ...state.game, winner } : null,
        })),
      updateGameJoinedPlayers: (joined_players) =>
        set((state) => ({
          game: state.game ? { ...state.game, joined_players } : null,
        })),

      setPiece: (piece) => set({ piece }),
      updatePiecePosition: (position) =>
        set((state) => ({
          piece: state.piece ? { ...state.piece, position } : null,
        })),
      updatePieceIsHome: (is_home) =>
        set((state) => ({
          piece: state.piece ? { ...state.piece, is_home } : null,
        })),
      updatePieceIsFinished: (is_finished) =>
        set((state) => ({
          piece: state.piece ? { ...state.piece, is_finished } : null,
        })),

      setDiceRoll: (diceRoll) => set({ diceRoll }),
      updateTurnNumber: (turn_number) =>
        set((state) => ({
          diceRoll: state.diceRoll ? { ...state.diceRoll, turn_number } : null,
        })),
      updateRoller: (roller) =>
        set((state) => ({
          diceRoll: state.diceRoll ? { ...state.diceRoll, roller } : null,
        })),
      updateValue: (value) =>
        set((state) => ({
          diceRoll: state.diceRoll ? { ...state.diceRoll, value } : null,
        })),

      // updatePlayerExperience: (experience) => set((state) => ({
      //   player: state.player ? { ...state.player, experience } : null
      // })),

      // updatePlayerHealth: (health) => set((state) => ({
      //   player: state.player ? { ...state.player, health } : null
      // })),

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Game actions
      startGame: () => set({ gameStarted: true }),
      endGame: () => set({ gameStarted: false }),

      // Utility actions
      resetStore: () => set(initialState),
    }),
    {
      name: "dojo-starter-store",
      partialize: (state) => ({
        player: state.player,
        gameStarted: state.gameStarted,
      }),
    }
  )
);

export default useAppStore;

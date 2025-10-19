import { DojoProvider, DojoCall } from "@dojoengine/core";
import {
  Account,
  AccountInterface,
  BigNumberish,
  CairoOption,
  CairoCustomEnum,
} from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {
  const build_dice_system_rollDice_calldata = (
    gameId: BigNumberish,
    playerIndex: BigNumberish,
    value: BigNumberish
  ): DojoCall => {
    return {
      contractName: "dice_system",
      entrypoint: "roll_dice",
      calldata: [gameId, playerIndex, value],
    };
  };

  const dice_system_rollDice = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    playerIndex: BigNumberish,
    value: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount,
        build_dice_system_rollDice_calldata(gameId, playerIndex, value),
        "starkdice"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_gamesystem_createGame_calldata = (
    gameId: BigNumberish,
    maxPlayers: BigNumberish
  ): DojoCall => {
    return {
      contractName: "gamesystem",
      entrypoint: "create_game",
      calldata: [gameId, maxPlayers],
    };
  };

  const gamesystem_createGame = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    maxPlayers: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount,
        build_gamesystem_createGame_calldata(gameId, maxPlayers),
        "starkdice"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_gamesystem_joinGame_calldata = (
    gameId: BigNumberish
  ): DojoCall => {
    return {
      contractName: "gamesystem",
      entrypoint: "join_game",
      calldata: [gameId],
    };
  };

  const gamesystem_joinGame = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount,
        build_gamesystem_joinGame_calldata(gameId),
        "starkdice"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_gamesystem_spawn_calldata = (): DojoCall => {
    return {
      contractName: "gamesystem",
      entrypoint: "spawn",
      calldata: [],
    };
  };

  const gamesystem_spawn = async (snAccount: Account | AccountInterface) => {
    try {
      return await provider.execute(
        snAccount,
        build_gamesystem_spawn_calldata(),
        "starkdice"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_gamesystem_startGame_calldata = (
    gameId: BigNumberish
  ): DojoCall => {
    return {
      contractName: "gamesystem",
      entrypoint: "start_game",
      calldata: [gameId],
    };
  };

  const gamesystem_startGame = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount,
        build_gamesystem_startGame_calldata(gameId),
        "starkdice"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const build_piece_system_movePiece_calldata = (
    gameId: BigNumberish,
    playerIndex: BigNumberish,
    pieceIndex: BigNumberish
  ): DojoCall => {
    return {
      contractName: "piece_system",
      entrypoint: "move_piece",
      calldata: [gameId, playerIndex, pieceIndex],
    };
  };

  const piece_system_movePiece = async (
    snAccount: Account | AccountInterface,
    gameId: BigNumberish,
    playerIndex: BigNumberish,
    pieceIndex: BigNumberish
  ) => {
    try {
      return await provider.execute(
        snAccount,
        build_piece_system_movePiece_calldata(gameId, playerIndex, pieceIndex),
        "starkdice"
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return {
    dice_system: {
      rollDice: dice_system_rollDice,
      buildRollDiceCalldata: build_dice_system_rollDice_calldata,
    },
    gamesystem: {
      createGame: gamesystem_createGame,
      buildCreateGameCalldata: build_gamesystem_createGame_calldata,
      joinGame: gamesystem_joinGame,
      buildJoinGameCalldata: build_gamesystem_joinGame_calldata,
      spawn: gamesystem_spawn,
      buildSpawnCalldata: build_gamesystem_spawn_calldata,
      startGame: gamesystem_startGame,
      buildStartGameCalldata: build_gamesystem_startGame_calldata,
    },
    piece_system: {
      movePiece: piece_system_movePiece,
      buildMovePieceCalldata: build_piece_system_movePiece_calldata,
    },
  };
}

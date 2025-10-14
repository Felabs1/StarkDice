import { useState, useCallback } from "react";
import { useAccount, useCall } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account, num } from "starknet";
import useAppStore from "../../zustand/store";
import { useParams } from "react-router-dom";
import { useStarkDiceEntities } from "../../utils/starkdiceState";
import { useStarknetConnect } from "./useStarknetConnect";

interface MovePieceActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: "PENDING" | "SUCCESS" | "REJECTED" | null;
}

interface useMovePieceActionReturn {
  movePieceState: MovePieceActionState;
  executeMovePiece: (
    pieceIndex: number
  ) => Promise<void>;
  canMovePiece: boolean;
  resetMovePieceState: () => void;
}

export const useMovePieceAction = (): useMovePieceActionReturn => {
  const { account } = useAccount();
  const { status, address } = useStarknetConnect();
  const { client } = useDojoSDK();
  const {state } = useStarkDiceEntities();
  const {
    diceRoll,
    piece,
    updateGameCurrentTurn,
    updateGameDiceRoll,
    updateGameWinner,
    updatePiecePosition,
    updateRoller,
    updateTurnNumber,
    updateValue,
    updatePieceIsHome,
    updatePieceIsFinished,
  } = useAppStore();
  
  const { gameId } = useParams();

  const game = gameId ? state.getGame(gameId) : undefined;

  const [movePieceState, setMovePieceState] = useState<MovePieceActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
  });
  const isConnected = status === "connected";
  const canMovePiece = isConnected && !movePieceState.isLoading;

const currentPlayer = gameId &&address
  ? state.players[`${gameId}_${address}`]
  : undefined;

  const executeMovePiece = useCallback(
    async (pieceIndex: number) => {
      if (!canMovePiece || !account || !currentPlayer) {
        const errorMsg = !account ? "Please connect your controller" : "";
        setMovePieceState((prev) => ({ ...prev, error: errorMsg }));
        return;
      }

      try {
        setMovePieceState({
          isLoading: true,
          error: null,
          txHash: null,
          txStatus: "PENDING",
        });
        console.log("📤 Executing create game transaction...");

        const tx = await client.gamesystem.createGame(
          account as Account,
          gameId,
          currentPlayer.index,
          pieceIndex
        );
        console.log("📥 executing move piece transaction:", tx);

        if (tx?.transaction_hash) {
          setMovePieceState((prev) => ({
            ...prev,
            txHash: tx.transaction_hash,
          }));
        }

        if (tx && tx.code === "SUCCESS") {
          updateGameCurrentTurn(Number(game?.current_turn) || 0);
          updateGameDiceRoll(String(game?.dice_roll) || "DICE_NOT_ROLLED");
          updateGameWinner(Number(game?.winner) || 1000);

          updatePiecePosition(piece?.position || 0);
          updateRoller(diceRoll?.roller || "");
          updateTurnNumber(diceRoll?.turn_number || 0);
          updateValue(diceRoll?.value || 1);
          updatePieceIsHome(piece?.is_home || false);
          updatePieceIsFinished(piece?.is_finished || false);

          setMovePieceState((prev) => ({
            ...prev,
            txStatus: "SUCCESS",
            isLoading: false,
          }));
        } else {
          throw new Error(
            `create game transaction failed with ${tx?.code || "unknown"}`
          );
        }
      } catch (error) {
        console.error("❌ Error executing create game:", error);
        setMovePieceState({
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
          txHash: null,
          txStatus: "REJECTED",
        });
      }
    },
    [
      game,
      diceRoll,
      piece,
      updateGameCurrentTurn,
      updateGameDiceRoll,
      updateGameWinner,
      updatePiecePosition,
      updateRoller,
      updateTurnNumber,
      updateValue,
      updatePieceIsHome,
      updatePieceIsFinished,
    ]
  );

  const resetMovePieceState = useCallback(() => {
    setMovePieceState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
    });
  }, []);

  return {
    movePieceState,
    executeMovePiece,
    canMovePiece,
    resetMovePieceState,
  };
};

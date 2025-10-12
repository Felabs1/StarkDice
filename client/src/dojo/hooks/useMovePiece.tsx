import { useState, useCallback } from "react";
import { useAccount, useCall } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account, num } from "starknet";
import useAppStore from "../../zustand/store";

interface MovePieceActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: "PENDING" | "SUCCESS" | "REJECTED" | null;
}

interface useMovePieceActionReturn {
  movePieceState: MovePieceActionState;
  executeMovePiece: (
    gameId: string,
    playerIndex: number,
    pieceIndex: number
  ) => Promise<void>;
  canMovePiece: boolean;
  resetMovePieceState: () => void;
}

export const useMovePieceAction = (): useMovePieceActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const {
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
  } = useAppStore();
  const [movePieceState, setMovePieceState] = useState<MovePieceActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
  });
  const isConnected = status === "connected";
  const canMovePiece = isConnected && !movePieceState.isLoading;

  const executeMovePiece = useCallback(
    async (gameId: string, playerIndex: number, pieceIndex: number) => {
      if (!canMovePiece || !account) {
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
          playerIndex,
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
          updateGameCurrentTurn(game?.current_turn || 0);
          updateGameDiceRoll(game?.dice_roll || "DICE_NOT_ROLLED");
          updateGameWinner(game?.winner || 1000);

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

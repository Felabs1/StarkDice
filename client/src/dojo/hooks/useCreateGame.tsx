import { useState, useCallback } from "react";
import { useAccount, useCall } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";
import { useNavigate } from "react-router-dom";

interface CreateGameActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: "PENDING" | "SUCCESS" | "REJECTED" | null;
}

interface UseGreateGameActionReturn {
  createGameState: CreateGameActionState;
  executeCreateGame: (gameId: string, maxPlayers: number) => Promise<void>;
  canCreateGame: boolean;
  resetCreateGameState: () => void;
}

export const useCreateGameAction = (): UseGreateGameActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const {
    game,
    updateGameIsActive,
    updateGameCurrentTurn,
    updateGameDiceRoll,
    updateGameWinner,
    updateGameJoinedPlayers,
  } = useAppStore();

  const [createGameState, setCreateGameState] = useState<CreateGameActionState>(
    {
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
    }
  );

  const navigate = useNavigate();

  const isConnected = status === "connected";
  const canCreateGame = isConnected && !createGameState.isLoading;

  const executeCreateGame = useCallback(
    async (gameId: string, maxPlayers: number) => {
      if (!canCreateGame || !account) {
        const errorMsg = !account ? "Please connect your controller" : "";
        setCreateGameState((prev) => ({ ...prev, error: errorMsg }));
        return;
      }

      try {
        setCreateGameState({
          isLoading: true,
          error: null,
          txHash: null,
          txStatus: "PENDING",
        });

        console.log("📤 Executing create game transaction...");

        const tx = await client.gamesystem.createGame(
          account as Account,
          gameId,
          maxPlayers
        );
        console.log("📥 creategame transaction response:", tx);

        if (tx?.transaction_hash) {
          setCreateGameState((prev) => ({
            ...prev,
            txHash: tx.transaction_hash,
          }));
        }

        if (tx && tx.code === "SUCCESS") {
          console.log("✅ creategame transaction successful!");
          updateGameCurrentTurn(game?.current_turn || 0);
          updateGameDiceRoll(game?.dice_roll || "DICE_NOT_ROLLED");
          updateGameIsActive(game?.is_active || false);
          updateGameWinner(game?.winner || 1000);
          updateGameJoinedPlayers(game?.joined_players || 1);

          setCreateGameState((prev) => ({
            ...prev,
            txStatus: "SUCCESS",
            isLoading: false,
          }));

          alert("game created successfully");

          setTimeout(() => {
            setCreateGameState({
              isLoading: false,
              error: null,
              txHash: null,
              txStatus: null,
            });
          }, 3000);

          setTimeout(() => {
            navigate(`/lobby/${gameId}`);
          }, 3000);
        } else {
          throw new Error(
            `create game transaction failed with ${tx?.code || "unknown"}`
          );
        }
      } catch (error) {
        console.error("❌ Error executing create game:", error);
        setCreateGameState({
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
          txHash: null,
          txStatus: "REJECTED",
        });
      }
    },
    [
      canCreateGame,
      account,
      client.gamesystem,
      game,
      updateGameCurrentTurn,
      updateGameDiceRoll,
      updateGameIsActive,
      updateGameJoinedPlayers,
      updateGameWinner,
    ]
  );

  const resetCreateGameState = useCallback(() => {
    setCreateGameState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
    });
  }, []);

  return {
    createGameState,
    executeCreateGame,
    canCreateGame,
    resetCreateGameState,
  };
};

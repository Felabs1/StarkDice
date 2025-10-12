import { useState, useCallback } from "react";
import { useAccount, useCall } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";
import { useNavigate } from "react-router-dom";

interface StartGameActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: "PENDING" | "SUCCESS" | "REJECTED" | null;
}

interface useStartGameActionReturn {
  startGameState: StartGameActionState;
  executeStartGame: (gameId: string) => Promise<void>;
  canStartGame: boolean;
  resetStartGameState: () => void;
}

export const useStartGameAction = (): useStartGameActionReturn => {
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

  const [startGameState, setStartGameState] = useState<StartGameActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
  });

  const navigate = useNavigate();

  const isConnected = status === "connected";

  const canStartGame = isConnected && !startGameState.isLoading;

  const executeStartGame = useCallback(
    async (gameId: string) => {
      if (!canStartGame || !account) {
        const errorMsg = !account ? "Please connect your controller" : "";
        setStartGameState((prev) => ({ ...prev, error: errorMsg }));
        return;
      }

      try {
        setStartGameState({
          isLoading: true,
          error: null,
          txHash: null,
          txStatus: "PENDING",
        });

        console.log("📤 Executing create game transaction...");
        console.log(client);
        const tx = await client.gamesystem.startGame(
          account as Account,
          gameId
        );
        console.log("📥 creategame transaction response:", tx);

        if (tx?.transaction_hash) {
          setStartGameState((prev) => ({
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

          setStartGameState((prev) => ({
            ...prev,
            txStatus: "SUCCESS",
            isLoading: false,
          }));

          alert("game created successfully");

          setTimeout(() => {
            setStartGameState({
              isLoading: false,
              error: null,
              txHash: null,
              txStatus: null,
            });
          }, 3000);

          setTimeout(() => {
            navigate(`/game/${gameId}`);
          }, 3000);
        } else {
          throw new Error(
            `create game transaction failed with ${tx?.code || "unknown"}`
          );
        }
      } catch (error) {
        console.error("❌ Error executing create game:", error);
        setStartGameState({
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
          txHash: null,
          txStatus: "REJECTED",
        });
      }
    },
    [
      canStartGame,
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

  const resetStartGameState = useCallback(() => {
    setStartGameState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
    });
  }, []);

  return {
    startGameState,
    executeStartGame,
    canStartGame,
    resetStartGameState,
  };
};

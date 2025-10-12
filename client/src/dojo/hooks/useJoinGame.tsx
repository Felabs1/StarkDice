import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";
import { useNavigate } from "react-router-dom";

interface JoinGameActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: "PENDING" | "SUCCESS" | "REJECTED" | null;
}

interface UseJoinGameActionReturn {
  joinGameState: JoinGameActionState;
  executeJoinGame: (gameId: string) => Promise<void>;
  canJoinGame: boolean;
  resetJoinGameState: () => void;
}

export const useJoinGameAction = (): UseJoinGameActionReturn => {
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

  const navigate = useNavigate();

  const [joinGameState, setJoinGameState] = useState<JoinGameActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
  });

  const isConnected = status === "connected";
  const canJoinGame = isConnected && !joinGameState.isLoading;

  const executeJoinGame = useCallback(
    async (gameId: string) => {
      if (!canJoinGame || !account) {
        const errorMsg = !account ? "please connect your controller" : "";
        setJoinGameState((prev) => ({ ...prev, error: errorMsg }));
      }

      try {
        setJoinGameState({
          isLoading: true,
          error: null,
          txHash: null,
          txStatus: "PENDING",
        });

        console.log("📥 Executing join game transaction...");
        console.log("client", client);
        const tx = await client.gamesystem.joinGame(account as Account, gameId);
        console.log("📥 join game transaction response");
        if (tx?.transaction_hash) {
          setJoinGameState((prev) => ({
            ...prev,
            txHash: tx.transaction_hash,
          }));
        }

        if (tx && tx.code === "SUCCESS") {
          console.log("✅ join game transaction response", tx);
          updateGameCurrentTurn(game?.current_turn || 0);
          updateGameDiceRoll(game?.dice_roll || "DICE_NOT_ROLLED");
          updateGameIsActive(game?.is_active || false);
          updateGameWinner(game?.winner || 1000);
          updateGameJoinedPlayers(game?.joined_players || 1);

          setJoinGameState((prev) => ({
            ...prev,
            txStatus: "SUCCESS",
            isLoading: false,
          }));
          alert("player successfully joined");

          setTimeout(() => {
            setJoinGameState({
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
            `join game transaction failed with ${tx?.code || "unknown"}`
          );
        }
      } catch (error) {
        console.error("error executing join game:", error);
        setJoinGameState({
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
          txHash: null,
          txStatus: "REJECTED",
        });
      }
    },
    [
      canJoinGame,
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

  const resetJoinGameState = useCallback(() => {
    setJoinGameState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
    });
  }, []);

  return {
    joinGameState,
    executeJoinGame,
    canJoinGame,
    resetJoinGameState,
  };
};

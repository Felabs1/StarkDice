import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";
import { useStarkDiceStore } from "../../store/strkDice";
import { useGameStore } from "../../store/starkDiceStore";
import { useStarkDiceEntities } from "../../utils/starkdiceState";
import { ensureHexZeroPrefix } from "../../utils/utils";
import { useStarknetConnect } from "./useStarknetConnect";
import { useParams } from "react-router-dom";

interface RollDiceActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: "PENDING" | "SUCCESS" | "REJECTED" | null;
}

interface UseRollDiceActionReturn {
  rollDiceState: RollDiceActionState;
  executeRollDice: (
    value: number
  ) => Promise<void>;
  canRollDice: boolean;
  resetRollDiceState: () => void;
}

export const useRollDiceAction = (): UseRollDiceActionReturn => {
  const { account} = useAccount();
  const { status, address } = useStarknetConnect();
  const { client } = useDojoSDK();
  const {game_id} = useStarkDiceStore();
  const {state } = useStarkDiceEntities();
  const {
    ludoPlayer,
    piece,
    updateGameIsActive,
    updateGameCurrentTurn,
    updateGameDiceRoll,
    updateGameWinner,
    updateGameJoinedPlayers,
    diceRoll,
    updateTurnNumber,
    updateRoller,
    updateValue,
  } = useAppStore();

  const { gameId } = useParams();

  const game = gameId ? state.getGame(gameId) : undefined;

  const playerPieces = gameId &&  address 
  ? state.getPiecesByPlayer(gameId, address) 
  : [];

  console.log(address,gameId,state.players)

  const currentPlayer = gameId &&address
  ? state.players[`${gameId}_${address}`]
  : undefined;

  const [rollDiceState, setRollDiceState] = useState<RollDiceActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
  });

  const isConnected = status === "connected";
  const canRollDice =
    isConnected &&
    !rollDiceState.isLoading &&
    game?.is_active === true &&
    game?.current_turn?.toString() === currentPlayer?.index?.toString();
  //console.log("dice clicker ", ludoPlayer);
  console.log("----->",game?.current_turn,currentPlayer?.index);
  const executeRollDice = useCallback(
    async (value: number) => {
      if (!canRollDice || !account) {
        const errorMsg = !account ? "please connect your controller" : "";
        setRollDiceState((prev) => ({ ...prev, error: errorMsg }));
      }

      try {
        setRollDiceState({
          isLoading: true,
          error: null,
          txHash: null,
          txStatus: "PENDING",
        });

        if(!currentPlayer) return;

        console.log("📥 Executing join game transaction...");
        // console.log("client", client);

        const tx = await client.dice_system.rollDice(
          account as Account,
          gameId,
          currentPlayer.index,
          value
        );
        console.log("📥 roll dice tx response: ", tx);

        if (tx?.transaction_hash) {
          setRollDiceState((prev) => ({
            ...prev,
            txHash: tx.transaction_hash,
          }));
        }

        if (tx && tx.code === "SUCCESS") {
          console.log("✅ roll dice transaction successful");
          updateGameCurrentTurn(Number(game?.current_turn) || 0);
          updateGameDiceRoll(String(game?.dice_roll) || "DICE_NOT_ROLLED");
          updateTurnNumber(diceRoll?.turn_number || 0);
          updateRoller(diceRoll?.roller || "");
          updateValue(diceRoll?.value || 1);
          setRollDiceState((prev) => ({
            ...prev,
            txStatus: "SUCCESS",
            isLoading: false,
          }));

          console.log("dice rolled successfully");
        } else {
          throw new Error(
            `roll dice transaction failed with ${tx?.code || "unknown"}`
          );
        }
      } catch (error) {
        console.error("❌ Error executing roll dice: ", error);
        setRollDiceState({
          isLoading: false,
          error: error instanceof Error ? error.message : "unknown error",
          txHash: null,
          txStatus: "REJECTED",
        });
      }
    },
    [
      canRollDice,
      account,
      client.dice_system,
      diceRoll,
      updateGameWinner,
      updateGameJoinedPlayers,
      updateTurnNumber,
      updateRoller,
      updateValue,
      updateGameIsActive,
    ]
  );

  const resetRollDiceState = useCallback(() => {
    setRollDiceState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
    });
  }, []);

  return {
    rollDiceState,
    executeRollDice,
    canRollDice,
    resetRollDiceState,
  };
};

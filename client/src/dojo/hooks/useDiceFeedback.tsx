import { useEffect, useState, useMemo } from "react";
import { ToriiClient } from "@dojoengine/torii-client";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import useAppStore, { DiceRoll } from "../../zustand/store";
import { useNavigate } from "react-router-dom";
// import { DiceRoll } from "../bindings";

interface UseDiceReturn {
  dice: DiceRoll | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const GAME_QUERY = `
query GetDiceRoll ($gameId: felt252!, turnNumber: u8!) {
  dojoStarterDiceRollModels(where: {game_id: $gameId, turn_number: $turnNumber}) {
    edges {
      node {
        game_id
        roller
        turn_number
        value
      }
    }
  }
}
  

`;

const hexToNumber = (hexValue: string | number): number => {
  if (typeof hexValue === "number") return hexValue;
  if (typeof hexValue === "string" && hexValue.startsWith("0x")) {
    return parseInt(hexValue, 16);
  }
  if (typeof hexValue === "string") {
    return parseInt(hexValue, 10);
  }
  return 0;
};

const hexToUtf8String = (hexValue: string): string => {
  if (typeof hexValue !== "string" || !hexValue.startsWith("0x")) {
    throw new Error("Invalid hex string");
  }
  const hex = hexValue.slice(2);
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (code) str += String.fromCharCode(code);
  }
  return str;
};

const fetchDiceData = async (
  gameId: string,
  turnNumber: number
): Promise<DiceRoll | null> => {
  try {
    console.log("fetching dice");
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GAME_QUERY,
        variables: { gameId, turnNumber },
      }),
    });

    const result = await response.json();
    console.log("📡 GraphQL response:", result);

    if (!result.data?.dojoStarterDiceRollModels?.edges?.length) {
      console.log("❌ No Game found in response");
      return null;
    }

    const rawGameData: DiceRoll =
      result.data.dojoStarterDiceRollModels.edges[0].node;

    const diceRollData: DiceRoll = {
      game_id: hexToUtf8String(rawGameData.game_id),
      turn_number: rawGameData.turn_number,
      roller: rawGameData.roller,
      value: rawGameData.value,
    };

    return diceRollData;
  } catch (error) {
    console.error("❌ Error Fetching Games", error);
    throw error;
  }
};

export const useDice = (gameId: string, turnNumber: number): UseDiceReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();

  const storeDiceRoll = useAppStore((state) => state.diceRoll);
  const setDiceRoll = useAppStore((state) => state.setDiceRoll);

  const userAddress = useMemo(
    () => (account ? addAddressPadding(account.address).toLowerCase() : ""),
    [account]
  );

  const refetch = async () => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const diceData = await fetchDiceData(gameId, turnNumber);
      console.log("🎮 Player data fetched:", diceData);

      setDiceRoll(diceData);

      const updatedDiceRoll = useAppStore.getState().diceRoll;
      console.log("💾 Player in store after update:", updatedDiceRoll);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      console.error("❌ Error in refetch:", error);
      setError(error);
      setDiceRoll(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("address changed refetching dice data");
    refetch();

    let subscription: any;

    const subscribe = async () => {
      try {
        const torii = await new ToriiClient({
          toriiUrl: dojoConfig.toriiUrl,
          worldAddress: dojoConfig.manifest.world.address,
        });

        console.log("✅ Torii client ready:", torii);

        subscription = await torii.onEntityUpdated(
          {
            Keys: {
              keys: [undefined],
              pattern_matching: "VariableLen",
              models: [],
            },
          },
          (entities: any) => {
            console.log("📡 Updated entities:", entities.models);
            // console.log(entities.models);
            refetch();

            if (entities.models["dojo_starter-DiceRoll"]["roller"].value) {
              refetch();
            }
          }
        );
      } catch (error) {
        console.error("❌ Failed to subscribe to Torii updates:", error);
      }
    };

    subscribe();

    return () => {
      subscription?.cancel?.();
    };
  }, [userAddress]);

  return {
    dice: storeDiceRoll,
    isLoading,
    error,
    refetch,
  };
};

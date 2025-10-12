import { useEffect, useState, useMemo } from "react";
import { ToriiClient } from "@dojoengine/torii-client";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import useAppStore, { Game } from "../../zustand/store";
import { useNavigate } from "react-router-dom";

interface UseGameReturn {
  games: Game[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const GAME_QUERY = `query GetGames {
  dojoStarterGameModels {
    edges {
      node {
        id
        is_active
        joined_players
        max_players
        owner
        winner
        dice_roll
        current_turn
      }
    }
    totalCount
  }
}`;

// --- helpers ---
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

// --- fetch from graphql ---
const fetchGameData = async (): Promise<Game[] | null> => {
  try {
    console.log("fetching games");
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: GAME_QUERY }),
    });

    const result = await response.json();
    console.log("📡 GraphQL response:", result);

    if (!result.data?.dojoStarterGameModels?.edges?.length) {
      console.log("❌ No Game found in response");
      return null;
    }

    const edges = result.data.dojoStarterGameModels.edges;
    const rawGameData: Game[] = edges.map((edge: any) => {
      const node = edge.node;
      return {
        id: hexToUtf8String(node.id),
        is_active: node.is_active,
        joined_players: node.joined_players,
        max_players: node.max_players,
        owner: node.owner,
        winner: node.winner,
        dice_roll: hexToUtf8String(node.dice_roll),
        current_turn: node.current_turn,
      };
    });

    return rawGameData;
  } catch (error) {
    console.error("❌ Error Fetching Games", error);
    throw error;
  }
};

// --- main hook ---
export const useGame = (): UseGameReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();

  const storeGames = useAppStore((state) => state.games);
  const setGames = useAppStore((state) => state.setGames);

  const navigate = useNavigate();
  const userAddress = useMemo(
    () => (account ? addAddressPadding(account.address).toLowerCase() : ""),
    [account]
  );

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const gameData = await fetchGameData();
      setGames(gameData);

      const updatedGames = useAppStore.getState().games;
      console.log("games after update", updatedGames);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occured");
      setError(error);
      setGames(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Address changed, refetching game data");
    refetch();

    let subscription: any;

    const subscribe = async () => {
      try {
        // ✅ Await the client, it’s async in your version
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
            fetchGameData();
            refetch();

            setTimeout(() => {
              if (
                entities.models["dojo_starter-Game"]["is_active"].value === true
              ) {
                const gameId = entities.models["dojo_starter-Game"]["id"].value;
                navigate(`/game/${hexToUtf8String(gameId)}`);
              }
            }, 2000);
          }
        );
      } catch (err) {
        console.error("❌ Failed to subscribe to Torii updates:", err);
      }
    };

    subscribe();

    return () => {
      subscription?.cancel?.();
    };
  }, [userAddress]);

  return {
    games: storeGames,
    isLoading,
    error,
    refetch,
  };
};

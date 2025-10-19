import { useEffect, useState, useMemo } from "react";
import { ToriiClient } from "@dojoengine/torii-client";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import useAppStore, { Player } from "../../zustand/store";

interface UsePlayerReturn {
  players: Player[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const PLAYER_QUERY = `
    query GetPlayer($gameId: felt252!) {
        starkdicePlayerModels(where: { game_id: $gameId}) {
            edges {
                node {
                    addr
                    game_id
                    has_joined
                    index
                }
            }
            totalCount
        }
    }
`;

// helper to convert hex values to numbers
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

const utf8StringToHex = (str: string): string => {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + hex;
};

const fetchPlayerData = async (gameId: string): Promise<Player[] | null> => {
  console.log("game id ", gameId);
  console.log("game id ", utf8StringToHex(gameId));
  const _gameId = utf8StringToHex(gameId);
  try {
    console.log("fetching players");

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PLAYER_QUERY,
        variables: { gameId: _gameId },
      }),
    });

    const result = await response.json();
    console.log("📡 GraphQL response:", result);

    if (!result.data?.starkdicePlayerModels?.edges?.length) {
      console.log("❌ No Player found in response");
      return null;
    }

    const edges = result.data.starkdicePlayerModels.edges;
    const rawPlayerData: Player[] = edges.map((edge: any) => {
      const node = edge.node;
      return {
        addr: node.addr,
        game_id: hexToUtf8String(node.game_id),
        has_joined: node.has_joined,
        index: node.index,
      };
    });

    return rawPlayerData;
  } catch (error) {
    console.error("❌ Error Fetching Games", error);
    throw error;
  }
};

// --main hook ---

export const usePlayers = (gameId: string): UsePlayerReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();

  const storePlayers = useAppStore((state) => state.ludoPlayers);
  const setPlayers = useAppStore((state) => state.setLudoPlayers);

  const userAddress = useMemo(
    () => (account ? addAddressPadding(account.address).toLowerCase() : ""),
    [account]
  );

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const playerData = await fetchPlayerData(gameId);
      console.log("players data", playerData);
      setPlayers(playerData);

      const updatedPlayers = useAppStore.getState().ludoPlayers;
      console.log("players after update", updatedPlayers);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occured");
      setError(error);
      setPlayers(null);
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
            console.log("📡 Updated player entities:", entities.models);
            fetchPlayerData(gameId);
            refetch();
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
    players: storePlayers,
    isLoading,
    error,
    refetch,
  };
};

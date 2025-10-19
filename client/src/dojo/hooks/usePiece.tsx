import { useEffect, useState, useMemo } from "react";
import { ToriiClient } from "@dojoengine/torii-client";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import useAppStore, { Piece } from "../../zustand/store";

interface UsePieceReturn {
  pieces: Piece[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const PIECE_QUERY = `
    query GetPiece($gameId: felt252!) {
        starkdicePieceModels(where: { game_id: $gameId}) {
            edges {
                node {
                    game_id
                    is_finished
                    is_home
                    piece_index
                    player_address
                    player_index
                    position
                }
            }
            totalCount
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

const utf8StringToHex = (str: string): string => {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + hex;
};

const fetchPieceData = async (gameId: string): Promise<Piece[] | null> => {
  console.log("game id ", gameId);
  console.log("game id ", utf8StringToHex(gameId));
  const _gameId = utf8StringToHex(gameId);

  try {
    console.log("fetching pieces");
    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PIECE_QUERY,
        variables: { gameId: _gameId },
      }),
    });

    const result = await response.json();
    console.log("📡 GraphQL response:", result);

    if (!result.data?.starkdicePieceModels?.edges?.length) {
      console.log("❌ No Piece found in response");
      return null;
    }

    const edges = result.data.starkdicePieceModels.edges;
    const rawPieceData: Piece[] = edges.map((edge: any) => {
      const node = edge.node;
      return {
        game_id: hexToUtf8String(node.game_id),
        is_finished: node.is_finished,
        is_home: node.is_home,
        piece_index: node.piece_index,
        player_address: node.player_address,
        player_index: node.player_index,
        position: node.position,
      };
    });

    console.log("raw piece data", rawPieceData);
    return rawPieceData;
  } catch (error) {
    console.error("Error fecching pieces");
    throw error;
  }
};

export const usePieces = (gameId: string): UsePieceReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();

  const storePieces = useAppStore((state) => state.pieces);
  const setPieces = useAppStore((state) => state.setPieces);

  const userAddress = useMemo(
    () => (account ? addAddressPadding(account.address).toLowerCase() : ""),
    [account]
  );

  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const pieceData = await fetchPieceData(gameId);
      console.log("players data", pieceData);
      setPieces(pieceData);

      const updatedPieces = useAppStore.getState().pieces;
      console.log("players after update", updatedPieces);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occured");
      setError(error);
      setPieces(null);
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
            console.log("📡 Updated pieces entities:", entities.models);
            fetchPieceData(gameId);
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

  useEffect(() => {
    if (userAddress) {
      console.log("🔄 Address changed, refetching player data");
      refetch();
    }
  }, [userAddress]);

  return {
    pieces: storePieces,
    isLoading,
    error,
    refetch,
  };
};

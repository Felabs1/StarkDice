import { useEffect, useState, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { addAddressPadding } from "starknet";
import { dojoConfig } from "../dojoConfig";
import { PlayerProfile } from "../../zustand/store";
import useAppStore from "../../zustand/store";

interface UsePlayerReturn {
  player: PlayerProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const PLAYER_QUERY = `
    query GetPlayer($playerOwner: ContractAddress!) {
        starkdicePlayerProfileModels(where: { owner: $playerOwner }) {
            edges {
                node {
                    owner
                    games_won
                    games_lost
                    creation_day
                }
            }
            totalCount
        }
    }
`;

// Helper to convert hex values to numbers
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

// Function to fetch player data from GraphQL
const fetchPlayerData = async (
  playerOwner: string
): Promise<PlayerProfile | null> => {
  try {
    console.log("🔍 Fetching player with owner:", playerOwner);

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: PLAYER_QUERY,
        variables: { playerOwner },
      }),
    });

    const result = await response.json();
    console.log("📡 GraphQL response:", result);

    if (!result.data?.starkdicePlayerProfileModels?.edges?.length) {
      console.log("❌ No player found in response");
      return null;
    }

    // Extract player data
    const rawPlayerData =
      result.data.starkdicePlayerProfileModels.edges[0].node;
    console.log("📄 Raw player data:", rawPlayerData);

    // Convert hex values to numbers - using your structure
    const playerData: PlayerProfile = {
      owner: rawPlayerData.owner,
      games_won: hexToNumber(rawPlayerData.games_won),
      games_lost: hexToNumber(rawPlayerData.games_lost),
      creation_day: hexToNumber(rawPlayerData.creation_day),
    };

    console.log("✅ Player data after conversion:", playerData);
    return playerData;
  } catch (error) {
    console.error("❌ Error fetching player:", error);
    throw error;
  }
};

// Main hook
export const usePlayer = (): UsePlayerReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { account } = useAccount();

  const storePlayer = useAppStore((state) => state.player);
  const setPlayer = useAppStore((state) => state.setPlayer);

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

      const playerData = await fetchPlayerData(userAddress);
      console.log("🎮 Player data fetched:", playerData);

      setPlayer(playerData);

      const updatedPlayer = useAppStore.getState().player;
      console.log("💾 Player in store after update:", updatedPlayer);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      console.error("❌ Error in refetch:", error);
      setError(error);
      setPlayer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userAddress) {
      console.log("🔄 Address changed, refetching player data");
      refetch();
    }
  }, [userAddress]);

  useEffect(() => {
    if (!account) {
      console.log("❌ No account, clearing player data");
      setPlayer(null);
      setError(null);
      setIsLoading(false);
    }
  }, [account, setPlayer]);

  return {
    player: storePlayer,
    isLoading,
    error,
    refetch,
  };
};

import { ClauseBuilder, ToriiQueryBuilder } from "@dojoengine/sdk";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useEffect } from "react";
import { useGameStore } from "../store/starkDiceStore";

// Helper to extract primitive value
const getPrimitiveValue = (field: any) => {
  if (field?.type === "primitive") {
    switch (field.type_name) {
      case "ContractAddress":
        return field.value;
      case "u256":
      case "u64":
      case "u128":
      case "u32":
      case "u16":
      case "u8":
        return BigInt(field.value).toString();
      case "felt252":
        return field.value;
      case "bool":
        return field.value;
      default:
        return Number(field.value);
    }
  }

  if (field?.type === "struct") {
    if (typeof field.value === "object") {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(field.value)) {
        result[key] = getPrimitiveValue(value);
      }
      return result;
    }
    return getPrimitiveValue({
      type: "primitive",
      type_name: field.type_name,
      value: field.value,
    });
  }

  if (field?.type === "enum") {
    return field.value.option;
  }

  return field;
};

// Transform functions for each entity type
const transformDiceRoll = (rawData: any) => {
  const data = rawData["starkdice-DiceRoll"];
  if (!data) return null;

  return {
    game_id: getPrimitiveValue(data.game_id),
    turn_number: getPrimitiveValue(data.turn_number),
    roller: getPrimitiveValue(data.roller),
    value: getPrimitiveValue(data.value),
  };
};

const transformGame = (rawData: any) => {
  const data = rawData["starkdice-Game"];
  if (!data) return null;

  return {
    id: getPrimitiveValue(data.id),
    is_active: getPrimitiveValue(data.is_active),
    owner: getPrimitiveValue(data.owner),
    current_turn: getPrimitiveValue(data.current_turn),
    dice_roll: getPrimitiveValue(data.dice_roll),
    winner: getPrimitiveValue(data.winner),
    max_players: getPrimitiveValue(data.max_players),
    joined_players: getPrimitiveValue(data.joined_players),
  };
};

const transformPiece = (rawData: any) => {
  const data = rawData["starkdice-Piece"];
  if (!data) return null;

  return {
    game_id: getPrimitiveValue(data.game_id),
    player_index: getPrimitiveValue(data.player_index),
    piece_index: getPrimitiveValue(data.piece_index),
    player_address: getPrimitiveValue(data.player_address),
    position: getPrimitiveValue(data.position),
    is_home: getPrimitiveValue(data.is_home),
    is_finished: getPrimitiveValue(data.is_finished),
  };
};

const transformPlayer = (rawData: any) => {
  const data = rawData["starkdice-Player"];
  if (!data) return null;

  return {
    game_id: getPrimitiveValue(data.game_id),
    addr: getPrimitiveValue(data.addr),
    index: getPrimitiveValue(data.index),
    has_joined: getPrimitiveValue(data.has_joined),
  };
};

const transformPlayerProfile = (rawData: any) => {
  const data = rawData["starkdice-PlayerProfile"];
  if (!data) return null;

  return {
    owner: getPrimitiveValue(data.owner),
    games_won: getPrimitiveValue(data.games_won),
    games_lost: getPrimitiveValue(data.games_lost),
    creation_day: getPrimitiveValue(data.creation_day),
  };
};

// Main hook
export const useStarkDiceEntities = (pollInterval = 5000) => {
  const { useDojoStore, sdk } = useDojoSDK();

  const { setGame, setPlayer, setPiece, setDiceRoll, setPlayerProfile } =
    useGameStore();

  const fetchAllEntities = async () => {
    try {
      const queryBuilder = new ToriiQueryBuilder().withClause(
        new ClauseBuilder().keys([], [undefined], "VariableLen").build()
      );

      const res = await sdk.client.getEntities(queryBuilder.build());

      // Convert object to array if it's not already
      const entityArray = Array.isArray(res) ? res : Object.values(res).flat();

      console.log("Raw starkdice entities:", entityArray);

      entityArray.forEach((entity) => {
        if (entity && entity.models) {
          // Process DiceRoll
          if ("starkdice-DiceRoll" in entity.models) {
            const diceRoll = transformDiceRoll(entity.models);
            const utf8Value = hexToUtf8(diceRoll!.game_id);
            diceRoll!.game_id = utf8Value;
            if (diceRoll) setDiceRoll(diceRoll);
          }

          // Process Game
          if ("starkdice-Game" in entity.models) {
            const game = transformGame(entity.models);
            const utf8Value = hexToUtf8(game!.id);
            game!.id = utf8Value;
            console.log(game);
            if (game) setGame(game);
          }

          // Process Piece
          if ("starkdice-Piece" in entity.models) {
            const piece = transformPiece(entity.models);
            const utf8Value = hexToUtf8(piece!.game_id);
            piece!.game_id = utf8Value;
            if (piece) setPiece(piece);
          }

          // Process Player
          if ("starkdice-Player" in entity.models) {
            const player = transformPlayer(entity.models);
            //console.log(player)
            const utf8Value = hexToUtf8(player!.game_id);
            player!.game_id = utf8Value;
            if (player) setPlayer(player);
          }

          // Process PlayerProfile
          if ("starkdice-PlayerProfile" in entity.models) {
            const profile = transformPlayerProfile(entity.models);
            if (profile) setPlayerProfile(profile);
          }
        }
      });
    } catch (error) {
      console.error("Error fetching starkdice entities:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const startPolling = async () => {
      if (!sdk?.client) return;

      // Initial fetch
      await fetchAllEntities();

      // Set up polling only if component is still mounted
      if (isMounted) {
        intervalId = setInterval(fetchAllEntities, pollInterval);
      }
    };

    startPolling();

    // Cleanup
    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pollInterval]);

  return {
    state: useGameStore(),
    refetch: fetchAllEntities,
  };
};

export function hexToUtf8(hex: string) {
  hex = hex.replace(/^0x/, ""); // Remove "0x" prefix if present
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const char = String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    if (/[ -~]/.test(char)) {
      // Only add printable ASCII characters
      str += char;
    }
  }
  return str.trim();
}

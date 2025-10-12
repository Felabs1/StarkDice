// hooks/useToriiSubscription.ts
import { useEffect } from "react";
import useAppStore from "../../zustand/store"; // your zustand store

export function useToriiSubscription(torii: any) {
  useEffect(() => {
    let subscription: any;

    async function start() {
      subscription = await torii.onEntityUpdated(
        {
          Keys: { keys: [undefined], pattern_matching: "VariableLen", models: [] },
        },
        (entities: any) => {
          console.log("🔔 Torii update:", entities);

          // Push into zustand
          useAppStore.setState((state) => ({
            games: entities.map(parseGameEntity), // implement parseGameEntity
          }));
        }
      );
    }

    start();

    return () => {
      subscription?.cancel();
    };
  }, [torii]);
}

// Dummy example — customize for your schema
function parseGameEntity(entity: any) {
  return {
    id: entity.id,
    joined_players: entity.joined_players,
    max_players: entity.max_players,
    owner: entity.owner,
  };
}

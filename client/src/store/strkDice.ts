import { create } from 'zustand';

interface State {

  game_id: string | undefined;
  set_game_id: (game_id: string) => void;
}

export const useStarkDiceStore = create<State>((set) => ({

  game_id: "-1",
  set_game_id: (game_id: string) => {
    set(() => ({ game_id }));
  },
}));



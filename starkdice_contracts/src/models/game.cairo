use core::num::traits::{SaturatingAdd};
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: felt252, 
    pub is_active: bool,
    pub current_turn: u32,
    pub dice_roll: felt252,
    pub winner: u32,
    pub max_players: u8,
    pub joined_players: u8,
}

#[generate_trait]
pub impl GameImpl of GameTrait {
    fn join_players(ref self: Game) {
        assert(self.joined_players < self.max_players, 'lobby_full');
        assert(self.is_active == false, 'game_started');
        assert(self.winner == 1000, 'game_ended');
        self.joined_players.saturating_add(1);
    }

    fn start_match(ref self: Game) {
        assert(self.joined_players > 1, 'single_player');
        self.is_active = true;
    }

    fn increment_turn(ref self: Game) {
        let joined_players: u8 = self.joined_players;
        self.current_turn.saturating_add(1);
        if self.current_turn == joined_players.into() {
            self.current_turn = 0_u32;
        }
        self.dice_roll = 'DICE_NOT_ROLLED';
    }


}

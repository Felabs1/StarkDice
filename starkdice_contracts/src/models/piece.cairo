use core::num::traits::{SaturatingAdd};
use starkdice_contracts::constants::{HOME_POSITION_PLAYER_1, HOME_POSITION_PLAYER_2, TURNING_POINTS_PLAYER_1, TURNING_POINTS_PLAYER_2};

// use starknet::ContractAddress;
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Piece {
    #[key]
    pub game_id: felt252, 
    #[key]
    pub player_index: u8, 
    #[key]
    pub piece_index: u8,
    pub position: u32, 
    pub is_home: bool, 
    pub is_finished: bool, 
}

#[generate_trait]
pub impl PieceImpl of PieceTrait {
    fn increment_piece_position(ref self: Piece, steps: u8) {
        
        self.position.saturating_add(steps.into());

        if self.player_index == 0 {
            if self.position == HOME_POSITION_PLAYER_1 {
                self.is_finished == true;
            } else if self.position == TURNING_POINTS_PLAYER_1 {
                self.position = 100_u32 + steps.into();
            }

        }else if self.player_index == 1 && self.position == HOME_POSITION_PLAYER_2 {
            if self.position == HOME_POSITION_PLAYER_2 {
                self.is_finished == true;
            } else if self.position == TURNING_POINTS_PLAYER_2 {
                self.position = 200_u32 + steps.into();
            }
        }
        
    }

    fn is_eligible(ref self: Piece, player_index: u8, dice_value: u8) -> bool {
        if self.player_index != player_index {
            return false;
        }

        let home_pos = if player_index == 0 { HOME_POSITION_PLAYER_1 } else { HOME_POSITION_PLAYER_2 };

        if self.is_finished || self.position == home_pos {
            return false;
        }

        if self.is_home && dice_value != 6 {
            return false;
        }

        if (self.position < home_pos) && (dice_value.into() > (home_pos - self.position)) {
            return false;
        }

        // otherwise eligible
        true
    }


}

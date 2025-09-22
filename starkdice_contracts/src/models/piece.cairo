use starknet::ContractAddress;
use core::num::traits::{SaturatingAdd};
use starkdice_contracts::constants::{HOME_POSITION_PLAYER_1, HOME_POSITION_PLAYER_2, TURNING_POINTS_PLAYER_1, TURNING_POINTS_PLAYER_2, BASE_POSITIONS_PLAYER_1, BASE_POSITIONS_PLAYER_2, PLAYER_1_START_POSITION, PLAYER_2_START_POSITION};

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
    pub player_address: ContractAddress,
    pub position: u32, 
    pub is_home: bool, 
    pub is_finished: bool, 
}

#[generate_trait]
pub impl PieceImpl of PieceTrait {
    

    // adjust signature so we can mutate fields
    fn increment_piece_position(ref self: Piece, steps: u8) {
        let player1_positions = BASE_POSITIONS_PLAYER_1.span();
        let player2_positions = BASE_POSITIONS_PLAYER_2.span();

        // If already finished, nothing to do
        if self.is_finished {
            return;
        }

        // --- If piece is at home (not on board) ---
        if self.is_home || self.position == HOME_POSITION_PLAYER_1 || self.position == HOME_POSITION_PLAYER_2 {
            if steps == 6 {
                if self.player_index == 0 {
                    self.position = PLAYER_1_START_POSITION;
                    self.is_home = false;
                } else {
                    self.position = PLAYER_2_START_POSITION;
                    self.is_home = false;
                }
                self.is_home = false;
            }
            // whether moved out or not, return (no further movement this turn)
            return;
        }

        // --- Normal board movement: add steps ---
        // convert steps -> same type as position (assumes position is u32)
        let step_u32: u32 = steps.into();
        self.position = self.position + step_u32;

        // --- Special turning / home-stretch handling ---
        if self.player_index == 0 {
            if self.position == TURNING_POINTS_PLAYER_1 {
                // move into player 1 home stretch encoding
                self.position = 100_u32 + step_u32;
            } else if (self.position == *player1_positions[0]
                    || self.position == *player1_positions[1]
                    || self.position == *player1_positions[2]
                    || self.position == *player1_positions[3]) && steps == 6 {
                // if landing exactly on one of the base positions and rolled a 6, go to start
                self.position = PLAYER_1_START_POSITION;
                self.is_home = false;
            }
        } else {
            // player_index == 1
            if self.position == TURNING_POINTS_PLAYER_2 {
                self.position = 200_u32 + step_u32;
            } else if (self.position == *player2_positions[0]
                    || self.position == *player2_positions[1]
                    || self.position == *player2_positions[2]
                    || self.position == *player2_positions[3]) && steps == 6 {
                self.position = PLAYER_2_START_POSITION;
                self.is_home = false;
            }
        }

        // OPTIONAL: mark finished if reached final spot
        // if self.position == SOME_FINISH_VALUE {
        //     self.is_finished = true;
        // }
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

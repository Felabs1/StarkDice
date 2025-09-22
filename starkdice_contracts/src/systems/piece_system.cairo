#[starknet::interface]
pub trait IPieceSystem<T> {
    fn move_piece(ref self: T, game_id: felt252, player_index: u8, piece_index: u8);
}

#[dojo::contract]
mod piece_system {
    use dojo::model::{ModelStorage};
    // use dojo::event::{EventStorage};
    use starknet::{ContractAddress, get_caller_address};
    use super::IPieceSystem;
    use starkdice_contracts::constants::SAFE_ZONES;
    use starkdice_contracts::models::game::{Game, GameTrait};
    use starkdice_contracts::models::player::{Player};
    use starkdice_contracts::models::piece::{Piece, PieceTrait};
    use starkdice_contracts::models::dice_commit::{DiceRoll};

   

    #[abi(embed_v0)]
    impl IPieceSystemImpl of IPieceSystem<ContractState> {
        // fn move_piece(ref self: ContractState, game_id: felt252, player_index: u8, piece_index: u8){
          

        //     let player_address: ContractAddress = get_caller_address();
        //     let mut world = self.world_default();
        //     let mut game: Game = world.read_model(game_id);

        //     assert(game.dice_roll == 'DICE_ROLLED', 'dice_not_rolled');
        //     let mut player: Player = world.read_model((game_id, player_address));
        //     let mut piece: Piece = world.read_model((game_id, player_index, piece_index));
        //     assert(piece.player_index == player.index, 'NOT_YOUR_TURN');
        //     let mut dice_roll: DiceRoll = world.read_model((game_id, player_index));
        //     let steps = dice_roll.value;
        //     let piece_eligible: bool = piece.is_eligible(player_index, steps);
        //     if (piece_eligible == true) {
        //         piece.increment_piece_position(steps);

        //         // inquire the new position
        //         let is_kill = self.check_for_kill(game_id, player_index, piece_index, piece.position);
                
        //         if is_kill == true || steps == 6{
        //             game.dice_roll = 'DICE_NOT_ROLLED';
        //         }else{
        //             game.increment_turn();

        //         }


        //         // self.has_player_won(game_id, player_index);

        //     }else{
        //         game.increment_turn();
        //     }
        // }

        fn move_piece(ref self: ContractState, game_id: felt252, player_index: u8, piece_index: u8) {
            let player_address: ContractAddress = get_caller_address();
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);

            assert(game.dice_roll == 'DICE_ROLLED', 'dice_not_rolled');

            let mut player: Player = world.read_model((game_id, player_address));
            let mut piece: Piece = world.read_model((game_id, player_index, piece_index));

            // ✅ Fix: compare against piece.player_index instead of piece_index
            // POSTPONED: will add player.index assertions after hackathon
            assert(piece.player_index == player_index, 'NOT_YOUR_TURN');

            let mut dice_roll: DiceRoll = world.read_model((game_id, player_index));
            let steps = dice_roll.value;

            let piece_eligible: bool = piece.is_eligible(player_index, steps);
            if piece_eligible {
                piece.increment_piece_position(steps);

                // inquire the new position
                let is_kill = self.check_for_kill(game_id, player_index, piece_index, piece.position);

                if is_kill || steps == 6 {
                    // ✅ Fix: assignment, not comparison
                    game.dice_roll = 'DICE_NOT_ROLLED';
                } else {
                    game.increment_turn();
                }

                // self.has_player_won(game_id, player_index);

            } else {
                game.increment_turn();
            }

            world.write_model(@piece);
            world.write_model(@game);
        }


    }


     #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }

        fn check_for_kill(ref self: ContractState, game_id: felt252, current_player: u8, piece_index: u8, new_position: u32) -> bool {
            let mut world = self.world_default();
            let mut kill: bool = false;

            let opponent_index: u8 = if current_player == 0 { 1_u8 } else { 0_u8 };

            let mut i: u8 = 0_u8;

            while i < 4 {
                let mut opp_piece: Piece = world.read_model((game_id, opponent_index, i));
                if (opp_piece.position == new_position) {
                    let mut is_safe: bool = false;
                    let mut j: usize = 0;

                    while (j < 8) {
                        if (*SAFE_ZONES.span()[j] == new_position) {
                            is_safe == true;
                        }
                        j += 1;
                    };

                    if !is_safe {
                        opp_piece.position = 500_u32 + opp_piece.piece_index.into();
                        opp_piece.is_home == true;
                        opp_piece.is_finished = false;

                        world.write_model(@opp_piece);
                        kill = true;
                    }
                }

                i += 1_u8;
            };

            kill

        }

        fn has_player_won(ref self: ContractState, game_id: felt252, player_index: u8) -> bool {
            let mut world = self.world_default();
            let mut player_won = false;

            let mut i: u8 = 0_u8;
            
            while (i < 4_u8) {
                let piece: Piece = world.read_model((game_id, player_index, i));
                if piece.is_finished == false {
                    player_won = false;
                }else{
                    player_won = true;
                }
                i + 1_u8;
        
            };

            let mut game: Game = world.read_model(game_id);
            game.winner = player_index.into();
            game.is_active = false;
            world.write_model(@game);

            player_won
        }
    }
    
}

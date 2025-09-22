#[starknet::interface]
pub trait IDiceSystem<T>{
    fn roll_dice(ref self: T, game_id: felt252, player_index: u8, value: u8);
}

#[dojo::contract]
mod dice_system {
    use super::IDiceSystem;
    use dojo::model::{ModelStorage};
    use starkdice_contracts::models::game::{Game, GameTrait};
    use starkdice_contracts::models::dice_commit::DiceRoll;
    use starkdice_contracts::models::piece::{Piece, PieceTrait};
    use starkdice_contracts::models::player::{Player};
    use starknet::{ContractAddress, get_caller_address};

    #[abi(embed_v0)]
    impl IDiceSystemImpl of IDiceSystem<ContractState> {
        fn roll_dice(
            ref self: ContractState,
            game_id: felt252,
            player_index: u8,
            value: u8
        ) {
          
            assert(value >= 1_u8 && value <= 6_u8, 'Invalid dice roll');

            let roller: ContractAddress = get_caller_address();
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);
            let mut player: Player = world.read_model((game_id, get_caller_address()));

            assert(game.current_turn == player_index, 'not_your_turn');


           
            let dice_roll = DiceRoll {
                game_id: game_id,
                turn_number: player_index,
                roller: get_caller_address(),
                value: value,
            };

            // we need to check if piece is eligible before we move to next turn
            let mut index_checker: u8 = 0;
            let mut eligible_pieces: u8 = 0;
            while (index_checker < 4) {
                let mut piece: Piece = world.read_model((game_id, player_index, index_checker));
                if piece.is_eligible(player_index, value) {
                    eligible_pieces += 1;
                }
                index_checker += 1;
            }

            if eligible_pieces > 0 {
                game.dice_roll = 'DICE_ROLLED';
            }else{
                game.increment_turn();
            }
            world.write_model(@dice_roll);
            world.write_model(@game);

           
            // self.emit_dice_rolled(game_id, turn_number, roller, value);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }
    }
}
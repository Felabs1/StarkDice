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


           
            let dice_roll = DiceRoll {
                game_id: game_id,
                turn_number: player_index,
                roller: get_caller_address(),
                value: value,
            };
            game.dice_roll = 'DICE_ROLLED';
            world.write_model(@dice_roll);

           
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
#[starknet::interface]
pub trait IGameSystem<T> {
    fn create_game(ref self: T, game_id: felt252, max_players: u8);
    fn join_game(ref self: T, game_id: felt252);
    fn start_game(ref self: T, game_id: u64);
}

#[dojo::contract]
pub mod gamesystem {
    use dojo::model::{ModelStorage};
    use starknet::{ContractAddress, get_caller_address};
    use super::IGameSystem;
    use starkdice_contracts::models::game::{Game, GameTrait};
    use starkdice_contracts::models::player::{Player};
    use starkdice_contracts::models::piece::{Piece};
    #[abi(embed_v0)]
    impl IGameSystemImpl of IGameSystem<ContractState> {
        fn create_game(ref self: ContractState,game_id: felt252, max_players: u8) {
            let mut world = self.world_default();
            let player_address: ContractAddress = get_caller_address();
             
            let game: Game = Game {
                id: game_id,
                is_active: false,
                current_turn: 0,
                dice_roll:'DICE_NOT_ROLLED',
                winner: 1000,
                max_players: max_players,
                joined_players: 1,
            };

            let player: Player = Player {
                game_id: game_id,
                addr: player_address,
                index: 0,
                has_joined: true,
            };

            let mut piece_indexes: u8 = 0;
            let mut position: u32 = 500;
            while (piece_indexes < 4) {
                let piece: Piece = Piece {
                    game_id: game_id,
                    player_index: 0,
                    piece_index: piece_indexes,
                    position: position,
                    is_home: true,
                    is_finished: false,
                };
                world.write_model(@piece);
                piece_indexes += 1;
                position += 1;
            };

            world.write_model(@game);
            world.write_model(@player);

        }

        fn join_game(ref self: ContractState, game_id: felt252) {
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);
            let player: Player = Player {
                game_id: game_id,
                addr: get_caller_address(),
                index: game.joined_players,
                has_joined: true,
            };
            // check whether game is active, joined players is less than max players, 
            assert(game.is_active == false, 'game_started');
            assert(game.joined_players < game.max_players, 'players_full');
            assert(game.winner == 1000, 'game_ended');
            game.join_players();

            if game.joined_players == 1 {
                let mut piece_position: u32 = 600;
                let mut piece_indexes: u8 = 0;

                while (piece_indexes < 4) {
                    let piece: Piece = Piece {
                        game_id: game_id,
                        player_index: game.joined_players,
                        piece_index: piece_indexes,
                        position: piece_position,
                        is_home: true,
                        is_finished: false,
                    };
                
                    world.write_model(@piece);
                    piece_indexes += 1;
                    piece_position += 1;
                
                };

                
                
            } else if game.joined_players == 2 {
                let mut piece_position: u32 = 700;
                let mut piece_indexes: u8 = 0;

                while (piece_indexes < 4) {
                    let piece: Piece = Piece {
                        game_id: game_id,
                        player_index: game.joined_players,
                        piece_index: piece_indexes,
                        position: piece_position,
                        is_home: true,
                        is_finished: false,
                    };
                
                    world.write_model(@piece);
                    piece_indexes += 1;
                    piece_position += 1;
                
                };
            } else if game.joined_players == 3 {
                let mut piece_position = 800;
                let mut piece_indexes: u8 = 0;

                while (piece_indexes < 4) {
                    let piece: Piece = Piece {
                        game_id: game_id,
                        player_index: game.joined_players,
                        piece_index: piece_indexes,
                        position: piece_position,
                        is_home: true,
                        is_finished: false,
                    };
                
                    world.write_model(@piece);
                    piece_indexes += 1;
                    piece_position += 1;
                
                };
            }

            world.write_model(@game);
            world.write_model(@player);
            
        }

        fn start_game(ref self: ContractState, game_id: u64) {
            let mut world = self.world_default();
            let mut game = world.read_model(game_id);
            game.start_match();
            world.write_model(@game);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_starter")
        }
    }

}
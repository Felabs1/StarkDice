#[starknet::interface]
pub trait IGameSystem<T> {
    fn create_game(ref self: T, game_id: felt252, max_players: u8);
    fn join_game(ref self: T, game_id: felt252);
    fn start_game(ref self: T, game_id: felt252);
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

    // create initial game with ZERO joined players
            let mut game: Game = Game {
                id: game_id,
                is_active: false,
                current_turn: 0,
                dice_roll: 'DICE_NOT_ROLLED',
                owner: get_caller_address(),
                winner: 1000,
                max_players: max_players,
                joined_players: 0, // <-- start at 0
            };

            // persist initial game
            world.write_model(@game);

            // register the creator as the first player using current joined_players as index
            let creator_addr = get_caller_address();
            let creator_index: u8 = game.joined_players; // should be 0
            // assert(creator_index == 0, 'wrong_indexing');

            let player: Player = Player {
                game_id: game_id,
                addr: creator_addr,
                index: game.joined_players,
                has_joined: true,
            };

            // write player and init their pieces

            // init pieces for this player (positions spaced by 100 per player index)
            let mut piece_position: u32 = 500 + (creator_index.into()) * 100;
            let mut piece_indexes: u8 = 0;
            while (piece_indexes < 4) {
                let piece: Piece = Piece {
                    game_id: game_id,
                    player_index: creator_index,
                    piece_index: piece_indexes,
                    player_address: get_caller_address(),
                    position: piece_position,
                    is_home: true,
                    is_finished: false,
                };
                world.write_model(@piece);
                piece_indexes += 1;
                piece_position += 1;
            }

            // now increment joined_players and persist game
            game.join_players(); // increments from 0 -> 1
            world.write_model(@game);
            world.write_model(@player);


        }

        fn join_game(ref self: ContractState, game_id: felt252) {
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);
            let caller: ContractAddress = get_caller_address();

            // checks
            assert(game.is_active == false, 'game_started');
            assert(game.joined_players < game.max_players, 'players_full');
            assert(game.winner == 1000, 'game_ended');
            assert(game.owner == get_caller_address(), 'allready_created');

            // assign index BEFORE increment
            let new_index = game.joined_players;

            

            // create player
            let mut player: Player = Player {
                game_id: game_id,
                addr: get_caller_address(),
                index: game.joined_players.into(),   // FIXED: correct index
                has_joined: true,
            };

            // increment joined players
            game.join_players();


            // initialize pieces for this player
            let mut piece_position: u32 = match new_index {
                0 => 500,
                1 => 600,
                2 => 700,
                3 => 800,
                _ => 1000, // fallback (if you allow >4 players, adjust accordingly)
            };

            // assert(new_index == 1, 'wrong_indexing');


            let mut piece_indexes: u8 = 0;
            while piece_indexes < 4 {
                let piece: Piece = Piece {
                    game_id: game_id,
                    player_index: new_index,
                    player_address: caller,
                    piece_index: piece_indexes,
                    position: piece_position,
                    is_home: true,
                    is_finished: false,
                };

                world.write_model(@piece);
                piece_indexes += 1;
                piece_position += 1;
            }

            // write back updates
            world.write_model(@player);

            world.write_model(@game);
            
        }

        fn start_game(ref self: ContractState, game_id: felt252) {
    
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);
            assert(game.owner == get_caller_address(), 'not_owner');
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
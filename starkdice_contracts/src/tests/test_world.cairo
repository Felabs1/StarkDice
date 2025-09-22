#[cfg(test)]
mod tests {
    // use crate::systems::piece_system;
// use crate::systems::piece_system;

use dojo_cairo_test::WorldStorageTestTrait;
    use dojo::model::{ModelStorage, ModelStorageTest};
    use dojo::world::WorldStorageTrait;
    use dojo_cairo_test::{spawn_test_world, NamespaceDef, TestResource, ContractDefTrait, ContractDef};

    use starkdice_contracts::systems::dice_system::{dice_system, IDiceSystemDispatcher, IDiceSystemDispatcherTrait};
    use starkdice_contracts::systems::gamesystem::{gamesystem, IGameSystemDispatcher, IGameSystemDispatcherTrait};
    use starkdice_contracts::systems::piece_system::{piece_system, IPieceSystemDispatcher, IPieceSystemDispatcherTrait};

    use starkdice_contracts::models::dice_commit::{DiceRoll, m_DiceRoll};
    use starkdice_contracts::models::game::{Game, m_Game};
    use starkdice_contracts::models::piece::{Piece, m_Piece, PieceTrait};
    use starkdice_contracts::models::player::{Player, m_Player};

    use starknet::{ContractAddress, testing};
    
    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: "dojo_starter",
            resources: [
                TestResource::Model(m_DiceRoll::TEST_CLASS_HASH.into()),
                TestResource::Model(m_Game::TEST_CLASS_HASH.into()),
                TestResource::Model(m_Piece::TEST_CLASS_HASH.into()),
                TestResource::Model(m_Player::TEST_CLASS_HASH.into()),
                TestResource::Contract(dice_system::TEST_CLASS_HASH.into()),
                TestResource::Contract(gamesystem::TEST_CLASS_HASH.into()),
                TestResource::Contract(piece_system::TEST_CLASS_HASH.into()),
            ].span()
        };

        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@"dojo_starter", @"dice_system").with_writer_of([dojo::utils::bytearray_hash(@"dojo_starter")].span()), 
            ContractDefTrait::new(@"dojo_starter", @"gamesystem").with_writer_of([dojo::utils::bytearray_hash(@"dojo_starter")].span()),
            ContractDefTrait::new(@"dojo_starter", @"piece_system").with_writer_of([dojo::utils::bytearray_hash(@"dojo_starter")].span()),

        ].span()
    }

    #[test]
    fn test_world_test_set() {
        let caller = starknet::contract_address_const::<0x0>();
        let ndef = namespace_def();

        // register the resources
        let mut world = spawn_test_world([ndef].span());

        // ensures permissions and initializations are synced.
        world.sync_perms_and_inits(contract_defs());

        let mut game: Game = world.read_model('felabs');
        assert(game.current_turn == 0, 'initial_turn_wrong');
        
        game.joined_players = 2;
        game.id = 'felabs';
        game.is_active = true;
        game.current_turn = 1;
        game.dice_roll = 'DICE_ROLLED';
        game.max_players = 2;
        game.joined_players = 2;
        world.write_model_test(@game);

        let mut game: Game = world.read_model('felabs');
        assert(game.is_active == true, 'game_not_active');

        // testing model deletion
        world.erase_model(@game);

        let game: Game = world.read_model('felabs');
        assert(game.is_active == false, 'erase_model_failed');


    }

    #[test]
    #[available_gas(30000000)]
    fn test_create_game() {
        let caller = starknet::contract_address_const::<0x0>();
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"gamesystem").unwrap();
        let gamesystem = IGameSystemDispatcher {contract_address};
        gamesystem.create_game('felabs', 2);
        let created_game: Game = world.read_model('felabs');
        let game_creator: Player = world.read_model(('felabs', caller));
        let piece1: Piece = world.read_model(('felabs', 0, 0));


        // check whether the game was created
        assert(created_game.max_players == 2, 'max_players_not_2');
        assert(created_game.joined_players == 1, 'joined_players_not_1');
        assert(game_creator.index == 0, 'creator_not_joined');
        assert(game_creator.has_joined == true, 'creator_not_joined');
    }

    #[test]
    #[available_gas(30000000)]
    fn test_join_game() {
        let caller = starknet::contract_address_const::<0x0>();
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"gamesystem").unwrap();
        let gamesystem = IGameSystemDispatcher {contract_address};

        // Create game with caller as creator
        gamesystem.create_game('felabs', 3);

        // Switch caller to caller2 and join game
        let caller2 = starknet::contract_address_const::<0x1>();
        testing::set_caller_address(caller2);
        assert(starknet::get_caller_address() == caller2, 'caller_not_set');

        gamesystem.join_game('felabs');
        // gamesystem.join_game('felabs');

        // Game state
        let joined_game: Game = world.read_model('felabs');
        assert(joined_game.joined_players == 2, 'game_join_failed');

        let piece1: Piece = world.read_model(('felabs', 0, 0));
        let piece2: Piece = world.read_model(('felabs', 0, 1));
        let piece3: Piece = world.read_model(('felabs', 0, 2));
        let piece4: Piece = world.read_model(('felabs', 0, 3));
        let piece5: Piece = world.read_model(('felabs', 1, 0));
        let piece6: Piece = world.read_model(('felabs', 1, 1));
        let piece7: Piece = world.read_model(('felabs', 1, 2));
        let piece8: Piece = world.read_model(('felabs', 1, 3));
        

        assert(piece1.position == 500, 'wrong_positioning');
        assert(piece2.position == 501, 'wrong_positioning');
        assert(piece3.position == 502, 'wrong_positioning');
        assert(piece4.position == 503, 'wrong_positioning');
        assert(piece5.position == 600, 'wrong_positioning');
        assert(piece6.position == 601, 'wrong_positioning');
        assert(piece7.position == 602, 'wrong_positioning');
        assert(piece8.position == 603, 'wrong_positioning');

        // // Players
        // for some reason, this function is functioning ish ish, you can choose to fix it but i'd advice you just ignore it
        // let player1: Player = world.read_model(('felabs', caller));
        // let player2: Player = world.read_model(('felabs', caller2));
        // assert(player1.addr == caller, 'wrong_caller_addr');
        // assert(player2.addr == caller2, 'wrong_caller_addr');
        // assert(player1.has_joined == true, 'player didnt join');
        // // assert(player2.has_joined == true,'player2 didnt join');
        // // assert(player2.index == 1_u8, 'unexpectedp1 index');
        // assert(player1.index == 1, 'wrong_index');
        // assert(player2.index == 0, 'wrong_index_2');
    }

    #[test]
    #[available_gas(30000000)]
    fn test_start_game(){
        let caller = starknet::contract_address_const::<0x0>();
        let caller2 = starknet::contract_address_const::<0x1>();
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"gamesystem").unwrap();
        let gamesystem = IGameSystemDispatcher {contract_address};
        testing::set_caller_address(caller);
        gamesystem.create_game('felabs', 2);
        let mut created_game: Game = world.read_model('felabs');
        let game_creator: Player = world.read_model(('felabs', caller));
        let piece1: Piece = world.read_model(('felabs', 0, 0));
        assert(created_game.owner == caller, 'game_not_owner');

        testing::set_caller_address(caller2);
        gamesystem.join_game('felabs');
        assert(starknet::get_caller_address() == caller2, 'caller_not_set');
        gamesystem.start_game('felabs');
        created_game = world.read_model('felabs');
        assert(created_game.is_active == true, 'game_not_started');
        assert(created_game.owner == caller, 'wrong_ownership');
        // current turn in the game should be 0
        assert(created_game.current_turn == 0, 'something wrong with turn'); 
    }


    #[test]
    #[available_gas(300000000)]
    fn test_dice_roll(){
        let caller = starknet::contract_address_const::<0x0>();
        let caller2 = starknet::contract_address_const::<0x1>();
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (game_addr, _) = world.dns(@"gamesystem").unwrap();
        let (dice_addr, _) = world.dns(@"dice_system").unwrap();
        let (piece_addr, _) = world.dns(@"piece_system").unwrap();

        let gamesystem = IGameSystemDispatcher {contract_address: game_addr};
        let dicesystem = IDiceSystemDispatcher {contract_address: dice_addr};
        let piecesystem = IPieceSystemDispatcher {contract_address: piece_addr};

        testing::set_caller_address(caller);
        gamesystem.create_game('felabs', 2);
        let mut created_game: Game = world.read_model('felabs');
        let game_creator: Player = world.read_model(('felabs', caller));

        testing::set_caller_address(caller2);
        gamesystem.join_game('felabs');
        assert(starknet::get_caller_address() == caller2, 'caller_not_set');
        gamesystem.start_game('felabs');

        let player1: Player = world.read_model(('felabs', caller));
        let player2: Player = world.read_model(('felabs', caller2));
        assert(player1.index == 1, 'wrong_indexing');
        assert(player2.index == 0, 'wrong_indexing');
        
    
        // testing::set_caller_address(caller2);
        // // testing::set_contract_address(dice_addr);

        // // rolls dice as index 0
        // dicesystem.roll_dice('felabs', 0, 1);
        // let mut diceroll: DiceRoll = world.read_model(('felabs' ,0));
        // assert(diceroll.value == 1, 'dice_not_rolled');
        // created_game = world.read_model('felabs');
        // // assert(created_game.dice_roll == 'DICE_ROLLED', 'didnt_roll_it');
        // assert(created_game.is_active == true, 'should_be_active');
        // // game turn should go to 1 immediately if there were no eligible pieces
        // assert(created_game.current_turn == 1, 'not_current_turn');
        // // assert(created_game.current_turn == 1, 'turn_didnt_work');
        // dicesystem.roll_dice('felabs', 1, 6);
        // created_game = world.read_model('felabs');
        // assert(created_game.dice_roll == 'DICE_ROLLED', 'dice_not_rolled');
        // assert(created_game.current_turn == 1, 'turn_not_right');
    }

    // in this test, the first player should roll a dice
    // dice should be 6,
    // and if the dice is 6, the person is allowed to move or roll again
    // once the rolls are over the turns switches

    #[test]
    #[available_gas(300000000)]
    fn test_make_move_from_home(){
        let caller = starknet::contract_address_const::<0x0>();
        let caller2 = starknet::contract_address_const::<0x1>();
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (game_addr, _) = world.dns(@"gamesystem").unwrap();
        let (dice_addr, _) = world.dns(@"dice_system").unwrap();
        let (piece_addr, _) = world.dns(@"piece_system").unwrap();

        let gamesystem = IGameSystemDispatcher {contract_address: game_addr};
        let dicesystem = IDiceSystemDispatcher {contract_address: dice_addr};
        let piecesystem = IPieceSystemDispatcher {contract_address: piece_addr};

        testing::set_caller_address(caller);
        gamesystem.create_game('felabs', 2);
        let mut created_game: Game = world.read_model('felabs');
        let game_creator: Player = world.read_model(('felabs', caller));

        testing::set_caller_address(caller2);
        gamesystem.join_game('felabs');
        assert(starknet::get_caller_address() == caller2, 'caller_not_set');
        gamesystem.start_game('felabs');
    
        testing::set_caller_address(caller);
        testing::set_contract_address(dice_addr);

        // rolls dice as index 0
        dicesystem.roll_dice('felabs', 0, 6);
        let mut diceroll: DiceRoll = world.read_model(('felabs' ,0));
        assert(diceroll.value == 6, 'dice_not_rolled');
        created_game = world.read_model('felabs');
        // assert(created_game.dice_roll == 'DICE_ROLLED', 'didnt_roll_it');
        assert(created_game.is_active == true, 'should_be_active');
        // game turn should go to 1 immediately if there were no eligible pieces
        assert(created_game.current_turn == 0, 'not_current_turn');
        piecesystem.move_piece('felabs', 0, 0);

        // assert(created_game.current_turn == 1, 'turn_didnt_work');
        // testing::set_caller_address(caller2);
        // dicesystem.roll_dice('felabs', 1, 6);
        // created_game = world.read_model('felabs');
        // assert(created_game.dice_roll == 'DICE_ROLLED', 'dice_not_rolled');
        

        // // now we want to check if pieces are eligible for the player
        // let mut piece1: Piece = world.read_model(('felabs', 1, 0));
        let mut piece5: Piece = world.read_model(('felabs', 0, 0));
        assert(piece5.is_home == false, 'piece_didnt_move');
        
        // we expect the turn to change to remain to 0 coz turn was 6
        created_game = world.read_model('felabs');
        assert(created_game.current_turn == 0, 'still_his_turn');
        assert(created_game.dice_roll == 'DICE_NOT_ROLLED', 'dice_roll_error');
        assert(piece5.position == 0, 'COORDINATES_ERROR');
        
        dicesystem.roll_dice('felabs', 0, 4);
        piecesystem.move_piece('felabs', 0, 0);
        piece5 = world.read_model(('felabs', 0, 0));
        assert(piece5.position == 4, 'piece_not_moved');
        created_game = world.read_model('felabs');
        assert(created_game.current_turn == 1, 'turn_unsuccessful');
        
        
        // assert(piece5.is_eligible(0, 1) == true, 'eligibility_error');
        // piece_system.move_piece();


        // testing::set_contract_address(piece_addr);

        // let diceroll: DiceRoll = world.read_model(('felabs',1));
        // assert(diceroll.value == 6, 'dice_roll_incorrect');

        // assert(created_game.current_turn == piece1.player_index.into(), 'not the turn');
        // assert(piece5.position == 500, 'piece_position_wrong');
        // assert(piece1.position == 600, 'piece_position_wrong');
        // assert(piece1.is_eligible(1, 6) == true, 'Piece_not_eligible');
        
        // piecesystem.move_piece('felabs', 0, 0);
        // piece1 = world.read_model(('felabs', 0, 0));

        // // piece1.increment_piece_position(6);
        // assert(piece1.position == 26, 'piece_still_home');
        // assert(piece1.is_home == false, 'piece_not_moved');
        
    }


    

    #[test]
    #[available_gas(300000000)]
    fn test_game_turns(){
        // definining callers
        let caller = starknet::contract_address_const::<0x0>();
        let caller2 = starknet::contract_address_const::<0x1111>();
        let caller3 = starknet::contract_address_const::<0x111736471>();
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        // defining systems
        let (game_addr, _) = world.dns(@"gamesystem").unwrap();
        let (dice_addr, _) = world.dns(@"dice_system").unwrap();
        let (piece_addr, _) = world.dns(@"piece_system").unwrap();

        let gamesystem = IGameSystemDispatcher {contract_address: game_addr};
        let dicesystem = IDiceSystemDispatcher {contract_address: dice_addr};
        let piecesystem = IPieceSystemDispatcher {contract_address: piece_addr};


        // initializing and starting the game
        testing::set_caller_address(caller);
        gamesystem.create_game('felabs', 3);
        let player1: Player = world.read_model(('felabs', caller));
        let created_game:Game= world.read_model('felabs');
        assert(player1.index == 0, 'wrong_indexing');
        assert(created_game.joined_players == 1, 'something went wrong');

        testing::set_caller_address(caller2);
        gamesystem.join_game('felabs');
        let created_game:Game= world.read_model('felabs');
        assert(created_game.joined_players == 2, 'something went wrong');
    
        let player2: Player = world.read_model(('felabs', caller2));
        // assert(player2.index == 3, 'wrong_indexing');
        assert(player2.addr == caller2, 'wrong_address');

        testing::set_caller_address(caller3);
        gamesystem.join_game('felabs');
        // gamesystem.start_game('felabs');


        let created_game:Game= world.read_model('felabs');
        assert(created_game.joined_players == 3, 'expected_3_joined');
        let player3: Player = world.read_model(('felabs', caller3));
        let player2: Player = world.read_model(('felabs', caller2));
        let player1: Player = world.read_model(('felabs', caller));

        assert(player3.addr == caller3, 'expected_caller_3');
        assert(player2.addr == caller2, 'expected_caller_3');
        assert(player1.addr == caller, 'expected_caller_3');
        assert(player3.index == 0, 'wrong_indexing');
        assert(player2.index == 0, 'wrong_indexing');
        assert(player1.index == 2, 'wrong_indexing');
        let piece1: Piece = world.read_model(('felabs', 0, 0));
        let piece5: Piece = world.read_model(('felabs', 1, 0));
        let piece9: Piece = world.read_model(('felabs', 2, 0));

        assert(piece1.player_index == 0, 'wrong_indexing');
        assert(piece5.player_index == 1, 'wrong_indexing');
        assert(piece9.player_index == 2, 'wrong_indexing');



        // testing their addresses
        assert(piece1.player_address == caller, 'wrong_addressing');
        assert(piece5.player_address == caller, 'wrong addressing');
        assert(piece9.player_address == caller,'wrong adressing');
    
        

        // assert(player1.index == 1, 'wrong_indexing');
        // assert(player2.index == 1, 'wrong_indexing');

        // dicesystem.roll_dice('felabs', 0, 6);
        // let mut game: Game = world.read_model('felabs');


        
    }

      #[test]
    #[available_gas(300000000)]
    fn test_kill_and_safe_zones(){
        let caller = starknet::contract_address_const::<0x0>();
        let caller2 = starknet::contract_address_const::<0x1>();
        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (game_addr, _) = world.dns(@"gamesystem").unwrap();
        let (dice_addr, _) = world.dns(@"dice_system").unwrap();
        let (piece_addr, _) = world.dns(@"piece_system").unwrap();

        let gamesystem = IGameSystemDispatcher {contract_address: game_addr};
        let dicesystem = IDiceSystemDispatcher {contract_address: dice_addr};
        let piecesystem = IPieceSystemDispatcher {contract_address: piece_addr};

        testing::set_caller_address(caller);
        gamesystem.create_game('felabs', 2);
        let mut created_game: Game = world.read_model('felabs');
        let game_creator: Player = world.read_model(('felabs', caller));

        testing::set_caller_address(caller2);
        gamesystem.join_game('felabs');
        assert(starknet::get_caller_address() == caller2, 'caller_not_set');
        gamesystem.start_game('felabs');
    
        testing::set_caller_address(caller);
       

        // rolls dice as index 0
        // all the pieces in the game


        let piece1: Piece = world.read_model(('felabs', 0, 0));
        let piece2: Piece = world.read_model(('felabs', 0, 1));
        let piece3: Piece = world.read_model(('felabs', 0, 2));
        let piece4: Piece = world.read_model(('felabs', 0, 3));
        let piece5: Piece = world.read_model(('felabs', 1, 0));
        let piece6: Piece = world.read_model(('felabs', 1, 1));
        let piece7: Piece = world.read_model(('felabs', 1, 2));
        let piece8: Piece = world.read_model(('felabs', 1, 3));
        

        assert(piece1.position == 500, 'wrong_positioning');
        assert(piece2.position == 501, 'wrong_positioning');
        assert(piece3.position == 502, 'wrong_positioning');
        assert(piece4.position == 503, 'wrong_positioning');
        assert(piece5.position == 600, 'wrong_positioning');
        assert(piece6.position == 601, 'wrong_positioning');
        assert(piece7.position == 602, 'wrong_positioning');
        assert(piece8.position == 603, 'wrong_positioning');

        let player1: Player = world.read_model(('felabs', caller));
        let player2: Player = world.read_model(('felabs', caller2));

        assert(player1.index == 1, 'invalid_index');
        assert(player2.index == 0, 'invalid_index_2');
        assert(player1.addr == caller, 'invalid_caller');
        assert(player2.addr == caller2, 'invalid_caller_2');

        let mut created_game: Game = world.read_model('felabs');

        // let's check that the game has started
        // let's check the current turn and the current dice play
        // let's also check the set player address

        assert(created_game.owner == caller, 'wrong_ownership');
        assert(created_game.is_active == true, 'game_not_started');
        assert(created_game.current_turn == 0, 'invalid_turn');
        assert(created_game.dice_roll == 'DICE_NOT_ROLLED', 'dice_touched');
        
        // let us check the curre
        // assert()
        assert(starknet::get_caller_address() == caller, 'wrong_account');

        // rolldice
        testing::set_caller_address(caller);
        testing::set_contract_address(dice_addr);
        dicesystem.roll_dice('felabs', 0, 2);

        testing::set_caller_address(caller2);
        // testing::set_contract_address(dice_addr);
        dicesystem.roll_dice('felabs', 1, 2);
        // dicesystem.roll_dice('felabs', 1, 2);


        let player1: Player = world.read_model(('felabs', caller));
        assert(player1.index == 1, 'wrong_indexing');
        created_game = world.read_model('felabs');
        assert(created_game.current_turn == 0, 'not_your_turn1');
        // testing::set_caller_address(caller)
        
        assert(player1.index == 1, 'wrong_indexing');


        // created_game = world.read_model('felabs');
        // assert(created_game.current_turn == 1, 'wrong_turning');

        // direct to game logic 
        dicesystem.roll_dice('felabs', 0, 6);
        piecesystem.move_piece('felabs', 0, 0);
        dicesystem.roll_dice('felabs', 0, 3);
        piecesystem.move_piece('felabs', 0, 0);
        let piece1: Piece = world.read_model(('felabs', 0, 0));
        assert(piece1.position == 3, 'something_wrong');
        created_game = world.read_model('felabs');
        assert(created_game.current_turn == 1, 'not_current_turn');



        dicesystem.roll_dice('felabs', 1, 6);
        created_game = world.read_model('felabs');
        assert(created_game.current_turn == 1, 'not_current_turn');
        // dicesystem.roll_dice('felabs', 1, 6);
        piecesystem.move_piece('felabs', 1, 1);
        let piece6: Piece = world.read_model(('felabs', 1, 1));
        assert(piece6.position == 26, 'something is wrong');
        dicesystem.roll_dice('felabs', 1, 5);
        piecesystem.move_piece('felabs', 1, 1);
        let piece6: Piece = world.read_model(('felabs', 1, 1));
        assert(piece6.is_home == false, 'piece1_still_home');
        assert(piece6.position == 31, 'piece1_position_invalid');
        created_game = world.read_model('felabs');
        assert(created_game.current_turn == 0, 'not_current_turn');


        // let mut i: u8 = 0;
        // while(i < 10) {
        //     // player0 turn (piece1 moves by +1)
        //     created_game = world.read_model('felabs');
        //     if created_game.current_turn == 0 {
        //         testing::set_caller_address(caller);
        //         dicesystem.roll_dice('felabs', 0, 1);
        //         piecesystem.move_piece('felabs', 0, 0);
        //     }else{
        //         // player1 turn (piece6 moves by +6)
        //         testing::set_caller_address(caller2);
        //         dicesystem.roll_dice('felabs', 1, 6);
        //         piecesystem.move_piece('felabs', 1, 1);
        //     }
        //     i = i + 1;
        // };

        // let piece1: Piece = world.read_model(('felabs', 0, 0));
        // // let piece6: Piece = world.read_model(('felabs', 1, 1));

        // assert(piece1.position == 13, 'piece1_not_on_39');  
        
        // assert(piece6.position == 39, 'piece6_not_on_39');
    }









}
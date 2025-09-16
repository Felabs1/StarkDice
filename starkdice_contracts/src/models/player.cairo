use starknet::ContractAddress;
 
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Player {
    #[key]
    pub game_id: felt252,
    #[key]
    pub addr: ContractAddress,
    pub index: u8,
    pub has_joined: bool,
}



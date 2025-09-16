use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct DiceRoll {
    #[key]
    pub game_id: felt252,
    #[key]
    pub turn_number: u8,
    pub roller: ContractAddress,
    pub value: u8 
}

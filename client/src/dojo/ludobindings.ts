import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

// type definition for `starkdice_contracts::models::player::Player

export interface Player {
    game_id: string,
    addr: string,
    index: number,
    has_joined: boolean,
}

// type definition for piece
export interface Piece {
    game_id: string,
    player_index: number,
    piece_index: number,
    player_address: string,
    position: number,
    is_home: boolean,
    is_finished: boolean,
}


export interface Game {
    id: string,
    is_active: boolean,
    owner: string,
    current_turn: number,
    dice_roll: string,
    winner: number,
    max_players: number,
    joined_players: number,
}

export interface DiceRoll {
    game_id: string,
    turn_number: number,
    roller: string,
    value: number
}
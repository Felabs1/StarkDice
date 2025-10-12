import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `starkdice_contracts::models::dice_commit::DiceRoll` struct
export interface DiceRoll {
	game_id: BigNumberish;
	turn_number: BigNumberish;
	roller: string;
	value: BigNumberish;
}

// Type definition for `starkdice_contracts::models::game::Game` struct
export interface Game {
	id: BigNumberish;
	is_active: boolean;
	owner: string;
	current_turn: BigNumberish;
	dice_roll: BigNumberish;
	winner: BigNumberish;
	max_players: BigNumberish;
	joined_players: BigNumberish;
}

// Type definition for `starkdice_contracts::models::piece::Piece` struct
export interface Piece {
	game_id: BigNumberish;
	player_index: BigNumberish;
	piece_index: BigNumberish;
	player_address: string;
	position: BigNumberish;
	is_home: boolean;
	is_finished: boolean;
}

// Type definition for `starkdice_contracts::models::player::Player` struct
export interface Player {
	game_id: BigNumberish;
	addr: string;
	index: BigNumberish;
	has_joined: boolean;
}

// Type definition for `starkdice_contracts::models::player::PlayerProfile` struct
export interface PlayerProfile {
	owner: string;
	games_won: BigNumberish;
	games_lost: BigNumberish;
	creation_day: BigNumberish;
}

export interface SchemaType extends ISchemaType {
	starkdice_contracts: {
		DiceRoll: DiceRoll,
		Game: Game,
		Piece: Piece,
		Player: Player,
		PlayerProfile: PlayerProfile,
	},
}
export const schema: SchemaType = {
	starkdice_contracts: {
		DiceRoll: {
			game_id: 0,
			turn_number: 0,
			roller: "",
			value: 0,
		},
		Game: {
			id: 0,
			is_active: false,
			owner: "",
			current_turn: 0,
			dice_roll: 0,
			winner: 0,
			max_players: 0,
			joined_players: 0,
		},
		Piece: {
			game_id: 0,
			player_index: 0,
			piece_index: 0,
			player_address: "",
			position: 0,
			is_home: false,
			is_finished: false,
		},
		Player: {
			game_id: 0,
			addr: "",
			index: 0,
			has_joined: false,
		},
		PlayerProfile: {
			owner: "",
			games_won: 0,
			games_lost: 0,
			creation_day: 0,
		},
	},
};
export enum ModelsMapping {
	DiceRoll = 'starkdice_contracts-DiceRoll',
	Game = 'starkdice_contracts-Game',
	Piece = 'starkdice_contracts-Piece',
	Player = 'starkdice_contracts-Player',
	PlayerProfile = 'starkdice_contracts-PlayerProfile',
}
import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

// Type definition for `full_starter_react::models::player::Player` struct
export interface Player {
  game_id: string;
  addr: string;
  index: number;
  has_joined: boolean;
}

// Type definition for `full_starter_react::models::player::PlayerValue` struct
export interface PlayerProfile {
  owner: string;
  games_won: number;
  games_lost: number;
  creation_day: number;
}

export interface Game {
  id: string;
  is_active: boolean;
  owner: string;
  current_turn: number;
  dice_roll: string;
  winner: number;
  max_players: number;
  joined_players: number;
}

export interface Piece {
  game_id: string;
  player_index: number;
  piece_index: number;
  player_address: string;
  position: number;
  is_home: boolean;
  is_finished: boolean;
}

export interface DiceRoll {
  game_id: string;
  turn_number: number;
  roller: string;
  value: number;
}

// Type definition for `achievement::events::index::TrophyCreation` struct
// export interface TrophyCreation {
// 	id: number;
// 	hidden: boolean;
// 	index: number;
// 	points: number;
// 	start: number;
// 	end: number;
// 	group: number;
// 	icon: number;
// 	title: number;
// 	description: string;
// 	tasks: Array<Task>;
// 	data: string;
// }

// Type definition for `achievement::events::index::TrophyCreationValue` struct
// export interface TrophyCreationValue {
// 	hidden: boolean;
// 	index: number;
// 	points: number;
// 	start: number;
// 	end: number;
// 	group: number;
// 	icon: number;
// 	title: number;
// 	description: string;
// 	tasks: Array<Task>;
// 	data: string;
// }

// Type definition for `achievement::events::index::TrophyProgression` struct
// export interface TrophyProgression {
// 	player_id: number;
// 	task_id: number;
// 	count: number;
// 	time: number;
// }

// Type definition for `achievement::events::index::TrophyProgressionValue` struct
// export interface TrophyProgressionValue {
// 	count: number;
// 	time: number;
// }

// Type definition for `achievement::types::index::Task` struct
// export interface Task {
// 	id: number;
// 	total: number;
// 	description: string;
// }

export interface SchemaType extends ISchemaType {
  starkdice: {
    Player: Player;
    PlayerProfile: PlayerProfile;
    Game: Game;
    Piece: Piece;
    DiceRoll: DiceRoll;
  };
  // achievement: {
  // 	TrophyCreation: TrophyCreation,
  // 	TrophyCreationValue: TrophyCreationValue,
  // 	TrophyProgression: TrophyProgression,
  // 	TrophyProgressionValue: TrophyProgressionValue,
  // 	Task: Task,
  // },
}
export const schema: SchemaType = {
  starkdice: {
    Player: {
      game_id: "",
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
    Game: {
      id: "",
      is_active: false,
      owner: "",
      current_turn: 0,
      dice_roll: "DICE_NOT_ROLLED",
      winner: 1000,
      max_players: 0,
      joined_players: 0,
    },
    Piece: {
      game_id: "",
      player_index: 0,
      piece_index: 0,
      player_address: "",
      position: 0,
      is_home: true,
      is_finished: false,
    },
    DiceRoll: {
      game_id: "",
      turn_number: 0,
      roller: "",
      value: 0,
    },
  },
  // achievement: {
  // 	TrophyCreation: {
  // 		id: 0,
  // 		hidden: false,
  // 		index: 0,
  // 		points: 0,
  // 		start: 0,
  // 		end: 0,
  // 		group: 0,
  // 		icon: 0,
  // 		title: 0,
  // 		description: "",
  // 		tasks: [{ id: 0, total: 0, description: "", }],
  // 		data: "",
  // 	},
  // 	TrophyCreationValue: {
  // 		hidden: false,
  // 		index: 0,
  // 		points: 0,
  // 		start: 0,
  // 		end: 0,
  // 		group: 0,
  // 		icon: 0,
  // 		title: 0,
  // 		description: "",
  // 		tasks: [{ id: 0, total: 0, description: "", }],
  // 		data: "",
  // 	},
  // 	TrophyProgression: {
  // 		player_id: 0,
  // 		task_id: 0,
  // 		count: 0,
  // 		time: 0,
  // 	},
  // 	TrophyProgressionValue: {
  // 		count: 0,
  // 		time: 0,
  // 	},
  // 	Task: {
  // 		id: 0,
  // 		total: 0,
  // 		description: "",
  // 	},
  // }
};
export enum ModelsMapping {
  // Player = 'full_starter_react-Player',
  // PlayerValue = 'full_starter_react-PlayerValue',
  // TrophyCreation = 'achievement-TrophyCreation',
  // TrophyCreationValue = 'achievement-TrophyCreationValue',
  // TrophyProgression = 'achievement-TrophyProgression',
  // TrophyProgressionValue = 'achievement-TrophyProgressionValue',
  // Task = 'achievement-Task',

  Player = "starkdice-Player",
  PlayerProfile = "starkdice-PlayerProfile",
  Game = "starkdice-Game",
  piece = "starkdice-Piece",
  DiceRoll = "starkdice-DiceRoll",
}

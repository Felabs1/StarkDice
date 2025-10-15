type Position = readonly [number, number];

type CoordinateKey = number;

export const COORDINATES_MAP: Record<CoordinateKey, Position> = {
  0: [-0.065, -0.39],
  1: [-0.065, -0.325],
  2: [-0.065, -0.26],
  3: [-0.065, -0.195],
  4: [-0.065, -0.13],
  5: [-0.13, -0.065],
  6: [-0.195, -0.065],
  7: [-0.26, -0.065],
  8: [-0.325, -0.065],
  9: [-0.39, -0.065],
  10: [-0.455, -0.065],
  11: [-0.455, -0.0],
  12: [-0.455, 0.065],
  13: [-0.39, 0.065],
  14: [-0.325, 0.065],
  15: [-0.26, 0.065],
  16: [-0.195, 0.065],
  17: [-0.13, 0.065],
  18: [-0.065, 0.13],
  19: [-0.065, 0.195],
  20: [-0.065, 0.26],
  21: [-0.065, 0.325],
  22: [-0.065, 0.39],
  23: [-0.065, 0.455],
  24: [0, 0.455],
  25: [0.065, 0.455],
  26: [0.065, 0.39],
  27: [0.065, 0.325],
  28: [0.065, 0.26],
  29: [0.065, 0.195],
  30: [0.065, 0.13],
  31: [0.13, 0.065],
  32: [0.195, 0.065],
  33: [0.26, 0.065],
  34: [0.325, 0.065],
  35: [0.39, 0.065],
  36: [0.455, 0.065],
  37: [0.455, 0.0],
  38: [0.455, -0.065],
  39: [0.39, -0.065],
  40: [0.325, -0.065],
  41: [0.26, -0.065],
  42: [0.195, -0.065],
  43: [0.13, -0.065],
  44: [0.065, -0.13],
  45: [0.065, -0.195],
  46: [0.065, -0.26],
  47: [0.065, -0.325],
  48: [0.065, -0.39],
  49: [0.065, -0.455],
  50: [0.0, -0.455],
  51: [-0.065, -0.455],

  // HOME ENTRANCE

  // P1
  100: [0.0, -0.39],
  101: [0.0, -0.325],
  102: [0.0, -0.26],
  103: [0.0, -0.195],
  104: [0.0, -0.195],
  105: [0.0, -0.13],

  // P2
  200: [0.0, 0.455],
  201: [0.0, 0.39],
  202: [0.0, 0.325],
  203: [0.0, 0.26],
  204: [0.0, 0.195],
  205: [0.0, 0.13],

  // BASE POSITIONS

  // P1
  500: [-0.26, -0.325],
  501: [-0.26, -0.26],
  502: [-0.325, -0.325],
  503: [-0.325, -0.26],

  // P2
  600: [0.325, 0.26],
  601: [0.26, 0.26],
  602: [0.325, 0.325],
  603: [0.26, 0.325],
} as const;

export const STEP_LENGTH = 0.065 as const;

export const PLAYERS = ["P1", "P2"] as const;
export type Player = (typeof PLAYERS)[number];

export const BASE_POSITIONS: Record<Player, readonly number[]> = {
  P1: [500, 501, 502, 503],
  P2: [600, 601, 602, 603],
} as const;

export const START_POSITIONS: Record<Player, number> = {
  P1: 0,
  P2: 26,
} as const;

export const HOME_ENTRANCE: Record<Player, readonly number[]> = {
  P1: [100, 101, 102, 103, 104],
  P2: [200, 201, 202, 203, 204],
} as const;

export const HOME_POSITIONS: Record<Player, number> = {
  P1: 105,
  P2: 205,
} as const;

export const TURNING_POINTS: Record<Player, number> = {
  P1: 50,
  P2: 24,
} as const;

export const SAFE_POSITIONS: readonly number[] = [
  0, 8, 13, 21, 26, 34, 39, 47,
] as const;

export const STATE = {
  DICE_NOT_ROLLED: "DICE_NOT_ROLLED",
  DICE_ROLLED: "DICE_ROLLED",
} as const;

export type GameState = (typeof STATE)[keyof typeof STATE];

export const hexToNumber = (hexValue: string | number): number => {
  if (typeof hexValue === "number") return hexValue;
  if (typeof hexValue === "string" && hexValue.startsWith("0x")) {
    return parseInt(hexValue, 16);
  }
  if (typeof hexValue === "string") {
    return parseInt(hexValue, 10);
  }
  return 0;
};

export const hexToUtf8String = (hexValue: string): string => {
  if (typeof hexValue !== "string" || !hexValue.startsWith("0x")) {
    throw new Error("Invalid hex string");
  }
  const hex = hexValue.slice(2);
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substr(i, 2), 16);
    if (code) str += String.fromCharCode(code);
  }
  return str;
};

export const utf8StringToHex = (str: string): string => {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return "0x" + hex;
};

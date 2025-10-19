import { Connector } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { ControllerOptions } from "@cartridge/controller";
import { constants } from "starknet";
import { manifest } from "./manifest";

// const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
const VITE_PUBLIC_DEPLOY_TYPE = "sepolia" as any;
console.log(constants);

console.log("VITE_PUBLIC_DEPLOY_TYPE", VITE_PUBLIC_DEPLOY_TYPE);

const getRpcUrl = () => {
  switch (VITE_PUBLIC_DEPLOY_TYPE) {
    case "localhost":
      return "http://localhost:5050"; // Katana localhost default port
    case "mainnet":
      return "https://api.cartridge.gg/x/starknet/mainnet";
    case "sepolia":
      return "https://api.cartridge.gg/x/starknet/sepolia";
    default:
      return "https://api.cartridge.gg/x/starknet/sepolia";
  }
};

const getDefaultChainId = () => {
  switch (VITE_PUBLIC_DEPLOY_TYPE) {
    case "localhost":
      return "0x4b4154414e41"; // KATANA in ASCII
    case "mainnet":
      return constants.StarknetChainId.SN_MAIN;
    case "sepolia":
      return constants.StarknetChainId.SN_SEPOLIA;
    default:
      return constants.StarknetChainId.SN_SEPOLIA;
  }
};

// const getGameContractAddress = () => {
//   return manifest.contracts[0].address;

// };

// were gonna hard code contract address
const DICE_CONTRACT = manifest.contracts.find(
  (contract) => contract.tag === "starkdice-dice_system"
)?.address as any;
const GAME_CONTRACT = manifest.contracts.find(
  (contract) => contract.tag === "starkdice-gamesystem"
)?.address as any;
const PIECE_CONTRACT = manifest.contracts.find(
  (contract) => contract.tag === "starkdice-piece_system"
)?.address as any;

// const CONTRACT_ADDRESS_GAME = getGameContractAddress();
// console.log("Using game contract address:", CONTRACT_ADDRESS_GAME);

const policies = {
  contracts: {
    [DICE_CONTRACT]: {
      methods: [
        {
          name: "RollDice",
          entrypoint: "roll_dice",
          description: "roll dice in the game",
        },
      ],
    },
    [GAME_CONTRACT]: {
      methods: [
        {
          name: "Spawn",
          entrypoint: "spawn",
          description: "create player on wallet connect",
        },
        {
          name: "CreateGame",
          entrypoint: "create_game",
          description: "player create a new game",
        },
        {
          name: "JoinGame",
          entrypoint: "join_game",
          description: "player joins a room",
        },
        {
          name: "StartGame",
          entrypoint: "start_game",
          description: "player starts game",
        },
      ],
    },
    [PIECE_CONTRACT]: {
      methods: [
        {
          name: "MovePiece",
          entrypoint: "move_piece",
          description: "moves eligible player pieces within the game",
        },
      ],
    },
  },
};

console.log(policies);

const options: ControllerOptions = {
  chains: [{ rpcUrl: getRpcUrl() }],
  defaultChainId: getDefaultChainId(),
  policies,
  namespace: "starkdice",
  slot: "starkdice",
};

const cartridgeConnector = new ControllerConnector(
  options
) as never as Connector;

export default cartridgeConnector;

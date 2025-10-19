import { createDojoConfig } from "@dojoengine/core";

import { manifest } from "../config/manifest";

// const {
//     VITE_PUBLIC_NODE_URL,
//     VITE_PUBLIC_TORII,
//     VITE_PUBLIC_MASTER_ADDRESS,
//     VITE_PUBLIC_MASTER_PRIVATE_KEY,
//   } = import.meta.env;

const VITE_PUBLIC_NODE_URL = "https://api.cartridge.gg/x/starknet/sepolia";
const VITE_PUBLIC_TORII = "https://api.cartridge.gg/x/starkdice/torii";
const VITE_PUBLIC_MASTER_ADDRESS = "0x012345...";
const VITE_PUBLIC_MASTER_PRIVATE_KEY = "0xabcdef...";

export const dojoConfig = createDojoConfig({
  manifest,
  masterAddress: VITE_PUBLIC_MASTER_ADDRESS || "",
  masterPrivateKey: VITE_PUBLIC_MASTER_PRIVATE_KEY || "",
  rpcUrl: VITE_PUBLIC_NODE_URL || "",
  toriiUrl: VITE_PUBLIC_TORII || "",
});

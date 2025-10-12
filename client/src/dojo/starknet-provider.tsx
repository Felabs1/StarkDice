import type { PropsWithChildren } from "react";
import { sepolia, mainnet, devnet } from "@starknet-react/chains";
import {
  jsonRpcProvider,
  StarknetConfig,
  starkscan,
} from "@starknet-react/core";
import cartridgeConnector from "../config/cartridgeConnector";

export default function StarknetProvider({ children }: PropsWithChildren) {
  // const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
  const VITE_PUBLIC_DEPLOY_TYPE = "localhost" as any;

  // Get RPC URL based on environment
  const getRpcUrl = () => {
    switch (VITE_PUBLIC_DEPLOY_TYPE) {
      case "mainnet":
        return "https://api.cartridge.gg/x/starknet/mainnet";
      case "sepolia":
        return "https://api.cartridge.gg/x/starknet/sepolia";
      case "localhost":
        return "http://localhost:5050";
      default:
        return "https://api.cartridge.gg/x/starknet/sepolia";
    }
  };

  // Create provider with the correct RPC URL
  const provider = jsonRpcProvider({
    rpc: () => ({ nodeUrl: getRpcUrl() }),
  });

  const getChains = () => {
    if (VITE_PUBLIC_DEPLOY_TYPE === "mainnet") {
      return [mainnet];
    } else if (VITE_PUBLIC_DEPLOY_TYPE === "sepolia") {
      return [sepolia];
    } else {
      return [devnet];
    }
  };
  // Determine which chain to use
  const chains = getChains();
  console.log("chains");

  return (
    <StarknetConfig
      autoConnect
      chains={chains}
      connectors={[cartridgeConnector]}
      explorer={starkscan}
      provider={provider}
    >
      {children}
    </StarknetConfig>
  );
}

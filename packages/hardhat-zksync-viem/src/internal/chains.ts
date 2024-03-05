import { EthereumProvider } from "hardhat/types";
import type { Chain } from "viem";

import memoize from "lodash.memoize";

import {
  UnknownDevelopmentNetworkError,
  NetworkNotFoundError,
  MultipleMatchingNetworksError,
} from "./errors";
import { zkSyncChainIds } from "./constants";

export async function getChain(provider: EthereumProvider): Promise<Chain> {
  const chains: Record<string, Chain> = require("viem/chains");
  const chainId = await getChainId(provider);
  if (isDevelopmentNetwork(chainId)) {
    if (await isHardhatNetwork(provider)) {
      return chains.hardhat;
    } else {
      throw new UnknownDevelopmentNetworkError();
    }
  }

  const matchingChains = Object.values(chains).filter(
    ({ id }) => id === chainId
  );

  if (matchingChains.length === 0) {
    throw new NetworkNotFoundError(chainId);
  }

  if (matchingChains.length > 1) {
    throw new MultipleMatchingNetworksError(chainId);
  }

  return matchingChains[0];
}

export function isDevelopmentNetwork(chainId: number) {
  return chainId === 31337 || chainId === 270 || chainId === 260;
}

export function isZksyncNetwork(chainId: number) {
  return zkSyncChainIds.has(chainId);
}

async function getChainId(provider: EthereumProvider) {
  return _memoizedGetChainId(provider);
}

const _memoizedGetChainId = memoize(async (provider: EthereumProvider) => {
  return Number(await provider.send("eth_chainId"));
});

async function isHardhatNetwork(provider: EthereumProvider) {
  return _memoizedIsHardhatNetwork(provider);
}

const _memoizedIsHardhatNetwork = memoize(
  async (provider: EthereumProvider) => {
    try {
      await provider.send("hardhat_metadata");
      return true;
    } catch {
      return false;
    }
  }
);
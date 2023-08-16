import { ethers } from "hardhat";
import { UniswapV2EthPair } from "../src/UniswapV2EthPair";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi');
  const factoryAddresses = ['0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'];

  const markets = await UniswapV2EthPair.getUniswapMarketsByToken(provider, factoryAddresses, UniswapV2EthPair.ImpactAndFeeFuncs);
  console.log("Markets:", markets);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
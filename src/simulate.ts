require('dotenv').config();
import { Contract, ethers , Wallet } from "ethers";
import { BundleEntry } from './Arbitrage';
import { BUNDLE_EXECUTOR_ABI } from './abi';
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Arbitrage } from "./Arbitrage"; 
import * as dotenv from "dotenv";
import UniswapV2EthPair  from "./UniswapV2EthPair";
import { FACTORY_ADDRESSES } from "./addresses";
dotenv.config();



async function main() {
  const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi');

  const walletPrivateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(walletPrivateKey, provider);

  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom());
  
  const bundleExecutorContractAddress = '0xd664837a41986dcf1aba5d36bf9d1d1aaa88b4f1';
  const bundleExecutorContract = new Contract(bundleExecutorContractAddress, BUNDLE_EXECUTOR_ABI, wallet);

  const arbitrage = new Arbitrage(wallet, flashbotsProvider, bundleExecutorContract);

  const markets = await UniswapV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES, UniswapV2EthPair.ImpactAndFeeFuncs);
  const marketsByToken = this.markets.marketsByToken;

  // Example of evaluating markets
  const crossedMarkets = await arbitrage.evaluateMarkets(marketsByToken);
  for (let crossedMarket of crossedMarkets) {
    Arbitrage.printCrossedMarket(crossedMarket);
  }

  // Example of taking crossed markets
  const blockNumber = await provider.getBlockNumber();
  const minerRewardPercentage = 95;  // or any value you choose
  await arbitrage.takeCrossedMarkets(crossedMarkets, blockNumber, minerRewardPercentage);

  // Simulate the created bundles
  await arbitrage.simulateBundles(blockNumber, flashbotsProvider);

  // Submit the bundles
  await arbitrage.submitBundles(blockNumber, flashbotsProvider);
}

main().catch((error) => {
  console.error('An error occurred:', error);
});
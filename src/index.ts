import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Contract, providers, Wallet } from "ethers";
import { BUNDLE_EXECUTOR_ABI } from "./abi";
//import UniswapV2EthPair from "./UniswapV2EthPair";
//import { UniswapV2EthPair, GroupedMarkets } from "./UniswapV2EthPair";
import UniswapV2EthPair, { GroupedMarkets } from "./UniswapV2EthPair";
import { FACTORY_ADDRESSES } from "./addresses";
import { Arbitrage } from "./Arbitrage";
import { TriangularArbitrage } from "./TriangularArbitrage"; // Import the TriangularArbitrage class
import { get } from "https";
import { getDefaultRelaySigningKey } from "./utils"; 
import { batchEthCalls } from "./eth_calls";
import * as dotenv from "dotenv";
dotenv.config();

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545"
const PRIVATE_KEY = process.env.PRIVATE_KEY || getDefaultRelaySigningKey();
const BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || "0x15F33c68134c0B57f971d67EFB444373Cdda1AE2"

const FLASHBOTS_RELAY_SIGNING_KEY = process.env.FLASHBOTS_RELAY_SIGNING_KEY || getDefaultRelaySigningKey();

const MINER_REWARD_PERCENTAGE = parseInt(process.env.MINER_REWARD_PERCENTAGE || "90")
const PROVIDER_TIMEOUT = parseInt(process.env.PROVIDER_TIMEOUT || "300000");

if (PRIVATE_KEY === "") {
  console.warn("Must provide PRIVATE_KEY environment variable")
  process.exit(1)
}
if (BUNDLE_EXECUTOR_ADDRESS === "") {
  console.warn("Must provide BUNDLE_EXECUTOR_ADDRESS environment variable. Please see README.md")
  process.exit(1)
}

if (FLASHBOTS_RELAY_SIGNING_KEY === "") {
  console.warn("Must provide FLASHBOTS_RELAY_SIGNING_KEY. Please see https://github.com/flashbots/pm/blob/main/guides/searcher-onboarding.md")
  process.exit(1)
}

const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || ""

const provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
provider.pollingInterval = PROVIDER_TIMEOUT;

const arbitrageSigningWallet = new Wallet(PRIVATE_KEY);
const flashbotsRelaySigningWallet = new Wallet(FLASHBOTS_RELAY_SIGNING_KEY);

function healthcheck() {
  if (HEALTHCHECK_URL === "") {
    return
  }
  get(HEALTHCHECK_URL).on('error', console.error);
}

async function main() {
  console.log("Searcher Wallet Address: " + await arbitrageSigningWallet.getAddress());
  console.log("Flashbots Relay Signing Wallet Address: " + await flashbotsRelaySigningWallet.getAddress());
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
  const arbitrage = new Arbitrage(
    arbitrageSigningWallet,
    flashbotsProvider,
    new Contract(BUNDLE_EXECUTOR_ADDRESS, BUNDLE_EXECUTOR_ABI, provider)
  );
  console.log("Arbitrage object:", arbitrage);

  // Initialize markets as an empty GroupedMarkets object
  let markets: GroupedMarkets = {
    marketsByToken: {},
    allMarketPairs: [],
    getPriceImpact: async () => { throw new Error("Not implemented"); },
    getTradingFee: () => { throw new Error("Not implemented"); },
  };
  
  try {
    // Try to get the markets
    const result = await UniswapV2EthPair.getUniswapMarketsByToken(
      provider,
      FACTORY_ADDRESSES,
      UniswapV2EthPair.ImpactAndFeeFuncs
    );
  
    if (result) {
      markets = result;
    } else {
      throw new Error('No markets returned');
    }
  } catch (error) {
    console.error('An error occurred while getting Uniswap Markets By Token:', error);
  
    // Assign default value to markets in case of an error
    markets = {
      marketsByToken: {},
      allMarketPairs: [],
      getPriceImpact: async () => { throw new Error("Not implemented"); },
      getTradingFee: () => { throw new Error("Not implemented"); },
    };
  }
  

//const markets: GroupedMarkets = await UniswapV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES, UniswapV2EthPair.ImpactAndFeeFuncs);
// Check if markets is defined before accessing its properties
console.log("Markets object:", markets);
if (markets) {
  const bestCrossedMarkets = await TriangularArbitrage.evaluateMarkets(markets.marketsByToken);
  console.log("Best crossed markets:", bestCrossedMarkets);

  // Get the list of pairs
  const pairs = bestCrossedMarkets.flatMap((crossedMarket) => crossedMarket.marketPairs);

  // Split the pairs into groups of MAX_PAIRS_PER_CALL
  const MAX_PAIRS_PER_CALL = 50; // Adjust this value based on what works for your use case
  const pairGroups = [];
  for (let i = 0; i < pairs.length; i += MAX_PAIRS_PER_CALL) {
    pairGroups.push(pairs.slice(i, i + MAX_PAIRS_PER_CALL));
  }

  // Make a separate eth_call for each group of pairs
  for (const pairGroup of pairGroups) {
    const calls = pairGroup.map(pair => ({
      to: pair.address,
      data: pair.interface.encodeFunctionData("getReserves")
    }));
    const results = await batchEthCalls(provider, calls);
    UniswapV2EthPair.updateReservesFromResults(pairGroup, results);
  }

  if (bestCrossedMarkets.length === 0) {
    console.log("No crossed markets");
    return;
  }

  bestCrossedMarkets.forEach(Arbitrage.printCrossedMarket);
  // Check the definition of takeCrossedMarkets and pass the correct number of arguments
  const blockNumber = await provider.getBlockNumber();
  arbitrage.takeCrossedMarkets(bestCrossedMarkets, MINER_REWARD_PERCENTAGE, blockNumber).then(healthcheck).catch(console.error);
}

provider.on("rpc", (payload) => {
  console.log("RPC request payload:", payload);
});

provider.on("rpc", (payload) => {
    console.log("RPC request payload:", payload);
    
});
    // Implement batchEthCalls
    async function batchEthCalls(provider: providers.JsonRpcProvider, calls: Array<{ to: string, data: string }>) {
      const ALCHEMY_API_LIMIT = 2600000; // Alchemy API limit in bytes
      const OVERHEAD_PER_CALL = 1000; // Adjust this value based on the overhead of each call (e.g., the `to` field and other overhead from the JSON-RPC protocol)
      
      let i = 0;
      const results = [];
      while (i < calls.length) {
        let requestSize = 0;
        const batch = [];
    
        // Add calls to the batch until the request size is close to the API limit
        while (i < calls.length && requestSize + calls[i].data.length / 2 + OVERHEAD_PER_CALL < ALCHEMY_API_LIMIT) {
          requestSize += calls[i].data.length / 2 + OVERHEAD_PER_CALL;
          batch.push(calls[i]);
          i++;
        }
    
        // Make the eth_call for this batch
        const batchResults = await Promise.all(
          batch.map(call => provider.call({
            to: call.to,
            data: call.data
          }))
        );
        results.push(...batchResults);
      }
      return results;
    }
  }    

main();

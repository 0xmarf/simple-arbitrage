<<<<<<< HEAD
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
const ethers_1 = require("ethers");
const abi_1 = require("./abi");
//import UniswapV2EthPair from "./UniswapV2EthPair";
//import { UniswapV2EthPair, GroupedMarkets } from "./UniswapV2EthPair";
const UniswapV2EthPair_1 = __importDefault(require("./UniswapV2EthPair"));
const addresses_1 = require("./addresses");
const Arbitrage_1 = require("./Arbitrage");
const TriangularArbitrage_1 = require("./TriangularArbitrage"); // Import the TriangularArbitrage class
const https_1 = require("https");
const utils_1 = require("./utils");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || (0, utils_1.getDefaultRelaySigningKey)();
const BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || "0x15F33c68134c0B57f971d67EFB444373Cdda1AE2";
const FLASHBOTS_RELAY_SIGNING_KEY = process.env.FLASHBOTS_RELAY_SIGNING_KEY || (0, utils_1.getDefaultRelaySigningKey)();
const MINER_REWARD_PERCENTAGE = parseInt(process.env.MINER_REWARD_PERCENTAGE || "90");
const PROVIDER_TIMEOUT = parseInt(process.env.PROVIDER_TIMEOUT || "300000");
if (PRIVATE_KEY === "") {
    console.warn("Must provide PRIVATE_KEY environment variable");
    process.exit(1);
}
if (BUNDLE_EXECUTOR_ADDRESS === "") {
    console.warn("Must provide BUNDLE_EXECUTOR_ADDRESS environment variable. Please see README.md");
    process.exit(1);
}
if (FLASHBOTS_RELAY_SIGNING_KEY === "") {
    console.warn("Must provide FLASHBOTS_RELAY_SIGNING_KEY. Please see https://github.com/flashbots/pm/blob/main/guides/searcher-onboarding.md");
    process.exit(1);
}
const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || "";
const provider = new ethers_1.providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
provider.pollingInterval = PROVIDER_TIMEOUT;
const arbitrageSigningWallet = new ethers_1.Wallet(PRIVATE_KEY);
const flashbotsRelaySigningWallet = new ethers_1.Wallet(FLASHBOTS_RELAY_SIGNING_KEY);
function healthcheck() {
    if (HEALTHCHECK_URL === "") {
        return;
    }
    (0, https_1.get)(HEALTHCHECK_URL).on('error', console.error);
}
async function main() {
    console.log("Searcher Wallet Address: " + await arbitrageSigningWallet.getAddress());
    console.log("Flashbots Relay Signing Wallet Address: " + await flashbotsRelaySigningWallet.getAddress());
    const flashbotsProvider = await ethers_provider_bundle_1.FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
    const arbitrage = new Arbitrage_1.Arbitrage(arbitrageSigningWallet, flashbotsProvider, new ethers_1.Contract(BUNDLE_EXECUTOR_ADDRESS, abi_1.BUNDLE_EXECUTOR_ABI, provider));
    console.log("Arbitrage object:", arbitrage);
    // Initialize markets as an empty GroupedMarkets object
    let markets = {
        marketsByToken: {},
        allMarketPairs: [],
        getPriceImpact: async () => { throw new Error("Not implemented"); },
        getTradingFee: () => { throw new Error("Not implemented"); },
    };
    try {
        // Try to get the markets
        const result = await UniswapV2EthPair_1.default.getUniswapMarketsByToken(provider, addresses_1.FACTORY_ADDRESSES, UniswapV2EthPair_1.default.ImpactAndFeeFuncs);
        if (result) {
            markets = result;
        }
        else {
            throw new Error('No markets returned');
        }
    }
    catch (error) {
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
        const bestCrossedMarkets = await TriangularArbitrage_1.TriangularArbitrage.evaluateMarkets(markets.marketsByToken);
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
            UniswapV2EthPair_1.default.updateReservesFromResults(pairGroup, results);
        }
        if (bestCrossedMarkets.length === 0) {
            console.log("No crossed markets");
            return;
        }
        bestCrossedMarkets.forEach(Arbitrage_1.Arbitrage.printCrossedMarket);
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
    async function batchEthCalls(provider, calls) {
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
            const batchResults = await Promise.all(batch.map(call => provider.call({
                to: call.to,
                data: call.data
            })));
            results.push(...batchResults);
        }
        return results;
    }
}
main();
=======
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
const ethers_1 = require("ethers");
const abi_1 = require("./abi");
const UniswappyV2EthPair_1 = require("./UniswappyV2EthPair");
const addresses_1 = require("./addresses");
const Arbitrage_1 = require("./Arbitrage");
const https_1 = require("https");
const utils_1 = require("./utils");
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || utils_1.getDefaultRelaySigningKey();
const BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || "0x9451548B807e334247708f2F0d666486ead93487";
const FLASHBOTS_RELAY_SIGNING_KEY = process.env.FLASHBOTS_RELAY_SIGNING_KEY || utils_1.getDefaultRelaySigningKey();
const MINER_REWARD_PERCENTAGE = parseInt(process.env.MINER_REWARD_PERCENTAGE || "80");
if (PRIVATE_KEY === "") {
    console.warn("Must provide PRIVATE_KEY environment variable");
    process.exit(1);
}
if (BUNDLE_EXECUTOR_ADDRESS === "") {
    console.warn("Must provide BUNDLE_EXECUTOR_ADDRESS environment variable. Please see README.md");
    process.exit(1);
}
if (FLASHBOTS_RELAY_SIGNING_KEY === "") {
    console.warn("Must provide FLASHBOTS_RELAY_SIGNING_KEY. Please see https://github.com/flashbots/pm/blob/main/guides/searcher-onboarding.md");
    process.exit(1);
}
const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || "";
const provider = new ethers_1.providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
const arbitrageSigningWallet = new ethers_1.Wallet(PRIVATE_KEY);
const flashbotsRelaySigningWallet = new ethers_1.Wallet(FLASHBOTS_RELAY_SIGNING_KEY);
function healthcheck() {
    if (HEALTHCHECK_URL === "") {
        return;
    }
    https_1.get(HEALTHCHECK_URL).on('error', console.error);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Searcher Wallet Address: " + (yield arbitrageSigningWallet.getAddress()));
        console.log("Flashbots Relay Signing Wallet Address: " + (yield flashbotsRelaySigningWallet.getAddress()));
        const flashbotsProvider = yield ethers_provider_bundle_1.FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet);
        const arbitrage = new Arbitrage_1.Arbitrage(arbitrageSigningWallet, flashbotsProvider, new ethers_1.Contract(BUNDLE_EXECUTOR_ADDRESS, abi_1.BUNDLE_EXECUTOR_ABI, provider));
        const markets = yield UniswappyV2EthPair_1.UniswappyV2EthPair.getUniswapMarketsByToken(provider, addresses_1.FACTORY_ADDRESSES);
        provider.on('block', (blockNumber) => __awaiter(this, void 0, void 0, function* () {
            yield UniswappyV2EthPair_1.UniswappyV2EthPair.updateReserves(provider, markets.allMarketPairs);
            const bestCrossedMarkets = yield arbitrage.evaluateMarkets(markets.marketsByToken);
            if (bestCrossedMarkets.length === 0) {
                console.log("No crossed markets");
                return;
            }
            bestCrossedMarkets.forEach(Arbitrage_1.Arbitrage.printCrossedMarket);
            arbitrage.takeCrossedMarkets(bestCrossedMarkets, blockNumber, MINER_REWARD_PERCENTAGE).then(healthcheck).catch(console.error);
        }));
    });
}
main();
>>>>>>> 4aa599175b4e823f381cb0498c1a10c7c5442af5
//# sourceMappingURL=index.js.map
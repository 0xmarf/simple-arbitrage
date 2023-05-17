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
//# sourceMappingURL=index.js.map
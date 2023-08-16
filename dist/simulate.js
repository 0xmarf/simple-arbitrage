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
require('dotenv').config();
const ethers_1 = require("ethers");
const abi_1 = require("./abi");
const ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
const Arbitrage_1 = require("./Arbitrage");
const dotenv = __importStar(require("dotenv"));
const UniswapV2EthPair_1 = __importDefault(require("./UniswapV2EthPair"));
const addresses_1 = require("./addresses");
dotenv.config();
async function main() {
    const provider = new ethers_1.ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi');
    const walletPrivateKey = process.env.PRIVATE_KEY;
    const wallet = new ethers_1.ethers.Wallet(walletPrivateKey, provider);
    const flashbotsProvider = await ethers_provider_bundle_1.FlashbotsBundleProvider.create(provider, ethers_1.Wallet.createRandom());
    const bundleExecutorContractAddress = '0xd664837a41986dcf1aba5d36bf9d1d1aaa88b4f1';
    const bundleExecutorContract = new ethers_1.Contract(bundleExecutorContractAddress, abi_1.BUNDLE_EXECUTOR_ABI, wallet);
    const arbitrage = new Arbitrage_1.Arbitrage(wallet, flashbotsProvider, bundleExecutorContract);
    const markets = await UniswapV2EthPair_1.default.getUniswapMarketsByToken(provider, addresses_1.FACTORY_ADDRESSES, UniswapV2EthPair_1.default.ImpactAndFeeFuncs);
    const marketsByToken = this.markets.marketsByToken;
    // Example of evaluating markets
    const crossedMarkets = await arbitrage.evaluateMarkets(marketsByToken);
    for (let crossedMarket of crossedMarkets) {
        Arbitrage_1.Arbitrage.printCrossedMarket(crossedMarket);
    }
    // Example of taking crossed markets
    const blockNumber = await provider.getBlockNumber();
    const minerRewardPercentage = 95; // or any value you choose
    await arbitrage.takeCrossedMarkets(crossedMarkets, blockNumber, minerRewardPercentage);
    // Simulate the created bundles
    await arbitrage.simulateBundles(blockNumber, flashbotsProvider);
    // Submit the bundles
    await arbitrage.submitBundles(blockNumber, flashbotsProvider);
}
main().catch((error) => {
    console.error('An error occurred:', error);
});
//# sourceMappingURL=simulate.js.map
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
var ethers_1 = require("ethers");
var abi_1 = require("./abi");
var ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
var Arbitrage_1 = require("./Arbitrage");
var dotenv = require("dotenv");
var UniswapV2EthPair_1 = require("./UniswapV2EthPair");
var addresses_1 = require("./addresses");
dotenv.config();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var provider, walletPrivateKey, wallet, flashbotsProvider, bundleExecutorContractAddress, bundleExecutorContract, arbitrage, markets, marketsByToken, crossedMarkets, _i, crossedMarkets_1, crossedMarket, blockNumber, minerRewardPercentage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = new ethers_1.ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi');
                    walletPrivateKey = process.env.PRIVATE_KEY;
                    wallet = new ethers_1.ethers.Wallet(walletPrivateKey, provider);
                    return [4 /*yield*/, ethers_provider_bundle_1.FlashbotsBundleProvider.create(provider, ethers_1.Wallet.createRandom())];
                case 1:
                    flashbotsProvider = _a.sent();
                    bundleExecutorContractAddress = '0xd664837a41986dcf1aba5d36bf9d1d1aaa88b4f1';
                    bundleExecutorContract = new ethers_1.Contract(bundleExecutorContractAddress, abi_1.BUNDLE_EXECUTOR_ABI, wallet);
                    arbitrage = new Arbitrage_1.Arbitrage(wallet, flashbotsProvider, bundleExecutorContract);
                    return [4 /*yield*/, UniswapV2EthPair_1.UniswapV2EthPair.getUniswapMarketsByToken(provider, addresses_1.FACTORY_ADDRESSES, UniswapV2EthPair_1.UniswapV2EthPair.ImpactAndFeeFuncs)];
                case 2:
                    markets = _a.sent();
                    marketsByToken = markets.marketsByToken;
                    return [4 /*yield*/, arbitrage.evaluateMarkets(marketsByToken)];
                case 3:
                    crossedMarkets = _a.sent();
                    for (_i = 0, crossedMarkets_1 = crossedMarkets; _i < crossedMarkets_1.length; _i++) {
                        crossedMarket = crossedMarkets_1[_i];
                        Arbitrage_1.Arbitrage.printCrossedMarket(crossedMarket);
                    }
                    return [4 /*yield*/, provider.getBlockNumber()];
                case 4:
                    blockNumber = _a.sent();
                    minerRewardPercentage = 95;
                    return [4 /*yield*/, arbitrage.takeCrossedMarkets(crossedMarkets, blockNumber, minerRewardPercentage)];
                case 5:
                    _a.sent();
                    // Simulate the created bundles
                    return [4 /*yield*/, arbitrage.simulateBundles(blockNumber, flashbotsProvider)];
                case 6:
                    // Simulate the created bundles
                    _a.sent();
                    // Submit the bundles
                    return [4 /*yield*/, arbitrage.submitBundles(blockNumber, flashbotsProvider)];
                case 7:
                    // Submit the bundles
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('An error occurred:', error);
});

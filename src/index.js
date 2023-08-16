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
var ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
var ethers_1 = require("ethers");
var abi_1 = require("./abi");
//import UniswapV2EthPair from "./UniswapV2EthPair";
//import { UniswapV2EthPair, GroupedMarkets } from "./UniswapV2EthPair";
var UniswapV2EthPair_1 = require("./UniswapV2EthPair");
var addresses_1 = require("./addresses");
var Arbitrage_1 = require("./Arbitrage");
var TriangularArbitrage_1 = require("./TriangularArbitrage"); // Import the TriangularArbitrage class
var https_1 = require("https");
var utils_1 = require("./utils");
var dotenv = require("dotenv");
dotenv.config();
var ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "http://127.0.0.1:8545";
var PRIVATE_KEY = process.env.PRIVATE_KEY || (0, utils_1.getDefaultRelaySigningKey)();
var BUNDLE_EXECUTOR_ADDRESS = process.env.BUNDLE_EXECUTOR_ADDRESS || "0x15F33c68134c0B57f971d67EFB444373Cdda1AE2";
var FLASHBOTS_RELAY_SIGNING_KEY = process.env.FLASHBOTS_RELAY_SIGNING_KEY || (0, utils_1.getDefaultRelaySigningKey)();
var MINER_REWARD_PERCENTAGE = parseInt(process.env.MINER_REWARD_PERCENTAGE || "90");
var PROVIDER_TIMEOUT = parseInt(process.env.PROVIDER_TIMEOUT || "300000");
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
var HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || "";
var provider = new ethers_1.providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
provider.pollingInterval = PROVIDER_TIMEOUT;
var arbitrageSigningWallet = new ethers_1.Wallet(PRIVATE_KEY);
var flashbotsRelaySigningWallet = new ethers_1.Wallet(FLASHBOTS_RELAY_SIGNING_KEY);
function healthcheck() {
    if (HEALTHCHECK_URL === "") {
        return;
    }
    (0, https_1.get)(HEALTHCHECK_URL).on('error', console.error);
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        // Implement batchEthCalls
        function batchEthCalls(provider, calls) {
            return __awaiter(this, void 0, void 0, function () {
                var ALCHEMY_API_LIMIT, OVERHEAD_PER_CALL, i, results, requestSize, batch, batchResults;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            ALCHEMY_API_LIMIT = 2600000;
                            OVERHEAD_PER_CALL = 1000;
                            i = 0;
                            results = [];
                            _a.label = 1;
                        case 1:
                            if (!(i < calls.length)) return [3 /*break*/, 3];
                            requestSize = 0;
                            batch = [];
                            // Add calls to the batch until the request size is close to the API limit
                            while (i < calls.length && requestSize + calls[i].data.length / 2 + OVERHEAD_PER_CALL < ALCHEMY_API_LIMIT) {
                                requestSize += calls[i].data.length / 2 + OVERHEAD_PER_CALL;
                                batch.push(calls[i]);
                                i++;
                            }
                            return [4 /*yield*/, Promise.all(batch.map(function (call) { return provider.call({
                                    to: call.to,
                                    data: call.data
                                }); }))];
                        case 2:
                            batchResults = _a.sent();
                            results.push.apply(results, batchResults);
                            return [3 /*break*/, 1];
                        case 3: return [2 /*return*/, results];
                    }
                });
            });
        }
        var _a, _b, _c, _d, _e, _f, flashbotsProvider, arbitrage, markets, result, error_1, bestCrossedMarkets, pairs, MAX_PAIRS_PER_CALL, pairGroups, i, _i, pairGroups_1, pairGroup, calls, results, blockNumber;
        var _this = this;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _b = (_a = console).log;
                    _c = "Searcher Wallet Address: ";
                    return [4 /*yield*/, arbitrageSigningWallet.getAddress()];
                case 1:
                    _b.apply(_a, [_c + (_g.sent())]);
                    _e = (_d = console).log;
                    _f = "Flashbots Relay Signing Wallet Address: ";
                    return [4 /*yield*/, flashbotsRelaySigningWallet.getAddress()];
                case 2:
                    _e.apply(_d, [_f + (_g.sent())]);
                    return [4 /*yield*/, ethers_provider_bundle_1.FlashbotsBundleProvider.create(provider, flashbotsRelaySigningWallet)];
                case 3:
                    flashbotsProvider = _g.sent();
                    arbitrage = new Arbitrage_1.Arbitrage(arbitrageSigningWallet, flashbotsProvider, new ethers_1.Contract(BUNDLE_EXECUTOR_ADDRESS, abi_1.BUNDLE_EXECUTOR_ABI, provider));
                    console.log("Arbitrage object:", arbitrage);
                    markets = {
                        marketsByToken: {},
                        allMarketPairs: [],
                        getPriceImpact: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            throw new Error("Not implemented");
                        }); }); },
                        getTradingFee: function () { throw new Error("Not implemented"); },
                    };
                    _g.label = 4;
                case 4:
                    _g.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, UniswapV2EthPair_1.default.getUniswapMarketsByToken(provider, addresses_1.FACTORY_ADDRESSES, UniswapV2EthPair_1.default.ImpactAndFeeFuncs)];
                case 5:
                    result = _g.sent();
                    if (result) {
                        markets = result;
                    }
                    else {
                        throw new Error('No markets returned');
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _g.sent();
                    console.error('An error occurred while getting Uniswap Markets By Token:', error_1);
                    // Assign default value to markets in case of an error
                    markets = {
                        marketsByToken: {},
                        allMarketPairs: [],
                        getPriceImpact: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            throw new Error("Not implemented");
                        }); }); },
                        getTradingFee: function () { throw new Error("Not implemented"); },
                    };
                    return [3 /*break*/, 7];
                case 7:
                    //const markets: GroupedMarkets = await UniswapV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES, UniswapV2EthPair.ImpactAndFeeFuncs);
                    // Check if markets is defined before accessing its properties
                    console.log("Markets object:", markets);
                    if (!markets) return [3 /*break*/, 14];
                    return [4 /*yield*/, TriangularArbitrage_1.TriangularArbitrage.evaluateMarkets(markets.marketsByToken)];
                case 8:
                    bestCrossedMarkets = _g.sent();
                    console.log("Best crossed markets:", bestCrossedMarkets);
                    pairs = bestCrossedMarkets.flatMap(function (crossedMarket) { return crossedMarket.marketPairs; });
                    MAX_PAIRS_PER_CALL = 50;
                    pairGroups = [];
                    for (i = 0; i < pairs.length; i += MAX_PAIRS_PER_CALL) {
                        pairGroups.push(pairs.slice(i, i + MAX_PAIRS_PER_CALL));
                    }
                    _i = 0, pairGroups_1 = pairGroups;
                    _g.label = 9;
                case 9:
                    if (!(_i < pairGroups_1.length)) return [3 /*break*/, 12];
                    pairGroup = pairGroups_1[_i];
                    calls = pairGroup.map(function (pair) { return ({
                        to: pair.address,
                        data: pair.interface.encodeFunctionData("getReserves")
                    }); });
                    return [4 /*yield*/, batchEthCalls(provider, calls)];
                case 10:
                    results = _g.sent();
                    UniswapV2EthPair_1.default.updateReservesFromResults(pairGroup, results);
                    _g.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 9];
                case 12:
                    if (bestCrossedMarkets.length === 0) {
                        console.log("No crossed markets");
                        return [2 /*return*/];
                    }
                    bestCrossedMarkets.forEach(Arbitrage_1.Arbitrage.printCrossedMarket);
                    return [4 /*yield*/, provider.getBlockNumber()];
                case 13:
                    blockNumber = _g.sent();
                    arbitrage.takeCrossedMarkets(bestCrossedMarkets, MINER_REWARD_PERCENTAGE, blockNumber).then(healthcheck).catch(console.error);
                    _g.label = 14;
                case 14:
                    provider.on("rpc", function (payload) {
                        console.log("RPC request payload:", payload);
                    });
                    provider.on("rpc", function (payload) {
                        console.log("RPC request payload:", payload);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
main();

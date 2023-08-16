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
var _ = require("lodash");
var ethers_1 = require("ethers");
var abi_1 = require("./abi");
var addresses_1 = require("./addresses");
var utils_1 = require("./utils");
require('dotenv').config();
var ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;
var factoryAddress = addresses_1.UNISWAP_FACTORY_ADDRESS;
// batch count limit helpful for testing, loading entire set of uniswap markets takes a long time to load
var BATCH_COUNT_LIMIT = 100;
var UNISWAP_BATCH_SIZE = 2000;
var provider = new ethers_1.providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
// Not necessary, slightly speeds up loading initialization when we know tokens are bad
// Estimate gas will ensure we aren't submitting bad bundles, but bad tokens waste time
var blacklistTokens = [
    '0xD75EA151a61d06868E31F8988D28DFE5E9df57B4'
];
var UniswapV2EthPair = /** @class */ (function () {
    function UniswapV2EthPair(marketAddress, tokens, protocol) {
        this.marketAddress = marketAddress;
        this._tokens = tokens; // Add this line
        this.protocol = protocol;
        this._tokenBalances = _.zipObject(tokens, [ethers_1.BigNumber.from(0), ethers_1.BigNumber.from(0)]);
    }
    UniswapV2EthPair.buyFromMarket = function (buyFromMarket, sellToMarket, tokenAddress, profit) {
        throw new Error("Method not implemented.");
    };
    UniswapV2EthPair.impactAndFeeFuncs = function (provider, FACTORY_ADDRESSES, impactAndFeeFuncs) {
        throw new Error("Method not implemented.");
    };
    UniswapV2EthPair.updateReservesFromResults = function (pairs, results) {
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            var result = results[i];
            // Assuming result is an array of BigNumber representing reserves
            pair.setReservesViaOrderedBalances(result);
        }
    };
    UniswapV2EthPair.prototype.getTradingFee = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tradingFee;
            return __generator(this, function (_b) {
                tradingFee = ethers_1.BigNumber.from(30).div(10000);
                return [2 /*return*/, tradingFee];
            });
        });
    };
    UniswapV2EthPair.prototype.getPriceImpact = function (tokenAddress, tradeSize) {
        return __awaiter(this, void 0, void 0, function () {
            var reserve, impact;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getReserves(tokenAddress)];
                    case 1:
                        reserve = _b.sent();
                        impact = tradeSize.mul(ethers_1.BigNumber.from(10000)).div(reserve.add(tradeSize));
                        return [2 /*return*/, impact]; // Returns price impact as a basis point value (1/100 of a percent)
                }
            });
        });
    };
    UniswapV2EthPair.prototype.getReserves = function (tokenAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var pairContract, _b, reserve0, reserve1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        pairContract = new ethers_1.Contract(this.marketAddress, abi_1.UNISWAP_PAIR_ABI, provider);
                        return [4 /*yield*/, pairContract.getReserves()];
                    case 1:
                        _b = _c.sent(), reserve0 = _b[0], reserve1 = _b[1];
                        return [2 /*return*/, tokenAddress === this._tokens[0] ? reserve0 : reserve1]; // Change this line
                }
            });
        });
    };
    UniswapV2EthPair.prototype.receiveDirectly = function (tokenAddress) {
        return tokenAddress in this._tokenBalances;
    };
    UniswapV2EthPair.prototype.prepareReceive = function (tokenAddress, amountIn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                if (this._tokenBalances[tokenAddress] === undefined) {
                    throw new Error("Market does not operate on token ".concat(tokenAddress));
                }
                if (!amountIn.gt(0)) {
                    throw new Error("Invalid amount: ".concat(amountIn.toString()));
                }
                // No preparation necessary
                return [2 /*return*/, []];
            });
        });
    };
    UniswapV2EthPair.getUniswapMarkets = function (provider, factoryAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var uniswapFactory, uniswapQuery, allPairsLength, allMarketPairs, i, end, pairs, _i, pairs_1, pair, token0, token1, pairAddress, marketPair;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        uniswapFactory = new ethers_1.Contract(factoryAddress, abi_1.UNISWAP_FACTORY_ABI, provider);
                        uniswapQuery = new ethers_1.Contract(addresses_1.UNISWAP_LOOKUP_CONTRACT_ADDRESS, abi_1.UNISWAP_QUERY_ABI, provider);
                        return [4 /*yield*/, uniswapFactory.allPairsLength()];
                    case 1:
                        allPairsLength = _b.sent();
                        allMarketPairs = [];
                        i = 0;
                        _b.label = 2;
                    case 2:
                        if (!(i < allPairsLength)) return [3 /*break*/, 5];
                        end = Math.min(i + UNISWAP_BATCH_SIZE, allPairsLength);
                        return [4 /*yield*/, uniswapQuery.getPairsByIndexRange(factoryAddress, i, end)];
                    case 3:
                        pairs = _b.sent();
                        console.log("Fetched pairs in batch ".concat(i, " to ").concat(end, ":"), pairs);
                        // process each pair
                        for (_i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
                            pair = pairs_1[_i];
                            token0 = pair[0];
                            token1 = pair[1];
                            pairAddress = pair[2];
                            // ignore if either token is blacklisted
                            if (blacklistTokens.includes(token0) || blacklistTokens.includes(token1)) {
                                continue;
                            }
                            marketPair = new UniswapV2EthPair(pairAddress, [token0, token1,], 'Uniswapv2');
                            // add to list
                            allMarketPairs.push(marketPair);
                        }
                        _b.label = 4;
                    case 4:
                        i += UNISWAP_BATCH_SIZE;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, allMarketPairs];
                }
            });
        });
    };
    UniswapV2EthPair.getUniswapMarketsByToken = function (provider, factoryAddress, impactAndFeeFuncs) {
        return __awaiter(this, void 0, void 0, function () {
            var allPairs, allPairsFlat, allPairsWithBalance, filteredPairs_1, marketsByToken, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, Promise.all(_.map(factoryAddress, function (factoryAddress) {
                                return UniswapV2EthPair.getUniswapMarkets(provider, factoryAddress);
                            }))];
                    case 1:
                        allPairs = _b.sent();
                        allPairsFlat = _.flatten(allPairs);
                        return [4 /*yield*/, UniswapV2EthPair.updateReserves(provider, allPairsFlat)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, Promise.all(allPairsFlat.map(function (pair) { return pair.getBalance(addresses_1.WETH_ADDRESS).then(function (balance) { return balance.gt(utils_1.ETHER) ? pair : null; }); }))];
                    case 3:
                        allPairsWithBalance = _b.sent();
                        filteredPairs_1 = allPairsWithBalance.filter(function (pair) { return pair !== null; });
                        marketsByToken = _.groupBy(filteredPairs_1, function (pair) { return pair._tokens[0] === addresses_1.WETH_ADDRESS ? pair._tokens[1] : pair._tokens[0]; });
                        console.log("Grouped markets by token:", marketsByToken);
                        console.log("Filtered pairs count:", filteredPairs_1.length);
                        return [2 /*return*/, {
                                marketsByToken: marketsByToken,
                                allMarketPairs: filteredPairs_1,
                                getPriceImpact: function (tokenAddress, tradeSize) { return __awaiter(_this, void 0, void 0, function () {
                                    var pair, reserve;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                pair = filteredPairs_1.find(function (pair) { return pair._tokens.includes(tokenAddress); });
                                                if (!pair) {
                                                    throw new Error("No pair found for token ".concat(tokenAddress));
                                                }
                                                return [4 /*yield*/, pair.getReserves(tokenAddress)];
                                            case 1:
                                                reserve = _b.sent();
                                                return [2 /*return*/, impactAndFeeFuncs.getPriceImpact(tokenAddress, tradeSize, reserve)];
                                        }
                                    });
                                }); },
                                getTradingFee: impactAndFeeFuncs.getTradingFee,
                            }];
                    case 4:
                        error_1 = _b.sent();
                        console.error('Error details:', error_1.message, error_1.stack);
                        console.error('An error occurred while getting Uniswap Markets By Token:', error_1);
                        return [2 /*return*/, {
                                marketsByToken: {},
                                allMarketPairs: [],
                                getPriceImpact: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_b) {
                                    throw new Error("Not implemented");
                                }); }); },
                                getTradingFee: function () { throw new Error("Not implemented"); },
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    UniswapV2EthPair.updateReserves = function (provider, pairsInArbitrage) {
        return __awaiter(this, void 0, void 0, function () {
            var uniswapQuery, pairAddresses, reserves, i, marketPair, reserve;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        uniswapQuery = new ethers_1.Contract(addresses_1.UNISWAP_LOOKUP_CONTRACT_ADDRESS, abi_1.UNISWAP_QUERY_ABI, provider);
                        pairAddresses = pairsInArbitrage.map(function (marketPair) { return marketPair.marketAddress; });
                        // Log the number of pairs that are being updated
                        console.log("Updating markets, count:", pairAddresses.length);
                        // Query the reserves for all pairs currently in arbitrage
                        console.log("Pairs in Arbitrage:", pairsInArbitrage);
                        console.log("Pair Addresses:", pairAddresses);
                        return [4 /*yield*/, uniswapQuery.functions.getReservesByPairs(pairAddresses)];
                    case 1:
                        reserves = (_b.sent())[0];
                        // Update the reserve information for each pair
                        for (i = 0; i < pairsInArbitrage.length; i++) {
                            marketPair = pairsInArbitrage[i];
                            reserve = reserves[i];
                            marketPair.setReservesViaOrderedBalances([reserve[0], reserve[1]]);
                            console.log("Updated reserves for pair ".concat(marketPair.marketAddress, ":"), reserve);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    UniswapV2EthPair.prototype.getBalance = function (tokenAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var balance;
            return __generator(this, function (_b) {
                balance = this._tokenBalances[tokenAddress];
                if (balance === undefined)
                    throw new Error("bad token");
                return [2 /*return*/, balance];
            });
        });
    };
    UniswapV2EthPair.prototype.setReservesViaOrderedBalances = function (balances) {
        this.setReservesViaMatchingArray(this._tokens, balances); // Change this line
    };
    UniswapV2EthPair.prototype.setReservesViaMatchingArray = function (tokens, balances) {
        var tokenBalances = _.zipObject(tokens, balances);
        if (!_.isEqual(this._tokenBalances, tokenBalances)) {
            this._tokenBalances = tokenBalances;
        }
    };
    UniswapV2EthPair.prototype.getTokensIn = function (tokenIn, tokenOut, amountOut) {
        var reserveIn = this._tokenBalances[tokenIn];
        var reserveOut = this._tokenBalances[tokenOut];
        return this.getAmountIn(reserveIn, reserveOut, amountOut);
    };
    UniswapV2EthPair.prototype.getTokensOut = function (tokenIn, tokenOut, amountIn) {
        var reserveIn = this._tokenBalances[tokenIn];
        var reserveOut = this._tokenBalances[tokenOut];
        return this.getAmountOut(reserveIn, reserveOut, amountIn);
    };
    UniswapV2EthPair.prototype.getAmountIn = function (reserveIn, reserveOut, amountOut) {
        var numerator = reserveIn.mul(amountOut).mul(1000);
        var denominator = reserveOut.sub(amountOut).mul(997);
        return numerator.div(denominator).add(1);
    };
    UniswapV2EthPair.prototype.getAmountOut = function (reserveIn, reserveOut, amountIn) {
        var amountInWithFee = amountIn.mul(997);
        var numerator = amountInWithFee.mul(reserveOut);
        var denominator = reserveIn.mul(1000).add(amountInWithFee);
        return numerator.div(denominator);
    };
    UniswapV2EthPair.prototype.sellTokensToNextMarket = function (tokenIn, amountIn, ethMarket) {
        return __awaiter(this, void 0, void 0, function () {
            var exchangeCall_1, exchangeCall;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(ethMarket.receiveDirectly(tokenIn) === true)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.sellTokens(tokenIn, amountIn, ethMarket.marketAddress)];
                    case 1:
                        exchangeCall_1 = _b.sent();
                        return [2 /*return*/, {
                                data: [exchangeCall_1],
                                targets: [this.marketAddress]
                            }];
                    case 2: return [4 /*yield*/, this.sellTokens(tokenIn, amountIn, ethMarket.marketAddress)];
                    case 3:
                        exchangeCall = _b.sent();
                        return [2 /*return*/, {
                                data: [exchangeCall],
                                targets: [this.marketAddress]
                            }];
                }
            });
        });
    };
    UniswapV2EthPair.prototype.sellTokens = function (tokenIn, amountIn, recipient) {
        return __awaiter(this, void 0, void 0, function () {
            var amount0Out, amount1Out, tokenOut, populatedTransaction;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        amount0Out = ethers_1.BigNumber.from(0);
                        amount1Out = ethers_1.BigNumber.from(0);
                        if (tokenIn === this._tokens[0]) { // Change this line
                            tokenOut = this._tokens[1]; // Change this line
                            amount1Out = this.getTokensOut(tokenIn, tokenOut, amountIn);
                        }
                        else if (tokenIn === this._tokens[1]) { // Change this line
                            tokenOut = this._tokens[0]; // Change this line
                            amount0Out = this.getTokensOut(tokenIn, tokenOut, amountIn);
                        }
                        else {
                            throw new Error("Bad token input address");
                        }
                        return [4 /*yield*/, UniswapV2EthPair.uniswapInterface.populateTransaction.swap(amount0Out, amount1Out, recipient, [])];
                    case 1:
                        populatedTransaction = _b.sent();
                        if (populatedTransaction === undefined || populatedTransaction.data === undefined)
                            throw new Error("HI");
                        return [2 /*return*/, populatedTransaction.data];
                }
            });
        });
    };
    var _a;
    _a = UniswapV2EthPair;
    UniswapV2EthPair.uniswapInterface = new ethers_1.Contract(addresses_1.WETH_ADDRESS, abi_1.UNISWAP_PAIR_ABI);
    UniswapV2EthPair.ImpactAndFeeFuncs = {
        getPriceImpact: function (tokenAddress, tradeSize, reserve) { return __awaiter(void 0, void 0, void 0, function () {
            var impact;
            return __generator(_a, function (_b) {
                if (!reserve || reserve.isZero()) {
                    throw new Error("Reserve is zero");
                }
                impact = tradeSize.mul(ethers_1.BigNumber.from(10000)).div(reserve.add(tradeSize));
                return [2 /*return*/, impact]; // Returns price impact as a basis point value (1/100 of a percent)
            });
        }); },
        getTradingFee: function (tokenAddress) { return __awaiter(void 0, void 0, void 0, function () {
            var tradingFee;
            return __generator(_a, function (_b) {
                tradingFee = ethers_1.BigNumber.from(30).div(10000);
                return [2 /*return*/, tradingFee]; // don't convert BigNumber to number, keep it as BigNumber
            });
        }); },
    };
    return UniswapV2EthPair;
}());
exports.default = UniswapV2EthPair;

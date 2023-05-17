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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Arbitrage = void 0;
var ethers_1 = require("ethers");
var addresses_1 = require("./addresses");
var utils_1 = require("./utils");
// Define the constant function market maker
var CFMM = {
    reserves: {
        x: ethers_1.BigNumber.from(0),
        y: ethers_1.BigNumber.from(0), // Reserve of token Y
    },
    tradingFunction: function () {
        // Invariant k = x * y
        return CFMM.reserves.x.mul(CFMM.reserves.y);
    },
    tradingFee: ethers_1.BigNumber.from("3000"), // Fee in basis points (0.3%)
};
// Define acceptance condition for submitted trades
var acceptTrade = function (R, deltaPlus, deltaMinus) {
    // φ(R − γ∆− − ∆+) ≥ φ(R)
    var tradingFunctionResult = CFMM.tradingFunction(R - (CFMM.tradingFee * deltaMinus) - deltaPlus);
    var tradingFunctionResult2 = CFMM.tradingFunction(R);
    if (tradingFunctionResult >= tradingFunctionResult2 && (R - (CFMM.tradingFee * deltaMinus) - deltaPlus) >= 0) {
        return true;
    }
    return false;
};
// Define the dual decomposition method
var dualDecomposition = function (referencePrices, objectiveFunction, penaltyVector) {
    // Initialize trading set T
    var T = [];
    // Iterate through reference prices
    for (var i = 0; i < referencePrices.length; i++) {
        // Generate ∆
        var deltaPlus = referencePrices[i];
        var deltaMinus = Math.min(referencePrices[i], 0);
        // Check acceptance condition
        if (acceptTrade(CFMM.reserves, deltaPlus, deltaMinus)) {
            // Add ∆ to trading set T
            T.push([deltaPlus, deltaMinus]);
        }
    }
    // Initialize dual variable ν
    var nu = 0;
    // Iterate through trading set T
    for (var i = 0; i < T.length; i++) {
        // Compute the objective function U(Ψ)
        var objectiveFunctionResult = objectiveFunction(T[i]);
        // Compute the linear penalty in the objective
        var penaltyResult = penaltyVector[i] * nu;
        // Update the dual variable ν
        nu = Math.max(nu, (objectiveFunctionResult - penaltyResult));
    }
    // Return the dual variable ν
    return nu;
};
// Define the swap market arbitrage problem
// Define the swap market arbitrage problem
var swapMarketArbitrage = function (referencePrices, objectiveFunction, penaltyVector) {
    // Initialize the dual variable ν
    var nu = 0;
    // Use bisection or ternary search to solve for the vector Ψ
    var psi = bisectionSearch(referencePrices, objectiveFunction, penaltyVector);
    // Iterate through the ∆i with i = 1, . . . , m
    for (var i = 0; i < referencePrices.length; i++) {
        // Compute the objective function U(Ψ)
        var objectiveFunctionResult = objectiveFunction(psi);
        // Compute the linear penalty in the objective
        var penaltyResult = penaltyVector[i] * nu;
        // Update the dual variable ν
        nu = Math.max(nu, (objectiveFunctionResult - penaltyResult));
    }
    // Return the dual variable ν
    return nu;
};
// Define the bounded liquidity market
var boundedLiquidityMarket = function (referencePrices, tradingFunction) {
    // Compute the minimum price of the market
    var minPrice = tradingFunction.leftDerivative(referencePrices[referencePrices.length - 1] - 1);
    // Compute the active interval for the bounded liquidity market
    var activeInterval = [minPrice, referencePrices[0]];
    // Return the active interval
    return activeInterval;
};
// Define the interface for swap markets
var swapMarketInterface = function (inputVector) {
    // Compute the price of the swap
    var swapPrice = tradingFunction(inputVector);
    // Return the price of the swap
    return swapPrice;
};
// Define the numerical solver
var numericalSolver = function (referencePrices, objectiveFunction, penaltyVector) {
    // Use bisection or ternary search to solve for the vector Ψ
    var psi = bisectionSearch(referencePrices, objectiveFunction, penaltyVector);
    // Use Newton methods to solve for the vector Ψ
    var newtonResult = newtonMethod(referencePrices, objectiveFunction, penaltyVector);
    // Choose the better solution between the bisection and Newton methods
    var optimalPsi = (objectiveFunction(psi) > objectiveFunction(newtonResult)) ? psi : newtonResult;
    // Return the optimal vector Ψ
    return optimalPsi;
};
// Define the bisection search
// Define the bisection search
var bisectionSearch = function (referencePrices, objectiveFunction, penaltyVector) {
    var left = 0;
    var right = referencePrices.length - 1;
    var tolerance = 1e-6;
    var psi;
    while (right - left > tolerance) {
        var mid = (left + right) / 2;
        var midValue = objectiveFunction(mid);
        var penaltyResult = penaltyVector[Math.round(mid)] * mid; // Updated line
        if (midValue > penaltyResult) {
            left = mid;
            psi = mid;
        }
        else {
            right = mid;
        }
    }
    return psi;
};
// Define the Newton method
var newtonMethod = function (referencePrices, objectiveFunction, penaltyVector) {
    var tolerance = 1e-6;
    var maxIterations = 100;
    var iteration = 0;
    var psi = referencePrices[0]; // Initial guess
    while (iteration < maxIterations) {
        var objectiveFunctionValue = objectiveFunction(psi);
        var penaltyResult = penaltyVector[psi] * psi;
        var difference = objectiveFunctionValue - penaltyResult;
        if (Math.abs(difference) < tolerance) {
            break;
        }
        var objectiveFunctionDerivative = (objectiveFunction(psi + tolerance) - objectiveFunction(psi)) / tolerance;
        var penaltyDerivative = penaltyVector[psi];
        psi = psi - (difference / (objectiveFunctionDerivative - penaltyDerivative));
        iteration++;
    }
    return psi;
};
function generateReferencePrices(marketsByToken) {
    var referencePrices = [];
    for (var tokenAddress in marketsByToken) {
        var markets = marketsByToken[tokenAddress];
        var cumulativePrice = 0;
        var marketCount = 0;
        for (var _i = 0, markets_1 = markets; _i < markets_1.length; _i++) {
            var market = markets_1[_i];
            cumulativePrice += market.getPrice(tokenAddress);
            marketCount++;
        }
        referencePrices.push(cumulativePrice / marketCount); // Calculate the average price for each token
    }
    return referencePrices;
}
function generateObjectiveFunction(marketsByToken) {
    return function (price) {
        // Assuming the objective is to maximize the profit, we return the negative price
        return -price;
    };
}
function generatePenaltyVector(marketsByToken) {
    var penaltyVector = [];
    for (var tokenAddress in marketsByToken) {
        var markets = marketsByToken[tokenAddress];
        for (var _i = 0, markets_2 = markets; _i < markets_2.length; _i++) {
            var market = markets_2[_i];
            // Calculate the penalty for each market based on trading fees
            var penalty = market.getTradingFee(tokenAddress);
            penaltyVector.push(penalty);
        }
    }
    return penaltyVector;
}
function findArbitrageTrades(arbitrageOpportunities, marketsByToken) {
    return __awaiter(this, void 0, void 0, function () {
        var crossedMarkets, tokenAddress, markets, i, j, buyFromMarket, sellToMarket, profit, optimalVolume;
        return __generator(this, function (_a) {
            crossedMarkets = [];
            // Iterate through the given markets by token
            for (tokenAddress in marketsByToken) {
                markets = marketsByToken[tokenAddress];
                // Calculate the arbitrage opportunities
                for (i = 0; i < markets.length; i++) {
                    for (j = i + 1; j < markets.length; j++) {
                        buyFromMarket = markets[i];
                        sellToMarket = markets[j];
                        profit = sellToMarket.getPrice(tokenAddress) - buyFromMarket.getPrice(tokenAddress);
                        if (profit > 0) {
                            optimalVolume = calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit);
                            // Create a CrossedMarketDetails object and add it to the list of arbitrage opportunities
                            crossedMarkets.push({
                                profit: ethers_1.BigNumber.from(profit),
                                volume: optimalVolume,
                                tokenAddress: tokenAddress,
                                buyFromMarket: buyFromMarket,
                                sellToMarket: sellToMarket
                            });
                        }
                    }
                }
            }
            // Sort the list of arbitrage opportunities based on the highest profit
            crossedMarkets.sort(function (a, b) { return b.profit.sub(a.profit).toNumber(); });
            return [2 /*return*/, crossedMarkets];
        });
    });
}
// Example function to calculate the optimal trade volume
function calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit) {
    // Determine the available liquidity in both markets involved in the arbitrage
    var availableLiquidityBuy = buyFromMarket.getReserves(tokenAddress);
    var availableLiquiditySell = sellToMarket.getReserves(tokenAddress);
    // Set a maximum trade size limit to manage risk
    var maxTradeSize = ethers_1.BigNumber.from(1000); // Set your desired maximum trade size limit
    // Consider implementing a minimum profit threshold to ensure that the trade is worthwhile
    var minProfitThreshold = ethers_1.BigNumber.from(1); // Set your desired minimum profit threshold
    // Calculate the price impact of different trade volumes on both markets
    var priceImpactBuy = buyFromMarket.getPriceImpact(tokenAddress, maxTradeSize);
    var priceImpactSell = sellToMarket.getPriceImpact(tokenAddress, maxTradeSize);
    // Account for trading fees, which are typically charged as a percentage of the trade volume
    var tradingFeeBuy = buyFromMarket.getTradingFee(tokenAddress);
    var tradingFeeSell = sellToMarket.getTradingFee(tokenAddress);
    var optimalVolume = ethers_1.BigNumber.from(0);
    var maxExpectedProfit = ethers_1.BigNumber.from(0);
    // Calculate the expected profit for different trade volumes, taking into account price impact and trading fees
    for (var volume = 1; volume <= maxTradeSize.toNumber(); volume++) {
        var currentVolume = ethers_1.BigNumber.from(volume);
        // Calculate the expected profit for the current trade volume
        var expectedProfit = profit
            .mul(currentVolume)
            .sub(priceImpactBuy.mul(currentVolume))
            .sub(priceImpactSell.mul(currentVolume))
            .sub(tradingFeeBuy.mul(currentVolume))
            .sub(tradingFeeSell.mul(currentVolume));
        // Update the optimal trade volume if the expected profit is higher and meets the minimum profit threshold
        if (expectedProfit.gt(maxExpectedProfit) && expectedProfit.gte(minProfitThreshold)) {
            maxExpectedProfit = expectedProfit;
            optimalVolume = currentVolume;
        }
    }
    // Ensure that the calculated trade volume does not exceed the available liquidity in either market
    optimalVolume = ethers_1.BigNumber.min(optimalVolume, availableLiquidityBuy, availableLiquiditySell);
    return optimalVolume;
}
function getGasPriceInfo(provider) {
    return __awaiter(this, void 0, void 0, function () {
        var latestBlock, blockNumber, blockGasPrices, i, block, currentGasPrice, avgGasPrice;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, provider.getBlock("latest")];
                case 1:
                    latestBlock = _a.sent();
                    blockNumber = latestBlock.number;
                    blockGasPrices = [];
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < 10)) return [3 /*break*/, 5];
                    return [4 /*yield*/, provider.getBlock(blockNumber - i)];
                case 3:
                    block = _a.sent();
                    blockGasPrices.push(block.gasPrice);
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    currentGasPrice = blockGasPrices[0];
                    avgGasPrice = ethers_1.BigNumber.from(blockGasPrices.reduce(function (a, b) { return a + b; }, 0)).div(blockGasPrices.length);
                    return [2 /*return*/, { currentGasPrice: currentGasPrice, avgGasPrice: avgGasPrice }];
            }
        });
    });
}
function adjustGasPriceForTransaction(currentGasPrice, avgGasPrice, competingBundleGasPrice) {
    return __awaiter(this, void 0, void 0, function () {
        var gasPrice, adjustedGasPrice;
        return __generator(this, function (_a) {
            gasPrice = ethers_1.BigNumber.max(currentGasPrice, avgGasPrice).mul(110).div(100);
            adjustedGasPrice = ethers_1.BigNumber.max(gasPrice, competingBundleGasPrice.add(1));
            return [2 /*return*/, adjustedGasPrice];
        });
    });
}
function ensureHigherEffectiveGasPrice(transactionGasPrice, tailTransactionGasPrice) {
    return __awaiter(this, void 0, void 0, function () {
        var effectiveGasPrice;
        return __generator(this, function (_a) {
            effectiveGasPrice = ethers_1.BigNumber.max(transactionGasPrice, tailTransactionGasPrice.add(1));
            return [2 /*return*/, effectiveGasPrice];
        });
    });
}
function checkBundleGas(bundleGas) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (bundleGas.gte(42000)) {
                return [2 /*return*/, true];
            }
            else {
                return [2 /*return*/, false];
            }
            return [2 /*return*/];
        });
    });
}
function monitorCompetingBundlesGasPrices(blocksApi) {
    return __awaiter(this, void 0, void 0, function () {
        var recentBlocks, competingBundlesGasPrices;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, blocksApi.getRecentBlocks()];
                case 1:
                    recentBlocks = _a.sent();
                    competingBundlesGasPrices = recentBlocks.map(function (block) { return block.bundleGasPrice; });
                    return [2 /*return*/, competingBundlesGasPrices];
            }
        });
    });
}
var Arbitrage = /** @class */ (function () {
    function Arbitrage(executorWallet, flashbotsProvider, bundleExecutorContract) {
        this.executorWallet = executorWallet;
        this.flashbotsProvider = flashbotsProvider;
        this.bundleExecutorContract = bundleExecutorContract;
    }
    Arbitrage.printCrossedMarket = function (crossedMarket) {
        var buyTokens = crossedMarket.buyFromMarket.tokens;
        var sellTokens = crossedMarket.sellToMarket.tokens;
        console.log("Profit: ".concat((0, utils_1.bigNumberToDecimal)(crossedMarket.profit), " ") +
            "Volume: ".concat((0, utils_1.bigNumberToDecimal)(crossedMarket.volume), "\n") +
            "".concat(crossedMarket.buyFromMarket.protocol, "(").concat(crossedMarket.buyFromMarket.marketAddress, ")\n") +
            "".concat(buyTokens[0], " => ").concat(buyTokens[1], "\n") +
            "".concat(crossedMarket.sellToMarket.protocol, "(").concat(crossedMarket.sellToMarket.marketAddress, ")\n") +
            "".concat(sellTokens[0], " => ").concat(sellTokens[1], "\n\n"));
    };
    Arbitrage.prototype.evaluateMarkets = function (marketsByToken) {
        return __awaiter(this, void 0, void 0, function () {
            var referencePrices, objectiveFunction, penaltyVector, arbitrageOpportunities;
            return __generator(this, function (_a) {
                referencePrices = generateReferencePrices(marketsByToken);
                objectiveFunction = generateObjectiveFunction(marketsByToken);
                penaltyVector = generatePenaltyVector(marketsByToken);
                arbitrageOpportunities = swapMarketArbitrage(referencePrices, objectiveFunction, penaltyVector);
                // Process the results and return the crossed market details
                return [2 /*return*/, findArbitrageTrades(arbitrageOpportunities, marketsByToken)];
            });
        });
    };
    Arbitrage.prototype.takeCrossedMarkets = function (bestCrossedMarkets, blockNumber, minerRewardPercentage) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, bestCrossedMarkets_1, bestCrossedMarket, buyCalls, inter, sellCallData, targets, payloads, minerReward, transaction, estimateGas, gasBuffer, error_1, signedTransaction, bundle, gasPrice, blockHash, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, bestCrossedMarkets_1 = bestCrossedMarkets;
                        _a.label = 1;
                    case 1:
                        if (!(_i < bestCrossedMarkets_1.length)) return [3 /*break*/, 15];
                        bestCrossedMarket = bestCrossedMarkets_1[_i];
                        console.log("Send this much WETH", bestCrossedMarket.volume.toString(), "get this much profit", bestCrossedMarket.profit.toString());
                        return [4 /*yield*/, bestCrossedMarket.buyFromMarket.sellTokensToNextMarket(addresses_1.WETH_ADDRESS, bestCrossedMarket.volume, bestCrossedMarket.sellToMarket)];
                    case 2:
                        buyCalls = _a.sent();
                        inter = bestCrossedMarket.buyFromMarket.getTokensOut(addresses_1.WETH_ADDRESS, bestCrossedMarket.tokenAddress, bestCrossedMarket.volume);
                        return [4 /*yield*/, bestCrossedMarket.sellToMarket.sellTokens(bestCrossedMarket.tokenAddress, inter, this.bundleExecutorContract.address)];
                    case 3:
                        sellCallData = _a.sent();
                        targets = __spreadArray(__spreadArray([], buyCalls.targets, true), [bestCrossedMarket.sellToMarket.marketAddress], false);
                        payloads = __spreadArray(__spreadArray([], buyCalls.data, true), [sellCallData], false);
                        console.log({
                            targets: targets,
                            payloads: payloads
                        });
                        minerReward = bestCrossedMarket.profit.mul(minerRewardPercentage).div(100);
                        return [4 /*yield*/, this.bundleExecutorContract.populateTransaction.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, {
                                gasPrice: ethers_1.BigNumber.from(0),
                                gasLimit: estimateGas,
                            })];
                    case 4:
                        transaction = _a.sent();
                        estimateGas = void 0;
                        gasBuffer = ethers_1.BigNumber.from(50000);
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.bundleExecutorContract.provider.estimateGas(transaction)];
                    case 6:
                        estimateGas = _a.sent();
                        console.log("Estimated gas for bundle execution:", estimateGas.toString());
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error("Failed to estimate gas for bundle execution:", error_1.message);
                        return [3 /*break*/, 14];
                    case 8:
                        transaction.gasLimit = estimateGas.add(gasBuffer);
                        return [4 /*yield*/, this.executorWallet.signTransaction(transaction)];
                    case 9:
                        signedTransaction = _a.sent();
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 13, , 14]);
                        bundle = [{
                                signedTransaction: signedTransaction,
                                signer: this.executorWallet.address,
                            }];
                        return [4 /*yield*/, this.flashbotsProvider.getGasPrice()];
                    case 11:
                        gasPrice = _a.sent();
                        return [4 /*yield*/, this.flashbotsProvider.sendBundle(bundle, blockNumber, {
                                minTimestamp: 0,
                                maxTimestamp: 0,
                                revertingTxHashes: [],
                            })];
                    case 12:
                        blockHash = _a.sent();
                        console.log("Sent bundle with hash", blockHash);
                        return [3 /*break*/, 14];
                    case 13:
                        error_2 = _a.sent();
                        console.error("Failed to send bundle:", error_2.message);
                        return [3 /*break*/, 14];
                    case 14:
                        _i++;
                        return [3 /*break*/, 1];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    Arbitrage.prototype.submitBundleWithAdjustedGasPrice = function (bundle, blockNumber, blocksApi) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, currentGasPrice, avgGasPrice, competingBundlesGasPrices, competingBundleGasPrice, adjustedGasPrice, effectiveGasPrice, isValidBundleGas, currentTimestamp, maxTimestamp, targetBlockNumber, bundleSubmission, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, getGasPriceInfo(this.flashbotsProvider)];
                    case 1:
                        _a = _b.sent(), currentGasPrice = _a.currentGasPrice, avgGasPrice = _a.avgGasPrice;
                        return [4 /*yield*/, monitorCompetingBundlesGasPrices(blocksApi)];
                    case 2:
                        competingBundlesGasPrices = _b.sent();
                        competingBundleGasPrice = ethers_1.BigNumber.from(Math.max.apply(Math, competingBundlesGasPrices));
                        return [4 /*yield*/, adjustGasPriceForTransaction(currentGasPrice, avgGasPrice, competingBundleGasPrice)];
                    case 3:
                        adjustedGasPrice = _b.sent();
                        return [4 /*yield*/, ensureHigherEffectiveGasPrice(adjustedGasPrice, currentGasPrice)];
                    case 4:
                        effectiveGasPrice = _b.sent();
                        return [4 /*yield*/, checkBundleGas(effectiveGasPrice)];
                    case 5:
                        isValidBundleGas = _b.sent();
                        if (!isValidBundleGas) {
                            console.error("Bundle gas is not valid");
                            return [2 /*return*/];
                        }
                        currentTimestamp = Math.floor(Date.now() / 1000);
                        maxTimestamp = currentTimestamp + 60;
                        targetBlockNumber = blockNumber + 1;
                        return [4 /*yield*/, this.flashbotsProvider.sendBundle(bundle, targetBlockNumber, {
                                minTimestamp: currentTimestamp,
                                maxTimestamp: maxTimestamp,
                                gasPrice: effectiveGasPrice, // Use the effective gas price
                            })];
                    case 6:
                        bundleSubmission = _b.sent();
                        console.log("Bundle submitted:", bundleSubmission);
                        return [3 /*break*/, 8];
                    case 7:
                        error_3 = _b.sent();
                        console.error("Failed to submit bundle:", error_3.message);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return Arbitrage;
}());
exports.Arbitrage = Arbitrage;

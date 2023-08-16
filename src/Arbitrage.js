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
exports.Arbitrage = exports.calculateOptimalVolume = void 0;
var ethers_1 = require("ethers");
var addresses_1 = require("./addresses");
var utils_1 = require("./utils");
// Define the constant function market maker
var defaultValue = ethers_1.BigNumber.from("0");
var CFMM = {
    reserves: {
        x: ethers_1.BigNumber.from(0),
        y: ethers_1.BigNumber.from(0), // Reserve of token Y
    },
    tradingFunction: function (R) {
        if (this === null || this === void 0 ? void 0 : this.reserves) {
            R = R || this.reserves.x;
            return this.reserves ? R.mul(this.reserves.y) : defaultValue;
        }
        return ethers_1.BigNumber.from(0);
    },
    tradingFee: ethers_1.BigNumber.from("3000"), // Fee in basis points (0.3%)
};
// Define acceptance condition for submitted trades
var acceptTrade = function (R, deltaPlus, deltaMinus) {
    var tradingFunctionResult = CFMM.tradingFunction(R.sub(CFMM.tradingFee.mul(deltaMinus)).sub(deltaPlus));
    var tradingFunctionResult2 = CFMM.tradingFunction(R);
    if (tradingFunctionResult.gte(tradingFunctionResult2) && R.sub(CFMM.tradingFee.mul(deltaMinus)).sub(deltaPlus).gte(0)) {
        return true;
    }
    return false;
};
// Define the dual decomposition method
var dualDecomposition = function (referencePrices, objectiveFunction, penaltyVector) {
    if (referencePrices === void 0) { referencePrices = []; }
    // Initialize trading set T
    var T = [];
    // Iterate through reference prices
    for (var i = 0; i < referencePrices.length; i++) {
        // Generate ∆
        var deltaPlus = referencePrices[i].cumulativePrice;
        var deltaMinus = Math.min(referencePrices[i].cumulativePrice, 0);
        // Check acceptance condition
        if (acceptTrade(CFMM.reserves.x, deltaPlus, deltaMinus)) {
            // Add ∆ to trading set T
            T.push([deltaPlus, deltaMinus]);
        }
    }
    // Initialize dual variable ν
    var nu = 0;
    // Iterate through trading set T
    for (var i = 0; i < T.length; i++) {
        // Compute the objective function U(Ψ)
        var objectiveFunctionResult = objectiveFunction(T[i][0]);
        // Compute the linear penalty in the objective
        var penaltyResult = penaltyVector[i] * nu;
        // Compute the linear penalty in the objective
        // Update the dual variable ν
        nu = Math.max(nu, (objectiveFunctionResult - penaltyResult));
    }
    // Return the dual variable ν
    return nu;
};
// Define the swap market arbitrage problem
// Define the swap market arbitrage problem
var swapMarketArbitrage = function (referencePrices, objectiveFunction, penaltyVector) {
    if (referencePrices === void 0) { referencePrices = []; }
    // Initialize the dual variable ν
    var nu = 0;
    // Use bisection or ternary search to solve for the vector Ψ
    // Assuming that bisectionSearch accepts a number, not an array
    var psi = bisectionSearch(referencePrices, objectiveFunction, penaltyVector);
    // Iterate through the ∆i with i = 1, . . . , m
    for (var i = 0; i < referencePrices.length; i++) {
        // Compute the objective function U(Ψ)
        // Use the i-th element from psi
        var objectiveFunctionResult = objectiveFunction(referencePrices[psi].cumulativePrice);
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
    var swapPrice = CFMM.tradingFunction(inputVector);
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
        var mid = Math.floor((left + right) / 2);
        var midValue = objectiveFunction(mid);
        var penaltyResult = penaltyVector[mid] * mid;
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
    var psi = 0; // Initial guess
    while (iteration < maxIterations) {
        var objectiveFunctionValue = objectiveFunction(referencePrices[psi].cumulativePrice);
        var penaltyResult = penaltyVector[psi] * psi;
        var difference = objectiveFunctionValue - penaltyResult;
        if (Math.abs(difference) < tolerance) {
            break;
        }
        var objectiveFunctionDerivative = (objectiveFunction(referencePrices[psi + 1].cumulativePrice) - objectiveFunctionValue) / tolerance;
        var penaltyDerivative = penaltyVector[psi];
        psi = psi - (difference / (objectiveFunctionDerivative - penaltyDerivative));
        iteration++;
    }
    return psi;
};
// Example function to calculate the optimal trade volume
function calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit) {
    return __awaiter(this, void 0, void 0, function () {
        var availableLiquidityBuy, availableLiquiditySell, maxTradeSize, minProfitThreshold, priceImpactBuy, priceImpactSell, tradingFeeBuy, tradingFeeSell, optimalVolume, maxExpectedProfit, volume, currentVolume, expectedProfit;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, buyFromMarket.getReserves(tokenAddress)];
                case 1:
                    availableLiquidityBuy = _a.sent();
                    return [4 /*yield*/, sellToMarket.getReserves(tokenAddress)];
                case 2:
                    availableLiquiditySell = _a.sent();
                    maxTradeSize = ethers_1.BigNumber.from(1000);
                    minProfitThreshold = ethers_1.BigNumber.from(1);
                    return [4 /*yield*/, buyFromMarket.getPriceImpact(tokenAddress, maxTradeSize)];
                case 3:
                    priceImpactBuy = _a.sent();
                    return [4 /*yield*/, sellToMarket.getPriceImpact(tokenAddress, maxTradeSize)];
                case 4:
                    priceImpactSell = _a.sent();
                    return [4 /*yield*/, buyFromMarket.getTradingFee(tokenAddress)];
                case 5:
                    tradingFeeBuy = _a.sent();
                    return [4 /*yield*/, sellToMarket.getTradingFee(tokenAddress)];
                case 6:
                    tradingFeeSell = _a.sent();
                    optimalVolume = ethers_1.BigNumber.from(0);
                    maxExpectedProfit = ethers_1.BigNumber.from(0);
                    // Calculate the expected profit for different trade volumes, taking into account price impact and trading fees
                    for (volume = 1; volume <= maxTradeSize.toNumber(); volume++) {
                        currentVolume = ethers_1.BigNumber.from(volume);
                        expectedProfit = ethers_1.BigNumber.from(profit)
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
                    optimalVolume = ethers_1.BigNumber.from(Math.min(optimalVolume.toNumber(), availableLiquidityBuy.toNumber(), availableLiquiditySell.toNumber()));
                    return [2 /*return*/, optimalVolume];
            }
        });
    });
}
exports.calculateOptimalVolume = calculateOptimalVolume;
function getGasPriceInfo(provider) {
    return __awaiter(this, void 0, void 0, function () {
        var latestBlock, blockNumber, blockGasPrices, i, block, transactions, totalGasPriceInBlock, transactionCountInBlock, _i, transactions_1, txHash, tx, avgGasPriceInBlock, currentGasPrice, totalGasPrice, i, avgGasPrice;
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
                    if (!(i < 10)) return [3 /*break*/, 9];
                    return [4 /*yield*/, provider.getBlock(blockNumber - i)];
                case 3:
                    block = _a.sent();
                    transactions = block.transactions;
                    totalGasPriceInBlock = ethers_1.BigNumber.from(0);
                    transactionCountInBlock = 0;
                    _i = 0, transactions_1 = transactions;
                    _a.label = 4;
                case 4:
                    if (!(_i < transactions_1.length)) return [3 /*break*/, 7];
                    txHash = transactions_1[_i];
                    return [4 /*yield*/, provider.getTransaction(txHash)];
                case 5:
                    tx = _a.sent();
                    totalGasPriceInBlock = totalGasPriceInBlock.add(tx.gasPrice);
                    transactionCountInBlock++;
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    avgGasPriceInBlock = totalGasPriceInBlock.div(ethers_1.BigNumber.from(transactionCountInBlock));
                    blockGasPrices.push(avgGasPriceInBlock);
                    _a.label = 8;
                case 8:
                    i++;
                    return [3 /*break*/, 2];
                case 9:
                    currentGasPrice = blockGasPrices[0];
                    totalGasPrice = ethers_1.BigNumber.from(0);
                    for (i = 0; i < blockGasPrices.length; i++) {
                        totalGasPrice = totalGasPrice.add(blockGasPrices[i]);
                    }
                    avgGasPrice = totalGasPrice.div(ethers_1.BigNumber.from(blockGasPrices.length));
                    return [2 /*return*/, { currentGasPrice: currentGasPrice, avgGasPrice: avgGasPrice }];
            }
        });
    });
}
function ensureHigherEffectiveGasPrice(transactionGasPrice, tailTransactionGasPrice) {
    return __awaiter(this, void 0, void 0, function () {
        var effectiveGasPrice;
        return __generator(this, function (_a) {
            effectiveGasPrice = transactionGasPrice.gt(tailTransactionGasPrice) ? transactionGasPrice : tailTransactionGasPrice.add(1);
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
        // An internal state for storing bundle entries
        this.bundleEntries = [];
        this.generateReferencePrices = function (marketsByToken) {
            var referencePrices = [];
            for (var tokenAddress in marketsByToken) {
                var markets = marketsByToken[tokenAddress];
                for (var _i = 0, markets_1 = markets; _i < markets_1.length; _i++) {
                    var market = markets_1[_i];
                    var cumulativePrice = ethers_1.ethers.BigNumber.from(0);
                    var marketCount = 0;
                    var reserves = {
                        tokenA: market.getBalance(market.tokens[0]),
                        tokenB: market.getBalance(market.tokens[1])
                    };
                    var price = 0;
                    if (market.tokens[0] === tokenAddress) {
                        price = Number(reserves.tokenB.div(reserves.tokenA)); // Assuming price = tokenB / tokenA
                    }
                    else if (market.tokens[1] === tokenAddress) {
                        price = Number(reserves.tokenA.div(reserves.tokenB)); // Assuming price = tokenA / tokenB
                    }
                    cumulativePrice = cumulativePrice.add(price);
                    marketCount++;
                    // Convert cumulativePrice from BigNumber to number
                    var cumulativePriceNumber = Number(ethers_1.ethers.utils.formatUnits(cumulativePrice, 'ether'));
                    referencePrices.push({ marketAddress: market.marketAddress, cumulativePrice: cumulativePriceNumber, marketCount: marketCount });
                }
            }
            return referencePrices;
        };
        this.executorWallet = executorWallet;
        this.flashbotsProvider = flashbotsProvider;
        this.bundleExecutorContract = bundleExecutorContract;
        // Binding this to instance methods
        this.evaluateMarkets = this.evaluateMarkets.bind(this);
        this.generateReferencePrices = this.generateReferencePrices.bind(this);
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
    Arbitrage.prototype.findArbitrageTrades = function (arbitrageOpportunities, marketsByToken) {
        return __awaiter(this, void 0, void 0, function () {
            var crossedMarkets, referencePrices, _a, _b, _c, _i, tokenAddress, markets, i, _loop_1, j;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        crossedMarkets = [];
                        referencePrices = this.generateReferencePrices(marketsByToken);
                        _a = marketsByToken;
                        _b = [];
                        for (_c in _a)
                            _b.push(_c);
                        _i = 0;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _b.length)) return [3 /*break*/, 8];
                        _c = _b[_i];
                        if (!(_c in _a)) return [3 /*break*/, 7];
                        tokenAddress = _c;
                        markets = marketsByToken[tokenAddress];
                        i = 0;
                        _d.label = 2;
                    case 2:
                        if (!(i < markets.length)) return [3 /*break*/, 7];
                        _loop_1 = function (j) {
                            var buyFromMarket, sellToMarket, profit, optimalVolume;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        buyFromMarket = markets[i];
                                        sellToMarket = markets[j];
                                        profit = referencePrices.find(function (refPrice) { return refPrice.marketAddress === sellToMarket.marketAddress; }).cumulativePrice -
                                            referencePrices.find(function (refPrice) { return refPrice.marketAddress === buyFromMarket.marketAddress; }).cumulativePrice;
                                        if (!(profit > 0)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit)];
                                    case 1:
                                        optimalVolume = _e.sent();
                                        // Create a CrossedMarketDetails object and add it to the list of arbitrage opportunities
                                        crossedMarkets.push({
                                            profit: ethers_1.BigNumber.from(profit),
                                            volume: optimalVolume,
                                            tokenAddress: tokenAddress,
                                            buyFromMarket: buyFromMarket,
                                            sellToMarket: sellToMarket,
                                            marketPairs: undefined
                                        });
                                        _e.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        j = i + 1;
                        _d.label = 3;
                    case 3:
                        if (!(j < markets.length)) return [3 /*break*/, 6];
                        return [5 /*yield**/, _loop_1(j)];
                    case 4:
                        _d.sent();
                        _d.label = 5;
                    case 5:
                        j++;
                        return [3 /*break*/, 3];
                    case 6:
                        i++;
                        return [3 /*break*/, 2];
                    case 7:
                        _i++;
                        return [3 /*break*/, 1];
                    case 8:
                        // Sort the list of arbitrage opportunities based on the highest profit
                        crossedMarkets.sort(function (a, b) { return b.profit.sub(a.profit).toNumber(); });
                        return [2 /*return*/, crossedMarkets];
                }
            });
        });
    };
    Arbitrage.prototype.createBundleEntry = function (signedTransaction) {
        return __awaiter(this, void 0, void 0, function () {
            var transaction, bundleEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.executorWallet.provider.getTransaction(signedTransaction)];
                    case 1:
                        transaction = _a.sent();
                        bundleEntry = {
                            to: transaction.to,
                            gas: transaction.gasLimit.toNumber(),
                            gas_price: ethers_1.ethers.utils.formatUnits(transaction.gasPrice, 'wei'),
                            value: Number(ethers_1.ethers.utils.formatUnits(transaction.value, 'ether')),
                            input: transaction.data,
                            from: this.executorWallet.address,
                            signedTransaction: signedTransaction,
                            signer: this.executorWallet.address,
                        };
                        return [2 /*return*/, bundleEntry];
                }
            });
        });
    };
    Arbitrage.prototype.pushBundleEntries = function (bundle, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.bundleEntries.push({ bundle: bundle, blockNumber: blockNumber });
                console.log('Pushing bundle entries:', bundle, blockNumber);
                return [2 /*return*/];
            });
        });
    };
    Arbitrage.prototype.simulateBundles = function (blockNumber, flashbotsProvider) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, entry, signedTransactions, simulation;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.bundleEntries;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        entry = _a[_i];
                        if (!(entry.blockNumber === blockNumber)) return [3 /*break*/, 4];
                        return [4 /*yield*/, flashbotsProvider.signBundle(entry.bundle)];
                    case 2:
                        signedTransactions = _b.sent();
                        return [4 /*yield*/, flashbotsProvider.simulate(signedTransactions, blockNumber)];
                    case 3:
                        simulation = _b.sent();
                        console.log('Simulation for block number:', blockNumber, JSON.stringify(simulation, null, 2));
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Submits all the bundles in the internal state.
     */
    Arbitrage.prototype.submitBundles = function (blockNumber, flashbotsProvider) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, entry, flashbotsTransactionResponse;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.bundleEntries;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        entry = _a[_i];
                        if (!(entry.blockNumber === blockNumber)) return [3 /*break*/, 3];
                        return [4 /*yield*/, flashbotsProvider.sendBundle(entry.bundle, blockNumber)];
                    case 2:
                        flashbotsTransactionResponse = _b.sent();
                        console.log('Submitting bundle for block number:', blockNumber, 'Transaction response:', flashbotsTransactionResponse);
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Arbitrage.prototype.generateObjectiveFunction = function (marketsByToken) {
        var _this = this;
        return function (price) {
            var adjustment = 0;
            // Assuming marketsByToken is an object where each value is an array of markets
            for (var token in marketsByToken) {
                for (var _i = 0, _a = marketsByToken[token]; _i < _a.length; _i++) {
                    var market = _a[_i];
                    // Assuming each market has a 'buyPrice' and 'sellPrice' properties
                    var buyPrice = _this.market.buyPrice;
                    var sellPrice = _this.market.sellPrice;
                    // Compute the difference between sell price and buy price
                    var difference = sellPrice - buyPrice;
                    adjustment += difference;
                }
            }
            return -price + adjustment;
        };
    };
    Arbitrage.prototype.generatePenaltyVector = function (marketsByToken) {
        return __awaiter(this, void 0, void 0, function () {
            var penaltyVector, _loop_2, tokenAddress;
            return __generator(this, function (_a) {
                penaltyVector = [];
                _loop_2 = function (tokenAddress) {
                    var markets = marketsByToken[tokenAddress];
                    penaltyVector = penaltyVector.concat(markets.map(function (market) { return market.getTradingFee(tokenAddress).then(function (fee) { return fee.toNumber(); }); }));
                };
                for (tokenAddress in marketsByToken) {
                    _loop_2(tokenAddress);
                }
                return [2 /*return*/, Promise.all(penaltyVector)];
            });
        });
    };
    Arbitrage.prototype.simulateBundle = function (bundle, blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var stringBundle, simulation, bundleGasPrice, coinbaseDiff, results, cost, profit, _i, results_1, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        stringBundle = bundle.map(function (entry) { return entry.signedTransaction; });
                        return [4 /*yield*/, this.flashbotsProvider.simulate(stringBundle, blockNumber)];
                    case 1:
                        simulation = _a.sent();
                        if (typeof simulation === 'string' || 'error' in simulation) {
                            throw new Error(simulation);
                        }
                        bundleGasPrice = simulation.bundleGasPrice, coinbaseDiff = simulation.coinbaseDiff, results = simulation.results;
                        cost = bundleGasPrice.mul(simulation.totalGasUsed);
                        profit = coinbaseDiff.sub(cost);
                        // Check the results of the transactions in the bundle
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            result = results_1[_i];
                            if ('error' in result) {
                                console.error('Transaction simulation failed:', result.error);
                            }
                            else {
                                console.log('Transaction simulation successful:', result);
                            }
                        }
                        // Check the profitability of the bundle
                        if (profit.lte(0)) {
                            console.log('The bundle is not profitable');
                        }
                        else {
                            console.log('The bundle is profitable with a profit of', profit.toString(), 'wei');
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to simulate the bundle:', error_1.message || error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Arbitrage.prototype.evaluateMarkets = function (marketsByToken) {
        return __awaiter(this, void 0, void 0, function () {
            var referencePrices, objectiveFunction, penaltyVector, arbitrageOpportunities;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        referencePrices = this.generateReferencePrices(marketsByToken);
                        objectiveFunction = this.generateObjectiveFunction(marketsByToken);
                        return [4 /*yield*/, this.generatePenaltyVector(marketsByToken)];
                    case 1:
                        penaltyVector = _a.sent();
                        return [4 /*yield*/, swapMarketArbitrage(referencePrices, objectiveFunction, penaltyVector)];
                    case 2:
                        arbitrageOpportunities = _a.sent();
                        // Process the results and return the crossed market details
                        return [2 /*return*/, this.findArbitrageTrades(arbitrageOpportunities, marketsByToken)];
                }
            });
        });
    };
    Arbitrage.prototype.takeCrossedMarkets = function (bestCrossedMarkets, blockNumber, minerRewardPercentage) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, bestCrossedMarkets_1, bestCrossedMarket, buyCalls, inter, sellCallData, targets, payloads, minerReward, tempTransaction, estimateGas, error_2, gasBuffer, transaction, signedTransaction, bundleEntry, bundle;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, bestCrossedMarkets_1 = bestCrossedMarkets;
                        _a.label = 1;
                    case 1:
                        if (!(_i < bestCrossedMarkets_1.length)) return [3 /*break*/, 14];
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
                        return [4 /*yield*/, this.bundleExecutorContract.populateTransaction.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, { gasPrice: ethers_1.BigNumber.from(100000000) })];
                    case 4:
                        tempTransaction = _a.sent();
                        estimateGas = void 0;
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.bundleExecutorContract.provider.estimateGas(tempTransaction)];
                    case 6:
                        estimateGas = _a.sent();
                        console.log("Estimated gas for bundle execution:", estimateGas.toString());
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        console.error("Failed to estimate gas for bundle execution:", error_2.message);
                        return [3 /*break*/, 13];
                    case 8:
                        gasBuffer = ethers_1.BigNumber.from(50000);
                        estimateGas = estimateGas.add(gasBuffer);
                        return [4 /*yield*/, this.bundleExecutorContract.populateTransaction.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, { gasPrice: ethers_1.BigNumber.from(100000000), gasLimit: estimateGas })];
                    case 9:
                        transaction = _a.sent();
                        return [4 /*yield*/, this.executorWallet.signTransaction(transaction)];
                    case 10:
                        signedTransaction = _a.sent();
                        return [4 /*yield*/, this.createBundleEntry(signedTransaction)];
                    case 11:
                        bundleEntry = _a.sent();
                        bundle = [bundleEntry];
                        return [4 /*yield*/, this.pushBundleEntries(bundle, blockNumber)];
                    case 12:
                        _a.sent();
                        _a.label = 13;
                    case 13:
                        _i++;
                        return [3 /*break*/, 1];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    Arbitrage.prototype.adjustGasPriceForTransaction = function (currentGasPrice, avgGasPrice, competingBundleGasPrice) {
        return __awaiter(this, void 0, void 0, function () {
            var adjustedGasPrice, gasPriceIncreasePercentage, additionalGasPrice;
            return __generator(this, function (_a) {
                adjustedGasPrice = currentGasPrice;
                if (avgGasPrice.gt(adjustedGasPrice)) {
                    adjustedGasPrice = avgGasPrice;
                }
                if (competingBundleGasPrice.gt(adjustedGasPrice)) {
                    adjustedGasPrice = competingBundleGasPrice;
                }
                gasPriceIncreasePercentage = ethers_1.BigNumber.from(10);
                additionalGasPrice = adjustedGasPrice.mul(gasPriceIncreasePercentage).div(100);
                adjustedGasPrice = adjustedGasPrice.add(additionalGasPrice);
                return [2 /*return*/, adjustedGasPrice];
            });
        });
    };
    Arbitrage.prototype.submitBundleWithAdjustedGasPrice = function (bundle, blockNumber, blocksApi) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, currentGasPrice, avgGasPrice, competingBundlesGasPrices, competingBundleGasPrice, i, currentPrice, adjustedGasPrice, isValidBundleGas, currentTimestamp, maxTimestamp, targetBlockNumber, bundleSubmission, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, getGasPriceInfo(this.flashbotsProvider)];
                    case 1:
                        _a = _b.sent(), currentGasPrice = _a.currentGasPrice, avgGasPrice = _a.avgGasPrice;
                        return [4 /*yield*/, monitorCompetingBundlesGasPrices(blocksApi)];
                    case 2:
                        competingBundlesGasPrices = _b.sent();
                        competingBundleGasPrice = ethers_1.BigNumber.from(0);
                        for (i = 0; i < competingBundlesGasPrices.length; i++) {
                            currentPrice = ethers_1.BigNumber.from(competingBundlesGasPrices[i]);
                            if (currentPrice.gt(competingBundleGasPrice)) {
                                competingBundleGasPrice = currentPrice;
                            }
                        }
                        return [4 /*yield*/, this.adjustGasPriceForTransaction(currentGasPrice, avgGasPrice, competingBundleGasPrice)];
                    case 3:
                        adjustedGasPrice = _b.sent();
                        // Ensure higher effective gas price
                        if (adjustedGasPrice.lte(currentGasPrice)) {
                            console.error("Adjusted gas price is not higher than the current gas price");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, checkBundleGas(adjustedGasPrice)];
                    case 4:
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
                            })];
                    case 5:
                        bundleSubmission = _b.sent();
                        console.log("Bundle submitted:", bundleSubmission);
                        return [3 /*break*/, 7];
                    case 6:
                        error_3 = _b.sent();
                        console.error("Failed to submit bundle:", error_3.message);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return Arbitrage;
}());
exports.Arbitrage = Arbitrage;

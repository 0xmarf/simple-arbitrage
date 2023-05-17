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
exports.Arbitrage = void 0;
const ethers_1 = require("ethers");
const addresses_1 = require("./addresses");
const utils_1 = require("./utils");
// Define the constant function market maker
let CFMM = {
    reserves: {
        x: ethers_1.BigNumber.from(0),
        y: ethers_1.BigNumber.from(0),
    },
    tradingFunction: () => {
        // Invariant k = x * y
        return CFMM.reserves.x.mul(CFMM.reserves.y);
    },
    tradingFee: ethers_1.BigNumber.from("3000"),
};
// Define acceptance condition for submitted trades
let acceptTrade = (R, deltaPlus, deltaMinus) => {
    let tradingFunctionResult = CFMM.tradingFunction(R.sub(CFMM.tradingFee.mul(deltaMinus)).sub(deltaPlus));
    let tradingFunctionResult2 = CFMM.tradingFunction(R);
    if (tradingFunctionResult.gte(tradingFunctionResult2) && R.sub(CFMM.tradingFee.mul(deltaMinus)).sub(deltaPlus).gte(0)) {
        return true;
    }
    return false;
};
// Define the dual decomposition method
let dualDecomposition = (referencePrices, objectiveFunction, penaltyVector) => {
    // Initialize trading set T
    let T = [];
    // Iterate through reference prices
    for (let i = 0; i < referencePrices.length; i++) {
        // Generate ∆
        let deltaPlus = referencePrices[i];
        let deltaMinus = Math.min(referencePrices[i], 0);
        // Check acceptance condition
        if (acceptTrade(CFMM.reserves, deltaPlus, deltaMinus)) {
            // Add ∆ to trading set T
            T.push([deltaPlus, deltaMinus]);
        }
    }
    // Initialize dual variable ν
    let nu = 0;
    // Iterate through trading set T
    for (let i = 0; i < T.length; i++) {
        // Compute the objective function U(Ψ)
        let objectiveFunctionResult = objectiveFunction(T[i]);
        // Compute the linear penalty in the objective
        let penaltyResult = penaltyVector[i] * nu;
        // Update the dual variable ν
        nu = Math.max(nu, (objectiveFunctionResult - penaltyResult));
    }
    // Return the dual variable ν
    return nu;
};
// Define the swap market arbitrage problem
// Define the swap market arbitrage problem
let swapMarketArbitrage = (referencePrices, objectiveFunction, penaltyVector) => {
    // Initialize the dual variable ν
    let nu = 0;
    // Use bisection or ternary search to solve for the vector Ψ
    let psi = bisectionSearch(referencePrices, objectiveFunction, penaltyVector);
    // Iterate through the ∆i with i = 1, . . . , m
    for (let i = 0; i < referencePrices.length; i++) {
        // Compute the objective function U(Ψ)
        let objectiveFunctionResult = objectiveFunction(psi);
        // Compute the linear penalty in the objective
        let penaltyResult = penaltyVector[i] * nu;
        // Update the dual variable ν
        nu = Math.max(nu, (objectiveFunctionResult - penaltyResult));
    }
    // Return the dual variable ν
    return nu;
};
// Define the bounded liquidity market
let boundedLiquidityMarket = (referencePrices, tradingFunction) => {
    // Compute the minimum price of the market
    let minPrice = tradingFunction.leftDerivative(referencePrices[referencePrices.length - 1] - 1);
    // Compute the active interval for the bounded liquidity market
    let activeInterval = [minPrice, referencePrices[0]];
    // Return the active interval
    return activeInterval;
};
// Define the interface for swap markets
let swapMarketInterface = (inputVector) => {
    // Compute the price of the swap
    let swapPrice = tradingFunction(inputVector);
    // Return the price of the swap
    return swapPrice;
};
// Define the numerical solver
let numericalSolver = (referencePrices, objectiveFunction, penaltyVector) => {
    // Use bisection or ternary search to solve for the vector Ψ
    let psi = bisectionSearch(referencePrices, objectiveFunction, penaltyVector);
    // Use Newton methods to solve for the vector Ψ
    let newtonResult = newtonMethod(referencePrices, objectiveFunction, penaltyVector);
    // Choose the better solution between the bisection and Newton methods
    let optimalPsi = (objectiveFunction(psi) > objectiveFunction(newtonResult)) ? psi : newtonResult;
    // Return the optimal vector Ψ
    return optimalPsi;
};
// Define the bisection search
// Define the bisection search
let bisectionSearch = (referencePrices, objectiveFunction, penaltyVector) => {
    let left = 0;
    let right = referencePrices.length - 1;
    let tolerance = 1e-6;
    let psi;
    while (right - left > tolerance) {
        let mid = (left + right) / 2;
        let midValue = objectiveFunction(mid);
        let penaltyResult = penaltyVector[Math.round(mid)] * mid; // Updated line
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
let newtonMethod = (referencePrices, objectiveFunction, penaltyVector) => {
    let tolerance = 1e-6;
    let maxIterations = 100;
    let iteration = 0;
    let psi = referencePrices[0]; // Initial guess
    while (iteration < maxIterations) {
        let objectiveFunctionValue = objectiveFunction(psi);
        let penaltyResult = penaltyVector[psi] * psi;
        let difference = objectiveFunctionValue - penaltyResult;
        if (Math.abs(difference) < tolerance) {
            break;
        }
        let objectiveFunctionDerivative = (objectiveFunction(psi + tolerance) - objectiveFunction(psi)) / tolerance;
        let penaltyDerivative = penaltyVector[psi];
        psi = psi - (difference / (objectiveFunctionDerivative - penaltyDerivative));
        iteration++;
    }
    return psi;
};
function generateReferencePrices(marketsByToken) {
    let referencePrices = [];
    for (const tokenAddress in marketsByToken) {
        const markets = marketsByToken[tokenAddress];
        let cumulativePrice = 0;
        let marketCount = 0;
        for (const market of markets) {
            cumulativePrice += market.getPrice(tokenAddress);
            marketCount++;
        }
        referencePrices.push(cumulativePrice / marketCount); // Calculate the average price for each token
    }
    return referencePrices;
}
function generateObjectiveFunction(marketsByToken) {
    return (price) => {
        -price;
    };
}
function generatePenaltyVector(marketsByToken) {
    let penaltyVector = [];
    for (const tokenAddress in marketsByToken) {
        const markets = marketsByToken[tokenAddress];
        for (const market of markets) {
            // Calculate the penalty for each market based on trading fees
            const penalty = market.getTradingFee(tokenAddress);
            penaltyVector.push(penalty);
        }
    }
    return penaltyVector;
}
function findArbitrageTrades(arbitrageOpportunities, marketsByToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let crossedMarkets = [];
        // Iterate through the given markets by token
        for (const tokenAddress in marketsByToken) {
            const markets = marketsByToken[tokenAddress];
            // Calculate the arbitrage opportunities
            for (let i = 0; i < markets.length; i++) {
                for (let j = i + 1; j < markets.length; j++) {
                    const buyFromMarket = markets[i];
                    const sellToMarket = markets[j];
                    // Determine the difference between buy and sell prices
                    const profit = sellToMarket.getPrice(tokenAddress) - buyFromMarket.getPrice(tokenAddress);
                    if (profit > 0) {
                        // Calculate the optimal trade volume based on your trading strategy
                        const optimalVolume = calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit);
                        // Create a CrossedMarketDetails object and add it to the list of arbitrage opportunities
                        crossedMarkets.push({
                            profit: ethers_1.BigNumber.from(profit),
                            volume: optimalVolume,
                            tokenAddress,
                            buyFromMarket,
                            sellToMarket
                        });
                    }
                }
            }
        }
        // Sort the list of arbitrage opportunities based on the highest profit
        crossedMarkets.sort((a, b) => b.profit.sub(a.profit).toNumber());
        return crossedMarkets;
    });
}
// Example function to calculate the optimal trade volume
function calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit) {
    // Determine the available liquidity in both markets involved in the arbitrage
    const availableLiquidityBuy = buyFromMarket.getReserves(tokenAddress);
    const availableLiquiditySell = sellToMarket.getReserves(tokenAddress);
    // Set a maximum trade size limit to manage risk
    const maxTradeSize = ethers_1.BigNumber.from(1000); // Set your desired maximum trade size limit
    // Consider implementing a minimum profit threshold to ensure that the trade is worthwhile
    const minProfitThreshold = ethers_1.BigNumber.from(1); // Set your desired minimum profit threshold
    // Calculate the price impact of different trade volumes on both markets
    const priceImpactBuy = buyFromMarket.getPriceImpact(tokenAddress, maxTradeSize);
    const priceImpactSell = sellToMarket.getPriceImpact(tokenAddress, maxTradeSize);
    // Account for trading fees, which are typically charged as a percentage of the trade volume
    const tradingFeeBuy = buyFromMarket.getTradingFee(tokenAddress);
    const tradingFeeSell = sellToMarket.getTradingFee(tokenAddress);
    let optimalVolume = ethers_1.BigNumber.from(0);
    let maxExpectedProfit = ethers_1.BigNumber.from(0);
    // Calculate the expected profit for different trade volumes, taking into account price impact and trading fees
    for (let volume = 1; volume <= maxTradeSize.toNumber(); volume++) {
        const currentVolume = ethers_1.BigNumber.from(volume);
        // Calculate the expected profit for the current trade volume
        const expectedProfit = profit
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
    return __awaiter(this, void 0, void 0, function* () {
        const latestBlock = yield provider.getBlock("latest");
        const blockNumber = latestBlock.number;
        const blockGasPrices = [];
        // Sample the gas prices of the last 10 blocks
        for (let i = 0; i < 10; i++) {
            const block = yield provider.getBlock(blockNumber - i);
            blockGasPrices.push(block.gasPrice);
        }
        const currentGasPrice = blockGasPrices[0];
        const avgGasPrice = ethers_1.BigNumber.from(blockGasPrices.reduce((a, b) => a + b, 0)).div(blockGasPrices.length);
        return { currentGasPrice, avgGasPrice };
    });
}
function adjustGasPriceForTransaction(currentGasPrice, avgGasPrice, competingBundleGasPrice) {
    return __awaiter(this, void 0, void 0, function* () {
        const gasPrice = ethers_1.BigNumber.maximum(currentGasPrice, avgGasPrice).mul(110).div(100);
        const adjustedGasPrice = ethers_1.BigNumber.maximum(gasPrice, competingBundleGasPrice.add(1));
        return adjustedGasPrice;
    });
}
function ensureHigherEffectiveGasPrice(transactionGasPrice, tailTransactionGasPrice) {
    return __awaiter(this, void 0, void 0, function* () {
        const effectiveGasPrice = ethers_1.BigNumber.maximum(transactionGasPrice, tailTransactionGasPrice.add(1));
        return effectiveGasPrice;
    });
}
function checkBundleGas(bundleGas) {
    return __awaiter(this, void 0, void 0, function* () {
        if (bundleGas.gte(42000)) {
            return true;
        }
        else {
            return false;
        }
    });
}
function monitorCompetingBundlesGasPrices(blocksApi) {
    return __awaiter(this, void 0, void 0, function* () {
        const recentBlocks = yield blocksApi.getRecentBlocks();
        const competingBundlesGasPrices = recentBlocks.map(block => block.bundleGasPrice);
        return competingBundlesGasPrices;
    });
}
class Arbitrage {
    constructor(executorWallet, flashbotsProvider, bundleExecutorContract) {
        this.executorWallet = executorWallet;
        this.flashbotsProvider = flashbotsProvider;
        this.bundleExecutorContract = bundleExecutorContract;
    }
    static printCrossedMarket(crossedMarket) {
        const buyTokens = crossedMarket.buyFromMarket.tokens;
        const sellTokens = crossedMarket.sellToMarket.tokens;
        console.log(`Profit: ${utils_1.bigNumberToDecimal(crossedMarket.profit)} ` +
            `Volume: ${utils_1.bigNumberToDecimal(crossedMarket.volume)}\n` +
            `${crossedMarket.buyFromMarket.protocol}(${crossedMarket.buyFromMarket.marketAddress})\n` +
            `${buyTokens[0]} => ${buyTokens[1]}\n` +
            `${crossedMarket.sellToMarket.protocol}(${crossedMarket.sellToMarket.marketAddress})\n` +
            `${sellTokens[0]} => ${sellTokens[1]}\n\n`);
    }
    evaluateMarkets(marketsByToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prepare the referencePrices, objectiveFunction, and penaltyVector based on the input data
            // You might need to create helper functions to generate these from the input data
            let referencePrices = generateReferencePrices(marketsByToken);
            let objectiveFunction = generateObjectiveFunction(marketsByToken);
            let penaltyVector = generatePenaltyVector(marketsByToken);
            // Run the swapMarketArbitrage algorithm with the prepared data
            let arbitrageOpportunities = swapMarketArbitrage(referencePrices, objectiveFunction, penaltyVector);
            // Process the results and return the crossed market details
            return findArbitrageTrades(arbitrageOpportunities, marketsByToken);
        });
    }
    takeCrossedMarkets(bestCrossedMarkets, blockNumber, minerRewardPercentage) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const bestCrossedMarket of bestCrossedMarkets) {
                console.log("Send this much WETH", bestCrossedMarket.volume.toString(), "get this much profit", bestCrossedMarket.profit.toString());
                const buyCalls = yield bestCrossedMarket.buyFromMarket.sellTokensToNextMarket(addresses_1.WETH_ADDRESS, bestCrossedMarket.volume, bestCrossedMarket.sellToMarket);
                const inter = bestCrossedMarket.buyFromMarket.getTokensOut(addresses_1.WETH_ADDRESS, bestCrossedMarket.tokenAddress, bestCrossedMarket.volume);
                const sellCallData = yield bestCrossedMarket.sellToMarket.sellTokens(bestCrossedMarket.tokenAddress, inter, this.bundleExecutorContract.address);
                const targets = [...buyCalls.targets, bestCrossedMarket.sellToMarket.marketAddress];
                const payloads = [...buyCalls.data, sellCallData];
                console.log({
                    targets,
                    payloads
                });
                let estimateGas;
                const minerReward = bestCrossedMarket.profit.mul(minerRewardPercentage).div(100);
                const transaction = yield this.bundleExecutorContract.populateTransaction.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, {
                    gasPrice: ethers_1.BigNumber.from(0),
                    gasLimit: estimateGas,
                });
                const gasBuffer = ethers_1.BigNumber.from(50000); // You can adjust this buffer value as needed
                try {
                    estimateGas = yield this.bundleExecutorContract.provider.estimateGas(transaction);
                    console.log("Estimated gas for bundle execution:", estimateGas.toString());
                }
                catch (error) {
                    console.error("Failed to estimate gas for bundle execution:", error.message);
                    continue;
                }
                transaction.gasLimit = estimateGas.add(gasBuffer);
                const signedTransaction = yield this.executorWallet.signTransaction(transaction);
                try {
                    const bundle = [{
                            signedTransaction,
                            signer: this.executorWallet.address,
                        }];
                    const gasPrice = yield this.flashbotsProvider.getGasPrice();
                    const blockHash = yield this.flashbotsProvider.sendBundle(bundle, blockNumber, {
                        minTimestamp: 0,
                        maxTimestamp: 0,
                        revertingTxHashes: [],
                    });
                    console.log("Sent bundle with hash", blockHash);
                }
                catch (error) {
                    console.error("Failed to send bundle:", error.message);
                }
            }
        });
    }
    submitBundleWithAdjustedGasPrice(bundle, blockNumber, blocksApi) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get current and average gas prices
                const { currentGasPrice, avgGasPrice } = yield getGasPriceInfo(this.flashbotsProvider);
                // Monitor competing bundles gas prices
                const competingBundlesGasPrices = yield monitorCompetingBundlesGasPrices(blocksApi);
                // Find the maximum gas price among competing bundles
                const competingBundleGasPrice = ethers_1.BigNumber.from(Math.max(...competingBundlesGasPrices));
                // Adjust gas price for the transaction
                const adjustedGasPrice = yield adjustGasPriceForTransaction(currentGasPrice, avgGasPrice, competingBundleGasPrice);
                // Ensure higher effective gas price
                const effectiveGasPrice = yield ensureHigherEffectiveGasPrice(adjustedGasPrice, currentGasPrice);
                // Check if the bundle gas is valid
                const isValidBundleGas = yield checkBundleGas(effectiveGasPrice);
                if (!isValidBundleGas) {
                    console.error("Bundle gas is not valid");
                    return;
                }
                // Calculate the current Unix timestamp and add a buffer time (e.g., 60 seconds)
                const currentTimestamp = Math.floor(Date.now() / 1000);
                const maxTimestamp = currentTimestamp + 60;
                // Submit the bundle with the adjusted gas price and maxTimestamp
                const targetBlockNumber = blockNumber + 1;
                const bundleSubmission = yield this.flashbotsProvider.sendBundle(bundle, targetBlockNumber, {
                    minTimestamp: currentTimestamp,
                    maxTimestamp: maxTimestamp,
                    gasPrice: effectiveGasPrice,
                });
                console.log("Bundle submitted:", bundleSubmission);
            }
            catch (error) {
                console.error("Failed to submit bundle:", error.message);
            }
        });
    }
}
exports.Arbitrage = Arbitrage;
//# sourceMappingURL=Arbitrage.js.map
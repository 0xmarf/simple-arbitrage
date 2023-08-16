"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Arbitrage = exports.calculateOptimalVolume = void 0;
const ethers_1 = require("ethers");
const addresses_1 = require("./addresses");
const utils_1 = require("./utils");
// Define the constant function market maker
const defaultValue = ethers_1.BigNumber.from("0");
let CFMM = {
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
let acceptTrade = (R, deltaPlus, deltaMinus) => {
    let tradingFunctionResult = CFMM.tradingFunction(R.sub(CFMM.tradingFee.mul(deltaMinus)).sub(deltaPlus));
    let tradingFunctionResult2 = CFMM.tradingFunction(R);
    if (tradingFunctionResult.gte(tradingFunctionResult2) && R.sub(CFMM.tradingFee.mul(deltaMinus)).sub(deltaPlus).gte(0)) {
        return true;
    }
    return false;
};
// Define the dual decomposition method
let dualDecomposition = (referencePrices = [], objectiveFunction, penaltyVector) => {
    // Initialize trading set T
    let T = [];
    // Iterate through reference prices
    for (let i = 0; i < referencePrices.length; i++) {
        // Generate ∆
        let deltaPlus = referencePrices[i].cumulativePrice;
        let deltaMinus = Math.min(referencePrices[i].cumulativePrice, 0);
        // Check acceptance condition
        if (acceptTrade(CFMM.reserves.x, deltaPlus, deltaMinus)) {
            // Add ∆ to trading set T
            T.push([deltaPlus, deltaMinus]);
        }
    }
    // Initialize dual variable ν
    let nu = 0;
    // Iterate through trading set T
    for (let i = 0; i < T.length; i++) {
        // Compute the objective function U(Ψ)
        let objectiveFunctionResult = objectiveFunction(T[i][0]);
        // Compute the linear penalty in the objective
        let penaltyResult = penaltyVector[i] * nu;
        // Compute the linear penalty in the objective
        // Update the dual variable ν
        nu = Math.max(nu, (objectiveFunctionResult - penaltyResult));
    }
    // Return the dual variable ν
    return nu;
};
// Define the swap market arbitrage problem
// Define the swap market arbitrage problem
let swapMarketArbitrage = (referencePrices = [], objectiveFunction, penaltyVector) => {
    // Initialize the dual variable ν
    let nu = 0;
    // Use bisection or ternary search to solve for the vector Ψ
    // Assuming that bisectionSearch accepts a number, not an array
    let psi = bisectionSearch(referencePrices, objectiveFunction, penaltyVector);
    // Iterate through the ∆i with i = 1, . . . , m
    for (let i = 0; i < referencePrices.length; i++) {
        // Compute the objective function U(Ψ)
        // Use the i-th element from psi
        const objectiveFunctionResult = objectiveFunction(referencePrices[psi].cumulativePrice);
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
    let swapPrice = CFMM.tradingFunction(inputVector);
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
        let mid = Math.floor((left + right) / 2);
        let midValue = objectiveFunction(mid);
        let penaltyResult = penaltyVector[mid] * mid;
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
    let psi = 0; // Initial guess
    while (iteration < maxIterations) {
        let objectiveFunctionValue = objectiveFunction(referencePrices[psi].cumulativePrice);
        let penaltyResult = penaltyVector[psi] * psi;
        let difference = objectiveFunctionValue - penaltyResult;
        if (Math.abs(difference) < tolerance) {
            break;
        }
        let objectiveFunctionDerivative = (objectiveFunction(referencePrices[psi + 1].cumulativePrice) - objectiveFunctionValue) / tolerance;
        let penaltyDerivative = penaltyVector[psi];
        psi = psi - (difference / (objectiveFunctionDerivative - penaltyDerivative));
        iteration++;
    }
    return psi;
};
// Example function to calculate the optimal trade volume
async function calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit) {
    // Determine the available liquidity in both markets involved in the arbitrage
    const availableLiquidityBuy = await buyFromMarket.getReserves(tokenAddress);
    const availableLiquiditySell = await sellToMarket.getReserves(tokenAddress);
    // Set a maximum trade size limit to manage risk
    const maxTradeSize = ethers_1.BigNumber.from(1000); // Set your desired maximum trade size limit
    // Consider implementing a minimum profit threshold to ensure that the trade is worthwhile
    const minProfitThreshold = ethers_1.BigNumber.from(1); // Set your desired minimum profit threshold
    // Calculate the price impact of different trade volumes on both markets
    const priceImpactBuy = await buyFromMarket.getPriceImpact(tokenAddress, maxTradeSize);
    const priceImpactSell = await sellToMarket.getPriceImpact(tokenAddress, maxTradeSize);
    // Account for trading fees, which are typically charged as a percentage of the trade volume
    const tradingFeeBuy = await buyFromMarket.getTradingFee(tokenAddress);
    const tradingFeeSell = await sellToMarket.getTradingFee(tokenAddress);
    let optimalVolume = ethers_1.BigNumber.from(0);
    let maxExpectedProfit = ethers_1.BigNumber.from(0);
    // Calculate the expected profit for different trade volumes, taking into account price impact and trading fees
    for (let volume = 1; volume <= maxTradeSize.toNumber(); volume++) {
        const currentVolume = ethers_1.BigNumber.from(volume);
        // Calculate the expected profit for the current trade volume
        const expectedProfit = ethers_1.BigNumber.from(profit)
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
    return optimalVolume;
}
exports.calculateOptimalVolume = calculateOptimalVolume;
async function getGasPriceInfo(provider) {
    const latestBlock = await provider.getBlock("latest");
    const blockNumber = latestBlock.number;
    const blockGasPrices = [];
    // Sample the gas prices of the last 10 blocks
    for (let i = 0; i < 10; i++) {
        const block = await provider.getBlock(blockNumber - i);
        const transactions = block.transactions;
        let totalGasPriceInBlock = ethers_1.BigNumber.from(0);
        let transactionCountInBlock = 0;
        for (const txHash of transactions) {
            const tx = await provider.getTransaction(txHash);
            totalGasPriceInBlock = totalGasPriceInBlock.add(tx.gasPrice);
            transactionCountInBlock++;
        }
        const avgGasPriceInBlock = totalGasPriceInBlock.div(ethers_1.BigNumber.from(transactionCountInBlock));
        blockGasPrices.push(avgGasPriceInBlock);
    }
    const currentGasPrice = blockGasPrices[0];
    let totalGasPrice = ethers_1.BigNumber.from(0);
    for (let i = 0; i < blockGasPrices.length; i++) {
        totalGasPrice = totalGasPrice.add(blockGasPrices[i]);
    }
    const avgGasPrice = totalGasPrice.div(ethers_1.BigNumber.from(blockGasPrices.length));
    return { currentGasPrice, avgGasPrice };
}
async function ensureHigherEffectiveGasPrice(transactionGasPrice, tailTransactionGasPrice) {
    const effectiveGasPrice = transactionGasPrice.gt(tailTransactionGasPrice) ? transactionGasPrice : tailTransactionGasPrice.add(1);
    return effectiveGasPrice;
}
async function checkBundleGas(bundleGas) {
    if (bundleGas.gte(42000)) {
        return true;
    }
    else {
        return false;
    }
}
async function monitorCompetingBundlesGasPrices(blocksApi) {
    const recentBlocks = await blocksApi.getRecentBlocks();
    const competingBundlesGasPrices = recentBlocks.map((block) => block.bundleGasPrice);
    return competingBundlesGasPrices;
}
class Arbitrage {
    constructor(executorWallet, flashbotsProvider, bundleExecutorContract) {
        // An internal state for storing bundle entries
        this.bundleEntries = [];
        this.generateReferencePrices = (marketsByToken) => {
            let referencePrices = [];
            for (const tokenAddress in marketsByToken) {
                const markets = marketsByToken[tokenAddress];
                for (const market of markets) {
                    let cumulativePrice = ethers_1.ethers.BigNumber.from(0);
                    let marketCount = 0;
                    const reserves = {
                        tokenA: market.getBalance(market.tokens[0]),
                        tokenB: market.getBalance(market.tokens[1])
                    };
                    let price = 0;
                    if (market.tokens[0] === tokenAddress) {
                        price = Number(reserves.tokenB.div(reserves.tokenA)); // Assuming price = tokenB / tokenA
                    }
                    else if (market.tokens[1] === tokenAddress) {
                        price = Number(reserves.tokenA.div(reserves.tokenB)); // Assuming price = tokenA / tokenB
                    }
                    cumulativePrice = cumulativePrice.add(price);
                    marketCount++;
                    // Convert cumulativePrice from BigNumber to number
                    const cumulativePriceNumber = Number(ethers_1.ethers.utils.formatUnits(cumulativePrice, 'ether'));
                    referencePrices.push({ marketAddress: market.marketAddress, cumulativePrice: cumulativePriceNumber, marketCount });
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
    static printCrossedMarket(crossedMarket) {
        const buyTokens = crossedMarket.buyFromMarket.tokens;
        const sellTokens = crossedMarket.sellToMarket.tokens;
        console.log(`Profit: ${(0, utils_1.bigNumberToDecimal)(crossedMarket.profit)} ` +
            `Volume: ${(0, utils_1.bigNumberToDecimal)(crossedMarket.volume)}\n` +
            `${crossedMarket.buyFromMarket.protocol}(${crossedMarket.buyFromMarket.marketAddress})\n` +
            `${buyTokens[0]} => ${buyTokens[1]}\n` +
            `${crossedMarket.sellToMarket.protocol}(${crossedMarket.sellToMarket.marketAddress})\n` +
            `${sellTokens[0]} => ${sellTokens[1]}\n\n`);
    }
    async findArbitrageTrades(arbitrageOpportunities, marketsByToken) {
        let crossedMarkets = [];
        // Get the reference prices for each token across all markets
        let referencePrices = this.generateReferencePrices(marketsByToken);
        // Iterate through the given markets by token
        for (const tokenAddress in marketsByToken) {
            const markets = marketsByToken[tokenAddress];
            // Calculate the arbitrage opportunities
            for (let i = 0; i < markets.length; i++) {
                for (let j = i + 1; j < markets.length; j++) {
                    const buyFromMarket = markets[i]; // Ensure buyFromMarket is of type MarketType
                    const sellToMarket = markets[j];
                    // Determine the difference between buy and sell prices
                    const profit = referencePrices.find(refPrice => refPrice.marketAddress === sellToMarket.marketAddress).cumulativePrice -
                        referencePrices.find(refPrice => refPrice.marketAddress === buyFromMarket.marketAddress).cumulativePrice;
                    if (profit > 0) {
                        // Calculate the optimal trade volume based on your trading strategy
                        const optimalVolume = await calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit);
                        // Create a CrossedMarketDetails object and add it to the list of arbitrage opportunities
                        crossedMarkets.push({
                            profit: ethers_1.BigNumber.from(profit),
                            volume: optimalVolume,
                            tokenAddress,
                            buyFromMarket,
                            sellToMarket,
                            marketPairs: undefined
                        });
                    }
                }
            }
        }
        // Sort the list of arbitrage opportunities based on the highest profit
        crossedMarkets.sort((a, b) => b.profit.sub(a.profit).toNumber());
        return crossedMarkets;
    }
    async createBundleEntry(signedTransaction) {
        const transaction = await this.executorWallet.provider.getTransaction(signedTransaction);
        const bundleEntry = {
            to: transaction.to,
            gas: transaction.gasLimit.toNumber(),
            gas_price: ethers_1.ethers.utils.formatUnits(transaction.gasPrice, 'wei'),
            value: Number(ethers_1.ethers.utils.formatUnits(transaction.value, 'ether')),
            input: transaction.data,
            from: this.executorWallet.address,
            signedTransaction: signedTransaction,
            signer: this.executorWallet.address,
        };
        return bundleEntry;
    }
    async pushBundleEntries(bundle, blockNumber) {
        this.bundleEntries.push({ bundle, blockNumber });
        console.log('Pushing bundle entries:', bundle, blockNumber);
    }
    async simulateBundles(blockNumber, flashbotsProvider) {
        for (const entry of this.bundleEntries) {
            if (entry.blockNumber === blockNumber) {
                const signedTransactions = await flashbotsProvider.signBundle(entry.bundle);
                const simulation = await flashbotsProvider.simulate(signedTransactions, blockNumber);
                console.log('Simulation for block number:', blockNumber, JSON.stringify(simulation, null, 2));
            }
        }
    }
    /**
     * Submits all the bundles in the internal state.
     */
    async submitBundles(blockNumber, flashbotsProvider) {
        for (const entry of this.bundleEntries) {
            if (entry.blockNumber === blockNumber) {
                const flashbotsTransactionResponse = await flashbotsProvider.sendBundle(entry.bundle, blockNumber);
                console.log('Submitting bundle for block number:', blockNumber, 'Transaction response:', flashbotsTransactionResponse);
            }
        }
    }
    generateObjectiveFunction(marketsByToken) {
        return (price) => {
            let adjustment = 0;
            // Assuming marketsByToken is an object where each value is an array of markets
            for (const token in marketsByToken) {
                for (const market of marketsByToken[token]) {
                    // Assuming each market has a 'buyPrice' and 'sellPrice' properties
                    let buyPrice = this.market.buyPrice;
                    let sellPrice = this.market.sellPrice;
                    // Compute the difference between sell price and buy price
                    let difference = sellPrice - buyPrice;
                    adjustment += difference;
                }
            }
            return -price + adjustment;
        };
    }
    async generatePenaltyVector(marketsByToken) {
        let penaltyVector = [];
        for (const tokenAddress in marketsByToken) {
            const markets = marketsByToken[tokenAddress];
            penaltyVector = penaltyVector.concat(markets.map((market) => market.getTradingFee(tokenAddress).then(fee => fee.toNumber())));
        }
        return Promise.all(penaltyVector);
    }
    async simulateBundle(bundle, blockNumber) {
        try {
            // Assuming bundle has a property 'signedTransaction' that contains the signed transaction string.
            const stringBundle = bundle.map(entry => entry.signedTransaction);
            // Simulate the bundle transaction
            const simulation = await this.flashbotsProvider.simulate(stringBundle, blockNumber);
            if (typeof simulation === 'string' || 'error' in simulation) {
                throw new Error(simulation);
            }
            const { bundleGasPrice, coinbaseDiff, results } = simulation;
            // Compute the cost and profit in ETH
            const cost = bundleGasPrice.mul(simulation.totalGasUsed);
            const profit = coinbaseDiff.sub(cost);
            // Check the results of the transactions in the bundle
            for (const result of results) {
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
        }
        catch (error) {
            console.error('Failed to simulate the bundle:', error.message || error);
        }
    }
    async evaluateMarkets(marketsByToken) {
        // Use the class methods instead of standalone functions
        let referencePrices = this.generateReferencePrices(marketsByToken);
        let objectiveFunction = this.generateObjectiveFunction(marketsByToken);
        let penaltyVector = await this.generatePenaltyVector(marketsByToken);
        // Run the swapMarketArbitrage algorithm with the prepared data
        let arbitrageOpportunities = await swapMarketArbitrage(referencePrices, objectiveFunction, penaltyVector);
        // Process the results and return the crossed market details
        return this.findArbitrageTrades(arbitrageOpportunities, marketsByToken);
    }
    async takeCrossedMarkets(bestCrossedMarkets, blockNumber, minerRewardPercentage) {
        for (const bestCrossedMarket of bestCrossedMarkets) {
            console.log("Send this much WETH", bestCrossedMarket.volume.toString(), "get this much profit", bestCrossedMarket.profit.toString());
            const buyCalls = await bestCrossedMarket.buyFromMarket.sellTokensToNextMarket(addresses_1.WETH_ADDRESS, bestCrossedMarket.volume, bestCrossedMarket.sellToMarket);
            const inter = bestCrossedMarket.buyFromMarket.getTokensOut(addresses_1.WETH_ADDRESS, bestCrossedMarket.tokenAddress, bestCrossedMarket.volume);
            const sellCallData = await bestCrossedMarket.sellToMarket.sellTokens(bestCrossedMarket.tokenAddress, inter, this.bundleExecutorContract.address);
            const targets = [...buyCalls.targets, bestCrossedMarket.sellToMarket.marketAddress];
            const payloads = [...buyCalls.data, sellCallData];
            console.log({
                targets,
                payloads
            });
            const minerReward = bestCrossedMarket.profit.mul(minerRewardPercentage).div(100);
            const tempTransaction = await this.bundleExecutorContract.populateTransaction.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, { gasPrice: ethers_1.BigNumber.from(100000000) });
            let estimateGas;
            try {
                estimateGas = await this.bundleExecutorContract.provider.estimateGas(tempTransaction);
                console.log("Estimated gas for bundle execution:", estimateGas.toString());
            }
            catch (error) {
                console.error("Failed to estimate gas for bundle execution:", error.message);
                continue;
            }
            const gasBuffer = ethers_1.BigNumber.from(50000);
            estimateGas = estimateGas.add(gasBuffer);
            const transaction = await this.bundleExecutorContract.populateTransaction.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, { gasPrice: ethers_1.BigNumber.from(100000000), gasLimit: estimateGas });
            const signedTransaction = await this.executorWallet.signTransaction(transaction);
            // Create a bundle entry
            const bundleEntry = await this.createBundleEntry(signedTransaction);
            const bundle = [bundleEntry];
            await this.pushBundleEntries(bundle, blockNumber);
        }
    }
    async adjustGasPriceForTransaction(currentGasPrice, avgGasPrice, competingBundleGasPrice) {
        // Find the maximum gas price among current, average, and competing bundle gas prices
        let adjustedGasPrice = currentGasPrice;
        if (avgGasPrice.gt(adjustedGasPrice)) {
            adjustedGasPrice = avgGasPrice;
        }
        if (competingBundleGasPrice.gt(adjustedGasPrice)) {
            adjustedGasPrice = competingBundleGasPrice;
        }
        // Add a certain percentage to the maximum gas price to ensure our bundle has priority
        const gasPriceIncreasePercentage = ethers_1.BigNumber.from(10); // 10% increase, you can adjust this value
        const additionalGasPrice = adjustedGasPrice.mul(gasPriceIncreasePercentage).div(100);
        adjustedGasPrice = adjustedGasPrice.add(additionalGasPrice);
        return adjustedGasPrice;
    }
    async submitBundleWithAdjustedGasPrice(bundle, blockNumber, blocksApi) {
        try {
            // Get current and average gas prices
            const { currentGasPrice, avgGasPrice } = await getGasPriceInfo(this.flashbotsProvider);
            // Monitor competing bundles gas prices
            const competingBundlesGasPrices = await monitorCompetingBundlesGasPrices(blocksApi);
            // Find the maximum gas price among competing bundles
            let competingBundleGasPrice = ethers_1.BigNumber.from(0);
            for (let i = 0; i < competingBundlesGasPrices.length; i++) {
                const currentPrice = ethers_1.BigNumber.from(competingBundlesGasPrices[i]);
                if (currentPrice.gt(competingBundleGasPrice)) {
                    competingBundleGasPrice = currentPrice;
                }
            }
            // Adjust gas price for the transaction
            const adjustedGasPrice = await this.adjustGasPriceForTransaction(currentGasPrice, avgGasPrice, competingBundleGasPrice);
            // Ensure higher effective gas price
            if (adjustedGasPrice.lte(currentGasPrice)) {
                console.error("Adjusted gas price is not higher than the current gas price");
                return;
            }
            // Check if the bundle gas is valid
            const isValidBundleGas = await checkBundleGas(adjustedGasPrice);
            if (!isValidBundleGas) {
                console.error("Bundle gas is not valid");
                return;
            }
            // Calculate the current Unix timestamp and add a buffer time (e.g., 60 seconds)
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const maxTimestamp = currentTimestamp + 60;
            // Submit the bundle with the adjusted gas price and maxTimestamp
            const targetBlockNumber = blockNumber + 1;
            const bundleSubmission = await this.flashbotsProvider.sendBundle(bundle, targetBlockNumber, {
                minTimestamp: currentTimestamp,
                maxTimestamp: maxTimestamp,
            });
            console.log("Bundle submitted:", bundleSubmission);
        }
        catch (error) {
            console.error("Failed to submit bundle:", error.message);
        }
    }
}
exports.Arbitrage = Arbitrage;
//# sourceMappingURL=Arbitrage.js.map
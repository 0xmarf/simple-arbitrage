"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriangularArbitrage = void 0;
const ethers_1 = require("ethers");
const Arbitrage_1 = require("./Arbitrage");
class TriangularArbitrage {
    static async evaluateMarkets(marketsByToken) {
        const potentialOpportunities = [];
        for (const [tokenA, marketsA] of Object.entries(marketsByToken)) {
            for (const [tokenB, marketsB] of Object.entries(marketsByToken)) {
                if (tokenA === tokenB)
                    continue;
                const marketAB = marketsA.find((market) => market.tokenAddress === tokenB);
                const marketBA = marketsB.find((market) => market.tokenAddress === tokenA);
                if (!marketAB || !marketBA)
                    continue;
                for (const [tokenC, marketsC] of Object.entries(marketsByToken)) {
                    if (tokenA === tokenC || tokenB === tokenC)
                        continue;
                    const marketAC = marketsA.find((market) => market.tokenAddress === tokenC);
                    const marketCA = marketsC.find((market) => market.tokenAddress === tokenA);
                    if (!marketAC || !marketCA)
                        continue;
                    // Calculate the potential profit for the triangular arbitrage
                    const profit = calculateTriangularArbitrageProfit(marketAB, marketBA, marketAC, marketCA);
                    // If the profit is greater than a predefined threshold, add the arbitrage opportunity
                    if (profit.gt(ethers_1.BigNumber.from("10000000000000000"))) {
                        const volume = await (0, Arbitrage_1.calculateOptimalVolume)(marketAB, marketBA, tokenA, profit.toNumber());
                        potentialOpportunities.push({
                            profit,
                            volume,
                            tokenAddress: tokenA,
                            marketPairs: [marketAB, marketBA],
                            buyFromMarket: marketAB,
                            sellToMarket: marketBA
                        });
                    }
                }
            }
        }
        return potentialOpportunities;
    }
}
exports.TriangularArbitrage = TriangularArbitrage;
function calculateTriangularArbitrageProfit(marketAB, marketBA, marketAC, marketCA) {
    // Calculate the conversion rate from A to B
    const rateAB = marketAB.reserve1.div(marketAB.reserve0);
    // Calculate the conversion rate from B to C
    const rateBC = marketBA.reserve0.div(marketBA.reserve1);
    // Calculate the conversion rate from C to A
    const rateCA = marketCA.reserve1.div(marketCA.reserve0);
    // Calculate the round-trip rate of return
    const rateReturn = rateAB.mul(rateBC).mul(rateCA);
    // If the round-trip rate of return is greater than 1, there's a profit to be made
    const profit = rateReturn.gt(ethers_1.BigNumber.from(1)) ? rateReturn.sub(1) : ethers_1.BigNumber.from(0);
    return profit;
}
//# sourceMappingURL=TriangularArbitrage.js.map
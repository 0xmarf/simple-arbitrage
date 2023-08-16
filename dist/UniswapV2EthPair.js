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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const ethers_1 = require("ethers");
const abi_1 = require("./abi");
const addresses_1 = require("./addresses");
const utils_1 = require("./utils");
require('dotenv').config();
const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;
const factoryAddress = addresses_1.UNISWAP_FACTORY_ADDRESS;
// batch count limit helpful for testing, loading entire set of uniswap markets takes a long time to load
const BATCH_COUNT_LIMIT = 100;
const UNISWAP_BATCH_SIZE = 2000;
const provider = new ethers_1.providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);
// Not necessary, slightly speeds up loading initialization when we know tokens are bad
// Estimate gas will ensure we aren't submitting bad bundles, but bad tokens waste time
const blacklistTokens = [
    '0xD75EA151a61d06868E31F8988D28DFE5E9df57B4'
];
class UniswapV2EthPair {
    static buyFromMarket(buyFromMarket, sellToMarket, tokenAddress, profit) {
        throw new Error("Method not implemented.");
    }
    static impactAndFeeFuncs(provider, FACTORY_ADDRESSES, impactAndFeeFuncs) {
        throw new Error("Method not implemented.");
    }
    static updateReservesFromResults(pairs, results) {
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const result = results[i];
            // Assuming result is an array of BigNumber representing reserves
            pair.setReservesViaOrderedBalances(result);
        }
    }
    async getTradingFee() {
        // Uniswap V2 has a fixed trading fee of 0.3% (30 basis points)
        const tradingFee = ethers_1.BigNumber.from(30).div(10000);
        return tradingFee;
    }
    constructor(marketAddress, tokens, protocol) {
        this.marketAddress = marketAddress;
        this._tokens = tokens; // Add this line
        this.protocol = protocol;
        this._tokenBalances = _.zipObject(tokens, [ethers_1.BigNumber.from(0), ethers_1.BigNumber.from(0)]);
    }
    async getPriceImpact(tokenAddress, tradeSize) {
        const reserve = await this.getReserves(tokenAddress);
        const impact = tradeSize.mul(ethers_1.BigNumber.from(10000)).div(reserve.add(tradeSize));
        return impact; // Returns price impact as a basis point value (1/100 of a percent)
    }
    async getReserves(tokenAddress) {
        const pairContract = new ethers_1.Contract(this.marketAddress, abi_1.UNISWAP_PAIR_ABI, provider);
        const [reserve0, reserve1] = await pairContract.getReserves();
        return tokenAddress === this._tokens[0] ? reserve0 : reserve1; // Change this line
    }
    receiveDirectly(tokenAddress) {
        return tokenAddress in this._tokenBalances;
    }
    async prepareReceive(tokenAddress, amountIn) {
        if (this._tokenBalances[tokenAddress] === undefined) {
            throw new Error(`Market does not operate on token ${tokenAddress}`);
        }
        if (!amountIn.gt(0)) {
            throw new Error(`Invalid amount: ${amountIn.toString()}`);
        }
        // No preparation necessary
        return [];
    }
    static async getUniswapMarkets(provider, factoryAddress) {
        // contract setup
        const uniswapFactory = new ethers_1.Contract(factoryAddress, abi_1.UNISWAP_FACTORY_ABI, provider);
        const uniswapQuery = new ethers_1.Contract(addresses_1.UNISWAP_LOOKUP_CONTRACT_ADDRESS, abi_1.UNISWAP_QUERY_ABI, provider);
        // get length of all pairs
        const allPairsLength = await uniswapFactory.allPairsLength();
        // for storing the final results
        const allMarketPairs = [];
        // iterate over all pairs in batches
        for (let i = 0; i < allPairsLength; i += UNISWAP_BATCH_SIZE) {
            const end = Math.min(i + UNISWAP_BATCH_SIZE, allPairsLength);
            // get pairs in batch
            const pairs = await uniswapQuery.getPairsByIndexRange(factoryAddress, i, end);
            console.log(`Fetched pairs in batch ${i} to ${end}:`, pairs);
            // process each pair
            for (let pair of pairs) {
                const token0 = pair[0];
                const token1 = pair[1];
                const pairAddress = pair[2];
                // ignore if either token is blacklisted
                if (blacklistTokens.includes(token0) || blacklistTokens.includes(token1)) {
                    continue;
                }
                // create market pair
                const marketPair = new UniswapV2EthPair(pairAddress, [token0, token1,], 'Uniswapv2');
                // add to list
                allMarketPairs.push(marketPair);
            }
        }
        return allMarketPairs;
    }
    static async getUniswapMarketsByToken(provider, factoryAddress, impactAndFeeFuncs) {
        try {
            const allPairs = await Promise.all(_.map(factoryAddress, factoryAddress => UniswapV2EthPair.getUniswapMarkets(provider, factoryAddress)));
            const allPairsFlat = _.flatten(allPairs);
            await UniswapV2EthPair.updateReserves(provider, allPairsFlat);
            const allPairsWithBalance = await Promise.all(allPairsFlat.map(pair => pair.getBalance(addresses_1.WETH_ADDRESS).then((balance) => balance.gt(utils_1.ETHER) ? pair : null)));
            const filteredPairs = allPairsWithBalance.filter(pair => pair !== null);
            const marketsByToken = _.groupBy(filteredPairs, pair => pair._tokens[0] === addresses_1.WETH_ADDRESS ? pair._tokens[1] : pair._tokens[0]); // Change this line
            console.log(`Grouped markets by token:`, marketsByToken);
            console.log(`Filtered pairs count:`, filteredPairs.length);
            return {
                marketsByToken,
                allMarketPairs: filteredPairs,
                getPriceImpact: async (tokenAddress, tradeSize) => {
                    // Find the specific pair and its reserve from allMarketPairs
                    const pair = filteredPairs.find(pair => pair._tokens.includes(tokenAddress)); // Change this line
                    if (!pair) {
                        throw new Error(`No pair found for token ${tokenAddress}`);
                    }
                    const reserve = await pair.getReserves(tokenAddress);
                    return impactAndFeeFuncs.getPriceImpact(tokenAddress, tradeSize, reserve);
                },
                getTradingFee: impactAndFeeFuncs.getTradingFee,
            };
        }
        catch (error) {
            console.error('Error details:', error.message, error.stack);
            console.error('An error occurred while getting Uniswap Markets By Token:', error);
            return {
                marketsByToken: {},
                allMarketPairs: [],
                getPriceImpact: async () => { throw new Error("Not implemented"); },
                getTradingFee: () => { throw new Error("Not implemented"); },
            };
        }
    }
    static async updateReserves(provider, pairsInArbitrage) {
        const uniswapQuery = new ethers_1.Contract(addresses_1.UNISWAP_LOOKUP_CONTRACT_ADDRESS, abi_1.UNISWAP_QUERY_ABI, provider);
        // Get all the addresses of the pairs that are currently in arbitrage
        const pairAddresses = pairsInArbitrage.map(marketPair => marketPair.marketAddress);
        // Log the number of pairs that are being updated
        console.log("Updating markets, count:", pairAddresses.length);
        // Query the reserves for all pairs currently in arbitrage
        console.log("Pairs in Arbitrage:", pairsInArbitrage);
        console.log("Pair Addresses:", pairAddresses);
        const reserves = (await uniswapQuery.functions.getReservesByPairs(pairAddresses))[0];
        // Update the reserve information for each pair
        for (let i = 0; i < pairsInArbitrage.length; i++) {
            const marketPair = pairsInArbitrage[i];
            const reserve = reserves[i];
            marketPair.setReservesViaOrderedBalances([reserve[0], reserve[1]]);
            console.log(`Updated reserves for pair ${marketPair.marketAddress}:`, reserve);
        }
    }
    async getBalance(tokenAddress) {
        const balance = this._tokenBalances[tokenAddress];
        if (balance === undefined)
            throw new Error("bad token");
        return balance;
    }
    setReservesViaOrderedBalances(balances) {
        this.setReservesViaMatchingArray(this._tokens, balances); // Change this line
    }
    setReservesViaMatchingArray(tokens, balances) {
        const tokenBalances = _.zipObject(tokens, balances);
        if (!_.isEqual(this._tokenBalances, tokenBalances)) {
            this._tokenBalances = tokenBalances;
        }
    }
    getTokensIn(tokenIn, tokenOut, amountOut) {
        const reserveIn = this._tokenBalances[tokenIn];
        const reserveOut = this._tokenBalances[tokenOut];
        return this.getAmountIn(reserveIn, reserveOut, amountOut);
    }
    getTokensOut(tokenIn, tokenOut, amountIn) {
        const reserveIn = this._tokenBalances[tokenIn];
        const reserveOut = this._tokenBalances[tokenOut];
        return this.getAmountOut(reserveIn, reserveOut, amountIn);
    }
    getAmountIn(reserveIn, reserveOut, amountOut) {
        const numerator = reserveIn.mul(amountOut).mul(1000);
        const denominator = reserveOut.sub(amountOut).mul(997);
        return numerator.div(denominator).add(1);
    }
    getAmountOut(reserveIn, reserveOut, amountIn) {
        const amountInWithFee = amountIn.mul(997);
        const numerator = amountInWithFee.mul(reserveOut);
        const denominator = reserveIn.mul(1000).add(amountInWithFee);
        return numerator.div(denominator);
    }
    async sellTokensToNextMarket(tokenIn, amountIn, ethMarket) {
        if (ethMarket.receiveDirectly(tokenIn) === true) {
            const exchangeCall = await this.sellTokens(tokenIn, amountIn, ethMarket.marketAddress);
            return {
                data: [exchangeCall],
                targets: [this.marketAddress]
            };
        }
        const exchangeCall = await this.sellTokens(tokenIn, amountIn, ethMarket.marketAddress);
        return {
            data: [exchangeCall],
            targets: [this.marketAddress]
        };
    }
    async sellTokens(tokenIn, amountIn, recipient) {
        let amount0Out = ethers_1.BigNumber.from(0);
        let amount1Out = ethers_1.BigNumber.from(0);
        let tokenOut;
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
        const populatedTransaction = await UniswapV2EthPair.uniswapInterface.populateTransaction.swap(amount0Out, amount1Out, recipient, []);
        if (populatedTransaction === undefined || populatedTransaction.data === undefined)
            throw new Error("HI");
        return populatedTransaction.data;
    }
}
_a = UniswapV2EthPair;
UniswapV2EthPair.uniswapInterface = new ethers_1.Contract(addresses_1.WETH_ADDRESS, abi_1.UNISWAP_PAIR_ABI);
UniswapV2EthPair.ImpactAndFeeFuncs = {
    getPriceImpact: async (tokenAddress, tradeSize, reserve) => {
        if (!reserve || reserve.isZero()) {
            throw new Error("Reserve is zero");
        }
        const impact = tradeSize.mul(ethers_1.BigNumber.from(10000)).div(reserve.add(tradeSize));
        return impact; // Returns price impact as a basis point value (1/100 of a percent)
    },
    getTradingFee: async (tokenAddress) => {
        // compute trading fee here
        const tradingFee = ethers_1.BigNumber.from(30).div(10000);
        return tradingFee; // don't convert BigNumber to number, keep it as BigNumber
    },
};
exports.default = UniswapV2EthPair;
//# sourceMappingURL=UniswapV2EthPair.js.map
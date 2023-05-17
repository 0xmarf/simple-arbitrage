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
exports.findArbitrageTrades = void 0;
function findArbitrageTrades() {
    return __awaiter(this, void 0, void 0, function* () {
        const numMarkets = 10;
        const maxIterations = 100;
        const startingStepSize = 1;
        const convergenceThreshold = 0.001;
        function feasibleTradeAmounts(x) {
            const multipliers = [0.25, 0.5, 0.75, 1];
            const minTradeAmount = 0.001;
            return x.map((trade) => multipliers.map((multiplier) => (Math.min(trade.maxSell, trade.maxBuy, trade.totalLiquidity) -
                minTradeAmount) *
                multiplier));
        }
        function utilityFunction(x, pairs) {
            return __awaiter(this, void 0, void 0, function* () {
                const reserves = yield flashQueryContract.methods
                    .getReservesByPairs(pairs)
                    .call();
                const pi = reserves.map((r, i) => r[1] / r[0]);
                const ci = 0.002;
                const Ui = x.reduce((acc, cur, i) => acc + (pi[i] - ci) * cur, 0);
                return Ui;
            });
        }
        function getLiquidityInfo(i, pairs) {
            return __awaiter(this, void 0, void 0, function* () {
                const pair = pairs[i];
                const token0 = yield pair.methods.token0().call();
                const token1 = yield pair.methods.token1().call();
                const reserves = yield pair.methods.getReserves().call();
                const totalLiquidity = yield pair.methods.totalSupply().call();
                const token0Price = reserves[1] / reserves[0];
                const token1Price = reserves[0] / reserves[1];
                const liquidityInfo = {
                    token0: {
                        address: token0,
                        balance: reserves[0],
                    },
                    token1: {
                        address: token1,
                        balance: reserves[1],
                    },
                    totalLiquidity,
                    token0Price,
                    token1Price,
                };
                return liquidityInfo;
            });
        }
        function updateNetTokenFlows(x, pairs) {
            return __awaiter(this, void 0, void 0, function* () {
                const b = yield Promise.all(x.map((trade, i) => __awaiter(this, void 0, void 0, function* () {
                    const liquidityInfo = yield getLiquidityInfo(i, pairs);
                    const buyAmount = trade.buy * liquidityInfo.token1Price;
                    const sellAmount = trade.sell * liquidityInfo.token0Price;
                    return [
                        buyAmount - sellAmount,
                        trade.buy - sellAmount / liquidityInfo.token1Price,
                        sellAmount - buyAmount / liquidityInfo.token0Price,
                        trade.sell - buyAmount / liquidityInfo.token1Price,
                    ];
                })));
                const bSum = b.reduce((acc, cur) => acc.map((val, i) => val + cur[i]), Array(4).fill(0));
                return bSum;
            });
        }
        const flashQueryContract = new web3.eth.Contract(abi, contractAddress);
        const solverOptions = {
            method: "SLSQP",
            options: {
                disp: false,
            },
        };
        let pairs = awaitflashQueryContract.methods
            .getPairsByIndexRange(uniswapFactoryAddress, 0, numMarkets - 1)
            .call();
        pairs = pairs.map((p) => new web3.eth.Contract(uniswapPairAbi, p[0]));
        const constraints = {
            type: "ineq",
            fun: feasibleTradeAmounts,
        };
        const A = Array(numMarkets)
            .fill(null)
            .map(() => Array(numMarkets * 4).fill(0));
        for (let i = 0; i < numMarkets; i++) {
            A[i][i * 4] = 1;
            A[i][i * 4 + 1] = -1;
            A[i][i * 4 + 2] = 1;
            A[i][i * 4 + 3] = -1;
        }
        const b = Array(numMarkets).fill(0);
        let lambda = np.zeros([numMarkets, A.length]);
        let x = pairs.map(() => ({
            buy: 0,
            sell: 0,
        }));
        let stepSize = startingStepSize;
        let error = Infinity;
        let numIterations = 0;
        let oldX = JSON.parse(JSON.stringify(x));
        while (error > convergenceThreshold && numIterations < maxIterations) {
            // Modified objective function to maximize total market value of coins out for profit
            const objective = (lambda) => {
                let sum = 0;
                for (let i = 0; i < numMarkets; i++) {
                    for (let j = 0; j < A.length; j++) {
                        sum +=
                            lambda[i][j] * (prices[i][j] * (x[i][1] - x[i][0] / prices[i][j]));
                    }
                }
                return -sum;
            };
            const result = minimize(objective, lambda, {
                constraints,
                options: {
                    maxiter: 1000,
                },
                method: "SLSQP",
                args: [],
                bounds: {
                    xmin: 0,
                    xmax: Infinity,
                },
                A,
                b,
            });
            for (let i = 0; i < pairs.length; i++) {
                const market = pairs[i].market;
                const buyAsset = pairs[i].buy;
                const sellAsset = pairs[i].sell;
                const index1 = assets.indexOf(buyAsset);
                const index2 = assets.indexOf(sellAsset);
                x[i].buy = result.x[index1][index2];
                x[i].sell = result.x[index2][index1];
            }
            const b = yield Promise.all(Array.from({ length: numMarkets }, (_, i) => updateNetTokenFlows(x[i], i)));
            const bSum = b.reduce((acc, cur) => acc.map((val, i) => val + cur[i]));
            const lambdaFunc = (lambda) => __awaiter(this, void 0, void 0, function* () {
                let sum = 0;
                for (let i = 0; i < numMarkets; i++) {
                    const liquidityInfo = yield getLiquidityInfo(i);
                    const pi = liquidityInfo.token1Price;
                    const ci = 0.002;
                    const Ui = (pi - ci) * (x[i][0] - x[i][1] / pi);
                    sum += lambda[i] * (bSum[i] - Ui);
                }
                return sum;
            });
            const lambdaResult = yield optimize(lambdaFunc, lambda, constraints, solverOptions);
            lambda = lambdaResult.x;
            const xFunc = (x) => __awaiter(this, void 0, void 0, function* () {
                let sum = 0;
                for (let i = 0; i < numMarkets; i++) {
                    const liquidityInfo = yield getLiquidityInfo(i);
                    const pi = liquidityInfo.token1Price;
                    const ci = 0.002;
                    const Li = liquidityInfo.totalLiquidity;
                    const Vi = Li * (pi - ci);
                    const Ai = (x[0] - x[1] / pi) * (x[2] - x[3] * pi);
                    const Ui = (pi - ci) * (x[0] - x[1] / pi);
                    sum += lambda[i] * (Vi + Ai - Ui);
                }
                return sum;
            });
            x = yield optimize(xFunc, x.flat(), constraints, solverOptions).reshape([
                numMarkets,
                4,
            ]);
            stepSize *= 0.5;
            const newError = (yield isProfitable(x))
                ? 0
                : np.abs((x - oldX) / oldX).max();
            error = newError < error ? newError : error;
            oldX = x.copy();
            numIterations++;
        }
        if (numIterations === maxIterations) {
            console.log("Maximum iterations reached.");
        }
        else {
            console.log("Convergence achieved.");
        }
        function execute(amount) {
            return __awaiter(this, void 0, void 0, function* () {
                if (amount <= 0) {
                    throw new Error("Invalid amount");
                }
                const blockNumber = yield web3.eth.getBlockNumber();
                const x = yield findArbitrageTrades();
                if (!x) {
                    console.log("No profitable trades found.");
                    return;
                }
                const deadline = (yield web3.eth.getBlock(blockNumber)).timestamp + 300; // 5 minutes from now
                const amountsIn = x.map((trade) => trade.sell);
                const amountsOut = x.map((trade) => trade.buy);
                const path = x.map((trade) => [trade.token0.address, trade.token1.address]);
                const pathFlat = path.flat();
                try {
                    const accounts = yield web3.eth.getAccounts();
                    const flashLoan = new web3.eth.Contract(abi, contractAddress);
                    const gasEstimate = yield flashLoan.methods
                        .executeFlashLoan(amountsIn, amountsOut, pathFlat, deadline)
                        .estimateGas({
                        from: accounts[0],
                    });
                    yield flashLoan.methods
                        .executeFlashLoan(amountsIn, amountsOut, pathFlat, deadline)
                        .send({
                        from: accounts[0],
                        gas: gasEstimate,
                    });
                    console.log("Arbitrage executed successfully.");
                }
                catch (error) {
                    console.log("Error executing arbitrage:", error);
                }
            });
        }
        if (yield isProfitable(x)) {
            console.log("Arbitrage opportunity found:", x);
            yield execute(minTradeAmount);
        }
        else {
            console.log("No arbitrage opportunity found.");
        }
    });
}
exports.findArbitrageTrades = findArbitrageTrades;
findArbitrageTrades();
//# sourceMappingURL=findArbitrageTrades.js.map
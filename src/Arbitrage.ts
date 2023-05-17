// Combined imports from both scripts
import * as _ from "lodash";
import { BigNumber, Contract, Wallet } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { WETH_ADDRESS } from "./addresses";
import { EthMarket } from "./EthMarket";
import { ETHER, bigNumberToDecimal } from "./utils";

export interface CrossedMarketDetails {
  profit: BigNumber,
  volume: BigNumber,
  tokenAddress: string,
  buyFromMarket: EthMarket,
  sellToMarket: EthMarket,
}

export type MarketsByToken = {
  [tokenAddress: string]: Array < EthMarket >
}

// Define the constant function market maker
let CFMM = {
  reserves: {
    x: BigNumber.from(0), // Reserve of token X
    y: BigNumber.from(0), // Reserve of token Y
  },
  tradingFunction: () => {
    // Invariant k = x * y
    return CFMM.reserves.x.mul(CFMM.reserves.y);
  },
  tradingFee: BigNumber.from("3000"), // Fee in basis points (0.3%)
};
  
  // Define acceptance condition for submitted trades
  let acceptTrade = (R: BigNumber, deltaPlus: number, deltaMinus: number) => {
    let tradingFunctionResult = CFMM.tradingFunction(R.sub(CFMM.tradingFee.mul(deltaMinus)).sub(deltaPlus));
    let tradingFunctionResult2 = CFMM.tradingFunction(R);
    if (tradingFunctionResult.gte(tradingFunctionResult2) && R.sub(CFMM.tradingFee.mul(deltaMinus)).sub(deltaPlus).gte(0)) {
      return true;
    }
    return false;
  }
  
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
        } else {
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

  function generateReferencePrices(marketsByToken: MarketsByToken): number[] {
    let referencePrices: number[] = [];
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
  
  function generateObjectiveFunction(marketsByToken: MarketsByToken): (price: number) => number {
    return (price: number) => {
      -price;
    };
  }
  
  function generatePenaltyVector(marketsByToken: MarketsByToken): number[] {
    let penaltyVector: number[] = [];
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
  

  async function findArbitrageTrades(arbitrageOpportunities: number, marketsByToken: MarketsByToken): Promise<Array<CrossedMarketDetails>> {
    let crossedMarkets: Array<CrossedMarketDetails> = [];
  
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
              profit: BigNumber.from(profit),
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
  }
  
  // Example function to calculate the optimal trade volume
  function calculateOptimalVolume(buyFromMarket, sellToMarket, tokenAddress, profit) {

    // Determine the available liquidity in both markets involved in the arbitrage
    const availableLiquidityBuy = buyFromMarket.getReserves(tokenAddress);
    const availableLiquiditySell = sellToMarket.getReserves(tokenAddress);
  
    // Set a maximum trade size limit to manage risk
    const maxTradeSize = BigNumber.from(1000); // Set your desired maximum trade size limit
  
    // Consider implementing a minimum profit threshold to ensure that the trade is worthwhile
    const minProfitThreshold = BigNumber.from(1); // Set your desired minimum profit threshold
  
    // Calculate the price impact of different trade volumes on both markets
    const priceImpactBuy = buyFromMarket.getPriceImpact(tokenAddress, maxTradeSize);
    const priceImpactSell = sellToMarket.getPriceImpact(tokenAddress, maxTradeSize);
  
    // Account for trading fees, which are typically charged as a percentage of the trade volume
    const tradingFeeBuy = buyFromMarket.getTradingFee(tokenAddress);
    const tradingFeeSell = sellToMarket.getTradingFee(tokenAddress);
  
    let optimalVolume = BigNumber.from(0);
    let maxExpectedProfit = BigNumber.from(0);
  
    // Calculate the expected profit for different trade volumes, taking into account price impact and trading fees
    for (let volume = 1; volume <= maxTradeSize.toNumber(); volume++) {
      const currentVolume = BigNumber.from(volume);
  
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
    optimalVolume = BigNumber.min(optimalVolume, availableLiquidityBuy, availableLiquiditySell);
  
    return optimalVolume;
  }
  
async function getGasPriceInfo(provider): Promise<{ currentGasPrice: BigNumber, avgGasPrice: BigNumber }> {
  const latestBlock = await provider.getBlock("latest");
  const blockNumber = latestBlock.number;

  const blockGasPrices = [];

  // Sample the gas prices of the last 10 blocks
  for (let i = 0; i < 10; i++) {
    const block = await provider.getBlock(blockNumber - i);
    blockGasPrices.push(block.gasPrice);
  }

  const currentGasPrice = blockGasPrices[0];
  const avgGasPrice = BigNumber.from(blockGasPrices.reduce((a, b) => a + b, 0)).div(blockGasPrices.length);

  return { currentGasPrice, avgGasPrice };
}

async function adjustGasPriceForTransaction(currentGasPrice: BigNumber, avgGasPrice: BigNumber, competingBundleGasPrice: BigNumber): Promise<BigNumber> {
  const gasPrice = BigNumber.maximum(currentGasPrice, avgGasPrice).mul(110).div(100);
  const adjustedGasPrice = BigNumber.maximum(gasPrice, competingBundleGasPrice.add(1));
  return adjustedGasPrice;
}

async function ensureHigherEffectiveGasPrice(transactionGasPrice: BigNumber, tailTransactionGasPrice: BigNumber): Promise<BigNumber> {
  const effectiveGasPrice = BigNumber.maximum(transactionGasPrice, tailTransactionGasPrice.add(1));
  return effectiveGasPrice;
}

async function checkBundleGas(bundleGas: BigNumber): Promise<boolean> {
  if (bundleGas.gte(42000)) {
    return true;
  } else {
    return false;
  }
}

async function monitorCompetingBundlesGasPrices(blocksApi): Promise<Array<BigNumber>> {
  const recentBlocks = await blocksApi.getRecentBlocks();
  const competingBundlesGasPrices = recentBlocks.map(block => block.bundleGasPrice);

  return competingBundlesGasPrices;
}

export class Arbitrage {
 
  private flashbotsProvider: FlashbotsBundleProvider;
    private bundleExecutorContract: Contract;
    private executorWallet: Wallet;
  
    constructor(executorWallet: Wallet, flashbotsProvider: FlashbotsBundleProvider, bundleExecutorContract: Contract) {
      this.executorWallet = executorWallet;
      this.flashbotsProvider = flashbotsProvider;
      this.bundleExecutorContract = bundleExecutorContract;
    }
  
    static printCrossedMarket(crossedMarket: CrossedMarketDetails): void {
      const buyTokens = crossedMarket.buyFromMarket.tokens;
      const sellTokens = crossedMarket.sellToMarket.tokens;
      console.log(
        `Profit: ${bigNumberToDecimal(crossedMarket.profit)} ` +
        `Volume: ${bigNumberToDecimal(crossedMarket.volume)}\n` +
        `${crossedMarket.buyFromMarket.protocol}(${crossedMarket.buyFromMarket.marketAddress})\n` +
        `${buyTokens[0]} => ${buyTokens[1]}\n` +
        `${crossedMarket.sellToMarket.protocol}(${crossedMarket.sellToMarket.marketAddress})\n` +
        `${sellTokens[0]} => ${sellTokens[1]}\n\n`
      );
    }
    
  
    async evaluateMarkets(marketsByToken: MarketsByToken): Promise<Array<CrossedMarketDetails>> {
      // Prepare the referencePrices, objectiveFunction, and penaltyVector based on the input data
      // You might need to create helper functions to generate these from the input data
      
      let referencePrices = generateReferencePrices(marketsByToken);
      let objectiveFunction = generateObjectiveFunction(marketsByToken);
      let penaltyVector = generatePenaltyVector(marketsByToken);
    
      // Run the swapMarketArbitrage algorithm with the prepared data
      let arbitrageOpportunities = swapMarketArbitrage(referencePrices, objectiveFunction, penaltyVector);
    
      // Process the results and return the crossed market details
      return findArbitrageTrades(arbitrageOpportunities, marketsByToken);
    }
    
  
    async takeCrossedMarkets(bestCrossedMarkets: CrossedMarketDetails[], blockNumber: number, minerRewardPercentage: number): Promise<void> {
      for (const bestCrossedMarket of bestCrossedMarkets) {
        console.log("Send this much WETH", bestCrossedMarket.volume.toString(), "get this much profit", bestCrossedMarket.profit.toString())
        const buyCalls = await bestCrossedMarket.buyFromMarket.sellTokensToNextMarket(WETH_ADDRESS, bestCrossedMarket.volume, bestCrossedMarket.sellToMarket);
        const inter = bestCrossedMarket.buyFromMarket.getTokensOut(WETH_ADDRESS, bestCrossedMarket.tokenAddress, bestCrossedMarket.volume)
        const sellCallData = await bestCrossedMarket.sellToMarket.sellTokens(bestCrossedMarket.tokenAddress, inter, this.bundleExecutorContract.address);
  
        const targets: Array<string> = [...buyCalls.targets, bestCrossedMarket.sellToMarket.marketAddress]
        const payloads: Array<string> = [...buyCalls.data, sellCallData]
        console.log({
          targets,
          payloads
        })
        let estimateGas: BigNumber;
        const minerReward = bestCrossedMarket.profit.mul(minerRewardPercentage).div(100);
        const transaction = await this.bundleExecutorContract.populateTransaction.uniswapWeth(bestCrossedMarket.volume, minerReward, targets, payloads, {
          gasPrice: BigNumber.from(0),
          gasLimit: estimateGas,
        });
  
        const gasBuffer = BigNumber.from(50000); // You can adjust this buffer value as needed
        try {
          estimateGas = await this.bundleExecutorContract.provider.estimateGas(transaction);
          console.log("Estimated gas for bundle execution:", estimateGas.toString());
        } catch (error) {
          console.error("Failed to estimate gas for bundle execution:", error.message);
          continue;
        }
        transaction.gasLimit = estimateGas.add(gasBuffer); 
      
        const signedTransaction = await this.executorWallet.signTransaction(transaction);
  
        try {
          const bundle = [{
            signedTransaction,
            signer: this.executorWallet.address,
          }];
  
          const gasPrice = await this.flashbotsProvider.getGasPrice();
          const blockHash = await this.flashbotsProvider.sendBundle(bundle, blockNumber, {
            minTimestamp: 0,
            maxTimestamp: 0,
            revertingTxHashes: [],
          });
          console.log("Sent bundle with hash", blockHash);
        } catch (error) {
          console.error("Failed to send bundle:", error.message);
        }
      }
    }

  async submitBundleWithAdjustedGasPrice(
    bundle: any[],
    blockNumber: number,
    blocksApi: any
  ): Promise<void> {
    try {
      // Get current and average gas prices
      const { currentGasPrice, avgGasPrice } = await getGasPriceInfo(this.flashbotsProvider);

      // Monitor competing bundles gas prices
      const competingBundlesGasPrices = await monitorCompetingBundlesGasPrices(blocksApi);

      // Find the maximum gas price among competing bundles
      const competingBundleGasPrice = BigNumber.from(Math.max(...competingBundlesGasPrices));

      // Adjust gas price for the transaction
      const adjustedGasPrice = await adjustGasPriceForTransaction(
        currentGasPrice,
        avgGasPrice,
        competingBundleGasPrice
      );

      // Ensure higher effective gas price
      const effectiveGasPrice = await ensureHigherEffectiveGasPrice(adjustedGasPrice, currentGasPrice);

      // Check if the bundle gas is valid
      const isValidBundleGas = await checkBundleGas(effectiveGasPrice);
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
        gasPrice: effectiveGasPrice, // Use the effective gas price
      });


      console.log("Bundle submitted:", bundleSubmission);
    } catch (error) {
      console.error("Failed to submit bundle:", error.message);
    }
  }
}

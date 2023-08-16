import * as _ from "lodash";
import { BigNumber, Contract, providers, utils } from "ethers";
import { UNISWAP_PAIR_ABI, UNISWAP_QUERY_ABI, UNISWAP_FACTORY_ABI } from "./abi";
import { UNISWAP_FACTORY_ADDRESS, UNISWAP_LOOKUP_CONTRACT_ADDRESS, WETH_ADDRESS } from "./addresses";
import { CallDetails, MultipleCallData, TokenBalances } from "./EthMarket";
import { ETHER } from "./utils";
import { MarketType } from './Arbitrage';
import { EthMarket, CrossedMarketDetails, MarketsByToken } from "./types";
require('dotenv').config();

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL;
const factoryAddress = UNISWAP_FACTORY_ADDRESS;


// batch count limit helpful for testing, loading entire set of uniswap markets takes a long time to load
const BATCH_COUNT_LIMIT = 100;
const UNISWAP_BATCH_SIZE = 2000;
const provider = new providers.StaticJsonRpcProvider(ETHEREUM_RPC_URL);

// Not necessary, slightly speeds up loading initialization when we know tokens are bad
// Estimate gas will ensure we aren't submitting bad bundles, but bad tokens waste time
const blacklistTokens = [
  '0xD75EA151a61d06868E31F8988D28DFE5E9df57B4'
]

export interface ImpactAndFeeFuncs {
  getPriceImpact: (tokenAddress: string, tradeSize: BigNumber, reserve: BigNumber) => Promise<BigNumber>;
  getTradingFee: (tokenAddress: string) => Promise<BigNumber>;
}

export interface GroupedMarkets {
  marketsByToken: MarketsByToken;
  allMarketPairs: Array<UniswapV2EthPair>;
  getPriceImpact(tokenAddress: string, tradeSize: BigNumber): Promise<BigNumber>;
  getTradingFee(tokenAddress: string): Promise<BigNumber>;
}

export default class UniswapV2EthPair implements EthMarket, MarketType {
  static filteredPairs: any;
  tokens: any;
  _tokens: string[]; // Add this line
  tokenAddress: string; // Add this line
  protocol: string;
  static buyFromMarket(buyFromMarket: any, sellToMarket: EthMarket, tokenAddress: string, profit: number) {
    throw new Error("Method not implemented.");
  }
  static impactAndFeeFuncs(provider: providers.StaticJsonRpcProvider, FACTORY_ADDRESSES: string[], impactAndFeeFuncs: any) {
    throw new Error("Method not implemented.");
  }
  static updateReservesFromResults(pairs: Array<UniswapV2EthPair>, results: Array<any>): void {
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const result = results[i];
      // Assuming result is an array of BigNumber representing reserves
      pair.setReservesViaOrderedBalances(result);
    }
  }
  reserve: BigNumber;
  async getTradingFee(): Promise<BigNumber> {
    // Uniswap V2 has a fixed trading fee of 0.3% (30 basis points)
    const tradingFee: BigNumber = BigNumber.from(30).div(10000);
    return tradingFee;
  }
  static uniswapInterface = new Contract(WETH_ADDRESS, UNISWAP_PAIR_ABI);
  private _tokenBalances: TokenBalances;

  constructor(marketAddress: string, tokens: Array<string>, protocol: string) {
    this.marketAddress = marketAddress;
    this._tokens = tokens; // Add this line
    this.protocol = protocol;
    this._tokenBalances = _.zipObject(tokens,[BigNumber.from(0), BigNumber.from(0)]);
  }
  marketAddress: string;
async getPriceImpact(tokenAddress: string, tradeSize: BigNumber): Promise<BigNumber> {
    const reserve = await this.getReserves(tokenAddress);
    const impact = tradeSize.mul(BigNumber.from(10000)).div(reserve.add(tradeSize));
    return impact; // Returns price impact as a basis point value (1/100 of a percent)
}
async getReserves(tokenAddress: string): Promise<BigNumber> {
    const pairContract = new Contract(this.marketAddress, UNISWAP_PAIR_ABI, provider);
    const [reserve0, reserve1] = await pairContract.getReserves();
    return tokenAddress === this._tokens[0] ? reserve0 : reserve1; // Change this line
}

  receiveDirectly(tokenAddress: string): boolean {
    return tokenAddress in this._tokenBalances;
  }

  async prepareReceive(tokenAddress: string, amountIn: BigNumber): Promise<Array<CallDetails>> {
    if (this._tokenBalances[tokenAddress] === undefined) {
      throw new Error(`Market does not operate on token ${tokenAddress}`)
    }
    if (! amountIn.gt(0)) {
      throw new Error(`Invalid amount: ${amountIn.toString()}`)
    }
    // No preparation necessary
    return []
  }

  static ImpactAndFeeFuncs: ImpactAndFeeFuncs = {
    getPriceImpact: async (tokenAddress: string, tradeSize: BigNumber, reserve: BigNumber) => {
      if (!reserve || reserve.isZero()) {
        throw new Error("Reserve is zero");
      }
      const impact = tradeSize.mul(BigNumber.from(10000)).div(reserve.add(tradeSize));
      return impact; // Returns price impact as a basis point value (1/100 of a percent)
    },
    getTradingFee: async (tokenAddress: string): Promise<BigNumber> => {
      // compute trading fee here
      const tradingFee: BigNumber = BigNumber.from(30).div(10000);
      return tradingFee; // don't convert BigNumber to number, keep it as BigNumber
    },
  };
static async getUniswapMarkets(provider: providers.JsonRpcProvider, factoryAddress: string) {
    // contract setup
    const uniswapFactory = new Contract(factoryAddress, UNISWAP_FACTORY_ABI, provider);
    const uniswapQuery = new Contract(UNISWAP_LOOKUP_CONTRACT_ADDRESS, UNISWAP_QUERY_ABI, provider);

    // get length of all pairs
    const allPairsLength = await uniswapFactory.allPairsLength();

    // for storing the final results
    const allMarketPairs: Array<UniswapV2EthPair> = [];

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
 static async getUniswapMarketsByToken(provider: providers.JsonRpcProvider, factoryAddress: Array<string>, impactAndFeeFuncs: ImpactAndFeeFuncs): Promise<GroupedMarkets> {
    try {
        const allPairs = await Promise.all(
            _.map(factoryAddress, factoryAddress => 
                UniswapV2EthPair.getUniswapMarkets(provider, factoryAddress))
        )

        const allPairsFlat: UniswapV2EthPair[] = _.flatten(allPairs);

        await UniswapV2EthPair.updateReserves(provider, allPairsFlat);

        const allPairsWithBalance: (UniswapV2EthPair | null)[] = await Promise.all(
            allPairsFlat.map(pair => pair.getBalance(WETH_ADDRESS).then((balance: BigNumber) => balance.gt(ETHER) ? pair : null))
        );

        const filteredPairs: UniswapV2EthPair[] = allPairsWithBalance.filter(pair => pair !== null) as UniswapV2EthPair[];


        const marketsByToken: MarketsByToken = _.groupBy(filteredPairs, pair => pair._tokens[0] === WETH_ADDRESS ? pair._tokens[1] : pair._tokens[0]) as unknown as MarketsByToken; // Change this line
        console.log(`Grouped markets by token:`, marketsByToken);
        console.log(`Filtered pairs count:`, filteredPairs.length);
    
        return {
            marketsByToken,
            allMarketPairs: filteredPairs,
            getPriceImpact: async (tokenAddress: string, tradeSize: BigNumber) => {
                // Find the specific pair and its reserve from allMarketPairs
                const pair = filteredPairs.find(pair => pair._tokens.includes(tokenAddress)); // Change this line
                if (!pair) {
                    throw new Error(`No pair found for token ${tokenAddress}`);
                }
                const reserve = await pair.getReserves(tokenAddress);
                return impactAndFeeFuncs.getPriceImpact(tokenAddress, tradeSize, reserve);
            },
            getTradingFee: impactAndFeeFuncs.getTradingFee,
        }
    } catch (error) {
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

static async updateReserves(provider: providers.JsonRpcProvider, pairsInArbitrage: Array<UniswapV2EthPair>): Promise<void> {
  const uniswapQuery = new Contract(UNISWAP_LOOKUP_CONTRACT_ADDRESS, UNISWAP_QUERY_ABI, provider);

  // Get all the addresses of the pairs that are currently in arbitrage
  const pairAddresses = pairsInArbitrage.map(marketPair => marketPair.marketAddress);

  // Log the number of pairs that are being updated
  console.log("Updating markets, count:", pairAddresses.length)

  // Query the reserves for all pairs currently in arbitrage
  console.log("Pairs in Arbitrage:", pairsInArbitrage);
  console.log("Pair Addresses:", pairAddresses);
  const reserves: Array<Array<BigNumber>> = (await uniswapQuery.functions.getReservesByPairs(pairAddresses))[0];

  // Update the reserve information for each pair
  for (let i = 0; i < pairsInArbitrage.length; i++) {
    const marketPair = pairsInArbitrage[i];
    const reserve = reserves[i];
    marketPair.setReservesViaOrderedBalances([reserve[0], reserve[1]])
    console.log(`Updated reserves for pair ${marketPair.marketAddress}:`, reserve);
  }
}


  async getBalance(tokenAddress: string): Promise<BigNumber> {
    const balance = this._tokenBalances[tokenAddress]
    if (balance === undefined) throw new Error("bad token")
    return balance;
  }
 setReservesViaOrderedBalances(balances: Array<BigNumber>): void {
    this.setReservesViaMatchingArray(this._tokens, balances) // Change this line
  }

  setReservesViaMatchingArray(tokens: Array<string>, balances: Array<BigNumber>): void {
    const tokenBalances = _.zipObject(tokens, balances)
    if (!_.isEqual(this._tokenBalances, tokenBalances)) {
      this._tokenBalances = tokenBalances
    }
  }

  getTokensIn(tokenIn: string, tokenOut: string, amountOut: BigNumber): BigNumber {
    const reserveIn = this._tokenBalances[tokenIn]
    const reserveOut = this._tokenBalances[tokenOut]
    return this.getAmountIn(reserveIn, reserveOut, amountOut);
  }

  getTokensOut(tokenIn: string, tokenOut: string, amountIn: BigNumber): BigNumber {
    const reserveIn = this._tokenBalances[tokenIn]
    const reserveOut = this._tokenBalances[tokenOut]
    return this.getAmountOut(reserveIn, reserveOut, amountIn);
  }

  getAmountIn(reserveIn: BigNumber, reserveOut: BigNumber, amountOut: BigNumber): BigNumber {
    const numerator: BigNumber = reserveIn.mul(amountOut).mul(1000);
    const denominator: BigNumber = reserveOut.sub(amountOut).mul(997);
    return numerator.div(denominator).add(1);
  }

  getAmountOut(reserveIn: BigNumber, reserveOut: BigNumber, amountIn: BigNumber): BigNumber {
    const amountInWithFee: BigNumber = amountIn.mul(997);
    const numerator = amountInWithFee.mul(reserveOut);
    const denominator = reserveIn.mul(1000).add(amountInWithFee);
    return numerator.div(denominator);
  }
async sellTokensToNextMarket(tokenIn: string, amountIn: BigNumber, ethMarket: EthMarket): Promise<MultipleCallData> {
    if (ethMarket.receiveDirectly(tokenIn) === true) {
      const exchangeCall = await this.sellTokens(tokenIn, amountIn, ethMarket.marketAddress)
      return {
        data: [exchangeCall],
        targets: [this.marketAddress]
      }
    }

    const exchangeCall = await this.sellTokens(tokenIn, amountIn, ethMarket.marketAddress)
    return {
      data: [exchangeCall],
      targets: [this.marketAddress]
    }
  }

  async sellTokens(tokenIn: string, amountIn: BigNumber, recipient: string): Promise<string> {
    let amount0Out = BigNumber.from(0)
    let amount1Out = BigNumber.from(0)
    let tokenOut: string;
    if (tokenIn === this._tokens[0]) { // Change this line
      tokenOut = this._tokens[1] // Change this line
      amount1Out = this.getTokensOut(tokenIn, tokenOut, amountIn)
    } else if (tokenIn === this._tokens[1]) { // Change this line
      tokenOut = this._tokens[0] // Change this line
      amount0Out = this.getTokensOut(tokenIn, tokenOut, amountIn)
    } else {
      throw new Error("Bad token input address")
    }
    const populatedTransaction = await UniswapV2EthPair.uniswapInterface.populateTransaction.swap(amount0Out, amount1Out, recipient, []);
    if (populatedTransaction === undefined || populatedTransaction.data === undefined) throw new Error("HI")
    return populatedTransaction.data;
  }
}



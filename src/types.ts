// types.ts

import { BigNumber } from "ethers";

export interface CrossedMarketDetails {
  marketPairs: any;
  profit: BigNumber,
  volume: BigNumber,
  tokenAddress: string,

  buyFromMarket: EthMarket,
  sellToMarket: EthMarket,
}

export type MarketsByToken = {
  [tokenAddress: string]: Array < EthMarket >
}

export interface MarketType {
  marketAddress: string;
  getReserves(tokenAddress: string): Promise<BigNumber>;
  getPriceImpact(tokenAddress: string, tradeSize: BigNumber): Promise<BigNumber>;
  getTradingFee(tokenAddress: string): Promise<BigNumber>; // Modified to accept tokenAddress as an argument
}

export interface EthMarket extends MarketType {
    [x: string]: any;
    tokenAddress: string;
    tokens: any;
    protocol: any;
    getBalance(arg0: any): unknown;
    sellTokensToNextMarket(WETH_ADDRESS: string, volume: BigNumber, sellToMarket: EthMarket): unknown;
    getTokensOut(WETH_ADDRESS: string, tokenAddress: string, volume: BigNumber): unknown;
    sellTokens(tokenAddress: string, inter: any, address: string): unknown;
    getReserves(tokenAddress: string): Promise<BigNumber>;
    getPriceImpact(tokenAddress: string, tradeSize: BigNumber): Promise<BigNumber>;
    getTradingFee(tokenAddress: string): Promise<BigNumber>; // Added tokenAddress as an argument
  }
  
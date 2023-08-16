<<<<<<< HEAD
require('dotenv').config();
import { Contract, ethers , Wallet } from "ethers";
import { BundleEntry } from './Arbitrage';
import { BUNDLE_EXECUTOR_ABI } from './abi';
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { Arbitrage } from "./Arbitrage"; 
import * as dotenv from "dotenv";
import UniswapV2EthPair  from "./UniswapV2EthPair";
import { FACTORY_ADDRESSES } from "./addresses";
dotenv.config();



async function main() {
  const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi');

  const walletPrivateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(walletPrivateKey, provider);

  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, Wallet.createRandom());
  
  const bundleExecutorContractAddress = '0xd664837a41986dcf1aba5d36bf9d1d1aaa88b4f1';
  const bundleExecutorContract = new Contract(bundleExecutorContractAddress, BUNDLE_EXECUTOR_ABI, wallet);

  const arbitrage = new Arbitrage(wallet, flashbotsProvider, bundleExecutorContract);

  const markets = await UniswapV2EthPair.getUniswapMarketsByToken(provider, FACTORY_ADDRESSES, UniswapV2EthPair.ImpactAndFeeFuncs);
  const marketsByToken = this.markets.marketsByToken;

  // Example of evaluating markets
  const crossedMarkets = await arbitrage.evaluateMarkets(marketsByToken);
  for (let crossedMarket of crossedMarkets) {
    Arbitrage.printCrossedMarket(crossedMarket);
  }

  // Example of taking crossed markets
  const blockNumber = await provider.getBlockNumber();
  const minerRewardPercentage = 95;  // or any value you choose
  await arbitrage.takeCrossedMarkets(crossedMarkets, blockNumber, minerRewardPercentage);

  // Simulate the created bundles
  await arbitrage.simulateBundles(blockNumber, flashbotsProvider);

  // Submit the bundles
  await arbitrage.submitBundles(blockNumber, flashbotsProvider);
}

main().catch((error) => {
  console.error('An error occurred:', error);
});
=======
import axios from 'axios';
import { Arbitrage } from './Arbitrage';
import { Wallet, ethers, Contract } from 'ethers';
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';
import { UniswapMarket, SushiswapMarket } from './markets';


// Define the required parameters
const privateKey = 'PRIVATE_KEY';
const providerUrl = 'https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi';
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const executorWallet = new Wallet(privateKey, provider);

// Define an async function to initialize flashbotsProvider and other async operations
async function initialize() {
  // Define or import the flashbotsProvider (you need to provide the actual values for the provider and authSigner)
  const authSigner = new Wallet(privateKey);
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, {
    authSigner,
    flashbotsAuthEndpoint: 'https://relay.flashbots.net',
  });

  // Define or import the bundleExecutorContract (you need to provide the actual values for the contract address and ABI)
  const bundleExecutorContractAddress = '0x9451548B807e334247708f2F0d666486ead93487';
  const bundleExecutorContractABI = '[{"inputs":[{"internalType":"address","name":"_executor","type":"address"}],"stateMutability":"payable","type":"constructor"},{"inputs":[{"internalType":"address payable","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"call","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_wethAmountToFirstMarket","type":"uint256"},{"internalType":"uint256","name":"_ethAmountToCoinbase","type":"uint256"},{"internalType":"address[]","name":"_targets","type":"address[]"},{"internalType":"bytes[]","name":"_payloads","type":"bytes[]"}],"name":"uniswapWeth","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}]';

  const bundleExecutorContract = new Contract(bundleExecutorContractAddress, bundleExecutorContractABI, executorWallet);

  // Instantiate the Arbitrage class with the required parameters
  const arbitrage = new Arbitrage(executorWallet, flashbotsProvider, bundleExecutorContract);

  // Create instances of the EthMarket class (or its subclasses) for each market
  const uniswapEthDaiMarket = new UniswapMarket('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', ['ETH', 'DAI'], 'Uniswap');
  const sushiswapEthUsdcMarket = new SushiswapMarket('0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac', ['ETH', 'USDC'], 'Sushiswap');
  const uniswapDaiUsdcMarket = new UniswapMarket('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', ['DAI', 'USDC'], 'Uniswap');
  
  // Define the marketsByToken data
  const marketsByToken = {
  'ETH': [uniswapEthDaiMarket, sushiswapEthUsdcMarket],
  'DAI': [uniswapEthDaiMarket, uniswapDaiUsdcMarket],
  'USDC': [sushiswapEthUsdcMarket, uniswapDaiUsdcMarket],
  };

  // Define the simulateTransaction function
}
const simulateTransaction = async () => {
  try {
  // Find arbitrage opportunities
  const crossedMarkets = await arbitrage.evaluateMarkets(marketsByToken);
// Iterate through the arbitrage opportunities
for (const crossedMarket of crossedMarkets) {
    // Get the current block number
    const blockNumber = await provider.getBlockNumber();
    // Define minerRewardPercentage (replace with actual value)
    const minerRewardPercentage = 0.05;

    // Generate the transaction data for each opportunity
    const transactionData = await arbitrage.takeCrossedMarkets([crossedMarket], blockNumber, minerRewardPercentage);

    // Define TENDERLY_USER and TENDERLY_PROJECT (replace with actual values)
    const TENDERLY_USER = '0xmitch';
    const TENDERLY_PROJECT = 'mevbot';

    // Simulate the transaction using the Tenderly Simulation API
    const response = await axios.post(
        `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
        transactionData,
        {
            headers: {
                'X-Access-Key': 'B4V7IdHRs3xf9mLIW5pjd',
            },
        }
    );

    // Analyze the simulation results
    console.log(response.data);
}
} catch (error) {
    console.error(error);
}


// Call the simulateTransaction function
await simulateTransaction();
}

// Call the initialize function
initialize();
>>>>>>> 4aa599175b4e823f381cb0498c1a10c7c5442af5

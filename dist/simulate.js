<<<<<<< HEAD
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const ethers_1 = require("ethers");
const abi_1 = require("./abi");
const ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
const Arbitrage_1 = require("./Arbitrage");
const dotenv = __importStar(require("dotenv"));
const UniswapV2EthPair_1 = __importDefault(require("./UniswapV2EthPair"));
const addresses_1 = require("./addresses");
dotenv.config();
async function main() {
    const provider = new ethers_1.ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi');
    const walletPrivateKey = process.env.PRIVATE_KEY;
    const wallet = new ethers_1.ethers.Wallet(walletPrivateKey, provider);
    const flashbotsProvider = await ethers_provider_bundle_1.FlashbotsBundleProvider.create(provider, ethers_1.Wallet.createRandom());
    const bundleExecutorContractAddress = '0xd664837a41986dcf1aba5d36bf9d1d1aaa88b4f1';
    const bundleExecutorContract = new ethers_1.Contract(bundleExecutorContractAddress, abi_1.BUNDLE_EXECUTOR_ABI, wallet);
    const arbitrage = new Arbitrage_1.Arbitrage(wallet, flashbotsProvider, bundleExecutorContract);
    const markets = await UniswapV2EthPair_1.default.getUniswapMarketsByToken(provider, addresses_1.FACTORY_ADDRESSES, UniswapV2EthPair_1.default.ImpactAndFeeFuncs);
    const marketsByToken = this.markets.marketsByToken;
    // Example of evaluating markets
    const crossedMarkets = await arbitrage.evaluateMarkets(marketsByToken);
    for (let crossedMarket of crossedMarkets) {
        Arbitrage_1.Arbitrage.printCrossedMarket(crossedMarket);
    }
    // Example of taking crossed markets
    const blockNumber = await provider.getBlockNumber();
    const minerRewardPercentage = 95; // or any value you choose
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const Arbitrage_1 = require("./Arbitrage");
const ethers_1 = require("ethers");
const ethers_provider_bundle_1 = require("@flashbots/ethers-provider-bundle");
const markets_1 = require("./markets");
// Define the required parameters
const privateKey = 'PRIVATE_KEY';
const providerUrl = 'https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi';
const provider = new ethers_1.ethers.providers.JsonRpcProvider(providerUrl);
const executorWallet = new ethers_1.Wallet(privateKey, provider);
// Define an async function to initialize flashbotsProvider and other async operations
function initialize() {
    return __awaiter(this, void 0, void 0, function* () {
        // Define or import the flashbotsProvider (you need to provide the actual values for the provider and authSigner)
        const authSigner = new ethers_1.Wallet(privateKey);
        const flashbotsProvider = yield ethers_provider_bundle_1.FlashbotsBundleProvider.create(provider, {
            authSigner,
            flashbotsAuthEndpoint: 'https://relay.flashbots.net',
        });
        // Define or import the bundleExecutorContract (you need to provide the actual values for the contract address and ABI)
        const bundleExecutorContractAddress = '0x9451548B807e334247708f2F0d666486ead93487';
        const bundleExecutorContractABI = '[{"inputs":[{"internalType":"address","name":"_executor","type":"address"}],"stateMutability":"payable","type":"constructor"},{"inputs":[{"internalType":"address payable","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"call","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_wethAmountToFirstMarket","type":"uint256"},{"internalType":"uint256","name":"_ethAmountToCoinbase","type":"uint256"},{"internalType":"address[]","name":"_targets","type":"address[]"},{"internalType":"bytes[]","name":"_payloads","type":"bytes[]"}],"name":"uniswapWeth","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}]';
        const bundleExecutorContract = new ethers_1.Contract(bundleExecutorContractAddress, bundleExecutorContractABI, executorWallet);
        // Instantiate the Arbitrage class with the required parameters
        const arbitrage = new Arbitrage_1.Arbitrage(executorWallet, flashbotsProvider, bundleExecutorContract);
        // Create instances of the EthMarket class (or its subclasses) for each market
        const uniswapEthDaiMarket = new markets_1.UniswapMarket('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', ['ETH', 'DAI'], 'Uniswap');
        const sushiswapEthUsdcMarket = new markets_1.SushiswapMarket('0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac', ['ETH', 'USDC'], 'Sushiswap');
        const uniswapDaiUsdcMarket = new markets_1.UniswapMarket('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', ['DAI', 'USDC'], 'Uniswap');
        // Define the marketsByToken data
        const marketsByToken = {
            'ETH': [uniswapEthDaiMarket, sushiswapEthUsdcMarket],
            'DAI': [uniswapEthDaiMarket, uniswapDaiUsdcMarket],
            'USDC': [sushiswapEthUsdcMarket, uniswapDaiUsdcMarket],
        };
        // Define the simulateTransaction function
    });
}
const simulateTransaction = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find arbitrage opportunities
        const crossedMarkets = yield arbitrage.evaluateMarkets(marketsByToken);
        // Iterate through the arbitrage opportunities
        for (const crossedMarket of crossedMarkets) {
            // Get the current block number
            const blockNumber = yield provider.getBlockNumber();
            // Define minerRewardPercentage (replace with actual value)
            const minerRewardPercentage = 0.05;
            // Generate the transaction data for each opportunity
            const transactionData = yield arbitrage.takeCrossedMarkets([crossedMarket], blockNumber, minerRewardPercentage);
            // Define TENDERLY_USER and TENDERLY_PROJECT (replace with actual values)
            const TENDERLY_USER = '0xmitch';
            const TENDERLY_PROJECT = 'mevbot';
            // Simulate the transaction using the Tenderly Simulation API
            const response = yield axios_1.default.post(`https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`, transactionData, {
                headers: {
                    'X-Access-Key': 'B4V7IdHRs3xf9mLIW5pjd',
                },
            });
            // Analyze the simulation results
            console.log(response.data);
        }
    }
    catch (error) {
        console.error(error);
    }
    // Call the simulateTransaction function
    yield simulateTransaction();
});
// Call the initialize function
initialize();
>>>>>>> 4aa599175b4e823f381cb0498c1a10c7c5442af5
//# sourceMappingURL=simulate.js.map
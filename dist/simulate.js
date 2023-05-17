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
//# sourceMappingURL=simulate.js.map
import type { BundleEntry } from './Arbitrage';


import { BigNumber, Contract, Wallet, providers, ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider('https://eth-goerli.g.alchemy.com/v2/_y6M3LK_0yoML_5Zb81tRm646r-9mMb7');

const axios = require('axios'); 

class MyContractClass {
  executorWallet: { address: string };
  bundleExecutorContract: { address: string };

  constructor() {
    this.executorWallet = {address: "executorWalletAddressHere"};
    this.bundleExecutorContract = {address: "bundleExecutorContractAddressHere"};
  }

  async simulateBundle(bundle: BundleEntry[], blockNumber: number): Promise<void> {
    try {
      // Prepare the data for the simulation API
      const transactions = bundle.map(entry => {
        return {
          from: entry.from, // assuming BundleEntry has 'from' field
          to: entry.to, // assuming BundleEntry has 'to' field
          gas: entry.gas || 0, // assuming BundleEntry has 'gas' field
          gas_price: entry.gas_price || '0', // assuming BundleEntry has 'gas_price' field
          value: entry.value || 0, // assuming BundleEntry has 'value' field
          input: entry.input || '', // assuming BundleEntry has 'input' field
        };
      });
  
      const simulationData = {
        network_id: 5, // 1 for Ethereum Mainnet
        transactions: transactions, // an array of transactions to be simulated
        blockNumber: blockNumber, // the block number for the simulation
      };
  
      // Make a POST request to the Tenderly Simulation API
      const simulation = await axios.post(
        `https://api.tenderly.co/api/v1/account/0xmitch2/project/mevbot/simulate`,
        simulationData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Access-Key': 'B4V7IdHRs3xf9mLIW5pjd',
          },
        }
      );
  
      if (simulation.status !== 200 || !simulation.data) {
        throw new Error('Simulation failed');
      }
  
      // Handle the simulation result
      console.log('Simulation result:', simulation.data);
  
    } catch (error: any) {
      console.error('Failed to simulate the bundle:', error.message || error);
    }
  }
  
}
async function main() {
  // Assuming BundleEntry is an array of entries
  let bundleEntries: BundleEntry[] = []; // replace with actual entries
  const latestBlock = await provider.getBlock("latest");
  const blockNumber = latestBlock.number;

  let myContract = new MyContractClass();
  await myContract.simulateBundle(bundleEntries, blockNumber);
}

// Call the main function
main().catch((error) => {
  console.error('An error occurred:', error);
});

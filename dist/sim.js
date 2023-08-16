"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const provider = new ethers_1.ethers.providers.JsonRpcProvider('https://eth-goerli.g.alchemy.com/v2/_y6M3LK_0yoML_5Zb81tRm646r-9mMb7');
const axios = require('axios');
class MyContractClass {
    constructor() {
        this.executorWallet = { address: "executorWalletAddressHere" };
        this.bundleExecutorContract = { address: "bundleExecutorContractAddressHere" };
    }
    async simulateBundle(bundle, blockNumber) {
        try {
            // Prepare the data for the simulation API
            const transactions = bundle.map(entry => {
                return {
                    from: entry.from,
                    to: entry.to,
                    gas: entry.gas || 0,
                    gas_price: entry.gas_price || '0',
                    value: entry.value || 0,
                    input: entry.input || '', // assuming BundleEntry has 'input' field
                };
            });
            const simulationData = {
                network_id: 5,
                transactions: transactions,
                blockNumber: blockNumber, // the block number for the simulation
            };
            // Make a POST request to the Tenderly Simulation API
            const simulation = await axios.post(`https://api.tenderly.co/api/v1/account/0xmitch2/project/mevbot/simulate`, simulationData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Key': 'B4V7IdHRs3xf9mLIW5pjd',
                },
            });
            if (simulation.status !== 200 || !simulation.data) {
                throw new Error('Simulation failed');
            }
            // Handle the simulation result
            console.log('Simulation result:', simulation.data);
        }
        catch (error) {
            console.error('Failed to simulate the bundle:', error.message || error);
        }
    }
}
async function main() {
    // Assuming BundleEntry is an array of entries
    let bundleEntries = []; // replace with actual entries
    const latestBlock = await provider.getBlock("latest");
    const blockNumber = latestBlock.number;
    let myContract = new MyContractClass();
    await myContract.simulateBundle(bundleEntries, blockNumber);
}
// Call the main function
main().catch((error) => {
    console.error('An error occurred:', error);
});
//# sourceMappingURL=sim.js.map
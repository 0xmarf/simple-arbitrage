const ethers = require('ethers');

async function main() {
    // Replace this URL with your own Alchemy API URL
    const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/jpWIUdqC9uBZm_8nb1t0hgYf9jCbh3Wi');

    try {
        const blockNumber = await provider.getBlockNumber();
        console.log("Latest block number is: ", blockNumber);
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();

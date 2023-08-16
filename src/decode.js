const ethers = require('ethers');

// This ABI should be of the contract to which the transaction was sent. 
// For simplicity, I am assuming the getPairsByIndexRange method. 
const contractABI = [
    "function getPairsByIndexRange(address _uniswapFactory, uint256 _start, uint256 _stop) external view returns (address[3][] memory)"
];

const iface = new ethers.utils.Interface(contractABI);

// You can replace the data below with the data from the transaction
const data = '0xab2217e40000000000000000000000005c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f000000000000000000000000000000000000000000000000000000000000c418000000000000000000000000000000000000000000000000000000000000c47c';

const decodedData = iface.parseTransaction({ data });

console.log(decodedData);

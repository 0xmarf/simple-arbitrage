import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.6.12"
      },
      {
        version: "0.8.20"
      },
      {
        version: "0.8.3"
      }
    ]
  }
};

export default config;
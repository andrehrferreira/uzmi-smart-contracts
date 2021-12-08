import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ganache";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";

dotenv.config();

const {
    MAINNET_API_URL,
    MAINNET_PRIVATE_KEY,
    LOCAL_API_URL,
    LOCAL_MNEMONIC,
    UZMI_API_URL,
    UZMI_MNEMONIC,
    ETHERSCAN_API_KEY,
} = process.env;

const config: HardhatUserConfig = {
    defaultNetwork: "local",
    solidity: {
        version: "0.8.9",
        settings: {
            metadata: {
                bytecodeHash: "none",
            },
            optimizer: {
                enabled: true,
                runs: 1000,
            },
        },
    },
    networks: {
        /* mainnet: {
			url: MAINNET_API_URL,
			accounts: [MAINNET_PRIVATE_KEY]
		}, */
        local: {
            url: LOCAL_API_URL,
            chainId: 1337,
            accounts: { mnemonic: LOCAL_MNEMONIC },
            gas: 2100000,
            gasPrice: 8000000000,
        },
        uzminet: {
            url: UZMI_API_URL,
            chainId: 5315,
            accounts: { mnemonic: UZMI_MNEMONIC },
            gas: 2100000,
            gasPrice: 8000000000,
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    typechain: {
        outDir: "typechain",
        target: "ethers-v5",
    },
};

export default config;

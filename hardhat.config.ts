import dotenv from "dotenv";
import { task, HardhatUserConfig } from "hardhat/config";
import { HardhatNetworkAccountUserConfig } from "hardhat/types/config";

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ganache";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "@symblox/hardhat-abi-gen";

dotenv.config();

task("accounts", "Prints the list of accounts", async (_, { ethers }) => {
    const accounts = await ethers.getSigners();
  
    for (const account of accounts) {
        console.log(account.address);
    }
});

function getCustomPrivateKey(privateKey: string | undefined) {
    if (privateKey) {
      return [privateKey];
    } else {
      return [];
    }
}  

function getGasPrice(gasPrice: string | undefined) {
    if (gasPrice) {
        return parseInt(gasPrice, 10);
    } else {
        return "auto";
    }
}

const {
    MAINNET_API_URL,
    MAINNET_PRIVATE_KEY,
    LOCAL_API_URL,
    LOCAL_MNEMONIC,
    UZMI_API_URL,
    UZMI_PRIVATE_KEY,
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
            accounts: getCustomPrivateKey(UZMI_PRIVATE_KEY),
            gasPrice: getGasPrice("8000000000"),
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
    abiExporter: {
        path: './abi',
        clear: true,
        flat: true,
        only: [],
        spacing: 2
    }
};

export default config;

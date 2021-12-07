require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

const { 
	MAINNET_API_URL, 
	MAINNET_PRIVATE_KEY, 
	UZMI_API_URL,
	UZMI_PRIVATE_KEY_BRIDGE1,
	UZMI_PRIVATE_KEY_BRIDGE2,
	ETHERSCAN_API_KEY 
} = process.env;

module.exports = {
	solidity: "0.8.3",
	defaultNetwork: "uzminet",
	solidity: {
		version: "0.8.0",
		settings: {
			optimizer: {
				enabled: true,
				runs: 1000,
			},
		},
	},
	networks: {
		/*mainnet: {
			url: MAINNET_API_URL,
			accounts: [MAINNET_PRIVATE_KEY]
		},*/
		uzminet: {
			url: UZMI_API_URL,
			accounts: [UZMI_PRIVATE_KEY_BRIDGE1, UZMI_PRIVATE_KEY_BRIDGE2],
			gas: 2100000,
      		gasPrice: 8000000000
		}
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY
	}
};

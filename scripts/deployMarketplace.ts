import { ethers } from "hardhat";

const UzmiToken = "0x897bBB2C742B8C053c3a233e4996255252d55efc";
const UzmiNFT = "0x2c2ab1911DD56031C9db7817375334e0aD66eB9b";
const TeamWallet = "0x2B520f1395fd8EAF85C67C87A949997812A1B6B9";
const LotteryWallet = "0x21A590F1055AF8780AfcD62ABe9DB0dAce5104a8";
const TreasuryWallet = "0x35bF3e711A2413A85Bab840E1E38088bd4Cc1Cc9";

import { UzmiMarketplace__factory } from "../typechain";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    try {
 
        //Marketplace
        const UzmiMarketplace: UzmiMarketplace__factory = await ethers.getContractFactory("UzmiMarketplace");
        const uzmiMarketplace = await UzmiMarketplace.deploy(
            UzmiToken,
            UzmiNFT,
            TreasuryWallet,
            TeamWallet,
            LotteryWallet
        );

        const contractUzmiMarketplace = await uzmiMarketplace.deployed();

        console.log(
            "Contract Uzmi Marketplace deployed to address:",
            contractUzmiMarketplace.address
        );
    } catch (e) {
        console.log(e);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

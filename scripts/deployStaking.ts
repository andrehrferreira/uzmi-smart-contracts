import { ethers } from "hardhat";

const UzmiToken = "0x897bBB2C742B8C053c3a233e4996255252d55efc";

import { UzmiStaking__factory } from "../typechain";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    try {
        //Marketplace
        const UzmiStaking: UzmiStaking__factory = await ethers.getContractFactory("UzmiStaking");
        const uzmiStaking = await UzmiStaking.deploy(UzmiToken);
        const contractUzmiStaking = await uzmiStaking.deployed();

        console.log(
            "Contract Uzmi Staking deployed to address:",
            contractUzmiStaking.address
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

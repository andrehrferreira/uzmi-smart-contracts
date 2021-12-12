import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    try {
 
        //NFTs
        const UzmiNft = await ethers.getContractFactory("UzmiNft");
        const uzmiNft = await UzmiNft.deploy();
        const contractUzmiNft = await uzmiNft.deployed();

        console.log(
            "Contract Uzmi NFTs deployed to address:",
            uzmiNft.address
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

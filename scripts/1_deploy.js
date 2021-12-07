const { ethers, upgrades } = require('hardhat');

async function main() {
	const [deployer] = await ethers.getSigners();

	console.log(
		"Deploying contracts with the account:",
		deployer.address
	);

	try{
		const UzmiToken = await ethers.getContractFactory("UzmiToken");
		const uzmiToken = await UzmiToken.deploy();   
		console.log("Contract UzmiToken deployed to address:", uzmiToken.address);
	}
	catch(e){
		console.log(e);
	}

	try{
		const DragonScale = await ethers.getContractFactory("DragonScale");
		const dragonScale = await DragonScale.deploy();   
		console.log("Contract DragonScale deployed to address:", dragonScale.address);
	}
	catch(e){
		console.log(e);
	}
 }
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });
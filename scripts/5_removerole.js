const { ADM_WALLET } = process.env;

const CONTRACT_NAME = "DragonScale";
const CONTRACT_ID = "";
const GRANTROLE_WALLET = ""

async function main() {
    const ContractFactory = await ethers.getContractFactory(CONTRACT_NAME);
    const contract = await ContractFactory.attach(CONTRACT_ID);

    let MINTER = await contract.MINTER_ROLE.call();
    await contract.revokeRole(MINTER, GRANTROLE_WALLET);
    
    console.log(`Revoke role to ${GRANTROLE_WALLET} in ${CONTRACT_NAME}`);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
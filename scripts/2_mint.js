const { ADM_WALLET } = process.env;

const CONTRACT_NAME = "DragonScale";
const CONTRACT_ID = "";
const AMOUNT = 500000;

async function main() {
    const ContractFactory = await ethers.getContractFactory(CONTRACT_NAME);
    const contract = await ContractFactory.attach(CONTRACT_ID);
    await contract.mint(ADM_WALLET, AMOUNT);

    console.log(`Create ${AMOUNT} ${CONTRACT_NAME} in address:`, contract.address);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
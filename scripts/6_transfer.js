const { ADM_WALLET } = process.env;

const CONTRACT_NAME = "DragonScale";
const CONTRACT_ID = "";
const RECIVE_WALLET = ""
const AMOUNT = 1000;

async function main() {
    const ContractFactory = await ethers.getContractFactory(CONTRACT_NAME);
    const contract = await ContractFactory.attach(CONTRACT_ID);
    await contract.transfer(RECIVE_WALLET, AMOUNT);    
    console.log(`Transer ${AMOUNT} to ${RECIVE_WALLET} from ${CONTRACT_ID}`);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
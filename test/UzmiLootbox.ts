import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { UzmiToken, UzmiLootbox, UzmiNft, UzmiLootbox__factory } from "../typechain";


chai.use(solidity);
const { expect } = chai;

describe("Uzmi Lootbox", function () {
    let contractUzmiToken: UzmiToken;
    let contractUzmiLootbox: UzmiLootbox;
    let contractUzmiNft: UzmiNft;
    let owner: SignerWithAddress;
    let boxOwner: SignerWithAddress;

    before(async function () {
        [owner, boxOwner] = await ethers.getSigners();
    });

    beforeEach(async function () {
        const UzmiTokenFactory = await ethers.getContractFactory("UzmiToken");
        contractUzmiToken = await UzmiTokenFactory.deploy();
        contractUzmiToken = await contractUzmiToken.deployed();
        await contractUzmiToken.afterPreSale();

        const UzmiNftFactory = await ethers.getContractFactory("UzmiNft");
        contractUzmiNft = await UzmiNftFactory.deploy();
        contractUzmiNft = await contractUzmiNft.deployed();        
    });

    it("should create lootbox and withdraw", async function () {
        const nftURI = "https://ipfs.io/ipfs/QmTCnV18BUkhzcshH2fdd212oN5ufx8GvXc1kUTrjP3ptz?filename=metadata.json"
        const UzmiLootboxFactory: UzmiLootbox__factory = await ethers.getContractFactory("UzmiLootbox");
        const amountTokens = utils.parseUnits("100", 18);

        //Create Nft
        const createNft = await (await contractUzmiNft.safeMint(owner.address, nftURI)).wait();
        const eventMint = createNft.events?.filter((event) => event.event == "MintNft")[0];
        const NftId = Number(eventMint?.data);
        
        //Create lootbox
        contractUzmiLootbox = await UzmiLootboxFactory.deploy(contractUzmiToken.address, amountTokens, contractUzmiNft.address, NftId);
        contractUzmiLootbox = await contractUzmiLootbox.deployed();
        await contractUzmiToken.connect(owner).transfer(contractUzmiLootbox.address, amountTokens); //Transfer founds
        await contractUzmiNft.transferFrom(owner.address, contractUzmiLootbox.address, NftId); //Transfer NFT
       
        const validate = await contractUzmiLootbox.validate();
        
        //Withdraw
        await contractUzmiLootbox.setOwner(boxOwner.address);
        const myLootBox = await (await contractUzmiLootbox.connect(boxOwner).withdraw()).wait();
        console.log(myLootBox.events?.filter((event) => event.event == "Withdrew")[0].args);

        expect(validate).to.equal(true);
    });
});
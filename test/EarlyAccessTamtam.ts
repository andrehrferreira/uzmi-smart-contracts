import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { UzmiToken, EarlyAccessTamtam, MyRewards, UzmiNft, UzmiLootbox__factory } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Early Access Tamtam", function () {
    let contractEarlyAccessTamtam: EarlyAccessTamtam;
    let contractUzmiNft: UzmiNft;
    let contractMyRewards: MyRewards;
    let owner: SignerWithAddress;
    let boxOwner: SignerWithAddress;

    before(async function () {
        [owner, boxOwner] = await ethers.getSigners();
    });

    beforeEach(async function () {
        const UzmiNftFactory = await ethers.getContractFactory("UzmiNft");
        contractUzmiNft = await UzmiNftFactory.deploy();
        contractUzmiNft = await contractUzmiNft.deployed(); 
        
        const MyRewardsFactory = await ethers.getContractFactory("MyRewards");
        contractMyRewards = await MyRewardsFactory.deploy();
    });

    it("should create reward early access tamtam", async function () {
        const URITamtam = "https://ipfs.io/ipfs/bafkreiea5rjpttlen6khq2h4qs4o5e2safhxcftlemrl4rxxdowhwoltha"
        
        //Create Nft
        const createTamtam = await (await contractUzmiNft.safeMint(owner.address, URITamtam)).wait();
        const eventMintTamtam = createTamtam.events?.filter((event) => event.event == "MintNft")[0];
        const tamtamId = Number(eventMintTamtam?.data);
        
        //Create EarlyAccess
        const EarlyAccessTamtamFactory = await ethers.getContractFactory("EarlyAccessTamtam");
        contractEarlyAccessTamtam = await EarlyAccessTamtamFactory.deploy(contractUzmiNft.address);
        
        await contractEarlyAccessTamtam.create(boxOwner.address, tamtamId);
        await contractUzmiNft.connect(owner).transferFrom(owner.address, contractEarlyAccessTamtam.address, tamtamId);
        
        //Open 
        const myReward = await contractEarlyAccessTamtam.getRewardIdByAddress(boxOwner.address);
        await contractMyRewards.create(boxOwner.address, contractEarlyAccessTamtam.address, myReward);
        await (await contractEarlyAccessTamtam.connect(boxOwner).open(myReward)).wait();

        //Validate
        const balance = await contractUzmiNft.balanceOf(boxOwner.address);
        //const myRewards = await contractMyRewards.getRewardsIdByAddress(boxOwner.address);
        
        expect(balance).to.equal(1);
    });
});
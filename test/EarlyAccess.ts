import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { UzmiToken, EarlyAccess, MyRewards, UzmiNft, UzmiLootbox__factory } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Early Access", function () {
    let contractEarlyAccess: EarlyAccess;
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

    it("should create reward early access", async function () {
        const URIFounderMedal = "https://ipfs.io/ipfs/bafkreievjdfufm646qakc47lazx2h2e2fdwtheikri4i5nx756cv5hfwva"
        const URICard = "https://ipfs.io/ipfs/bafkreibol7s4evglnp7by5hlzkbqwvlyaziz5kp2xmhzvamrbntbez5mh4"
        
        //Create Nft
        const createFounderMedal = await (await contractUzmiNft.safeMint(owner.address, URIFounderMedal)).wait();
        const eventMintFounderMedal = createFounderMedal.events?.filter((event) => event.event == "MintNft")[0];
        const founderMedalId = Number(eventMintFounderMedal?.data);
        
        const createCard = await (await contractUzmiNft.safeMint(owner.address, URICard)).wait();
        const eventMintCard = createCard.events?.filter((event) => event.event == "MintNft")[0];
        const cardId = Number(eventMintCard?.data);

        //Create EarlyAccess
        const EarlyAccessFactory = await ethers.getContractFactory("EarlyAccess");
        contractEarlyAccess = await EarlyAccessFactory.deploy(contractUzmiNft.address);
        
        await contractEarlyAccess.create(boxOwner.address, founderMedalId, cardId);
        await contractUzmiNft.connect(owner).transferFrom(owner.address, contractEarlyAccess.address, founderMedalId);
        await contractUzmiNft.connect(owner).transferFrom(owner.address, contractEarlyAccess.address, cardId); 
        
        //Open 
        const myReward = await contractEarlyAccess.getRewardIdByAddress(boxOwner.address);
        await contractMyRewards.create(boxOwner.address, contractEarlyAccess.address, myReward);
        await (await contractEarlyAccess.connect(boxOwner).open(myReward)).wait();

        //Validate
        const balance = await contractUzmiNft.balanceOf(boxOwner.address);
        //const myRewards = await contractMyRewards.getRewardsIdByAddress(boxOwner.address);
        
        expect(balance).to.equal(2);
    });
});
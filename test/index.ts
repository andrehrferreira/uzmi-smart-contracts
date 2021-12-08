import chai from "chai";
import { ethers } from "hardhat";
import { Contract, utils } from "ethers";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber/lib/bignumber";

import { UzmiToken, DragonScale, UzmiNft, UzmiMarketplace } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Uzmi Token", function () {

    let contract: UzmiToken;
    let owner: SignerWithAddress;
    let address1: SignerWithAddress;
    let address2: SignerWithAddress;
    let address3: SignerWithAddress;
    let address4: SignerWithAddress;

    before(async function () {
        [owner, address1, address2, address3, address4] = await ethers.getSigners();
    });

    beforeEach(async function () {
        const UzmiTokenFactory = await ethers.getContractFactory("UzmiToken");

        contract = await UzmiTokenFactory.deploy();
        contract = await contract.deployed();

        await contract.afterPreSale();
        await contract.setTeamWallet(address1.address);
        await contract.setLotteryWallet(address2.address);
    });

    it("should have the correct name and symbol", async function () {
        const name = await contract.name();
        const symbol = await contract.symbol();
    
        expect(name).to.equal("Uzmi Token");
        expect(symbol).to.equal("UZMI");
    });

    it("should charge fees", async function () {
        await contract.transfer(address3.address, utils.parseEther("1000").toString());
        await contract.connect(address3).transfer(address4.address, utils.parseEther("1000").toString());

        const zeroBalance = await contract.balanceOf(address3.address);
        const balanceTaxed = await contract.balanceOf(address4.address);
        const teamBalance = await contract.balanceOf(address1.address);
        const lotteryBalance = await contract.balanceOf(address2.address); 

        expect(zeroBalance).to.equal(0);
        expect(balanceTaxed).to.equal(utils.parseEther("940").toString());
        expect(teamBalance).to.equal(utils.parseEther("50").toString());
        expect(lotteryBalance).to.equal(utils.parseEther("10").toString());
    });
});

describe("Dragon Scale", function () {

    let contract: DragonScale;
    let owner: SignerWithAddress;
    let address1: SignerWithAddress;
    let address2: SignerWithAddress;
    let address3: SignerWithAddress;
    let address4: SignerWithAddress;

    before(async function () {
        [owner, address1, address2, address3, address4] = await ethers.getSigners();
    });

    beforeEach(async function () {
        const DragonScaleFactory = await ethers.getContractFactory("DragonScale");

        contract = await DragonScaleFactory.deploy();
        contract = await contract.deployed();

        await contract.afterPreSale();
        await contract.setTeamWallet(address1.address);
        await contract.setLotteryWallet(address2.address);
    });

    it("should have the correct name and symbol", async function () {
        const name = await contract.name();
        const symbol = await contract.symbol();
    
        expect(name).to.equal("Dragon Scale");
        expect(symbol).to.equal("DRSL");
    });

    it("should charge fees", async function () {
        await contract.transfer(address3.address, "1000");
        await contract.connect(address3).transfer(address4.address, "1000");

        const zeroBalance = await contract.balanceOf(address3.address);
        const balanceTaxed = await contract.balanceOf(address4.address);
        const teamBalance = await contract.balanceOf(address1.address);
        const lotteryBalance = await contract.balanceOf(address2.address); 

        expect(zeroBalance).to.equal(0);
        expect(balanceTaxed).to.equal("930");
        expect(teamBalance).to.equal("50");
        expect(lotteryBalance).to.equal("10");
    });

    it("should mint more token", async function () {
        await contract.mint(owner.address, 100000000);
        const ownerBalance = await contract.balanceOf(owner.address);
        expect(ownerBalance).to.equal(200000000);
    });

    it("should grand and revoke access", async function () {
        await contract.grantRole(await contract.MINTER_ROLE(), address1.address);
        await contract.mint(address1.address, 100000000);
    });
});

describe("Uzmi Nft", function () {
    let contractUzmiToken: UzmiToken;
    let contractDragonScale: DragonScale;
    let contractUzmiNft: UzmiNft;
    let marketplace: UzmiMarketplace;
    let owner: SignerWithAddress;
    let address1: SignerWithAddress;
    let address2: SignerWithAddress;
    let TreasuryWallet: string;

    before(async function () {
        [owner, address1, address2] = await ethers.getSigners();
    });

    beforeEach(async function () {
        TreasuryWallet = "0x35bF3e711A2413A85Bab840E1E38088bd4Cc1Cc9";

        //Uzmi Token
        const UzmiTokenFactory = await ethers.getContractFactory("UzmiToken");
        
        contractUzmiToken = await UzmiTokenFactory.deploy();
        contractUzmiToken = await contractUzmiToken.deployed();

        await contractUzmiToken.afterPreSale();
        await contractUzmiToken.setTeamWallet(address1.address);
        await contractUzmiToken.setLotteryWallet(address2.address);
        
        //Dragon Scale
        const DragonScaleFactory = await ethers.getContractFactory("DragonScale");
        
        contractDragonScale = await DragonScaleFactory.deploy();
        contractDragonScale = await contractDragonScale.deployed();

        await contractDragonScale.afterPreSale();
        await contractDragonScale.setTeamWallet(address1.address);
        await contractDragonScale.setLotteryWallet(address2.address);
        
        //Uzmi NFT
        const UzmiNftFactory = await ethers.getContractFactory("UzmiNft");

        contractUzmiNft = await UzmiNftFactory.deploy();
        contractUzmiNft = await contractUzmiNft.deployed();

        await contractUzmiNft.afterPreSale();
        await contractUzmiNft.setTeamWallet(address1.address);
        await contractUzmiNft.setLotteryWallet(address2.address);
        await contractUzmiNft.setTreasuryWallet(TreasuryWallet);
        await contractUzmiNft.setUzmiTokenAddress(contractUzmiToken.address);
        await contractUzmiNft.setDragonScaleAddress(contractDragonScale.address);

        //Marketplace
        const marketplaceFactory = await ethers.getContractFactory("UzmiMarketplace");

        marketplace = await marketplaceFactory.deploy(
            contractUzmiToken.address, 
            contractUzmiNft.address,
            TreasuryWallet,
            address1.address,
            address2.address
        );
        
        marketplace = await marketplace.deployed();
    });

    it("should mint nft and transfer", async function () {
        const nftURI = "https://ipfs.io/ipfs/QmTCnV18BUkhzcshH2fdd212oN5ufx8GvXc1kUTrjP3ptz?filename=metadata.json"
        const oneEth = utils.parseUnits("1", 18);

        await contractUzmiToken.connect(owner).transfer(address1.address, oneEth);

        let tx = await contractUzmiNft.safeMint(owner.address, nftURI);
                
        const receipt = await tx.wait();
        const eventMint = receipt.events?.filter((event) => event.event == "MintNft")[0];

        if(eventMint && eventMint.data){
            const returnURI = await contractUzmiNft.tokenURI(Number(eventMint?.data));
            expect(nftURI).to.equal(returnURI);
        }      
        
        //Open trande
        const nfts = await contractUzmiNft.tokensOfOwner(owner.address);
        await contractUzmiNft.approve(marketplace.address, nfts[0], { from: owner.address });
        
        let tx1 = await (await marketplace.openTrade(nfts[0], oneEth, { from: owner.address })).wait();
        const transId = tx1.events?.filter((event) => event.event == "TradeStatusChange")[0].args;

        //Execute
        await contractUzmiToken.connect(address1).approve(marketplace.address, oneEth, { from: address1.address });
        await (await marketplace.connect(address1).executeTrade(transId?.ad, { from: address1.address })).wait();
        const trade = await marketplace.getTrade(transId?.ad);

        const nftsAccount1 = await contractUzmiNft.tokensOfOwner(address1.address);
        
        for(let key in nftsAccount1){
            let nftMetadata = await contractUzmiNft.tokenURI(nftsAccount1[key]);
            expect(nftURI).to.equal(nftMetadata);
        }
    });
});
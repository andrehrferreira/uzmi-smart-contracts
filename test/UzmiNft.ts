import chai from "chai";
import { ethers } from "hardhat";
import { utils } from "ethers";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { UzmiToken, UzmiNft, UzmiMarketplace } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Uzmi Nft", function () {
    let contractUzmiToken: UzmiToken;
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
                
        //Uzmi NFT
        const UzmiNftFactory = await ethers.getContractFactory("UzmiNft");

        contractUzmiNft = await UzmiNftFactory.deploy();
        contractUzmiNft = await contractUzmiNft.deployed();

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
        await contractUzmiNft.approve(marketplace.address, 0, { from: owner.address });
        let tx1 = await (await marketplace.openTrade(0, oneEth, { from: owner.address })).wait();
        const transId = tx1.events?.filter((event) => event.event == "TradeStatusChange")[0].args;

        //Execute
        await contractUzmiToken.connect(address1).approve(marketplace.address, oneEth, { from: address1.address });
        await (await marketplace.connect(address1).executeTrade(transId?.ad, { from: address1.address })).wait();
        const trade = await marketplace.getTrade(transId?.ad);

        /*const nftsAccount1 = await contractUzmiNft.tokensOfOwner(address1.address);
        
        for(let key in nftsAccount1){
            let nftMetadata = await contractUzmiNft.tokenURI(nftsAccount1[key]);
            expect(nftURI).to.equal(nftMetadata);
        }*/
    });
});


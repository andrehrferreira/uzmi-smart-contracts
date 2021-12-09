import chai from "chai";
import { ethers } from "hardhat";
import { Contract, utils } from "ethers";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "@ethersproject/bignumber/lib/bignumber";

import { UzmiToken, DragonScale, UzmiNft, UzmiMarketplace } from "../typechain";

chai.use(solidity);
const { expect } = chai;

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
        expect(teamBalance).to.equal("30");
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
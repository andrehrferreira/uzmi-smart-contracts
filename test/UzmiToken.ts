import chai from "chai";
import { ethers } from "hardhat";
import { utils } from "ethers";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { UzmiToken } from "../typechain";

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
        expect(balanceTaxed).to.equal(utils.parseEther("960").toString());
        expect(teamBalance).to.equal(utils.parseEther("30").toString());
        expect(lotteryBalance).to.equal(utils.parseEther("10").toString());
    });
});
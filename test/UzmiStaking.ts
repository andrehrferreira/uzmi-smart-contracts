import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { UzmiToken, UzmiStaking } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Uzmi Staking", function () {
    let contractUzmiToken: UzmiToken;
    let contractUzmiStaking: UzmiStaking;
    let owner: SignerWithAddress;
    let stakingOwner: SignerWithAddress;
    let treasuryWallet: SignerWithAddress;
    let teamWallet: SignerWithAddress;
    let lotteryWallet: SignerWithAddress;

    before(async function () {
        [owner, stakingOwner, treasuryWallet, teamWallet, lotteryWallet] = await ethers.getSigners();
    });

    beforeEach(async function () {
        const UzmiTokenFactory = await ethers.getContractFactory("UzmiToken");
        contractUzmiToken = await UzmiTokenFactory.deploy();
        contractUzmiToken = await contractUzmiToken.deployed();

        await contractUzmiToken.afterPreSale();
        await contractUzmiToken.setTeamWallet(teamWallet.address);
        await contractUzmiToken.setLotteryWallet(lotteryWallet.address);
        
        const UzmiStakingFactory = await ethers.getContractFactory("UzmiStaking");
        contractUzmiStaking = await UzmiStakingFactory.deploy(contractUzmiToken.address);
        contractUzmiStaking = await contractUzmiStaking.deployed();    
        await (await contractUzmiToken.excludeFromFees(contractUzmiToken.address, true)).wait();

        const Treasury = utils.parseEther("1000000");        
        await contractUzmiToken.transfer(contractUzmiStaking.address, Treasury);
        await contractUzmiStaking.setTreasury(Treasury);
        await contractUzmiStaking.setActive(true);
    });

    it("should create staking and withdraw", async function () {
        const amount = utils.parseEther("1000").toString();

        await contractUzmiToken.approve(contractUzmiStaking.address, amount, { from: owner.address });
        await (await contractUzmiStaking.connect(owner).deposit(amount, 1, true)).wait();

        const allocations = await contractUzmiStaking.fetchAllAllocations();
        const balanceStaking = await contractUzmiToken.balanceOf(contractUzmiStaking.address);
        
        expect(balanceStaking).to.equal("1001000000000000000000000");
        expect(allocations[0].amount).to.equal(amount);
        expect(allocations[0].owner).to.equal(owner.address);

        await (await contractUzmiStaking.withdraw(0)).wait();
        const balanceOwner = await contractUzmiToken.balanceOf(owner.address);
        expect(balanceOwner).to.equal(utils.parseEther("209000000").toString());
    });

    it("should refound", async function () {
        const amount = utils.parseEther("1000").toString();
        await (await contractUzmiToken.excludeFromFees(stakingOwner.address, true)).wait();
        await contractUzmiToken.connect(owner).transfer(stakingOwner.address, amount, { from: owner.address });
        await contractUzmiToken.connect(stakingOwner).approve(contractUzmiStaking.address, amount, { from: stakingOwner.address });
        await (await contractUzmiStaking.connect(stakingOwner).deposit(amount, 1, false)).wait();

        const balanceStaking = await contractUzmiToken.balanceOf(contractUzmiStaking.address);        
        expect(balanceStaking).to.equal("1001000000000000000000000");
 
        await (await contractUzmiStaking.connect(owner).refound()).wait();
        const balanceStakingOwnerToken = await contractUzmiToken.balanceOf(stakingOwner.address);
        expect(balanceStakingOwnerToken).to.equal(amount);
        await (await contractUzmiToken.excludeFromFees(stakingOwner.address, false)).wait();
    });
});
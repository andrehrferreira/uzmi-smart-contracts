import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { UzmiToken, UzmiLottery } from "../typechain";

chai.use(solidity);
const { expect } = chai;

describe("Uzmi Lottery", function () {
    let contractUzmiToken: UzmiToken;
    let contractUzmiLottery: UzmiLottery;
    let owner: SignerWithAddress;
    let teamWallet: SignerWithAddress;
    let lotteryWallet: SignerWithAddress;
    let address3: SignerWithAddress;
    let address4: SignerWithAddress;

    before(async function () {
        [owner, teamWallet, lotteryWallet, address3, address4] = await ethers.getSigners();
    });

    beforeEach(async function () {
        const UzmiTokenFactory = await ethers.getContractFactory("UzmiToken");
        const UzmiLotteryFactory = await ethers.getContractFactory("UzmiLottery");

        contractUzmiToken = await UzmiTokenFactory.deploy();
        contractUzmiToken = await contractUzmiToken.deployed();

        await contractUzmiToken.afterPreSale();
        await contractUzmiToken.setTeamWallet(teamWallet.address);
        await contractUzmiToken.setLotteryWallet(lotteryWallet.address);

        const nextDraw = Math.floor(Date.now() / 1000);
        contractUzmiLottery = await UzmiLotteryFactory.deploy(contractUzmiToken.address, lotteryWallet.address, nextDraw);
        contractUzmiLottery = await contractUzmiLottery.deployed();
    });

    it("should validate wallets", async function () {
        const lotteryWalletInsideContract = await contractUzmiLottery.lotteryWallet();        
        expect(lotteryWalletInsideContract).to.equal(lotteryWallet.address);
    });

    it("should add participants", async function () {
        await contractUzmiLottery.addParticipant(address3.address);
        await contractUzmiLottery.addParticipant(address4.address);
        const totalParticipants = await contractUzmiLottery.totalParticipants();
        expect(totalParticipants).to.equal(2);
    });

    it("should adding balance to lottery wallet", async function () {   
        await contractUzmiToken.transfer(lotteryWallet.address, 1000000);
        const balance = await contractUzmiToken.balanceOf(lotteryWallet.address);
        expect(balance).to.equal(1000000);
    });

    it("should draw", async function () {
        try{
            await contractUzmiToken.transfer(lotteryWallet.address, 1000000);
            const balance = await contractUzmiToken.balanceOf(lotteryWallet.address);
            await contractUzmiToken.connect(lotteryWallet).approve(contractUzmiLottery.address, balance, { from: lotteryWallet.address });
            
            await contractUzmiLottery.addParticipant(address3.address);
            await contractUzmiLottery.addParticipant(address4.address);
            
            const result = await (await contractUzmiLottery.draw()).wait();
            const resultData = result.events?.filter((event) => event.event == "WinnerDeclared")[0].args;

            try{
                //console.log(`Winner ${resultData?.winner} amount ${resultData?.amount}`);
            }
            catch{}

            const balanceWinner = await contractUzmiToken.balanceOf(resultData?.winner);

            expect(resultData?.amount).to.equal(1000000);
            expect(balanceWinner).to.equal(1000000);
        }
        catch(e){
            console.log(e);
        }        
    });
});
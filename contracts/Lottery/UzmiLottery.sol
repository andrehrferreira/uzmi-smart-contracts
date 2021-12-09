// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UzmiLottery {
    using SafeMath for uint256;

    address public creator;

    IERC20 currencyToken;
    address public lotteryWallet;

    bool public drawn = false;
    uint256 public drawDate;
    uint256 public createdAt;

    address[] public participantsAddress;
    uint256 participantsCounter;

    constructor(
        address _currencyTokenAddress, 
        address _lotteryWallet,
        uint256 _drawDate
    ){
        creator = msg.sender;
        currencyToken = IERC20(_currencyTokenAddress);
        lotteryWallet = _lotteryWallet;
        participantsCounter = 0;
        drawDate = _drawDate;
        createdAt = block.timestamp;
    }

    function balance() public view returns(uint){
        return currencyToken.balanceOf(lotteryWallet);
    }

    function totalParticipants() public virtual view returns(uint256){
        return participantsCounter;
    }

    function addParticipant(address _participantWallet) public onlyOwner {
        participantsAddress.push(_participantWallet);
        participantsCounter++;
    }

    function draw() public onlyOwner{
        require(block.timestamp >= drawDate, "The draw cannot be held, it is not time yet!");
        require(participantsAddress.length > 1, "Must have at least 2 participants to make the draw.");
        
        uint index = generateRandomNumber() % participantsAddress.length;
        uint256 total = balance();

        currencyToken.transferFrom(lotteryWallet, participantsAddress[index], total);
        drawn = true;

        emit WinnerDeclared(participantsAddress[index], total);
    }

    function setNewDrawDate(uint256 _drawDate) public onlyOwner{
        require(drawn, "To set a new drawing date and I need to perform the previous drawing");
        
        drawDate = _drawDate;
        drawn = false;
    }

    function generateRandomNumber() private view returns(uint256) {
        return uint256(keccak256(abi.encodePacked(block.difficulty, block.number, participantsAddress)));
    }

    modifier onlyOwner() {
        require(msg.sender == creator, "Only owner can call this function.");
        _;
    }

    event WinnerDeclared( address winner, uint256 amount );
}
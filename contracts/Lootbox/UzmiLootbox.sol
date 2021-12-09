// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract UzmiLootbox {
    IERC20 currencyToken;
    IERC721 itemToken;

    bool public open = false;

    uint256 amountCurrency;
    uint256 itemId;

    address creator;
    address owner;

    constructor (
        address _currencyTokenAddress, 
        uint256 _amountCurrency,
        address _itemTokenAddress,
        uint256 _itemId
    ) {
        owner = msg.sender;
        creator = msg.sender;
        currencyToken = IERC20(_currencyTokenAddress);
        itemToken = IERC721(_itemTokenAddress);
        amountCurrency = _amountCurrency;
        itemId = _itemId;
    }

    function awards() public view onlyCreator returns(uint256 amountToken, uint256 nftId){
        return (currencyToken.balanceOf(address(this)), itemId);
    }

    function validate() public view returns (bool fullBox){
        uint256 balance = currencyToken.balanceOf(address(this));
        uint256 totalNfts = itemToken.balanceOf(address(this));
        return (balance == amountCurrency && totalNfts > 0);
    }

    function setOwner(address _owner) public onlyCreator{
        owner = _owner;
    }

    function withdraw() public onlyOwner {
        require(!open, "This box has already been opened");
        require(owner != address(0), "The owner of the box has not been defined");

        uint256 tokenBalance = currencyToken.balanceOf(address(this));
        require(tokenBalance > 0, "The box has no balance for transfer");

        //currencyToken.transferFrom(address(this), owner, tokenBalance);
        itemToken.transferFrom(address(this), owner, itemId);
        open = true;

        emit Withdrew(address(currencyToken), msg.sender, tokenBalance, address(itemToken), itemId);
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator can call this function.");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    event Withdrew(address tokenContract, address to, uint256 amount, address nftContract, uint256 nftId);
}
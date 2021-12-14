// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UzmiMarketplace {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    
    Counters.Counter private _itemsSold;

    IERC20 currencyToken;
    IERC721 itemToken;

    //Fee
    address public treasuryWallet;
    address public teamWallet;
    address public lotteryWallet;
    uint256 public teamFee = 3;
    uint256 public lotteryFee = 1;

    struct Trade {
        address poster;
        uint256 item;
        uint256 price;
        bytes32 status;
    }

    mapping(uint256 => Trade) public trades;
    mapping(uint256 => uint256) public tradesByTokenId;
    uint256 public tradeCounter;

    constructor (
        address _currencyTokenAddress, 
        address _itemTokenAddress,
        address _treasuryWallet,
        address _teamWallet,
        address _lotteryWallet
    ) {
        currencyToken = IERC20(_currencyTokenAddress);
        itemToken = IERC721(_itemTokenAddress);

        treasuryWallet = _treasuryWallet;
        teamWallet = _teamWallet;
        lotteryWallet = _lotteryWallet;

        tradeCounter = 0;
    }

    function getTrade(uint256 _trade) public virtual view returns(address, uint256, uint256, bytes32)
    {
        Trade memory trade = trades[_trade];
        return (trade.poster, trade.item, trade.price, trade.status);
    }

    function getTrageByTokenId(uint256 _item) public virtual view returns(uint256, address, uint256, uint256, bytes32){
        uint256 _trade = tradesByTokenId[_item];
        require(_trade > 0, "This item is not for sale");

        Trade memory trade = trades[_trade];
        return (_trade, trade.poster, trade.item, trade.price, trade.status);
    }

    function openTrade(uint256 _item, uint256 _price) public payable {
        require(_price > 0, "Price must be at least 1 wei");

        itemToken.transferFrom(msg.sender, address(this), _item);

        trades[tradeCounter] = Trade({
            poster: payable(msg.sender),
            item: _item,
            price: _price,
            status: "Open"
        });

        tradesByTokenId[_item] = tradeCounter;
        tradeCounter += 1;

        emit TradeStatusChange(tradeCounter - 1, "Open");
    }

    function executeTrade(uint256 _trade) public payable {
        Trade memory trade = trades[_trade];
        require(trade.status == "Open", "Trade is not Open.");

        uint256 amount = trade.price;
        uint256 taxedAmount = trade.price;

        if (teamFee > 0) {
            uint256 tokensToTeam = amount.mul(teamFee).div(100);
            taxedAmount = taxedAmount.sub(tokensToTeam);
            currencyToken.transferFrom(msg.sender, teamWallet, tokensToTeam);
        }

        if (lotteryFee > 0) {
            uint256 tokensToLottery = amount.mul(lotteryFee).div(100);
            taxedAmount = taxedAmount.sub(tokensToLottery);
            currencyToken.transferFrom(msg.sender, lotteryWallet, tokensToLottery);
        }

        currencyToken.transferFrom(msg.sender, trade.poster, taxedAmount);

        itemToken.transferFrom(address(this), msg.sender, trade.item);
        _itemsSold.increment();
        trades[_trade].status = "Executed";
        tradesByTokenId[trade.item] = 0;

        emit TradeStatusChange(_trade, "Executed");
    }

    function cancelTrade(uint256 _trade) public payable {
        Trade memory trade = trades[_trade];

        require(
            msg.sender == trade.poster,
            "Trade can be cancelled only by poster."
        );

        require(trade.status == "Open", "Trade is not Open.");

        itemToken.transferFrom(address(this), trade.poster, trade.item);
        _itemsSold.increment();
        trades[_trade].status = "Cancelled";
        tradesByTokenId[trade.item] = 0;

        emit TradeStatusChange(_trade, "Cancelled");
    }

    function fetchMarketItems() public view returns (Trade[] memory) {
        uint256 itemsCount = tradeCounter - _itemsSold.current();
        uint256 currentIndex = 0;

        Trade[] memory items = new Trade[](itemsCount);

        for (uint256 i = 0; i < tradeCounter; i++) {
            if(trades[i].status == "Open"){
                Trade storage currentItem = trades[i];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }

    event TradeStatusChange(uint256 ad, bytes32 status);
}
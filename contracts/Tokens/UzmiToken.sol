// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

contract UzmiToken is ERC20, Ownable {
    using SafeMath for uint256;

    bool public tradingIsEnabled = false;

    address public teamWallet;
    address public lotteryWallet;

    uint256 public teamFee = 0;
    uint256 public lotteryFee = 0;

    uint256 public tSupply = 210000000 * (10**18);

    mapping(address => bool) public isExcludedFromFees;

    constructor() ERC20("Uzmi Token", "UZMI") {
        excludeFromFees(msg.sender, true);
        _mint(msg.sender, tSupply);
    }

    function afterPreSale() external onlyOwner {
        setTeamFee(3);
        setLotteryFee(1);
        tradingIsEnabled = true;
    }

    function excludeFromFees(address account, bool excluded) public onlyOwner {
        require(isExcludedFromFees[account] != excluded, "Already excluded");
        isExcludedFromFees[account] = excluded;
        emit ExcludeFromFees(account, excluded);
    }

    function setTeamWallet(address _newWallet) external onlyOwner {
        excludeFromFees(_newWallet, true);
        teamWallet = _newWallet;
    }

    function setLotteryWallet(address _newWallet) external onlyOwner {
        excludeFromFees(_newWallet, true);
        lotteryWallet = _newWallet;
    }

    function setTeamFee(uint256 newFee) public onlyOwner {
        teamFee = newFee;
    }

    function setLotteryFee(uint256 newFee) public onlyOwner{
        lotteryFee = newFee;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(from != address(0), "zero address");
        require(to != address(0), "zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        
        require(
            tradingIsEnabled ||
            (isExcludedFromFees[from] || isExcludedFromFees[to]),
            "Trading not started"
        );

        bool excludedAccount = isExcludedFromFees[from] ||
        isExcludedFromFees[to];
            
        if (excludedAccount) {
            super._transfer(from, to, amount);
        } 
        else {
            uint256 taxedAmount = amount;

            if (teamFee > 0) {
                uint256 tokensToTeam = amount.mul(teamFee).div(100);
                taxedAmount = taxedAmount.sub(tokensToTeam);
                super._transfer(from, teamWallet, tokensToTeam);
            }

            if (lotteryFee > 0) {
                uint256 tokensToLottery = amount.mul(lotteryFee).div(100);
                taxedAmount = taxedAmount.sub(tokensToLottery);
                super._transfer(from, lotteryWallet, tokensToLottery);
            }

            super._transfer(from, to, taxedAmount);
        }        
    }

    event ExcludeFromFees(address indexed account, bool isExcluded);
}


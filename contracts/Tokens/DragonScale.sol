// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DragonScale is ERC20, ERC20Burnable, Pausable, AccessControl {
    using SafeMath for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bool public tradingIsEnabled = false;

    address public teamWallet;
    address public lotteryWallet;

    uint256 public teamFee = 0;
    uint256 public lotteryFee = 0;
    uint256 public burnFree = 0;

    uint256 public tSupply = 100000000;

    mapping(address => bool) public isExcludedFromFees;

    constructor() ERC20("Dragon Scale", "DRSL") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);

        excludeFromFees(msg.sender, true);
        _mint(msg.sender, tSupply);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function decimals() public view virtual override returns (uint8) {
        return 0;  
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(amount >= 100000000, "It is not possible to mint more than 100000000 units at a time");

        _mint(to, amount);
    }

    function afterPreSale() public onlyRole(DEFAULT_ADMIN_ROLE){
        setTeamFee(5);
        setLotteryFee(1);
        setBurnFee(1);
        tradingIsEnabled = true;
    }

    function excludeFromFees(address account, bool excluded) public onlyRole(DEFAULT_ADMIN_ROLE){
        require(isExcludedFromFees[account] != excluded, "Already excluded");
        isExcludedFromFees[account] = excluded;
        emit ExcludeFromFees(account, excluded);
    }

    function setTeamWallet(address _newWallet) public onlyRole(DEFAULT_ADMIN_ROLE){
        excludeFromFees(_newWallet, true);
        teamWallet = _newWallet;
    }

    function setLotteryWallet(address _newWallet) public onlyRole(DEFAULT_ADMIN_ROLE){
        excludeFromFees(_newWallet, true);
        lotteryWallet = _newWallet;
    }

    function setTeamFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE){
        teamFee = newFee;
    }

    function setLotteryFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE){
        lotteryFee = newFee;
    }

    function setBurnFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE){
        burnFree = newFee;
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

            if(burnFree > 0) {
                uint256 tokensToBurn = amount.mul(burnFree).div(100); 
                taxedAmount = taxedAmount.sub(tokensToBurn);
                super._burn(from, tokensToBurn);
            }

            super._transfer(from, to, taxedAmount);
        }
    }

    event ExcludeFromFees(address indexed account, bool isExcluded);
}
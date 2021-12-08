// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UzmiNft is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Burnable, Pausable, AccessControl {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    bool public tradingIsEnabled = false;

    address public treasuryWallet;
    address public teamWallet;
    address public lotteryWallet;

    uint256 public teamFee = 0;
    uint256 public lotteryFee = 0;

    address public uzmiTokenAddress;
    address public dragonScaleAddress;

    uint256 public uzmiTokenFee = 1;
    uint256 public dragonScaleFee = 100;

    mapping (uint256 => uint256) public tokenIdToPrice;
    mapping (address => bool) public isExcludedFromFees;
    mapping (uint256 => address) public ownersList;

    constructor() ERC721("UzmiNft", "UZMINFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        excludeFromFees(msg.sender, true);
    }

    function excludeFromFees(address account, bool excluded) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isExcludedFromFees[account] != excluded, "Already excluded");
        isExcludedFromFees[account] = excluded;
        emit ExcludeFromFees(account, excluded);
    }

    function afterPreSale() public onlyRole(DEFAULT_ADMIN_ROLE){
        setTeamFee(5);
        setLotteryFee(1);
        tradingIsEnabled = true;
    }

    function setTeamWallet(address _newWallet) public onlyRole(DEFAULT_ADMIN_ROLE){
        excludeFromFees(_newWallet, true);
        teamWallet = _newWallet;
    }

    function setLotteryWallet(address _newWallet) public onlyRole(DEFAULT_ADMIN_ROLE){
        excludeFromFees(_newWallet, true);
        lotteryWallet = _newWallet;
    }

    function setTreasuryWallet(address _newWallet) public onlyRole(DEFAULT_ADMIN_ROLE){
        excludeFromFees(_newWallet, true);
        treasuryWallet = _newWallet;
    }

    function setTeamFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE){
        teamFee = newFee;
    }

    function setLotteryFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE){
        lotteryFee = newFee;
    }

    function setUzmiTokenAddress(address _tokenAddress) public onlyRole(DEFAULT_ADMIN_ROLE){
        uzmiTokenAddress = _tokenAddress;
    }

    function setDragonScaleAddress(address _tokenAddress) public onlyRole(DEFAULT_ADMIN_ROLE){
        dragonScaleAddress = _tokenAddress;
    }

    function setUzmiTokenFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE){
        uzmiTokenFee = newFee;
    }

    function setDragonScaleFee(uint256 newFee) public onlyRole(DEFAULT_ADMIN_ROLE){
        dragonScaleFee = newFee;
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function safeMint(address to, string memory uri) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        ownersList[tokenId] = to;
        emit MintNft(tokenId);
    }

    function _burn(uint256 _tokenId) internal override(ERC721, ERC721URIStorage) {
        require(msg.sender == ownerOf(_tokenId), 'Not owner of this token');
        super._burn(_tokenId);
    }

    function tokenURI(uint256 tokenId)
    public
    view
    override(ERC721, ERC721URIStorage)
    returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function tokensOfOwner(address _owner) external view returns(uint256[] memory ownerTokens){
        uint256 tokenCount = balanceOf(_owner);

        if (tokenCount == 0) {
            return new uint256[](0);
        } 
        else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 total = _tokenIdCounter.current();
            uint256 resultIndex = 0;
            uint256 index;

            for (index = 1; index <= total; index++) {
                if (ownersList[index] == _owner) {
                    result[resultIndex] = index;
                    resultIndex++;
                }
            }

            return result;
        }
    } 

    function allowBuy(uint256 _tokenId, uint256 _price) external {
        require(tradingIsEnabled || isExcludedFromFees[msg.sender], "Trading not started");
        require(msg.sender == ownerOf(_tokenId), 'Not owner of this token');
        require(_price > 0, 'Price zero');
        tokenIdToPrice[_tokenId] = _price;
    }

    function disallowBuy(uint256 _tokenId) external {
        require(tradingIsEnabled || isExcludedFromFees[msg.sender], "Trading not started");
        require(msg.sender == ownerOf(_tokenId), 'Not owner of this token');
        tokenIdToPrice[_tokenId] = 0;
    }

    function buy(uint256 _tokenId) external payable {
        uint256 price = tokenIdToPrice[_tokenId];
        address seller = ownerOf(_tokenId);

        require(
            tradingIsEnabled ||
            (isExcludedFromFees[msg.sender] || isExcludedFromFees[seller]),
            "Trading not started"
        );

        require(price > 0, 'This token is not for sale');
        require(msg.value == price, 'Incorrect value');
        
        _transfer(seller, msg.sender, _tokenId);
        ownersList[_tokenId] = msg.sender;
        tokenIdToPrice[_tokenId] = 0;

        uint256 totalPrice = msg.value;
        uint256 taxedAmount = msg.value;

        if (teamFee > 0) {
            uint256 tokensToTeam = totalPrice.mul(teamFee).div(100);
            taxedAmount = taxedAmount.sub(tokensToTeam);
            super._transfer(msg.sender, teamWallet, tokensToTeam);
        }

        if (lotteryFee > 0) {
            uint256 tokensToLottery = totalPrice.mul(lotteryFee).div(100);
            taxedAmount = taxedAmount.sub(tokensToLottery);
            super._transfer(msg.sender, lotteryWallet, tokensToLottery);
        }

        payable(seller).transfer(taxedAmount); 
        emit NftBought(seller, msg.sender, taxedAmount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function Concatenate(string memory a, string memory b) public pure returns (string memory concatenatedString) {
        bytes memory bytesA = bytes(a);
        bytes memory bytesB = bytes(b);
        string memory concatenatedAB = new string(bytesA.length + bytesB.length);
        bytes memory bytesAB = bytes(concatenatedAB);
        uint concatendatedIndex = 0;
        uint index = 0;

        for (index = 0; index < bytesA.length; index++) {
            bytesAB[concatendatedIndex++] = bytesA[index];
        }

        for (index = 0; index < bytesB.length; index++) {
            bytesAB[concatendatedIndex++] = bytesB[index];
        }
        
        return string(bytesAB);
    }

    event ExcludeFromFees(address indexed account, bool isExcluded);
    event NftBought(address _seller, address _buyer, uint256 _price);
    event MintNft(uint256 _tokeId);
}
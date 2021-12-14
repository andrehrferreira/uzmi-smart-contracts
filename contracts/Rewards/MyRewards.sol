// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MyRewards {

    address creator;

    struct Reward {
        address owner;
        address contractAddress;
        uint256 id;
    }

    mapping(uint256 => Reward) public rewards;
    mapping(address => uint256) public rewardsCounterByAddress;

    uint256 public rewardsCounter;

    constructor () {
        creator = msg.sender;
    }

    function getRewardsIdByAddress(address _address) public view returns(Reward[] memory){
        uint256 totalRewards = rewardsCounterByAddress[_address];
        uint256 itensCounter = 0;
        Reward[] memory items = new Reward[](totalRewards);

        require(totalRewards > 0, "This address has no reward");

        for (uint256 i = 0; i < rewardsCounter; i++) {
            if(rewards[i].owner == _address){
                items[itensCounter] = rewards[i];
                itensCounter += 1;
            }
        }

        return items;
    }

    function create(address _owner, address _contractAddress, uint256 _id) public onlyCreator {
        rewards[rewardsCounter] = Reward({
            owner: _owner,
            contractAddress: _contractAddress,
            id: _id
        });

        rewardsCounterByAddress[_owner] += 1;
        rewardsCounter += 1;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator can call this function.");
        _;
    }
}
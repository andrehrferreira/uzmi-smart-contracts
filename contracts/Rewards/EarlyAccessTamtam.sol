// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract EarlyAccessTamtam {

    IERC721 nftContract;

    address creator;

    struct Reward {
        address owner;
        uint256 tamtamId;
        bool opened;
    }

    mapping(uint256 => Reward) public rewards;
    uint256 public rewardsCounter;

    constructor (address _nftContract) {
        creator = msg.sender;
        nftContract = IERC721(_nftContract);
        rewardsCounter = 0;
    }

    function getRewardIdByAddress(address _address) public view returns(uint256){
        uint256 rewardId = 0;

        for (uint256 i = 0; i < rewardsCounter; i++) {
            if(rewards[i].owner == _address){
                rewardId = i + 1;
            }
        }

        require(rewardId > 0, "This address has no reward");
        return rewardId - 1;
    }

    function create(address _owner, uint256 _tamtamId) public onlyCreator {
        rewards[rewardsCounter] = Reward({
            owner: _owner,
            tamtamId: _tamtamId,
            opened: false
        });

        rewardsCounter += 1;
    }

    function open(uint256 _id) public {
        Reward memory reward = rewards[_id];
        require(msg.sender == reward.owner, "The reward can only be collected by the owner.");
        require(rewards[_id].opened == false, "The reward has already been collected.");
        nftContract.transferFrom(address(this), msg.sender, reward.tamtamId);
        rewards[_id].opened = true;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator can call this function.");
        _;
    }
}
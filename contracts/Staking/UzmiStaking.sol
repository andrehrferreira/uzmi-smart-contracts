// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UzmiStaking {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _total;

    bool active = false;
    IERC20 stakingToken;
    address owner;

    uint256 public totalTreasury = 0;
    uint256 public totalAllocated = 0;
    uint256 public totalReward = 0;
    uint256 public rewardPerMonth = 1;

    struct Allocation {
        address owner;
        uint256 amount;
        bytes32 status;
        uint256 createat;
        uint256 expire;
        uint256 reward;
        bool test;
    }

    mapping(uint256 => Allocation) public allocations;
    mapping(address => uint256) public allocationsByAddress;
    uint256 public allocationsCounter;

    event AllocationSuccess(uint256 id, address owner, uint256 amount);
    event AllocationStatusChange(uint256 id, bytes32 status);
    event Refound();
    event EndStakingFound();

    constructor(
        address _stakingToken
    ) {
        stakingToken = IERC20(_stakingToken);
        owner = msg.sender;
    }

    function setTreasury(uint256 _totalTreasury) public onlyOwner{
        totalTreasury = _totalTreasury;
    }

    function setRewardPerMonth(uint256 _rewardPerMonth) public onlyOwner{
        rewardPerMonth = _rewardPerMonth;
    }

    function setActive(bool _active) public onlyOwner{
        active = _active;
    }

    function refound() public onlyOwner{
        require(msg.sender != address(0), "zero address");

        if(allocationsCounter > 0){
            for(uint256 i = 0; i < allocationsCounter; i++){
                Allocation memory allocation = allocations[i];

                if(allocation.status == "Allocated" && allocation.owner != address(0)){
                    stakingToken.transfer(allocation.owner, allocation.amount);
                    allocations[i].status = "Refound";
                }
            }
        }
        
        uint256 balance = stakingToken.balanceOf(address(this));
        stakingToken.transfer(msg.sender, balance);
        active = false;
        emit Refound();        
    }

    function summary() public view returns(bool, uint256, uint256, uint256, uint256){
        return (active, totalTreasury, totalAllocated, totalReward, rewardPerMonth);
    }

    function refoundBalanceToOwner() public onlyOwner{
        uint256 balance = stakingToken.balanceOf(address(this));
        stakingToken.transfer(msg.sender, balance);
    }

    function refreshRewards() public onlyOwner{     
        uint256 totalRewardIndex = 0;

        for(uint256 i = 0; i < allocationsCounter; i++){
            Allocation memory allocation = allocations[i];

            uint256 totalDays = (allocation.expire - allocation.createat) / 60 / 60 / 24;

            if(totalDays > 0 && allocation.status == "Allocated"){
                uint256 reward = allocation.amount * totalDays.mul(rewardPerMonth.div(30)).div(100);
                allocations[i].reward = reward;
                totalRewardIndex += reward;
            }
        }

        if(totalRewardIndex >= totalTreasury){
            active = false;
            emit EndStakingFound();
        }
    }
 
    function deposit(uint256 _amount, uint _period, bool _test) public payable{
        require(owner != address(0), "Owner zero address");
        require(msg.sender != address(0), "Sender zero address");
        require(active == true, "The staking has not yet been released by the contract owner");
        require(_amount > 0, "Amount must be at least 1 wei");
        require(_period > 0, "The rental period must be greater than 1 day");
        require(totalTreasury > 0, "The staking has not yet been released by the contract owner");

        if(_test == true)
            require(msg.sender == owner, "Only the contract owner can submit test staking");

        stakingToken.transferFrom(msg.sender, address(this), _amount);

        allocations[allocationsCounter] = Allocation({
            owner: payable(msg.sender),
            amount: _amount,
            status: "Allocated",
            createat: block.timestamp,
            expire: block.timestamp + _period * 1 days,
            reward: 0,
            test: _test
        });

        allocationsCounter += 1;
        allocationsByAddress[msg.sender] += 1;
        totalAllocated += _amount;
        emit AllocationSuccess(allocationsCounter - 1, msg.sender, _amount);
    }

    function withdraw(uint256 _id) public {
        require(owner != address(0), "Owner zero address");

        Allocation memory allocation = allocations[_id];

        require(
            msg.sender == allocation.owner,
            "Only the owner of the allocation can request withdrawal"
        );

        require(active == true, "The staking has not yet been released by the contract owner");
        require(allocation.status == "Allocated", "The allocation has already been withdrawn");

        if(allocation.test == false)
            require(allocation.expire > block.timestamp, "The allocation time has not yet ended");

        uint256 balance = stakingToken.balanceOf(address(this));
        require(balance >= allocation.amount, "The contract does not have funds to make the payment");

        stakingToken.transfer(allocation.owner, allocation.amount);

        if(allocation.reward > 0 && totalTreasury > 0){
            stakingToken.transfer(allocation.owner, allocation.reward);
            totalTreasury -= allocation.reward;
            totalReward += allocation.reward;
        }

        allocations[_id].status = "Withdrawn";
        totalAllocated -= allocation.amount;
        
        emit AllocationStatusChange(_id, "Withdrawn");
    }

    function getAllocationById(uint256 _id) public virtual view returns(address, uint256, bytes32, uint256, uint256, uint256) {
        Allocation memory allocation = allocations[_id];
        return (allocation.owner, allocation.amount, allocation.status, allocation.createat, allocation.expire, allocation.reward);
    }

    function fetchAllAllocations() public view returns (Allocation[] memory) {
        Allocation[] memory items = new Allocation[](allocationsCounter);

        for(uint256 i = 0; i < allocationsCounter; i++){
            Allocation storage currentItem = allocations[i];
            items[i] = currentItem;
        }

        return items;
    }

    function fetchAcclocationsByAddress(address _address) public view returns (Allocation[] memory) {
        require(allocationsByAddress[_address] > 0, "The address informed has no allocations");

        Allocation[] memory items = new Allocation[](allocationsByAddress[_address]);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allocationsCounter; i++) {
            if(allocations[i].owner == _address){
                Allocation storage currentItem = allocations[i];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only creator can call this function.");
        _;
    }
}
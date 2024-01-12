// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract NobodyReserve is Ownable, ReentrancyGuard, VRFConsumerBaseV2 {
    uint256 public reservePrice = 0.19527 ether;
    // 1706792400 -> 2024-02-01 21:00:00 UTC+8
    uint256 public priorityTime = 1706792400;

    // reserver raffle weight before priorityTime
    uint256 public constant PRIORITY_WEIGHT = 9527;
    // reserver raffle weight after priorityTime
    uint256 public constant NORMAL_WEIGHT = 1000;

    bool public isWhitelistReserveActive = false;
    bool public isPublicReserveActive = false;
    bool public isRefundActive = false;

    address private immutable _VRFCoordinator;
    uint64 private _VRFSubscriptionId;
    uint256[] private _randomWords;

    uint256 private _totalWeight;
    uint256 private _priorityCount;
    address[] private _publicReservers;

    mapping(address => bool) public whitelist;
    mapping(address => bool) public reserved;
    mapping(address => bool) public raffleWon;
    mapping(address => bool) public refunded;

    // ============ Events ============
    event WhitelistReserved(address indexed reserver);
    event PublicReserved(address indexed reserver);
    event RandomWordsRequested(uint256 requestId);
    event RandomWordsFulfilled(uint256 requestId, uint256[] randomWords);
    event RaffleWon(address indexed reserver);
    event Refunded(address indexed reserver);

    // ============ Error ============
    error OnlyEOA();
    error RserveNotActive();
    error InvalidAddress();
    error InvalidValue();
    error AlreadyReserved();
    error InvalidRaffle();
    error RefundNotActive();
    error NotRefundable();
    error AlreadyRefund();
    error InsufficientBalance();
    error TransferFailed();

    // ============ Modifier ============
    modifier onlyEOA() {
        if (msg.sender != tx.origin) revert OnlyEOA();
        _;
    }

    // ============ Constructor ============
    constructor(address VRFCoordinator_, uint64 VRFSubscriptionId_) VRFConsumerBaseV2(VRFCoordinator_) {
        _VRFCoordinator = VRFCoordinator_;
        _VRFSubscriptionId = VRFSubscriptionId_;
    }

    function setReservePrice(uint256 _reservePrice) external onlyOwner {
        reservePrice = _reservePrice;
    }

    function setPriorityTime(uint256 _priorityTime) external onlyOwner {
        priorityTime = _priorityTime;
    }

    function setIsWhitelistReserveActive(bool _isWhitelistReserveActive) external onlyOwner {
        isWhitelistReserveActive = _isWhitelistReserveActive;
    }

    function setIsPublicReserveActive(bool _isPublicReserveActive) external onlyOwner {
        isPublicReserveActive = _isPublicReserveActive;
    }

    function setIsRefundActive(bool _isRefundActive) external onlyOwner {
        isRefundActive = _isRefundActive;
    }

    function setVRFSubscriptionId(uint64 VRFSubscriptionId_) external onlyOwner {
        _VRFSubscriptionId = VRFSubscriptionId_;
    }

    function setWhitelist(address[] calldata addresses, bool status) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = status;
        }
    }

    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0) {
            amount = address(this).balance;
        }
        _sendValue(payable(owner()), amount);
    }

    function requestRaffleRandomWords(
        bytes32 keyHash,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external onlyOwner {
        uint256 requestId = VRFCoordinatorV2Interface(_VRFCoordinator).requestRandomWords(
            keyHash,
            _VRFSubscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        emit RandomWordsRequested(requestId);
    }

    function executeRaffle(uint8 raffleRound, uint16 raffleCount) external onlyOwner {
        if (raffleRound >= _randomWords.length) revert InvalidRaffle();

        uint256 randomWord = _randomWords[raffleRound];
        uint256 priorityTotalWeight = _priorityCount * PRIORITY_WEIGHT;

        while (raffleCount > 0) {
            uint256 index;
            uint256 randomWeight = uint256(keccak256(abi.encodePacked(randomWord))) % _totalWeight;

            if (randomWeight <= priorityTotalWeight) {
                index = randomWeight / PRIORITY_WEIGHT;
            } else {
                index = _priorityCount + (randomWeight - priorityTotalWeight) / NORMAL_WEIGHT;
            }

            address winner = _publicReservers[index];
            // select the next reserver as the winner if the current reserver has won
            while (raffleWon[winner]) {
                index = index++ < _publicReservers.length ? index : 0;
                winner = _publicReservers[index];
            }
            // set reserver as winner
            raffleWon[winner] = true;

            unchecked {
                randomWord++;
            }
            raffleCount--;

            emit RaffleWon(winner);
        }
    }

    function whitelistReserve() external payable onlyEOA nonReentrant {
        if (!isWhitelistReserveActive) revert RserveNotActive();
        if (!whitelist[msg.sender]) revert InvalidAddress();
        if (reserved[msg.sender]) revert AlreadyReserved();
        if (msg.value != reservePrice) revert InvalidValue();

        reserved[msg.sender] = true;

        emit WhitelistReserved(msg.sender);
    }

    function publicReserve() external payable onlyEOA nonReentrant {
        if (!isPublicReserveActive) revert RserveNotActive();
        // whitelist address is not allowed to participate in the public reserve
        if (whitelist[msg.sender]) revert InvalidAddress();
        if (reserved[msg.sender]) revert AlreadyReserved();
        if (msg.value != reservePrice) revert InvalidValue();

        reserved[msg.sender] = true;
        _publicReservers.push(msg.sender);

        if (block.timestamp < priorityTime) {
            _totalWeight += PRIORITY_WEIGHT;
            _priorityCount++;
        } else {
            _totalWeight += NORMAL_WEIGHT;
        }

        emit PublicReserved(msg.sender);
    }

    function refund() external onlyEOA nonReentrant {
        if (!isRefundActive) revert RefundNotActive();
        if (!reserved[msg.sender]) revert NotRefundable();
        // whitelist address is not allowed to refund
        // only address participate in the public reserve could refund
        if (whitelist[msg.sender]) revert NotRefundable();
        // raffle winner is not allowed to refund
        if (raffleWon[msg.sender]) revert NotRefundable();
        if (refunded[msg.sender]) revert AlreadyRefund();

        refunded[msg.sender] = true;

        _sendValue(payable(msg.sender), reservePrice);

        emit Refunded(msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        _randomWords = randomWords;

        emit RandomWordsFulfilled(requestId, randomWords);
    }

    function _sendValue(address payable recipient, uint256 amount) private {
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Hedera Token Service Contracts
import {IHederaTokenService} from "@hashgraph/smart-contracts/contracts/system-contracts/hedera-token-service/IHederaTokenService.sol";
import {HederaResponseCodes} from "@hashgraph/smart-contracts/contracts/system-contracts/HederaResponseCodes.sol";

/**
 * @title Escrow Contract for Hedera
 * @dev Handles milestone-based payments for work between shoppers, makers, and agents
 */
contract Escrow is Ownable, ReentrancyGuard {
    
    // Constants
    uint8 private constant TOTAL_MILESTONES = 3;
    uint8 private constant TREASURY_PERCENTAGE = 10;
    uint8 private constant MAKER_PERCENTAGE = 65;
    uint8 private constant CREATOR_PERCENTAGE = 35;
    
    // Escrow status values
    bytes private constant STATUS_SHOPPER_DETAILS_RECEIVED = "ShopperDetailsReceived";
    bytes private constant STATUS_OUTFIT_MADE = "OutfitMade";
    bytes private constant STATUS_OUTFIT_DELIVERED = "OutfitDelivered";
    bytes private constant STATUS_COMPLETE = "Complete";
    bytes private constant STATUS_INVALID = "Invalid";

    // Structs
    struct EscrowData {
        address shopper;
        address maker;
        address creator; // Optional creator address
        address treasury;
        address agent;
        uint256 amount;
        uint8 milestonesCompleted;
        bytes status;
        uint256 remainingBalance;
        bool hasCreator;
    }

    // State variables
    mapping(uint256 => EscrowData) public escrows;
    mapping(address => mapping(address => uint256)) public deposits; // shopper => agent => amount
    mapping(address => uint256[]) public shopperEscrows; // shopper => escrow ids
    uint256 private nextEscrowId;
    IHederaTokenService public hederaTokenService;
    address public usdcAddress;

    // Events
    event FundsDeposited(address indexed shopper, address indexed agent, uint256 amount);
    event EscrowCreated(uint256 indexed escrowId, address shopper, address maker, address treasury, uint256 amount);
    event MilestoneCompleted(uint256 indexed escrowId, uint8 milestoneNumber, bytes status);
    event PaymentReleased(uint256 indexed escrowId, address recipient, uint256 amount);

    // Errors
    error InvalidAmount();
    error InvalidAddress();
    error InsufficientBalance();
    error Unauthorized();
    error MilestoneLimitReached();
    error TokenTransferFailed(int64 responseCode);
    error DepositFailed(int64 responseCode);
    error AssociateTokenFailed(int64 responseCode, address account);
    
    /**
     * @dev Constructor sets the USDC token address
     * @param _hederaTokenService The Hedera token service contract address
     * @param _usdcAddress The USDC token contract address
     */
    constructor(address _hederaTokenService, address _usdcAddress) {
        if (_hederaTokenService == address(0) || _usdcAddress == address(0)) revert InvalidAddress();
        hederaTokenService = IHederaTokenService(_hederaTokenService);
        usdcAddress = _usdcAddress;
        nextEscrowId = 1;
    }

    /**
     * @dev Associate the USDC token to this contract (should be called after deployment)
     * @return responseCode The response code from the association
     */
    function associateUsdcTokenToContract() external returns (int64) {
        int64 responseCode = hederaTokenService.associateToken(address(this), usdcAddress);
        if (responseCode != int64(HederaResponseCodes.SUCCESS)) revert AssociateTokenFailed(responseCode, address(this));
        return responseCode;
    }

    /**
     * @dev Safely convert uint256 to int64 for Hedera token transfers
     * @param value The uint256 value to convert
     * @return The int64 value
     */
    function safeUint256ToInt64(uint256 value) internal pure returns (int64) {
        require(value <= 9223372036854775807, "Value too large for int64"); // 2^63 - 1
        return int64(uint64(value));
    }

    /**
     * @dev Deposit funds into the escrow system
     * @param amount Amount to deposit
     * @param agent Address of the agent
     */
    function depositFunds(uint256 amount, address agent) external nonReentrant {
        if (amount <= 0) revert InvalidAmount();
        if (agent == address(0)) revert InvalidAddress();
 
        // Transfer the tokens from the sender to the escrow contract
        int64 responseCode = hederaTokenService.transferFrom(usdcAddress, msg.sender, address(this), amount);
        if (responseCode != int64(HederaResponseCodes.SUCCESS)) revert DepositFailed(responseCode);
        deposits[msg.sender][agent] += amount;
        
        emit FundsDeposited(msg.sender, agent, amount);
    }

    /**
     * @dev Get deposit balance for a shopper-agent pair
     * @param shopper Address of the shopper
     * @param agent Address of the agent
     * @return Balance of the deposit
     */
    function getDepositBalance(address shopper, address agent) external view returns (uint256) {
        return deposits[shopper][agent];
    }

    /**
     * @dev Create an escrow from deposited funds (agent only)
     * @param shopper Address of the shopper
     * @param maker Address of the maker
     * @param treasury Address of the treasury
     * @param creator Optional address of the creator (0x0 if none)
     * @param amount Amount to lock in escrow
     */
    function createEscrowByAgent(
        address shopper,
        address maker,
        address treasury,
        address creator,
        uint256 amount
    ) external nonReentrant {
        if (shopper == address(0)) revert InvalidAddress();
        if (maker == address(0)) revert InvalidAddress();
        if (treasury == address(0)) revert InvalidAddress();
        if (deposits[shopper][msg.sender] < amount) revert InsufficientBalance();
        if (amount <= 0) revert InvalidAmount();

        // Reduce deposit balance
        deposits[shopper][msg.sender] -= amount;
        
        // Create escrow
        uint256 escrowId = nextEscrowId++;
        escrows[escrowId] = EscrowData({
            shopper: shopper,
            maker: maker,
            creator: creator,
            treasury: treasury,
            agent: msg.sender,
            amount: amount,
            milestonesCompleted: 0,
            status: STATUS_SHOPPER_DETAILS_RECEIVED,
            remainingBalance: amount,
            hasCreator: creator != address(0)
        });
        shopperEscrows[shopper].push(escrowId);
        emit EscrowCreated(escrowId, shopper, maker, treasury, amount);
    }

    /**
     * @dev Complete a milestone and distribute payments (agent only)
     * @param escrowId ID of the escrow
     */
    function completeMilestoneByAgent(uint256 escrowId) external nonReentrant {
        EscrowData storage escrow = escrows[escrowId];
        
        if (escrow.agent != msg.sender) revert Unauthorized();
        if (escrow.milestonesCompleted >= TOTAL_MILESTONES) revert MilestoneLimitReached();
        
        uint256 treasuryShare = (escrow.amount * TREASURY_PERCENTAGE) / 100;
        
        if (!escrow.hasCreator) {
            // No creator, maker gets 90% divided across 4 milestones
            uint256 paymentAmount = (escrow.amount - treasuryShare) / TOTAL_MILESTONES;
            
            if (paymentAmount > escrow.remainingBalance) revert InsufficientBalance();
            
            escrow.remainingBalance -= paymentAmount;
            
            // Transfer payment to maker
            int64 responseCode = hederaTokenService.transferToken(usdcAddress, address(this), escrow.maker, safeUint256ToInt64(paymentAmount));
            if (responseCode != int64(HederaResponseCodes.SUCCESS)) revert TokenTransferFailed(responseCode);
            emit PaymentReleased(escrowId, escrow.maker, paymentAmount);
        } else {
            // With creator, split between maker and creator
            uint256 makerShare = (escrow.amount * MAKER_PERCENTAGE) / 100 / TOTAL_MILESTONES;
            uint256 creatorPaymentAmount = (escrow.amount * CREATOR_PERCENTAGE) / 100 / TOTAL_MILESTONES;
            
            if (makerShare + creatorPaymentAmount > escrow.remainingBalance) revert InsufficientBalance();
            
            escrow.remainingBalance -= (makerShare + creatorPaymentAmount);
            
            // Transfer payment to maker
            int64 responseCode = hederaTokenService.transferToken(usdcAddress, address(this), escrow.maker, safeUint256ToInt64(makerShare));
            if (responseCode != int64(HederaResponseCodes.SUCCESS)) revert TokenTransferFailed(responseCode);
            emit PaymentReleased(escrowId, escrow.maker, makerShare);
            
            // Transfer payment to creator
            responseCode = hederaTokenService.transferToken(usdcAddress, address(this), escrow.creator, safeUint256ToInt64(creatorPaymentAmount));
            if (responseCode != int64(HederaResponseCodes.SUCCESS)) revert TokenTransferFailed(responseCode);
            emit PaymentReleased(escrowId, escrow.creator, creatorPaymentAmount);
        }
        
        escrow.milestonesCompleted++;
        
        // Update status based on milestone completion
        if (escrow.milestonesCompleted == 1) {
            escrow.status = STATUS_OUTFIT_MADE;
        } else if (escrow.milestonesCompleted == 2) {
            escrow.status = STATUS_OUTFIT_DELIVERED;
        } else if (escrow.milestonesCompleted == 3) {
            escrow.status = STATUS_COMPLETE;
            
            // Transfer remaining balance to treasury
            if (escrow.remainingBalance > 0) {
                int64 responseCode = hederaTokenService.transferToken(usdcAddress, address(this), escrow.treasury, safeUint256ToInt64(escrow.remainingBalance));
                if (responseCode != int64(HederaResponseCodes.SUCCESS)) revert TokenTransferFailed(responseCode);
                emit PaymentReleased(escrowId, escrow.treasury, escrow.remainingBalance);
                escrow.remainingBalance = 0;
            }

            // TODO: Transfer the NFT to the shopper
        } else {
            escrow.status = STATUS_INVALID;
        }
        
        emit MilestoneCompleted(escrowId, escrow.milestonesCompleted, escrow.status);
    }

    /**
     * @dev Get the remaining balance in an escrow
     * @param escrowId ID of the escrow
     * @return Remaining balance
     */
    function getEscrowBalance(uint256 escrowId) external view returns (uint256) {
        return escrows[escrowId].remainingBalance;
    }
    
    /**
     * @dev Get the full details of an escrow
     * @param escrowId ID of the escrow
     * @return Full escrow data
     */
    function getEscrowDetails(uint256 escrowId) external view returns (EscrowData memory) {
        return escrows[escrowId];
    }

    /**
     * @dev Get the escrow ids for a shopper
     * @param shopper Address of the shopper
     * @return Escrow ids
     */
    function getShopperEscrows(address shopper) external view returns (uint256[] memory) {
        return shopperEscrows[shopper];
    }
}
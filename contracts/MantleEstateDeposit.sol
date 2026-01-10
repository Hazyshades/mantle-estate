// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MantleEstateDeposit
 * @notice Smart contract for handling user deposits on Mantle Estate platform
 * @dev Supports USDC deposits with wallet linking via signature verification
 * @custom:security-contact security@mantleestate.com
 */
contract MantleEstateDeposit is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ State Variables ============

    /// @notice USDC token contract address
    IERC20 public immutable usdcToken;

    /// @notice Minimum deposit amount (10 USDC with 6 decimals)
    uint256 public minDepositAmount = 10 * 10**6;

    /// @notice Maximum deposit amount (1,000,000 USDC with 6 decimals)
    uint256 public maxDepositAmount = 1_000_000 * 10**6;

    /// @notice Mapping from wallet address to Clerk userId
    mapping(address => string) public walletToUserId;

    /// @notice Mapping from userId to array of linked wallets
    mapping(string => address[]) public userIdToWallets;

    /// @notice Mapping to track processed transactions (prevent replay)
    mapping(bytes32 => bool) public processedTransactions;

    /// @notice Mapping to track used signatures (prevent replay)
    mapping(bytes32 => bool) public usedSignatures;

    /// @notice Total deposits per user
    mapping(string => uint256) public totalDeposits;

    /// @notice Total withdrawals per user
    mapping(string => uint256) public totalWithdrawals;

    /// @notice Deposit counter for generating unique IDs
    uint256 public depositCounter;

    /// @notice Withdraw counter for generating unique IDs
    uint256 public withdrawCounter;

    /// @notice Per-user nonce for unique transaction hash generation
    /// @dev Prevents txHash collisions even with same amount/block
    mapping(address => uint256) public userNonces;

    // ============ Events ============

    event WalletLinked(
        address indexed wallet,
        bytes32 indexed userIdHash,
        string userId,
        uint256 timestamp
    );

    event WalletUnlinked(
        address indexed wallet,
        bytes32 indexed userIdHash,
        string userId,
        uint256 timestamp
    );

    event Deposit(
        uint256 indexed depositId,
        address indexed wallet,
        bytes32 indexed userIdHash,
        string userId,
        uint256 amount,
        bytes32 txHash,
        uint256 blockNumber,
        uint256 timestamp,
        uint256 nonce
    );

    event Withdraw(
        uint256 indexed withdrawId,
        address indexed wallet,
        bytes32 indexed userIdHash,
        string userId,
        uint256 amount,
        bytes32 txHash,
        uint256 blockNumber,
        uint256 timestamp,
        uint256 nonce
    );

    event MinDepositAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxDepositAmountUpdated(uint256 oldAmount, uint256 newAmount);

    // ============ Errors ============

    error WalletAlreadyLinked();
    error WalletNotLinked();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error InvalidDepositAmount();
    error InvalidWithdrawAmount();
    error InsufficientBalance();
    error TransactionAlreadyProcessed();
    error InvalidUserId();
    error TransferFailed();

    // ============ Constructor ============

    /**
     * @notice Initialize the contract with USDC token address
     * @param _usdcToken Address of USDC token contract
     */
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcToken);
    }

    // ============ External Functions ============

    /**
     * @notice Link wallet to Clerk userId via signature verification
     * @param userId Clerk user ID
     * @param signature User's signature of the message
     * @dev Message format: "Mantle Estate: Link wallet\nUserID: {userId}\nWallet: {wallet}"
     */
    function linkWallet(
        string calldata userId,
        bytes calldata signature
    ) external whenNotPaused {
        if (bytes(userId).length == 0) revert InvalidUserId();
        if (bytes(walletToUserId[msg.sender]).length != 0) revert WalletAlreadyLinked();

        // Create message exactly as frontend will sign it
        // Frontend uses signMessage() which:
        // 1. Converts string to UTF-8 bytes
        // 2. Creates: "\x19Ethereum Signed Message:\n" + len(message_bytes) + message_bytes
        // 3. Hashes with keccak256 and signs
        // Note: signMessage does NOT pre-hash the message - it hashes the prefix + message together
        string memory message = string(
            abi.encodePacked(
                "Mantle Estate: Link wallet\nUserID: ",
                userId,
                "\nWallet: ",
                Strings.toHexString(msg.sender)
            )
        );

        // Check if signature was already used
        bytes32 signatureHash = keccak256(signature);
        if (usedSignatures[signatureHash]) revert SignatureAlreadyUsed();

        // Verify signature using standard Ethereum signed message format
        // signMessage() in ethers.js does: keccak256("\x19Ethereum Signed Message:\n" + len(message_bytes) + message_bytes)
        bytes memory messageBytes = bytes(message);
        bytes memory prefix = abi.encodePacked("\x19Ethereum Signed Message:\n", Strings.toString(messageBytes.length));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(prefix, messageBytes));
        address signer = ethSignedMessageHash.recover(signature);

        if (signer != msg.sender) revert InvalidSignature();

        // Mark signature as used
        usedSignatures[signatureHash] = true;

        // Link wallet to userId
        walletToUserId[msg.sender] = userId;
        userIdToWallets[userId].push(msg.sender);

        // Emit event with indexed userIdHash for efficient filtering
        bytes32 userIdHash = keccak256(bytes(userId));
        emit WalletLinked(msg.sender, userIdHash, userId, block.timestamp);
    }

    /**
     * @notice Unlink wallet from userId (only wallet owner can unlink)
     */
    function unlinkWallet() external {
        string memory userId = walletToUserId[msg.sender];
        if (bytes(userId).length == 0) revert WalletNotLinked();

        // Remove from walletToUserId mapping
        delete walletToUserId[msg.sender];

        // Remove from userIdToWallets array
        address[] storage wallets = userIdToWallets[userId];
        for (uint256 i = 0; i < wallets.length; i++) {
            if (wallets[i] == msg.sender) {
                wallets[i] = wallets[wallets.length - 1];
                wallets.pop();
                break;
            }
        }

        bytes32 userIdHash = keccak256(bytes(userId));
        emit WalletUnlinked(msg.sender, userIdHash, userId, block.timestamp);
    }

    /**
     * @notice Withdraw USDC tokens from the platform
     * @param amount Amount of USDC to withdraw (with 6 decimals)
     * @dev Wallet must be linked before withdrawing
     * @dev Uses per-user nonce to prevent txHash collisions
     * @dev Note: User must have sufficient balance in platform to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        // Check if wallet is linked
        string memory userId = walletToUserId[msg.sender];
        if (bytes(userId).length == 0) revert WalletNotLinked();

        // Validate withdraw amount
        if (amount < minDepositAmount) {
            revert InvalidWithdrawAmount();
        }

        // Store withdrawId BEFORE incrementing
        uint256 currentWithdrawId = withdrawCounter;

        // Get and increment user nonce for unique txHash
        uint256 currentNonce = userNonces[msg.sender];
        userNonces[msg.sender] = currentNonce + 1;

        // Generate unique transaction hash with nonce
        bytes32 txHash = keccak256(
            abi.encodePacked(
                msg.sender,
                amount,
                block.number,
                block.timestamp,
                currentWithdrawId,
                currentNonce
            )
        );

        // Check if transaction was already processed
        if (processedTransactions[txHash]) revert TransactionAlreadyProcessed();

        // Mark transaction as processed
        processedTransactions[txHash] = true;

        // Increment withdraw counter AFTER storing current value
        withdrawCounter = currentWithdrawId + 1;

        // Check contract balance (user must have funds in platform)
        uint256 contractBalance = usdcToken.balanceOf(address(this));
        if (amount > contractBalance) {
            revert InsufficientBalance();
        }

        // Update total withdrawals
        totalWithdrawals[userId] += amount;

        // Transfer USDC from contract to user
        usdcToken.safeTransfer(msg.sender, amount);

        // Emit event with indexed userIdHash
        bytes32 userIdHash = keccak256(bytes(userId));

        emit Withdraw(
            currentWithdrawId,
            msg.sender,
            userIdHash,
            userId,
            amount,
            txHash,
            block.number,
            block.timestamp,
            currentNonce
        );
    }

    /**
     * @notice Deposit USDC tokens to the platform
     * @param amount Amount of USDC to deposit (with 6 decimals)
     * @dev Wallet must be linked before depositing
     * @dev Uses per-user nonce to prevent txHash collisions
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        // Check if wallet is linked
        string memory userId = walletToUserId[msg.sender];
        if (bytes(userId).length == 0) revert WalletNotLinked();

        // Validate deposit amount
        if (amount < minDepositAmount || amount > maxDepositAmount) {
            revert InvalidDepositAmount();
        }

        // CRITICAL FIX #1: Store depositId BEFORE incrementing
        uint256 currentDepositId = depositCounter;
        
        // CRITICAL FIX #2: Get and increment user nonce for unique txHash
        uint256 currentNonce = userNonces[msg.sender];
        userNonces[msg.sender] = currentNonce + 1;

        // CRITICAL FIX #3: Generate unique transaction hash with nonce
        bytes32 txHash = keccak256(
            abi.encodePacked(
                msg.sender,
                amount,
                block.number,
                block.timestamp,
                currentDepositId,
                currentNonce  // Prevents collisions
            )
        );

        // Check if transaction was already processed
        if (processedTransactions[txHash]) revert TransactionAlreadyProcessed();

        // Mark transaction as processed
        processedTransactions[txHash] = true;

        // Increment deposit counter AFTER storing current value
        depositCounter = currentDepositId + 1;

        // Transfer USDC from user to contract
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update total deposits
        totalDeposits[userId] += amount;

        // CRITICAL FIX #4: Use bytes32 indexed userIdHash instead of string
        bytes32 userIdHash = keccak256(bytes(userId));

        // Emit deposit event with consistent depositId
        emit Deposit(
            currentDepositId,      // Use stored value
            msg.sender,
            userIdHash,            // Indexed hash for efficient filtering
            userId,                // Non-indexed string for readability
            amount,
            txHash,
            block.number,
            block.timestamp,
            currentNonce           // Include nonce for verification
        );
    }

    // ============ View Functions ============

    /**
     * @notice Get userId for a wallet address
     * @param wallet Wallet address
     * @return userId Clerk user ID
     */
    function getUserId(address wallet) external view returns (string memory) {
        return walletToUserId[wallet];
    }

    /**
     * @notice Get all wallets linked to a userId
     * @param userId Clerk user ID
     * @return Array of wallet addresses
     */
    function getLinkedWallets(string calldata userId) external view returns (address[] memory) {
        return userIdToWallets[userId];
    }

    /**
     * @notice Check if wallet is linked
     * @param wallet Wallet address
     * @return True if wallet is linked
     */
    function isWalletLinked(address wallet) external view returns (bool) {
        return bytes(walletToUserId[wallet]).length != 0;
    }

    /**
     * @notice Get total deposits for a user
     * @param userId Clerk user ID
     * @return Total deposit amount
     */
    function getTotalDeposits(string calldata userId) external view returns (uint256) {
        return totalDeposits[userId];
    }

    /**
     * @notice Get total withdrawals for a user
     * @param userId Clerk user ID
     * @return Total withdrawal amount
     */
    function getTotalWithdrawals(string calldata userId) external view returns (uint256) {
        return totalWithdrawals[userId];
    }

    /**
     * @notice Get contract USDC balance
     * @return Contract balance in USDC (6 decimals)
     */
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    /**
     * @notice Get current nonce for a wallet
     * @param wallet Wallet address
     * @return Current nonce value
     */
    function getUserNonce(address wallet) external view returns (uint256) {
        return userNonces[wallet];
    }

    /**
     * @notice Get userId hash for filtering events
     * @param userId Clerk user ID
     * @return Hash of userId
     */
    function getUserIdHash(string calldata userId) external pure returns (bytes32) {
        return keccak256(bytes(userId));
    }

    // ============ Admin Functions ============

    /**
     * @notice Update minimum deposit amount
     * @param newAmount New minimum amount
     */
    function setMinDepositAmount(uint256 newAmount) external onlyOwner {
        uint256 oldAmount = minDepositAmount;
        minDepositAmount = newAmount;
        emit MinDepositAmountUpdated(oldAmount, newAmount);
    }

    /**
     * @notice Update maximum deposit amount
     * @param newAmount New maximum amount
     */
    function setMaxDepositAmount(uint256 newAmount) external onlyOwner {
        uint256 oldAmount = maxDepositAmount;
        maxDepositAmount = newAmount;
        emit MaxDepositAmountUpdated(oldAmount, newAmount);
    }

    /**
     * @notice Pause contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw USDC tokens (admin only, for emergency)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        usdcToken.safeTransfer(to, amount);
    }
}
 
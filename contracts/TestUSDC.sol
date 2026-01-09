// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDC
 * @notice Simple ERC20 token for testing on Mantle Testnet with MNT refuel
 * @dev This is a test token with 6 decimals, matching USDC
 * @dev When minting tUSDC, users also receive MNT tokens for gas (refuel)
 */
contract TestUSDC is ERC20, Ownable {
    // Allow contract to receive native MNT
    receive() external payable {
        // Accept native MNT deposits
    }

    uint8 private constant _decimals = 6;

    /// @notice MNT token contract address on Mantle Sepolia
    /// @dev This may be a wrapped MNT or special contract
    IERC20 public constant MNT_TOKEN = IERC20(0x4200000000000000000000000000000000000011);

    /// @notice Amount of MNT tokens to send per mint (with 18 decimals)
    uint256 public mntPerMint = 0.01 ether; // 0.01 MNT per mint (changed from 1 MNT)

    /// @notice Total MNT balance available in the contract
    uint256 public totalMNTBalance;

    /// @notice Track if we're using native MNT (true) or ERC20 MNT (false)
    bool public useNativeMNT = false;

    /// @notice Track which addresses have already claimed initial MNT
    mapping(address => bool) public hasClaimedInitialMNT;

    /// @notice Amount of MNT to give for initial claim (with 18 decimals)
    uint256 public initialMNTAmount = 0.1 ether; // 0.1 MNT for initial claim

    constructor() ERC20("Test USDC", "tUSDC") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 10_000_000 * 10**_decimals); // 10M tokens
    }

    /**
     * @notice Returns the number of decimals for the token
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Mint tokens to an address and send MNT for gas refuel
     * @param to Address to mint tokens to
     * @param amount Amount to mint (with 6 decimals)
     * @dev Also sends MNT tokens to the recipient for gas
     */
    function mint(address to, uint256 amount) external {
        // Mint tUSDC tokens
        _mint(to, amount);

        // Send MNT tokens for gas refuel if available
        if (mntPerMint > 0) {
            uint256 availableBalance;
            
            if (useNativeMNT) {
                availableBalance = address(this).balance;
            } else {
                // Use low-level call to safely check balance
                (bool success, bytes memory data) = address(MNT_TOKEN).staticcall(
                    abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
                );
                if (success && data.length >= 32) {
                    availableBalance = abi.decode(data, (uint256));
                } else {
                    // If balance check fails, skip MNT transfer
                    return;
                }
            }
            
            if (availableBalance >= mntPerMint) {
                bool transferSuccess = false;
                
                if (useNativeMNT) {
                    // Send native MNT
                    (transferSuccess, ) = payable(to).call{value: mntPerMint}("");
                    require(transferSuccess, "TestUSDC: native MNT transfer failed");
                } else {
                    // Send ERC20 MNT using low-level call
                    (transferSuccess, ) = address(MNT_TOKEN).call(
                        abi.encodeWithSelector(IERC20.transfer.selector, to, mntPerMint)
                    );
                    require(transferSuccess, "TestUSDC: MNT token transfer failed");
                }
                
                // Only update balance after successful transfer
                if (transferSuccess) {
                    if (totalMNTBalance >= mntPerMint) {
                        totalMNTBalance -= mntPerMint;
                    }
                }
            }
        }
    }

    /**
     * @notice Claim initial MNT tokens for gas (one-time claim per address)
     * @dev Users can claim initial MNT once to cover gas fees for minting tUSDC
     * @dev This solves the "chicken and egg" problem - users need MNT to mint, but get MNT from minting
     */
    function claimInitialMNT() external {
        require(!hasClaimedInitialMNT[msg.sender], "TestUSDC: already claimed initial MNT");
        require(initialMNTAmount > 0, "TestUSDC: initial MNT claim is disabled");
        
        // Check if we have enough MNT in contract
        uint256 availableBalance;
        if (useNativeMNT) {
            availableBalance = address(this).balance;
        } else {
            // Use low-level call to safely check balance
            (bool success, bytes memory data) = address(MNT_TOKEN).staticcall(
                abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
            );
            if (success && data.length >= 32) {
                availableBalance = abi.decode(data, (uint256));
            } else {
                revert("TestUSDC: cannot check MNT balance");
            }
        }
        
        require(availableBalance >= initialMNTAmount, "TestUSDC: insufficient MNT in contract for initial claim");
        
        // Mark as claimed
        hasClaimedInitialMNT[msg.sender] = true;
        
        // Send MNT
        bool transferSuccess = false;
        if (useNativeMNT) {
            (transferSuccess, ) = payable(msg.sender).call{value: initialMNTAmount}("");
            require(transferSuccess, "TestUSDC: native MNT transfer failed");
        } else {
            (transferSuccess, ) = address(MNT_TOKEN).call(
                abi.encodeWithSelector(IERC20.transfer.selector, msg.sender, initialMNTAmount)
            );
            require(transferSuccess, "TestUSDC: MNT token transfer failed");
        }
        
        // Update internal balance tracking
        if (totalMNTBalance >= initialMNTAmount) {
            totalMNTBalance -= initialMNTAmount;
        }
        
        emit InitialMNTClaimed(msg.sender, initialMNTAmount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Deposit MNT tokens into the contract for refuel distribution (convenience function)
     * @param mntAmount Amount of MNT to deposit in whole units (e.g., 100 for 100 MNT)
     * @dev Only owner can deposit MNT
     * @dev User must approve this contract to spend MNT tokens first
     * @dev This function automatically converts whole MNT units to wei (multiplies by 10^18)
     * @dev Example: depositMNTEasy(100) deposits 100 MNT
     */
    function depositMNTEasy(uint256 mntAmount) external onlyOwner {
        require(mntAmount > 0, "TestUSDC: amount must be greater than 0");
        uint256 amount = mntAmount * 1e18;
        
        // Check balance using low-level call
        (bool success, bytes memory data) = address(MNT_TOKEN).staticcall(
            abi.encodeWithSelector(IERC20.balanceOf.selector, msg.sender)
        );
        require(success && data.length >= 32, "TestUSDC: MNT token error - cannot check balance");
        uint256 balance = abi.decode(data, (uint256));
        require(balance >= amount, "TestUSDC: insufficient MNT balance");
        
        // Check allowance using low-level call
        (success, data) = address(MNT_TOKEN).staticcall(
            abi.encodeWithSelector(IERC20.allowance.selector, msg.sender, address(this))
        );
        require(success && data.length >= 32, "TestUSDC: MNT token error - cannot check allowance");
        uint256 allowance = abi.decode(data, (uint256));
        require(allowance >= amount, "TestUSDC: insufficient MNT allowance. Please approve first");
        
        // Transfer using low-level call
        (success, ) = address(MNT_TOKEN).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, msg.sender, address(this), amount)
        );
        require(success, "TestUSDC: transferFrom failed. Check approve and balance");
        
        totalMNTBalance += amount;
        useNativeMNT = false;
        emit MNTDeposited(msg.sender, amount, totalMNTBalance);
    }

    /**
     * @notice Deposit native MNT (ETH) into the contract for refuel distribution
     * @dev Only owner can deposit native MNT
     * @dev Sends MNT as native currency with the transaction
     */
    function depositNativeMNT() external payable onlyOwner {
        require(msg.value > 0, "TestUSDC: must send MNT with transaction");
        totalMNTBalance += msg.value;
        useNativeMNT = true;
        emit MNTDeposited(msg.sender, msg.value, totalMNTBalance);
    }

    /**
     * @notice Deposit MNT tokens into the contract for refuel distribution
     * @param amount Amount of MNT to deposit (with 18 decimals in wei)
     * @dev Only owner can deposit MNT
     * @dev User must approve this contract to spend MNT tokens first
     * @dev Example: To deposit 100 MNT, use amount = 100000000000000000000 (100 * 10^18)
     * @dev For easier use, consider using depositMNTEasy(100) instead
     */
    function depositMNT(uint256 amount) external onlyOwner {
        require(amount > 0, "TestUSDC: amount must be greater than 0");
        
        // Check balance using low-level call
        (bool success, bytes memory data) = address(MNT_TOKEN).staticcall(
            abi.encodeWithSelector(IERC20.balanceOf.selector, msg.sender)
        );
        require(success && data.length >= 32, "TestUSDC: MNT token contract error - cannot check balance. Check address or use depositNativeMNT()");
        uint256 balance = abi.decode(data, (uint256));
        require(balance >= amount, "TestUSDC: insufficient MNT balance");

        // Check allowance using low-level call
        (success, data) = address(MNT_TOKEN).staticcall(
            abi.encodeWithSelector(IERC20.allowance.selector, msg.sender, address(this))
        );
        require(success && data.length >= 32, "TestUSDC: MNT token contract error - cannot check allowance. Try depositNativeMNT() instead");
        uint256 allowance = abi.decode(data, (uint256));
        require(allowance >= amount, "TestUSDC: insufficient MNT allowance. Please approve first");

        // Use low-level call for transferFrom (external call)
        (success, data) = address(MNT_TOKEN).call(
            abi.encodeWithSelector(
                IERC20.transferFrom.selector,
                msg.sender,
                address(this),
                amount
            )
        );
        
        require(success, "TestUSDC: transferFrom failed. Check approve and balance. Try depositNativeMNT() instead");
        
        // Verify the transfer actually happened using low-level call
        (success, data) = address(MNT_TOKEN).staticcall(
            abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
        );
        require(success && data.length >= 32, "TestUSDC: cannot verify transfer - balance check failed");
        uint256 contractBalance = abi.decode(data, (uint256));
        require(contractBalance >= amount, "TestUSDC: transfer verification failed - balance not increased");
        
        totalMNTBalance += amount;
        useNativeMNT = false;
        emit MNTDeposited(msg.sender, amount, totalMNTBalance);
    }

    /**
     * @notice Set the amount of MNT tokens to send per mint
     * @param amount Amount of MNT per mint (with 18 decimals)
     * @dev Only owner can set this value
     */
    function setMNTPerMint(uint256 amount) external onlyOwner {
        mntPerMint = amount;
        emit MNTPerMintUpdated(amount);
    }

    /**
     * @notice Set the amount of MNT tokens for initial claim
     * @param amount Amount of MNT for initial claim (with 18 decimals)
     * @dev Only owner can set this value
     * @dev Set to 0 to disable initial claims
     */
    function setInitialMNTAmount(uint256 amount) external onlyOwner {
        initialMNTAmount = amount;
        emit InitialMNTAmountUpdated(amount);
    }

    /**
     * @notice Withdraw MNT tokens from the contract (emergency only)
     * @param amount Amount of MNT to withdraw (with 18 decimals)
     * @dev Only owner can withdraw
     */
    function withdrawMNT(uint256 amount) external onlyOwner {
        require(amount > 0, "TestUSDC: amount must be greater than 0");
        require(amount <= totalMNTBalance, "TestUSDC: insufficient balance");
        totalMNTBalance -= amount;
        
        if (useNativeMNT) {
            // Withdraw native MNT
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "TestUSDC: native MNT withdrawal failed");
        } else {
            // Withdraw ERC20 MNT using low-level call
            (bool success, ) = address(MNT_TOKEN).call(
                abi.encodeWithSelector(IERC20.transfer.selector, msg.sender, amount)
            );
            require(success, "TestUSDC: MNT token withdrawal failed");
        }
        
        emit MNTWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Get the current MNT balance available for distribution
     * @return The amount of MNT tokens available in the contract
     */
    function getMNTBalance() external view returns (uint256) {
        if (useNativeMNT) {
            return address(this).balance;
        } else {
            // Use low-level call for safe balance check
            (bool success, bytes memory data) = address(MNT_TOKEN).staticcall(
                abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
            );
            if (success && data.length >= 32) {
                return abi.decode(data, (uint256));
            }
            return 0;
        }
    }

    /**
     * @notice Check if MNT token address is valid ERC20
     * @return True if token responds to standard ERC20 calls
     */
    function checkMNTToken() external view returns (bool) {
        (bool success, bytes memory data) = address(MNT_TOKEN).staticcall(
            abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
        );
        return success && data.length >= 32;
    }

    /**
     * @notice Get how many mints can be performed with current MNT balance
     * @return The number of mints that can be performed before MNT runs out
     */
    function getAvailableMints() external view returns (uint256) {
        if (mntPerMint == 0) return type(uint256).max;
        
        uint256 availableBalance;
        if (useNativeMNT) {
            availableBalance = address(this).balance;
        } else {
            // Use low-level call for safe balance check
            (bool success, bytes memory data) = address(MNT_TOKEN).staticcall(
                abi.encodeWithSelector(IERC20.balanceOf.selector, address(this))
            );
            if (success && data.length >= 32) {
                availableBalance = abi.decode(data, (uint256));
            } else {
                return 0;
            }
        }
        
        return availableBalance / mntPerMint;
    }

    // ============ Events ============

    /**
     * @notice Emitted when MNT is deposited into the contract
     */
    event MNTDeposited(address indexed from, uint256 amount, uint256 totalBalance);

    /**
     * @notice Emitted when MNT per mint amount is updated
     */
    event MNTPerMintUpdated(uint256 newAmount);

    /**
     * @notice Emitted when MNT is withdrawn from the contract
     */
    event MNTWithdrawn(address indexed to, uint256 amount);

    /**
     * @notice Emitted when a user claims initial MNT
     */
    event InitialMNTClaimed(address indexed user, uint256 amount);

    /**
     * @notice Emitted when initial MNT amount is updated
     */
    event InitialMNTAmountUpdated(uint256 newAmount);
}
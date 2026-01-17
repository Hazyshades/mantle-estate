// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IMantleEstateCityLPPool {
    function usdcToken() external view returns (IERC20);
    function operatorCollect(uint256 amountIn) external;
    function operatorPayout(address to, uint256 amountOut) external;
}

/**
 * @title MantleEstateLPPoolOperator
 * @notice Operator contract that can move USDC into/out of LP pools to apply fees and PnL.
 */
contract MantleEstateLPPoolOperator is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error InvalidPool();
    error InvalidAmount();
    error InvalidRecipient();

    event FundsReceived(address indexed token, address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount);
    event PoolCollected(address indexed pool, uint256 amountIn);
    event PoolPaidOut(address indexed pool, address indexed to, uint256 amountOut);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Deposit USDC into this operator contract for later collection into pools.
     * @param token USDC-like token contract address
     * @param amount Amount to deposit (6 decimals)
     */
    function depositUSDC(IERC20 token, uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert InvalidAmount();
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit FundsReceived(address(token), msg.sender, amount);
    }

    /**
     * @notice Collect USDC into a pool (fees / trader losses) via operatorCollect.
     * @param pool LP pool contract address
     * @param amount Amount to collect
     */
    function collectToPool(address pool, uint256 amount) external onlyOwner nonReentrant {
        if (pool == address(0)) revert InvalidPool();
        if (amount == 0) revert InvalidAmount();

        IERC20 token = IMantleEstateCityLPPool(pool).usdcToken();
        token.safeIncreaseAllowance(pool, amount);
        IMantleEstateCityLPPool(pool).operatorCollect(amount);

        emit PoolCollected(pool, amount);
    }

    /**
     * @notice Pay USDC out of a pool (trader profits) via operatorPayout.
     * @param pool LP pool contract address
     * @param to Recipient address
     * @param amount Amount to pay
     */
    function payoutFromPool(address pool, address to, uint256 amount) external onlyOwner nonReentrant {
        if (pool == address(0)) revert InvalidPool();
        if (to == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();

        IMantleEstateCityLPPool(pool).operatorPayout(to, amount);
        emit PoolPaidOut(pool, to, amount);
    }

    /**
     * @notice Withdraw tokens from this operator contract.
     * @param token Token address
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdrawToken(IERC20 token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        token.safeTransfer(to, amount);
        emit FundsWithdrawn(address(token), to, amount);
    }
}

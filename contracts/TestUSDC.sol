// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDC
 * @notice Simple ERC20 token for testing on Mantle Testnet
 * @dev This is a test token with 6 decimals, matching USDC
 */
contract TestUSDC is ERC20, Ownable {
    uint8 private constant _decimals = 6;

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
     * @notice Mint tokens to an address (owner only)
     * @param to Address to mint tokens to
     * @param amount Amount to mint (with 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
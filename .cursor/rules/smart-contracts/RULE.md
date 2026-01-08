# Smart Contracts Rules (Solidity)

## General Principles

- Language: Solidity ^0.8.20
- Contracts are located in the `contracts/` directory
- Use OpenZeppelin contracts for security

## Contract Structure

- Use SPDX license at the beginning of the file: `// SPDX-License-Identifier: MIT`
- Specify pragma version: `pragma solidity ^0.8.20;`
- Add comments to the contract describing its purpose

## Security

- Always use `SafeERC20` for working with ERC20 tokens
- Use `ReentrancyGuard` for functions that interact with external contracts
- Use `Ownable` for administrative functions
- Use `Pausable` for the ability to pause the contract in case of problems
- Check all input parameters

## Functions

- Use `nonReentrant` modifier for functions with external calls
- Use `onlyOwner` for administrative functions
- Use `whenNotPaused` for main functions
- Always check balance before transferring funds

## Events

- Emit events for all important operations
- Use indexing (`indexed`) for fields that will be filtered
- Name events clearly: `Deposit`, `Withdrawal`, `PositionOpened`, etc.

## Error Handling

- Use `require()` with clear messages for validation
- Use `revert()` with custom errors for gas efficiency:
  ```solidity
  error InsufficientBalance(uint256 requested, uint256 available);
  
  if (amount > balance) {
      revert InsufficientBalance(amount, balance);
  }
  ```

## Modifiers

- Create custom modifiers for repeated checks
- Examples: `onlyOwner`, `whenNotPaused`, `nonReentrant`, `validAmount`

## Comments

- Use NatSpec comments for public functions:
  ```solidity
  /// @notice Deposits USDC to user's balance
  /// @param amount Amount of USDC to deposit (6 decimals)
  /// @dev This function requires user signature verification
  function deposit(uint256 amount) external {
      // implementation
  }
  ```

## Testing

- Write tests for all contract functions
- Test edge cases
- Test error scenarios
- Use hardhat or foundry for testing

## Deployment

- Use verified addresses for production
- Verify contracts on Etherscan after deployment
- Document deployment parameters


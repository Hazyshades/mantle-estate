// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolLosAngeles
 * @notice Preconfigured LP pool for Los Angeles (LAX).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolLosAngeles is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("LAX"),
            "Los Angeles",
            "Mantle Estate LP - Los Angeles",
            "meLP-LAX"
        )
    {}
}
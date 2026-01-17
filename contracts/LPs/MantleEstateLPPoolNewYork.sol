// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolNewYork
 * @notice Preconfigured LP pool for New York (NYC).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolNewYork is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("NYC"),
            "New York",
            "Mantle Estate LP - New York",
            "meLP-NYC"
        )
    {}
}
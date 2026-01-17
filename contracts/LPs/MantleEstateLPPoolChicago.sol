// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolChicago
 * @notice Preconfigured LP pool for Chicago (CHI).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolChicago is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("CHI"),
            "Chicago",
            "Mantle Estate LP - Chicago",
            "meLP-CHI"
        )
    {}
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolSingapore
 * @notice Preconfigured LP pool for Singapore (SGP).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolSingapore is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("SGP"),
            "Singapore",
            "Mantle Estate LP - Singapore",
            "meLP-SGP"
        )
    {}
}
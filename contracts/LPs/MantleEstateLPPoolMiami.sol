// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolMiami
 * @notice Preconfigured LP pool for Miami (MIA).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolMiami is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("MIA"),
            "Miami",
            "Mantle Estate LP - Miami",
            "meLP-MIA"
        )
    {}
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolParis
 * @notice Preconfigured LP pool for Paris (PAR).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolParis is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("PAR"),
            "Paris",
            "Mantle Estate LP - Paris",
            "meLP-PAR"
        )
    {}
}
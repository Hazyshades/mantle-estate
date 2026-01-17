// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolPhiladelphia
 * @notice Preconfigured LP pool for Philadelphia (PHL).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolPhiladelphia is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("PHL"),
            "Philadelphia",
            "Mantle Estate LP - Philadelphia",
            "meLP-PHL"
        )
    {}
}
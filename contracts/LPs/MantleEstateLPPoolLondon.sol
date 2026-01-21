// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolLondon
 * @notice Preconfigured LP pool for London (LON).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolLondon is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("LON"),
            "London",
            "Mantle Estate LP - London",
            "meLP-LON"
        )
    {}
}
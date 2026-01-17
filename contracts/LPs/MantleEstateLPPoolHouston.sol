// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolHouston
 * @notice Preconfigured LP pool for Houston (HOU).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolHouston is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("HOU"),
            "Houston",
            "Mantle Estate LP - Houston",
            "meLP-HOU"
        )
    {}
}
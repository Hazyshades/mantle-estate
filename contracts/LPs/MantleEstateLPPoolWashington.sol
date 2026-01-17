// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolWashington
 * @notice Preconfigured LP pool for Washington (WAS).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolWashington is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("WAS"),
            "Washington",
            "Mantle Estate LP - Washington",
            "meLP-WAS"
        )
    {}
}
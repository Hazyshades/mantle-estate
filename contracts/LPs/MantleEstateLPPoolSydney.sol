// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolSydney
 * @notice Preconfigured LP pool for Sydney (SYD).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolSydney is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("SYD"),
            "Sydney",
            "Mantle Estate LP - Sydney",
            "meLP-SYD"
        )
    {}
}
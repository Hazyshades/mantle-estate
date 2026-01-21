// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolTokyo
 * @notice Preconfigured LP pool for Tokyo (TYO).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolTokyo is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("TYO"),
            "Tokyo",
            "Mantle Estate LP - Tokyo",
            "meLP-TYO"
        )
    {}
}
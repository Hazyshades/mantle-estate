// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolSeoul
 * @notice Preconfigured LP pool for Seoul (SEL).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolSeoul is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("SEL"),
            "Seoul",
            "Mantle Estate LP - Seoul",
            "meLP-SEL"
        )
    {}
}
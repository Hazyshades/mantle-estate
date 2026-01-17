// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolBerlin
 * @notice Preconfigured LP pool for Berlin (BER).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolBerlin is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("BER"),
            "Berlin",
            "Mantle Estate LP - Berlin",
            "meLP-BER"
        )
    {}
}
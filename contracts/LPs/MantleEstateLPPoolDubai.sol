// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolDubai
 * @notice Preconfigured LP pool for Dubai (DXB).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolDubai is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("DXB"),
            "Dubai",
            "Mantle Estate LP - Dubai",
            "meLP-DXB"
        )
    {}
}
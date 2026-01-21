// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolShanghai
 * @notice Preconfigured LP pool for Shanghai (SHA).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolShanghai is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("SHA"),
            "Shanghai",
            "Mantle Estate LP - Shanghai",
            "meLP-SHA"
        )
    {}
}
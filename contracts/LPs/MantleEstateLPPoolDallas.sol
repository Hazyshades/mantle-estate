// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MantleEstateLPPool.sol";

/**
 * @title MantleEstateLPPoolDallas
 * @notice Preconfigured LP pool for Dallas (DAL).
 * @dev Deploy one instance per city.
 */
contract MantleEstateLPPoolDallas is MantleEstateCityLPPool {
    constructor(address _usdcToken)
        MantleEstateCityLPPool(
            _usdcToken,
            bytes32("DAL"),
            "Dallas",
            "Mantle Estate LP - Dallas",
            "meLP-DAL"
        )
    {}
}
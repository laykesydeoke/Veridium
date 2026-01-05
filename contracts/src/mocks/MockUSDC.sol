// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Mock USDC token for testing purposes
/// @dev DO NOT use in production
contract MockUSDC is ERC20 {
    uint8 private _decimals;

    constructor() ERC20("Mock USDC", "USDC") {
        _decimals = 6; // USDC has 6 decimals
    }

    /// @notice Mints tokens to any address (for testing only)
    /// @param to The recipient address
    /// @param amount The amount to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Returns the number of decimals
    /// @return The number of decimals (6 for USDC)
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}

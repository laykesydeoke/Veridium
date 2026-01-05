// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BasenameResolver
/// @notice Helper library for Basename integration
/// @dev Placeholder for future Basename resolution integration
library BasenameResolver {
    /// @notice Resolve address to Basename (future integration)
    /// @param user The user address
    /// @return basename The Basename string (currently returns empty)
    function resolveBasename(address user) internal pure returns (string memory basename) {
        // Placeholder for future Basename registry integration
        // Will call Basename contract to resolve address to name
        user; // Silence unused variable warning
        return "";
    }

    /// @notice Resolve Basename to address (future integration)
    /// @param basename The Basename string
    /// @return user The resolved address (currently returns zero address)
    function resolveAddress(string memory basename) internal pure returns (address user) {
        // Placeholder for future Basename registry integration
        // Will call Basename contract to resolve name to address
        basename; // Silence unused variable warning
        return address(0);
    }

    /// @notice Check if address has Basename (future integration)
    /// @param user The user address
    /// @return hasName True if user has Basename (currently returns false)
    function hasBasename(address user) internal pure returns (bool hasName) {
        // Placeholder for future Basename registry integration
        user; // Silence unused variable warning
        return false;
    }

    /// @notice Get display name for user (Basename or address)
    /// @param user The user address
    /// @return displayName The display name
    function getDisplayName(address user) internal pure returns (string memory displayName) {
        string memory basename = resolveBasename(user);
        if (bytes(basename).length > 0) {
            return basename;
        }
        return toHexString(user);
    }

    /// @notice Convert address to hex string
    /// @param addr The address
    /// @return hexString The hex representation
    function toHexString(address addr) internal pure returns (string memory hexString) {
        bytes memory buffer = new bytes(42);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            uint8 value = uint8(uint160(addr) >> (8 * (19 - i)));
            buffer[2 + i * 2] = toHexChar(value >> 4);
            buffer[3 + i * 2] = toHexChar(value & 0x0f);
        }
        return string(buffer);
    }

    /// @notice Convert uint to hex char
    /// @param value The value (0-15)
    /// @return char The hex character
    function toHexChar(uint8 value) internal pure returns (bytes1 char) {
        if (value < 10) {
            return bytes1(uint8(48 + value)); // 0-9
        } else {
            return bytes1(uint8(87 + value)); // a-f
        }
    }
}

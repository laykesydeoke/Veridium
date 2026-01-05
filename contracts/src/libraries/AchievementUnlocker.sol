// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IAchievementNFT.sol";
import "../interfaces/ICredibilityRegistry.sol";

/// @title AchievementUnlocker
/// @notice Helper library for checking achievement unlock conditions
library AchievementUnlocker {
    /// @notice Check if user qualifies for FirstSession achievement
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return qualifies True if user qualifies
    function qualifiesForFirstSession(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (bool qualifies)
    {
        ICredibilityRegistry.CredibilityScore memory score = credibilityRegistry.getCredibility(user);
        return score.sessionsParticipated >= 1;
    }

    /// @notice Check if user qualifies for FirstWin achievement
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return qualifies True if user qualifies
    function qualifiesForFirstWin(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (bool qualifies)
    {
        ICredibilityRegistry.CredibilityScore memory score = credibilityRegistry.getCredibility(user);
        return score.sessionsWon >= 1;
    }

    /// @notice Check if user qualifies for FirstEvaluation achievement
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return qualifies True if user qualifies
    function qualifiesForFirstEvaluation(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (bool qualifies)
    {
        ICredibilityRegistry.CredibilityScore memory score = credibilityRegistry.getCredibility(user);
        return score.evaluationsSubmitted >= 1;
    }

    /// @notice Check if user qualifies for TenSessions achievement
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return qualifies True if user qualifies
    function qualifiesForTenSessions(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (bool qualifies)
    {
        ICredibilityRegistry.CredibilityScore memory score = credibilityRegistry.getCredibility(user);
        return score.sessionsParticipated >= 10;
    }

    /// @notice Check if user qualifies for FiftySessions achievement
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return qualifies True if user qualifies
    function qualifiesForFiftySessions(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (bool qualifies)
    {
        ICredibilityRegistry.CredibilityScore memory score = credibilityRegistry.getCredibility(user);
        return score.sessionsParticipated >= 50;
    }

    /// @notice Check if user qualifies for HighAccuracy achievement
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return qualifies True if user qualifies
    function qualifiesForHighAccuracy(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (bool qualifies)
    {
        ICredibilityRegistry.CredibilityScore memory score = credibilityRegistry.getCredibility(user);
        if (score.evaluationsSubmitted < 10) return false; // Minimum 10 evaluations
        uint256 accuracy = (score.evaluationsCorrect * 100) / score.evaluationsSubmitted;
        return accuracy >= 80;
    }

    /// @notice Check if user qualifies for Legendary achievement
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return qualifies True if user qualifies
    function qualifiesForLegendary(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (bool qualifies)
    {
        ICredibilityRegistry.CredibilityScore memory score = credibilityRegistry.getCredibility(user);
        return score.totalScore >= 100;
    }

    /// @notice Check if user qualifies for Champion achievement
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return qualifies True if user qualifies
    function qualifiesForChampion(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (bool qualifies)
    {
        ICredibilityRegistry.CredibilityScore memory score = credibilityRegistry.getCredibility(user);
        return score.sessionsWon >= 10;
    }

    /// @notice Check all achievements for a user
    /// @param credibilityRegistry The credibility registry
    /// @param user The user address
    /// @return unlocked Array of achievement types that are unlocked
    function checkAllAchievements(ICredibilityRegistry credibilityRegistry, address user)
        internal
        view
        returns (IAchievementNFT.AchievementType[] memory unlocked)
    {
        uint8 count = 0;
        bool[8] memory qualified;

        qualified[0] = qualifiesForFirstSession(credibilityRegistry, user);
        qualified[1] = qualifiesForFirstWin(credibilityRegistry, user);
        qualified[2] = qualifiesForFirstEvaluation(credibilityRegistry, user);
        qualified[3] = qualifiesForTenSessions(credibilityRegistry, user);
        qualified[4] = qualifiesForFiftySessions(credibilityRegistry, user);
        qualified[5] = qualifiesForHighAccuracy(credibilityRegistry, user);
        qualified[6] = qualifiesForLegendary(credibilityRegistry, user);
        qualified[7] = qualifiesForChampion(credibilityRegistry, user);

        for (uint8 i = 0; i < 8; i++) {
            if (qualified[i]) count++;
        }

        unlocked = new IAchievementNFT.AchievementType[](count);
        uint8 index = 0;
        for (uint8 i = 0; i < 8; i++) {
            if (qualified[i]) {
                unlocked[index] = IAchievementNFT.AchievementType(i);
                index++;
            }
        }

        return unlocked;
    }
}

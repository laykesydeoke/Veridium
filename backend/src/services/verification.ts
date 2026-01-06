import { verifyMessage } from 'viem';
import { UserModel } from '../models/user';

export interface VerificationChallenge {
  address: string;
  message: string;
  timestamp: number;
}

export const VerificationService = {
  /**
   * Generate a verification challenge message
   */
  generateChallenge(address: string): VerificationChallenge {
    const timestamp = Date.now();
    const message = `Sign this message to verify your ownership of ${address}\n\nTimestamp: ${timestamp}\n\nThis signature will not cost any gas fees.`;

    return {
      address: address.toLowerCase(),
      message,
      timestamp,
    };
  },

  /**
   * Verify a signed message
   */
  async verifySignature(
    address: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      const valid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      return valid;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  },

  /**
   * Verify challenge and update user verification status
   */
  async verifyChallengeAndUpdateUser(
    address: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    // Check if challenge is recent (within 5 minutes)
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (!timestampMatch) {
      return false;
    }

    const timestamp = parseInt(timestampMatch[1]);
    const age = Date.now() - timestamp;
    if (age > 5 * 60 * 1000) {
      // 5 minutes
      return false;
    }

    const valid = await this.verifySignature(address, message, signature);

    if (valid) {
      // Update user verification status
      const user = await UserModel.findByAddress(address);
      if (user) {
        await UserModel.update(user.id, { is_verified: true });
      }
    }

    return valid;
  },

  /**
   * Check if address matches expected format
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
};

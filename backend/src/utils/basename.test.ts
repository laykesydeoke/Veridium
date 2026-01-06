import { BasenameService } from '../services/basename';

describe('BasenameService', () => {
  describe('validateBasename', () => {
    it('should validate correct basenames', () => {
      expect(BasenameService.validateBasename('alice.base.eth')).toBe(true);
      expect(BasenameService.validateBasename('bob-123.base.eth')).toBe(true);
      expect(BasenameService.validateBasename('test-name.base.eth')).toBe(true);
    });

    it('should reject invalid basenames', () => {
      expect(BasenameService.validateBasename('ab.base.eth')).toBe(false); // Too short
      expect(BasenameService.validateBasename('a'.repeat(31) + '.base.eth')).toBe(false); // Too long
      expect(BasenameService.validateBasename('Alice.base.eth')).toBe(false); // Uppercase
      expect(BasenameService.validateBasename('-alice.base.eth')).toBe(false); // Starts with hyphen
      expect(BasenameService.validateBasename('alice-.base.eth')).toBe(false); // Ends with hyphen
      expect(BasenameService.validateBasename('alice_bob.base.eth')).toBe(false); // Underscore
      expect(BasenameService.validateBasename('alice.eth')).toBe(false); // Wrong suffix
    });
  });
});

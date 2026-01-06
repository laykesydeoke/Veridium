import { SessionOrchestrator } from '../services/sessionOrchestrator';

describe('SessionOrchestrator', () => {
  describe('canTransition', () => {
    it('should allow valid transitions', () => {
      expect(SessionOrchestrator.canTransition('pending', 'active')).toBe(true);
      expect(SessionOrchestrator.canTransition('pending', 'cancelled')).toBe(true);
      expect(SessionOrchestrator.canTransition('active', 'voting')).toBe(true);
      expect(SessionOrchestrator.canTransition('voting', 'completed')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(SessionOrchestrator.canTransition('pending', 'completed')).toBe(false);
      expect(SessionOrchestrator.canTransition('pending', 'voting')).toBe(false);
      expect(SessionOrchestrator.canTransition('completed', 'active')).toBe(false);
      expect(SessionOrchestrator.canTransition('cancelled', 'active')).toBe(false);
    });
  });
});

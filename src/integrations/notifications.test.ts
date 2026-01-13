import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import notifier from 'node-notifier';
import { sendNotification, notifyStart, notifyEnd } from './notifications.js';

vi.mock('node-notifier', () => ({
  default: {
    notify: vi.fn(),
  },
}));

describe('notifications integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendNotification', () => {
    it('sends notification with correct parameters', () => {
      sendNotification('Test Title', 'Test message');

      expect(notifier.notify).toHaveBeenCalledWith({
        title: 'Test Title',
        message: 'Test message',
        sound: 'Glass',
      });
    });
  });

  describe('notifyStart', () => {
    it('sends start notification with duration', () => {
      notifyStart(25);

      expect(notifier.notify).toHaveBeenCalledWith({
        title: 'Pomox',
        message: 'Pomodoro started (25 minutes)',
        sound: 'Glass',
      });
    });

    it('handles different durations', () => {
      notifyStart(50);

      expect(notifier.notify).toHaveBeenCalledWith({
        title: 'Pomox',
        message: 'Pomodoro started (50 minutes)',
        sound: 'Glass',
      });
    });
  });

  describe('notifyEnd', () => {
    it('sends completion notification', () => {
      notifyEnd();

      expect(notifier.notify).toHaveBeenCalledWith({
        title: 'Pomox',
        message: 'Pomodoro complete!',
        sound: 'Glass',
      });
    });
  });
});

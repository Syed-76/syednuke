import config from '../config.js';
import logger from './logger.js';

class RateLimiter {
  constructor() {
    this.delays = new Map();
  }

  async wait(key) {
    const now = Date.now();
    const lastCall = this.delays.get(key) || 0;
    const timeSinceLastCall = now - lastCall;
    const delayNeeded = config.messageDelay - timeSinceLastCall;

    if (delayNeeded > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }

    this.delays.set(key, Date.now());
  }

  reset(key) {
    this.delays.delete(key);
  }

  resetAll() {
    this.delays.clear();
  }
}

export default new RateLimiter();

class CircuitBreaker {
  /**
   * @param {Function} requestFn - Async function to execute
   * @param {Object} options - Configuration options
   */
  constructor(requestFn, options = {}) {
    this.requestFn = requestFn;
    this.failureThreshold = options.failureThreshold || 3; // Consecutive fails before opening
    this.cooldownPeriod = options.cooldownPeriod || 10000; // Time (ms) to stay in OPEN state
    
    this.state = 'CLOSED'; // Possible states: 'CLOSED', 'OPEN', 'HALF-OPEN'
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(...args) {
    // 1. Check if the circuit is OPEN
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF-OPEN';
      } else {
        throw new Error('CircuitBreakerOpen: Service temporarily unavailable');
      }
    }

    try {
      // 2. Attempt the request
      const response = await this.requestFn(...args);
      this.onSuccess();
      return response;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.cooldownPeriod;
      console.warn(`[CIRCUIT BREAKER] Threshold reached. Circuit is now OPEN for ${this.cooldownPeriod}ms.`);
    }
  }
}

module.exports = CircuitBreaker;

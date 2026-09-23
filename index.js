const express = require('express');
const CircuitBreaker = require('./CircuitBreaker');

const app = express();

// Simulated unreliable downstream third-party service
const flakyThirdPartyApi = async () => {
  const isFailure = Math.random() < 0.7; // 70% failure rate
  if (isFailure) {
    throw new Error('Downstream Service Timeout');
  }
  return { status: 200, data: 'Payment Gateway Success' };
};

// Instantiate Circuit Breaker: Trip after 3 failures, cooldown for 5 seconds
const breaker = new CircuitBreaker(flakyThirdPartyApi, {
  failureThreshold: 3,
  cooldownPeriod: 5000,
});

app.get('/checkout', async (req, res) => {
  try {
    const result = await breaker.execute();
    res.json({ success: true, result });
  } catch (error) {
    if (error.message.startsWith('CircuitBreakerOpen')) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Circuit breaker is OPEN. Request shed to protect downstream systems.',
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.listen(3001, () => {
  console.log('Circuit Breaker micro-tool running on port 3001');
});

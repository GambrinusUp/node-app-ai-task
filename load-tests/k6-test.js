/**
 * Advanced Load Testing with K6
 * 
 * Run with: k6 run load-tests/k6-test.js
 * 
 * Собирает детальные метрики:
 * - Response times
 * - Error rates
 * - Throughput
 * - Custom metrics
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Gauge, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const duration = new Trend('duration');
const requestCounter = new Counter('requests');
const activeConnections = new Gauge('active_connections');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp-up to 10 users
    { duration: '20s', target: 50 },   // Ramp-up to 50 users
    { duration: '30s', target: 100 },  // Ramp-up to 100 users
    { duration: '20s', target: 50 },   // Ramp-down to 50 users
    { duration: '10s', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    // Критерии успеха теста
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Увеличиваем счетчик активных соединений
  activeConnections.add(1);

  try {
    // Group 1: GET / (Home page)
    group('GET /', () => {
      const res = http.get(`${BASE_URL}/`, {
        tags: { endpoint: 'home' },
      });

      const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'has content': (r) => r.body.length > 0,
      });

      errorRate.add(!success);
      duration.add(res.timings.duration, { endpoint: 'home' });
      requestCounter.add(1);
    });

    sleep(1);

    // Group 2: GET /all (Fetch all images)
    group('GET /all', () => {
      const res = http.get(`${BASE_URL}/all`, {
        tags: { endpoint: 'images' },
      });

      const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 1000ms': (r) => r.timings.duration < 1000,
        'is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
      });

      errorRate.add(!success);
      duration.add(res.timings.duration, { endpoint: 'images' });
      requestCounter.add(1);
    });

    sleep(1);

    // Group 3: POST /new (Upload image - simulated)
    group('POST /new', () => {
      const payload = {
        name: `Image_${__VU}_${__ITER}`,
        description: 'Load test image',
        author: 'K6 Load Tester',
      };

      const res = http.post(`${BASE_URL}/new`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { endpoint: 'upload' },
      });

      // Ожидаем 400 так как нет файла
      const success = check(res, {
        'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
      });

      errorRate.add(!success);
      duration.add(res.timings.duration, { endpoint: 'upload' });
      requestCounter.add(1);
    });

  } finally {
    activeConnections.add(-1);
  }

  sleep(1);
}

// Summary function - выполняется после всех тестов
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  let summary = '\n==========================================================================\n';
  summary += 'K6 LOAD TEST SUMMARY\n';
  summary += '==========================================================================\n\n';

  if (data.metrics) {
    Object.entries(data.metrics).forEach(([name, metric]) => {
      if (metric.values) {
        summary += `${name}:\n`;
        summary += `  Current: ${metric.values.value}\n`;
      }
    });
  }

  summary += '\n==========================================================================\n';
  return summary;
}

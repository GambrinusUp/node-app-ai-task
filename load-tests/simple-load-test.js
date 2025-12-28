#!/usr/bin/env node

/**
 * Simple Load Testing Script for PhotoGallery
 * Использует встроенный модуль http для более надежного тестирования
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Конфигурация
const BASE_URL = 'http://localhost:3000';
const TEST_DURATION = 30; // секунды
const CONCURRENT_REQUESTS = 10;

class LoadTester {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
      responseTimes: [],
      statusCodes: {},
      errors: [],
      startTime: null,
      endTime: null
    };
    this.testActive = false;
  }

  /**
   * Отправка HTTP запроса
   */
  makeRequest(path, method = 'GET') {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const duration = Date.now() - startTime;
          
          // Собираем статистику
          this.stats.totalRequests++;
          this.stats.responseTimes.push(duration);
          
          const statusCode = res.statusCode.toString();
          this.stats.statusCodes[statusCode] = (this.stats.statusCodes[statusCode] || 0) + 1;

          if (res.statusCode < 400) {
            this.stats.successfulRequests++;
          } else {
            this.stats.failedRequests++;
          }

          resolve({
            success: res.statusCode < 400,
            statusCode: res.statusCode,
            duration: duration
          });
        });
      });

      req.on('error', (err) => {
        const duration = Date.now() - startTime;
        this.stats.totalRequests++;
        this.stats.failedRequests++;
        this.stats.responseTimes.push(duration);
        this.stats.errors.push(err.message);
        
        resolve({
          success: false,
          error: err.message,
          duration: duration
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const duration = Date.now() - startTime;
        this.stats.totalRequests++;
        this.stats.failedRequests++;
        this.stats.responseTimes.push(duration);
        this.stats.errors.push('Timeout');
        
        resolve({
          success: false,
          error: 'Timeout',
          duration: duration
        });
      });

      req.end();
    });
  }

  /**
   * Запуск одной волны запросов
   */
  async runRequestWave() {
    const endpoints = ['/', '/all', '/'];
    const promises = [];

    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      const endpoint = endpoints[i % endpoints.length];
      promises.push(this.makeRequest(endpoint));
    }

    await Promise.all(promises);
  }

  /**
   * Запуск тестирования
   */
  async runTest() {
    console.log('='.repeat(80));
    console.log('🔥 LOAD TESTING - PhotoGallery Application');
    console.log('='.repeat(80));
    console.log(`\n📋 Конфигурация:`);
    console.log(`  • URL: ${BASE_URL}`);
    console.log(`  • Параллельные запросы: ${CONCURRENT_REQUESTS}`);
    console.log(`  • Длительность: ${TEST_DURATION}s`);
    console.log(`\n⏳ Запуск теста...\n`);

    this.testActive = true;
    this.stats.startTime = Date.now();

    // Запуск волн запросов на протяжении определенного времени
    while (Date.now() - this.stats.startTime < TEST_DURATION * 1000) {
      await this.runRequestWave();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.stats.endTime = Date.now();
    this.stats.totalDuration = this.stats.endTime - this.stats.startTime;
    this.testActive = false;
    
    this.printResults();
    this.saveResults();
  }

  /**
   * Вычисление перцентилей
   */
  calculatePercentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (p / 100)) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Вывод результатов
   */
  printResults() {
    const totalTime = this.stats.totalDuration / 1000;
    const errorRate = (this.stats.failedRequests / this.stats.totalRequests) * 100;
    const rps = this.stats.totalRequests / totalTime;

    const responseTimes = this.stats.responseTimes;
    const meanLatency = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;
    const p50 = this.calculatePercentile(responseTimes, 50);
    const p90 = this.calculatePercentile(responseTimes, 90);
    const p99 = this.calculatePercentile(responseTimes, 99);
    const minLatency = Math.min(...responseTimes);
    const maxLatency = Math.max(...responseTimes);

    console.log('\n' + '='.repeat(80));
    console.log('📊 РЕЗУЛЬТАТЫ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ');
    console.log('='.repeat(80));

    console.log('\n📈 Общие метрики:');
    console.log(`  • Всего запросов: ${this.stats.totalRequests.toLocaleString()}`);
    console.log(`  • Успешных: ${this.stats.successfulRequests}`);
    console.log(`  • Ошибок: ${this.stats.failedRequests}`);
    console.log(`  • Длительность теста: ${totalTime.toFixed(1)}s`);

    console.log('\n🚀 RPS (Requests Per Second):');
    console.log(`  • Среднее: ${rps.toFixed(2)} req/s`);

    console.log('\n⏱️  Latency (мс):');
    console.log(`  • Среднее: ${meanLatency.toFixed(2)}ms`);
    console.log(`  • Min: ${minLatency}ms`);
    console.log(`  • p50: ${p50}ms`);
    console.log(`  • p90: ${p90}ms`);
    console.log(`  • p99: ${p99}ms`);
    console.log(`  • Max: ${maxLatency}ms`);

    console.log('\n❌ Errors & Timeouts:');
    console.log(`  • Error Rate: ${errorRate.toFixed(2)}%`);
    console.log(`  • Failed Requests: ${this.stats.failedRequests}`);

    if (Object.keys(this.stats.statusCodes).length > 0) {
      console.log('\n📡 Распределение HTTP кодов ответа:');
      Object.entries(this.stats.statusCodes).forEach(([code, count]) => {
        const percentage = ((count / this.stats.totalRequests) * 100).toFixed(2);
        console.log(`  • ${code}: ${count} (${percentage}%)`);
      });
    }

    console.log('\n💡 Рекомендации:');
    if (p99 > 1000) {
      console.log('  ⚠️  p99 latency > 1s - рассмотреть оптимизацию');
    }
    if (errorRate > 1) {
      console.log(`  ⚠️  Error rate > 1% (${errorRate.toFixed(2)}%) - проверить обработку ошибок`);
    }
    if (rps < 100) {
      console.log(`  ⚠️  RPS < 100 (${rps.toFixed(2)}) - проверить пропускную способность`);
    }
    if (meanLatency < 50 && errorRate < 0.1) {
      console.log('  ✅ Отличные результаты!');
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  /**
   * Сохранение результатов
   */
  saveResults() {
    const resultsDir = path.join(__dirname, 'results');
    
    // Создание директории
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `load_test_${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);

    const output = {
      timestamp: new Date().toISOString(),
      config: {
        url: BASE_URL,
        duration: TEST_DURATION,
        concurrentRequests: CONCURRENT_REQUESTS
      },
      results: this.stats,
      summary: {
        totalRequests: this.stats.totalRequests,
        successfulRequests: this.stats.successfulRequests,
        failedRequests: this.stats.failedRequests,
        errorRate: (this.stats.failedRequests / this.stats.totalRequests * 100).toFixed(2) + '%',
        rps: (this.stats.totalRequests / (this.stats.totalDuration / 1000)).toFixed(2),
        meanLatency: (this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length || 0).toFixed(2) + 'ms',
        p99Latency: this.calculatePercentile(this.stats.responseTimes, 99) + 'ms'
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`✅ Результаты сохранены: ${filepath}`);
  }
}

// Запуск теста
async function main() {
  const tester = new LoadTester();
  try {
    await tester.runTest();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();

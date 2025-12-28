/**
 * Autocannon Load Testing Script
 * 
 * Сценарий нагрузочного тестирования для сбора метрик:
 * - RPS (Requests Per Second)
 * - Latency (p50, p90, p99)
 * - Error Rate
 * - Throughput
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Конфигурация
const config = {
  url: 'http://localhost:3000',
  connections: 10,          // Количество одновременных соединений
  pipelining: 1,            // Количество запросов в одном соединении
  duration: 30,             // Длительность теста в секундах
  requests: [
    {
      path: '/',
      method: 'GET',
      weight: 50
    },
    {
      path: '/all',
      method: 'GET',
      weight: 30
    },
    {
      path: '/new',
      method: 'POST',
      weight: 20,
      body: {
        name: 'Test Image',
        description: 'Load test image',
        author: 'LoadTester'
      }
    }
  ]
};

// Результаты тестов
let results = {
  timestamp: new Date().toISOString(),
  config: config,
  metrics: {}
};

/**
 * Форматирование времени в человеческий формат
 */
function formatTime(ms) {
  if (ms < 1000) {
    return ms.toFixed(2) + 'ms';
  }
  return (ms / 1000).toFixed(2) + 's';
}

/**
 * Расчет процентиля
 */
function percentile(arr, p) {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * (p / 100)) - 1;
  return sorted[index] || 0;
}

/**
 * Запуск теста
 */
async function runLoadTest() {
  console.log('='.repeat(80));
  console.log('🔥 LOAD TESTING - PhotoGallery Application');
  console.log('='.repeat(80));
  console.log('\n📋 Конфигурация:');
  console.log(`  • URL: ${config.url}`);
  console.log(`  • Соединений: ${config.connections}`);
  console.log(`  • Длительность: ${config.duration}s`);
  console.log(`  • Pipelining: ${config.pipelining}`);
  console.log('\n⏳ Запуск теста...\n');

  try {
    const result = await autocannon({
      url: config.url,
      connections: config.connections,
      pipelining: config.pipelining,
      duration: config.duration,
      amount: 1000
    });

    // Сбор метрик
    results.metrics = {
      // Основные метрики
      totalRequests: result.requests.total,
      totalBytes: result.throughput.total,
      rps: {
        mean: result.requests.mean,
        p50: result.requests.p50,
        p90: result.requests.p90,
        p99: result.requests.p99,
        stddev: result.requests.stddev
      },
      latency: {
        mean: result.latency.mean,
        p50: result.latency.p50,
        p90: result.latency.p90,
        p99: result.latency.p99,
        stddev: result.latency.stddev,
        min: result.latency.min,
        max: result.latency.max
      },
      throughput: {
        total: result.throughput.total,
        mean: result.throughput.mean,
        p50: result.throughput.p50,
        p90: result.throughput.p90,
        p99: result.throughput.p99
      },
      errors: result.errors,
      timeouts: result.timeouts,
      statusCodeDistribution: result.statusCodeDistribution || {}
    };

    // Расчет error rate
    const errorRate = (results.metrics.errors / results.metrics.totalRequests) * 100;
    const timeoutRate = (results.metrics.timeouts / results.metrics.totalRequests) * 100;

    // Вывод результатов
    console.log('\n' + '='.repeat(80));
    console.log('📊 РЕЗУЛЬТАТЫ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ');
    console.log('='.repeat(80));

    console.log('\n📈 Общие метрики:');
    console.log(`  • Всего запросов: ${results.metrics.totalRequests.toLocaleString()}`);
    console.log(`  • Общий объем данных: ${(results.metrics.totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  • Длительность: ${config.duration}s`);
    console.log(`  • Соединений: ${config.connections}`);

    console.log('\n🚀 RPS (Requests Per Second):');
    console.log(`  • Среднее: ${results.metrics.rps.mean.toFixed(2)} req/s`);
    console.log(`  • p50: ${results.metrics.rps.p50.toFixed(2)} req/s`);
    console.log(`  • p90: ${results.metrics.rps.p90.toFixed(2)} req/s`);
    console.log(`  • p99: ${results.metrics.rps.p99.toFixed(2)} req/s`);
    console.log(`  • Std Dev: ${results.metrics.rps.stddev.toFixed(2)} req/s`);

    console.log('\n⏱️  Latency (мс):');
    console.log(`  • Среднее: ${results.metrics.latency.mean.toFixed(2)}ms`);
    console.log(`  • Min: ${results.metrics.latency.min}ms`);
    console.log(`  • p50: ${results.metrics.latency.p50}ms`);
    console.log(`  • p90: ${results.metrics.latency.p90}ms`);
    console.log(`  • p99: ${results.metrics.latency.p99}ms`);
    console.log(`  • Max: ${results.metrics.latency.max}ms`);
    console.log(`  • Std Dev: ${results.metrics.latency.stddev.toFixed(2)}ms`);

    console.log('\n📊 Throughput (байты/сек):');
    console.log(`  • Среднее: ${(results.metrics.throughput.mean / 1024).toFixed(2)} KB/s`);
    console.log(`  • p50: ${(results.metrics.throughput.p50 / 1024).toFixed(2)} KB/s`);
    console.log(`  • p90: ${(results.metrics.throughput.p90 / 1024).toFixed(2)} KB/s`);
    console.log(`  • p99: ${(results.metrics.throughput.p99 / 1024).toFixed(2)} KB/s`);

    console.log('\n❌ Errors & Timeouts:');
    console.log(`  • Errors: ${results.metrics.errors} (${errorRate.toFixed(2)}%)`);
    console.log(`  • Timeouts: ${results.metrics.timeouts} (${timeoutRate.toFixed(2)}%)`);

    if (Object.keys(results.metrics.statusCodeDistribution).length > 0) {
      console.log('\n📡 Распределение HTTP кодов ответа:');
      Object.entries(results.metrics.statusCodeDistribution).forEach(([code, count]) => {
        const percentage = ((count / results.metrics.totalRequests) * 100).toFixed(2);
        console.log(`  • ${code}: ${count} (${percentage}%)`);
      });
    }

    // Рекомендации
    console.log('\n💡 Рекомендации:');
    if (results.metrics.latency.p99 > 1000) {
      console.log('  ⚠️  p99 latency > 1s - рассмотреть оптимизацию');
    }
    if (errorRate > 1) {
      console.log(`  ⚠️  Error rate > 1% (${errorRate.toFixed(2)}%) - проверить обработку ошибок`);
    }
    if (results.metrics.rps.mean < 100) {
      console.log(`  ⚠️  RPS < 100 - проверить пропускную способность`);
    }
    if (results.metrics.latency.mean < 50 && errorRate < 0.1) {
      console.log('  ✅ Отличные результаты!');
    }

    // Сохранение результатов
    saveResults();

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Результаты сохранены в: load-tests/results/${getResultFilename()}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Ошибка при запуске теста:', error.message);
    process.exit(1);
  }
}

/**
 * Сохранение результатов в файл
 */
function saveResults() {
  const resultsDir = path.join(__dirname, 'results');
  
  // Создание директории, если её нет
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filename = getResultFilename();
  const filepath = path.join(resultsDir, filename);

  // Сохранение JSON
  fs.writeFileSync(
    filepath,
    JSON.stringify(results, null, 2)
  );

  // Сохранение CSV для анализа в Excel
  const csvPath = path.join(resultsDir, `metrics_${Date.now()}.csv`);
  const csvContent = generateCSV();
  fs.writeFileSync(csvPath, csvContent);
}

/**
 * Генерация имени файла результатов
 */
function getResultFilename() {
  return `load_test_${Date.now()}.json`;
}

/**
 * Генерация CSV отчета
 */
function generateCSV() {
  const m = results.metrics;
  const csv = [
    'Метрика,Значение',
    `Total Requests,${m.totalRequests}`,
    `RPS (Mean),${m.rps.mean.toFixed(2)}`,
    `RPS (p50),${m.rps.p50.toFixed(2)}`,
    `RPS (p90),${m.rps.p90.toFixed(2)}`,
    `RPS (p99),${m.rps.p99.toFixed(2)}`,
    `Latency Mean (ms),${m.latency.mean.toFixed(2)}`,
    `Latency p50 (ms),${m.latency.p50}`,
    `Latency p90 (ms),${m.latency.p90}`,
    `Latency p99 (ms),${m.latency.p99}`,
    `Latency Min (ms),${m.latency.min}`,
    `Latency Max (ms),${m.latency.max}`,
    `Errors,${m.errors}`,
    `Timeouts,${m.timeouts}`,
    `Throughput Mean (KB/s),${(m.throughput.mean / 1024).toFixed(2)}`
  ].join('\n');
  return csv;
}

// Запуск теста
runLoadTest().catch(console.error);
